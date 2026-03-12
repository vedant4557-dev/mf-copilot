"""
services/cas-parser/main.py
CAS (Consolidated Account Statement) Parser — Python FastAPI service
Parses CAMS / KFintech CAS PDFs into structured portfolio data.

Install: pip install fastapi uvicorn camelot-py tabula-py pypdf2 redis pydantic python-multipart
Run:     uvicorn main:app --host 0.0.0.0 --port 5000
"""

import hashlib
import json
import os
import re
import tempfile
from datetime import datetime
from typing import Optional

import camelot
import tabula
import PyPDF2
import redis
import requests
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ─────────────────────────────────────────────────────────────
# App setup
# ─────────────────────────────────────────────────────────────
app = FastAPI(title="MF Copilot — CAS Parser", version="4.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("WEB_ORIGIN", "http://localhost:3000")],
    allow_methods=["POST"],
    allow_headers=["*"],
)

r = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"))

AMFI_NAV_URL = "https://www.amfiindia.com/spages/NAVAll.txt"

# ─────────────────────────────────────────────────────────────
# Models
# ─────────────────────────────────────────────────────────────
class Transaction(BaseModel):
    date: str
    type: str          # purchase | redemption | sip | dividend | bonus | merger
    units: Optional[float] = None
    nav: Optional[float] = None
    amount: Optional[float] = None
    note: Optional[str] = None

class FolioRecord(BaseModel):
    folio: str
    fund_name: str
    isin: Optional[str] = None
    amc: Optional[str] = None
    units: float
    avg_buy_nav: float
    invested: float
    current_nav: Optional[float] = None
    current_value: Optional[float] = None
    transactions: list[Transaction]

class ParseResult(BaseModel):
    investor_name: str
    pan_masked: str
    cas_type: str        # CAMS | KFintech
    statement_date: str
    folios: list[FolioRecord]
    cached: bool

# ─────────────────────────────────────────────────────────────
# AMFI NAV lookup (cached 5 min)
# ─────────────────────────────────────────────────────────────
def get_amfi_nav_map() -> dict[str, float]:
    cached = r.get("amfi:nav_map")
    if cached:
        return json.loads(cached)

    resp = requests.get(AMFI_NAV_URL, timeout=30)
    nav_map: dict[str, float] = {}
    for line in resp.text.splitlines():
        parts = line.split(";")
        if len(parts) >= 6:
            isin = parts[1].strip()
            try:
                nav_map[isin] = float(parts[4].strip())
            except ValueError:
                pass

    r.setex("amfi:nav_map", 300, json.dumps(nav_map))
    return nav_map


# ─────────────────────────────────────────────────────────────
# PDF text extraction
# ─────────────────────────────────────────────────────────────
def extract_text(path: str) -> str:
    text = ""
    with open(path, "rb") as f:
        reader = PyPDF2.PdfReader(f)
        for page in reader.pages:
            text += page.extract_text() or ""
    return text


def detect_cas_type(text: str) -> str:
    if "CAMS" in text or "Computer Age Management" in text:
        return "CAMS"
    if "KFintech" in text or "Karvy" in text:
        return "KFintech"
    return "Unknown"


# ─────────────────────────────────────────────────────────────
# Investor metadata extraction
# ─────────────────────────────────────────────────────────────
def extract_investor_meta(text: str) -> dict:
    name = ""
    pan = ""
    date = ""

    name_match = re.search(r"Name\s*[:\-]\s*([A-Z][A-Z\s]+)", text)
    if name_match:
        name = name_match.group(1).strip()[:60]

    pan_match = re.search(r"PAN\s*[:\-]\s*([A-Z]{5}\d{4}[A-Z])", text)
    if pan_match:
        raw = pan_match.group(1)
        pan = raw[:5] + "XXXXX"   # mask last 5 chars for PII

    date_match = re.search(r"Statement.*?(\d{2}[\/\-]\d{2}[\/\-]\d{4})", text)
    if date_match:
        date = date_match.group(1)

    return {"name": name or "Investor", "pan": pan or "XXXXX0000X", "date": date}


# ─────────────────────────────────────────────────────────────
# Folio / transaction extraction
# ─────────────────────────────────────────────────────────────
FUND_NAME_RE   = re.compile(r"(?:Folio No|Folio)\s*[:\-]?\s*([\w\/]+)\s+(.*?)(?=ISIN|$)", re.I)
ISIN_RE        = re.compile(r"ISIN\s*[:\-]?\s*(INF[\w]{9})", re.I)
TXN_DATE_RE    = re.compile(r"(\d{2}-\w{3}-\d{4})")
TXN_TYPE_RE    = re.compile(r"(Purchase|Redemption|SIP|Dividend Reinvest|Dividend Payout|Bonus|Switch In|Switch Out|Merger)", re.I)
UNITS_RE       = re.compile(r"Units?\s*[:\-]?\s*([\d,]+\.\d+)")
NAV_RE         = re.compile(r"NAV\s*[:\-]?\s*([\d,]+\.\d+)")
AMOUNT_RE      = re.compile(r"Amount\s*[:\-]?\s*₹?\s*([\d,]+\.\d+)")


def parse_folio_blocks(text: str) -> list[dict]:
    """
    Split CAS text into per-folio blocks using 'Folio No' as delimiter.
    Each block is then parsed for transactions.
    """
    blocks = re.split(r"(?=Folio(?:\s+No)?[\s:\-])", text, flags=re.I)
    folios = []

    for block in blocks:
        folio_match = re.search(r"Folio(?:\s+No)?[\s:\-]*([\w\/]+)", block, re.I)
        if not folio_match:
            continue

        folio_no = folio_match.group(1).strip()
        isin     = (ISIN_RE.search(block) or type("", (), {"group": lambda s, x: None})()).group(1)
        txns     = parse_transactions(block)

        # Derive invested / units from transactions
        units_total    = 0.0
        invested_total = 0.0
        buy_navs       = []

        for t in txns:
            u = t.get("units") or 0
            a = t.get("amount") or 0
            n = t.get("nav") or 0
            if t["type"] in ("purchase", "sip", "switch_in", "dividend_reinvest"):
                units_total    += u
                invested_total += a
                if n > 0:
                    buy_navs.append(n)
            elif t["type"] in ("redemption", "switch_out"):
                units_total    -= u
                invested_total -= a
            elif t["type"] == "bonus":
                units_total += u

        avg_nav = sum(buy_navs) / len(buy_navs) if buy_navs else 1.0

        # Try to extract fund name from block header
        name_match = re.search(r"([\w\s\-]+Fund[\w\s\-]*)", block)
        fund_name  = name_match.group(1).strip()[:80] if name_match else "Unknown Fund"

        folios.append({
            "folio": folio_no,
            "fund_name": fund_name,
            "isin": isin,
            "units": round(max(0.0, units_total), 4),
            "avg_buy_nav": round(avg_nav, 4),
            "invested": round(max(0.0, invested_total), 2),
            "transactions": txns,
        })

    return folios


def parse_transactions(block: str) -> list[dict]:
    txns = []
    date_positions = [(m.start(), m.group(1)) for m in TXN_DATE_RE.finditer(block)]

    for i, (pos, date_str) in enumerate(date_positions):
        end = date_positions[i + 1][0] if i + 1 < len(date_positions) else len(block)
        segment = block[pos:end]

        type_match   = TXN_TYPE_RE.search(segment)
        units_match  = UNITS_RE.search(segment)
        nav_match    = NAV_RE.search(segment)
        amount_match = AMOUNT_RE.search(segment)

        raw_type = type_match.group(1).lower().replace(" ", "_") if type_match else "purchase"
        txns.append({
            "date": date_str,
            "type": raw_type,
            "units": float(units_match.group(1).replace(",", "")) if units_match else None,
            "nav":   float(nav_match.group(1).replace(",", ""))   if nav_match  else None,
            "amount":float(amount_match.group(1).replace(",","")) if amount_match else None,
        })

    return txns


# ─────────────────────────────────────────────────────────────
# Table extraction fallback (Camelot + Tabula)
# ─────────────────────────────────────────────────────────────
def extract_tables(path: str) -> list:
    """
    Use Camelot (lattice mode) first, fall back to Tabula stream mode.
    Returns list of DataFrames.
    """
    dfs = []
    try:
        tables = camelot.read_pdf(path, pages="all", flavor="lattice")
        dfs += [t.df for t in tables if t.accuracy > 70]
    except Exception:
        pass

    if not dfs:
        try:
            dfs = tabula.read_pdf(path, pages="all", multiple_tables=True, stream=True)
        except Exception:
            pass

    return dfs


# ─────────────────────────────────────────────────────────────
# Enrich with live NAV
# ─────────────────────────────────────────────────────────────
def enrich_nav(folios: list[dict], nav_map: dict) -> list[dict]:
    for f in folios:
        isin = f.get("isin")
        nav  = nav_map.get(isin, 0.0) if isin else 0.0
        f["current_nav"]   = round(nav, 4)
        f["current_value"] = round(f["units"] * nav, 2) if nav else None
    return folios


# ─────────────────────────────────────────────────────────────
# API Endpoint
# ─────────────────────────────────────────────────────────────
@app.post("/parse", response_model=ParseResult)
async def parse_cas(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are accepted")

    content = await file.read()
    if len(content) > 10 * 1024 * 1024:   # 10 MB limit
        raise HTTPException(413, "File too large (max 10 MB)")

    # Cache check — same file hash
    sha = hashlib.sha256(content).hexdigest()
    cached_raw = r.get(f"cas:{sha}")
    if cached_raw:
        data = json.loads(cached_raw)
        data["cached"] = True
        return ParseResult(**data)

    # Write to temp file
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    try:
        text     = extract_text(tmp_path)
        cas_type = detect_cas_type(text)
        meta     = extract_investor_meta(text)
        folios   = parse_folio_blocks(text)

        # Table fallback for structured PDFs
        if len(folios) == 0:
            tables = extract_tables(tmp_path)
            # TODO: parse DataFrame rows into FolioRecord objects

        nav_map  = get_amfi_nav_map()
        folios   = enrich_nav(folios, nav_map)

    finally:
        os.unlink(tmp_path)

    result = {
        "investor_name":  meta["name"],
        "pan_masked":     meta["pan"],
        "cas_type":       cas_type,
        "statement_date": meta["date"],
        "folios":         folios,
        "cached":         False,
    }

    # Cache for 24 hours
    r.setex(f"cas:{sha}", 86400, json.dumps(result))
    return ParseResult(**result)


@app.get("/health")
def health():
    return {"status": "ok", "service": "cas-parser", "version": "4.0.0"}
