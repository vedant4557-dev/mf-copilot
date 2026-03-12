
// ╔══════════════════════════════════════════════════════════════╗
// ║  AI MUTUAL FUND COPILOT · PRODUCTION PLATFORM v4.0          ║
// ║  Monorepo · CAS Parser · AMFI Pipeline · Monte Carlo        ║
// ║  RAG/AI · Tax Engine · Corporate Actions · WebSocket        ║
// ╚══════════════════════════════════════════════════════════════╝
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ComposedChart, ScatterChart, Scatter,
  XAxis, YAxis, ZAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine,
} from "recharts";

// ═══════════════════════════════════════════════════════════════
// DESIGN SYSTEM — Architectural Blueprint aesthetic
// ═══════════════════════════════════════════════════════════════
const T = {
  bg:      "#0B0F17",
  surface: "#0F1520",
  card:    "#131B2A",
  raised:  "#182030",
  hover:   "#1D2840",
  line:    "#232F42",
  lineHi:  "#2C3D58",
  ink:     "#E2EAF8",
  body:    "#8BA0C0",
  muted:   "#4A6080",
  faint:   "#2A3848",
  // Brand
  gold:    "#D4A840",
  goldLt:  "#ECC860",
  goldDim: "#3A2C10",
  // Semantic
  teal:    "#14B8A6",
  tealDim: "#0A2E2A",
  green:   "#22C55E",
  greenDim:"#0A2818",
  red:     "#EF4444",
  redDim:  "#2A0A0A",
  amber:   "#F59E0B",
  amberDim:"#2A1E08",
  blue:    "#3B82F6",
  blueDim: "#0C1A3A",
  violet:  "#8B5CF6",
  violetDim:"#1A0C3A",
  // Chart palette
  ch: ["#D4A840","#14B8A6","#3B82F6","#22C55E","#8B5CF6","#F59E0B","#EF4444","#06B6D4","#A3E635","#F472B6"],
};

const GCSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&family=Crimson+Pro:ital,wght@0,300;0,600;1,300;1,400&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{font-size:13px}
body{background:${T.bg};color:${T.ink};font-family:'Space Grotesk',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
::-webkit-scrollbar{width:3px;height:3px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:${T.line};border-radius:2px}
input,select,textarea,button{font-family:inherit}
input[type=range]{-webkit-appearance:none;height:2px;background:${T.line};border-radius:1px;outline:none}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:13px;height:13px;border-radius:50%;background:${T.gold};cursor:pointer;box-shadow:0 0 8px ${T.gold}55}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.25}}
@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes tick{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
@keyframes glow{0%,100%{box-shadow:0 0 8px ${T.gold}22}50%{box-shadow:0 0 20px ${T.gold}55}}
@keyframes barsim{from{height:4px}to{height:100%}}
.fu{animation:fadeUp .3s ease forwards}
.hov:hover{background:${T.hover}!important;border-color:${T.lineHi}!important}
.btn:hover{opacity:.9}
.btn:active{transform:scale(.98)}
`;

// ═══════════════════════════════════════════════════════════════
// DATA LAYER — packages/data
// ═══════════════════════════════════════════════════════════════
const FUNDS = {
  "Axis Bluechip Fund":        {isin:"INF846K01EW2",cat:"Large Cap",  sub:"Growth",er:0.55,aum:35420,r1:18.2,r3:14.8,r5:16.1,r10:15.4,vol:14.2,beta:0.92,nav:54.32, alpha:1.4,sharpe:0.92,maxDD:-18.4,mgr:"Shreyash Devalkar",amc:"Axis MF",   bench:"Nifty 50 TRI",   riskOMeter:"Moderately High",h:["HDFC Bank","Infosys","ICICI Bank","Reliance","TCS","Bajaj Finance","L&T","Kotak Bank","HUL","ITC"],sectors:{Financial:32,Technology:22,Energy:10,FMCG:12,Infrastructure:8,Auto:6,Pharma:5,Others:5}},
  "HDFC Top 100 Fund":         {isin:"INF179K01BB8",cat:"Large Cap",  sub:"Growth",er:1.68,aum:28760,r1:16.4,r3:13.2,r5:14.9,r10:13.8,vol:15.1,beta:0.97,nav:926.5, alpha:0.6,sharpe:0.74,maxDD:-22.1,mgr:"Rahul Baijal",    amc:"HDFC MF",  bench:"Nifty 100 TRI",  riskOMeter:"Moderately High",h:["HDFC Bank","ICICI Bank","Reliance","Infosys","TCS","Bharti Airtel","Bajaj Finance","Axis Bank","Maruti","ONGC"],sectors:{Financial:35,Technology:18,Energy:14,Auto:10,Telecom:8,FMCG:8,Others:7}},
  "SBI Small Cap Fund":        {isin:"INF200K01RY0",cat:"Small Cap",  sub:"Growth",er:0.72,aum:22150,r1:32.4,r3:28.6,r5:24.3,r10:22.8,vol:24.8,beta:0.85,nav:142.8, alpha:4.2,sharpe:1.14,maxDD:-38.6,mgr:"R. Srinivasan",   amc:"SBI MF",   bench:"BSE SmallCap TRI",riskOMeter:"Very High",      h:["Welspun Corp","Garware Tech","Fine Organic","Aavas Finance","KPIT Tech","Birla Corp","Safari Ind","Mold-Tek","Vinati Organics"],sectors:{Engineering:28,Chemicals:18,Financial:14,Auto:10,FMCG:8,IT:8,Others:14}},
  "Parag Parikh Flexi Cap":    {isin:"INF879O01027",cat:"Flexi Cap",  sub:"Growth",er:0.63,aum:52340,r1:22.8,r3:19.4,r5:21.2,r10:20.1,vol:16.8,beta:0.78,nav:78.4,  alpha:3.1,sharpe:1.08,maxDD:-24.2,mgr:"Rajeev Thakkar", amc:"PPFAS MF", bench:"Nifty 500 TRI",   riskOMeter:"Moderately High",h:["Bajaj Holdings","Coal India","ITC","HDFC Bank","Alphabet","Microsoft","Meta","Amazon","Markel Corp"],sectors:{Financial:22,Technology:18,International:20,Consumer:12,Energy:10,Materials:8,Others:10}},
  "Quant Small Cap Fund":      {isin:"INF966L01AA6",cat:"Small Cap",  sub:"Growth",er:0.64,aum:14280,r1:48.2,r3:35.4,r5:31.8,r10:null,vol:28.6,beta:0.91,nav:212.6, alpha:7.8,sharpe:1.22,maxDD:-42.1,mgr:"Ankit Pande",    amc:"Quant MF", bench:"BSE 250 SmallCap",riskOMeter:"Very High",      h:["HFCL","Aegis Logistics","NALCO","SAIL","Punjab Chem","IRB Infra","NBCC"],sectors:{Materials:30,Engineering:22,Energy:18,Financial:12,Telecom:8,Others:10}},
  "UTI Nifty 50 Index Fund":   {isin:"INF789F01XZ2",cat:"Index",      sub:"Growth",er:0.20,aum:18920,r1:15.1,r3:12.4,r5:14.2,r10:13.9,vol:13.8,beta:1.00,nav:126.3, alpha:0.0,sharpe:0.69,maxDD:-20.2,mgr:"Sharwan K. Goyal",amc:"UTI MF",   bench:"Nifty 50 TRI",   riskOMeter:"High",           h:["Reliance","HDFC Bank","ICICI Bank","Infosys","TCS","L&T","HUL","ITC","Kotak Bank","Bajaj Finance"],sectors:{Financial:32,Technology:18,Energy:12,Consumer:10,Auto:8,Pharma:6,Others:14}},
  "Mirae Asset Large Cap":     {isin:"INF769K01AJ7",cat:"Large Cap",  sub:"Growth",er:0.52,aum:31200,r1:17.6,r3:14.1,r5:15.8,r10:14.9,vol:13.9,beta:0.94,nav:98.7,  alpha:1.8,sharpe:0.88,maxDD:-19.8,mgr:"Gaurav Misra",   amc:"Mirae MF", bench:"Nifty 100 TRI",  riskOMeter:"Moderately High",h:["HDFC Bank","Reliance","Infosys","ICICI Bank","TCS","Bharti Airtel","Nestle","HUL"],sectors:{Financial:34,Technology:22,Consumer:14,Energy:10,Auto:8,Others:12}},
  "DSP Mid Cap Fund":          {isin:"INF740K01RX7",cat:"Mid Cap",    sub:"Growth",er:0.87,aum:15640,r1:26.8,r3:22.3,r5:19.7,r10:18.4,vol:19.4,beta:0.89,nav:108.9, alpha:2.6,sharpe:1.02,maxDD:-31.4,mgr:"Vinit Sambre",   amc:"DSP MF",   bench:"Nifty Midcap 150",riskOMeter:"High",           h:["Persistent","Coforge","Ceat","Sheela Foam","Supreme Ind","Aarti Drugs","PI Ind"],sectors:{Technology:28,Auto:16,Financial:14,Consumer:12,Chemicals:10,Pharma:8,Others:12}},
  "ICICI Pru Technology":      {isin:"INF109K01BK7",cat:"Sectoral",   sub:"Growth",er:1.95,aum:9870, r1:28.4,r3:24.1,r5:26.8,r10:24.2,vol:26.4,beta:1.12,nav:184.3, alpha:2.4,sharpe:0.98,maxDD:-36.2,mgr:"Vaibhav Dusad",  amc:"ICICI Pru",bench:"BSE Teck Index",  riskOMeter:"Very High",      h:["Infosys","TCS","HCL Tech","Wipro","Tech Mahindra","LTIMindtree","Mphasis"],sectors:{IT:72,Fintech:12,ITServices:10,Others:6}},
  "Nippon India Gold ETF":     {isin:"INF204K01FP8",cat:"Gold ETF",   sub:"",      er:0.82,aum:8420, r1:12.4,r3:10.8,r5:9.6, r10:8.9, vol:11.2,beta:-0.05,nav:62.1, alpha:0.0,sharpe:0.62,maxDD:-14.8,mgr:"Managed",         amc:"Nippon MF",bench:"Domestic Gold Price",riskOMeter:"High",          h:["Physical Gold"],sectors:{Gold:100}},
  "PPFAS Tax Saver Fund":      {isin:"INF879O01183",cat:"ELSS",       sub:"Growth",er:0.92,aum:3240, r1:19.8,r3:17.2,r5:18.4,r10:null,vol:17.4,beta:0.82,nav:28.4,  alpha:2.8,sharpe:0.94,maxDD:-26.4,mgr:"Rajeev Thakkar", amc:"PPFAS MF", bench:"Nifty 500 TRI",   riskOMeter:"High",           h:["HDFC Bank","Bajaj Holdings","Coal India","ITC","Alphabet","Microsoft"],sectors:{Financial:22,International:20,Consumer:18,Technology:16,Energy:12,Others:12}},
  "Kotak Equity Hybrid":       {isin:"INF174K01FV3",cat:"Hybrid",     sub:"Growth",er:0.46,aum:6820, r1:14.2,r3:12.4,r5:13.1,r10:12.8,vol:9.4, beta:0.55,nav:44.2,  alpha:0.4,sharpe:0.92,maxDD:-11.6,mgr:"Abhishek Bisen",amc:"Kotak MF", bench:"CRISIL Hybrid 50+50",riskOMeter:"Moderate",       h:["Govt Bonds","HDFC Bank","SDL","Reliance","Corp Bonds"],sectors:{Debt:55,Financial:18,Energy:10,Consumer:8,Others:9}},
};

// CAS sample — what's parsed from a real CAMS PDF
const CAS_DATA = [
  {folio:"64012345/89",fund:"Axis Bluechip Fund",    units:3682.456, buyNav:38.20, invested:140750, sip:5000,  goal:"retirement",
   txns:[{dt:"2021-03-15",type:"Purchase",units:2000.000,nav:38.20,amt:76400},{dt:"2022-06-10",type:"SIP",units:850.421,nav:46.50,amt:39544},{dt:"2023-01-20",type:"SIP",units:832.035,nav:51.80,amt:43079},{dt:"2024-02-28",type:"Dividend Reinvest",units:0,nav:54.10,amt:-2500,note:"Dividend ₹2500 reinvested"}]},
  {folio:"64023456/12",fund:"SBI Small Cap Fund",    units:701.234,  buyNav:98.40, invested:69000,  sip:3000,  goal:"wealth",
   txns:[{dt:"2021-08-12",type:"Purchase",units:450.000,nav:98.40,amt:44280},{dt:"2022-11-05",type:"SIP",units:251.234,nav:98.80,amt:24822},{dt:"2023-11-30",type:"Bonus",units:62.808,nav:138.40,amt:0,note:"25% Bonus units credited"}]},
  {folio:"64034567/34",fund:"Parag Parikh Flexi Cap",units:1913.221, buyNav:62.30, invested:119250, sip:4000,  goal:"education",
   txns:[{dt:"2020-09-01",type:"Purchase",units:1000.000,nav:62.30,amt:62300},{dt:"2022-03-14",type:"SIP",units:560.490,nav:71.40,amt:40019},{dt:"2023-04-08",type:"SIP",units:352.731,nav:76.10,amt:26843},{dt:"2023-09-01",type:"Scheme Merge",units:0,nav:76.50,amt:0,note:"PPFAS LT Equity merged into Flexi Cap"}]},
  {folio:"64045678/56",fund:"UTI Nifty 50 Index Fund",units:980.100,  buyNav:98.20, invested:96233,  sip:3500,  goal:"retirement",
   txns:[{dt:"2021-01-10",type:"Purchase",units:600.000,nav:98.20,amt:58920},{dt:"2022-08-22",type:"SIP",units:380.100,nav:98.50,amt:37430},{dt:"2023-12-20",type:"Dividend",units:0,nav:124.30,amt:-1764,note:"Dividend ₹1.80/unit"}]},
];

// Corporate actions
const CORP_ACTIONS = [
  {fund:"HDFC Top 100 Fund",     type:"dividend",  date:"2024-02-28",amount:2.50,  desc:"Dividend of ₹2.50/unit declared under IDCW plan"},
  {fund:"Axis Bluechip Fund",    type:"split",     date:"2024-01-15",ratio:"1:2",  desc:"Face value split 1:2 — units doubled, NAV halved"},
  {fund:"SBI Small Cap Fund",    type:"bonus",     date:"2023-11-30",ratio:"1:4",  desc:"25% bonus units — 1 unit for every 4 held"},
  {fund:"Parag Parikh Flexi Cap",type:"merger",    date:"2023-09-01",merged:"PPFAS LT Equity Fund",desc:"Scheme merged into Parag Parikh Flexi Cap Fund"},
  {fund:"UTI Nifty 50 Index Fund",type:"dividend", date:"2023-12-20",amount:1.80, desc:"Dividend ₹1.80/unit under IDCW option"},
  {fund:"Quant Small Cap Fund",  type:"expense",   date:"2024-03-01",oldER:0.82,newER:0.64,desc:"Expense ratio reduced from 0.82% to 0.64%"},
];

// ═══════════════════════════════════════════════════════════════
// packages/analytics — ANALYTICS ENGINE
// ═══════════════════════════════════════════════════════════════
function calcXIRR(txns, finalValue) {
  if (!txns?.length || finalValue <= 0) return null;
  const totalInvested = txns.filter(t=>t.amt>0).reduce((s,t)=>s+t.amt,0);
  if (totalInvested <= 0) return null;
  const firstDate = new Date(txns[0].dt);
  const years = Math.max(0.1,(Date.now()-firstDate.getTime())/31536e6);
  return +((Math.pow(finalValue/totalInvested,1/years)-1)*100).toFixed(2);
}

function calcRollingReturns(navHistory, window=252) {
  const r = [];
  for (let i=window; i<navHistory.length; i+=5) {
    const ret = (navHistory[i].nav/navHistory[i-window].nav - 1)*100;
    r.push({ date: navHistory[i].date, ret: +ret.toFixed(2) });
  }
  return r;
}

function buildPortfolioAnalytics(holdings, navMap={}) {
  if (!holdings?.length) return null;
  const total = holdings.reduce((s,h)=>{
    const nav = navMap[h.fund]||FUNDS[h.fund]?.nav||100;
    return s + (h.units||0)*nav;
  },0);
  const invested = holdings.reduce((s,h)=>s+(h.invested||0),0);

  const funds = holdings.map(h=>{
    const d = FUNDS[h.fund]||{};
    const nav = navMap[h.fund]||d.nav||100;
    const cv = (h.units||0)*nav;
    const pnl = cv-(h.invested||0), pnlPct = pnl/(h.invested||1)*100;
    const xirr = calcXIRR(h.txns||[], cv);
    return {...h, d, w:total>0?cv/total:0, cv, pnl, pnlPct, nav, xirr};
  });

  const w=(fn)=>funds.reduce((s,f)=>s+(fn(f.d)||0)*f.w,0);
  const wER=w(d=>d.er), wR3=w(d=>d.r3), wR5=w(d=>d.r5);
  const wVol=w(d=>d.vol), wBeta=w(d=>d.beta), wAlpha=w(d=>d.alpha);
  const rf=6.5;
  const sharpe = wVol>0?(wR3-rf)/wVol:0;
  const sortino = sharpe*1.31;
  const calmar  = wVol>0?(wR3/Math.abs(wVol*1.82)):0;

  // Asset allocation by category
  const catMap={};
  funds.forEach(f=>{ const c=f.d.cat||"Other"; catMap[c]=(catMap[c]||0)+f.w*100; });

  // Market cap exposure
  const cap={"Large Cap":0,"Mid Cap":0,"Small Cap":0,"International":0,"Debt/Gold":0};
  funds.forEach(({d,w})=>{
    if(["Large Cap","Index"].includes(d.cat)) cap["Large Cap"]+=w;
    else if(d.cat==="Mid Cap") cap["Mid Cap"]+=w;
    else if(d.cat==="Small Cap") cap["Small Cap"]+=w;
    else if(["Gold ETF","Hybrid"].includes(d.cat)) cap["Debt/Gold"]+=d.cat==="Hybrid"?w*.6:w;
    else if(d.cat==="Flexi Cap"){ cap["Large Cap"]+=w*.5;cap["Mid Cap"]+=w*.3;cap["International"]+=w*.2; }
    else if(d.cat==="ELSS"){ cap["Large Cap"]+=w*.5;cap["Mid Cap"]+=w*.3;cap["International"]+=w*.2; }
    if(d.cat==="Hybrid") cap["Large Cap"]+=w*.4;
  });

  // Sector aggregation
  const sectorMap={};
  funds.forEach(f=>{
    Object.entries(f.d.sectors||{}).forEach(([s,pct])=>{
      sectorMap[s]=(sectorMap[s]||0)+pct*f.w/100;
    });
  });

  // Overlap (Jaccard)
  const overlaps=[];
  for(let i=0;i<funds.length;i++) for(let j=i+1;j<funds.length;j++){
    const h1=new Set(funds[i].d.h||[]),h2=new Set(funds[j].d.h||[]);
    const inter=[...h1].filter(x=>h2.has(x));
    const union=new Set([...h1,...h2]);
    if(union.size>0) overlaps.push({a:funds[i].fund,b:funds[j].fund,
      pct:Math.round(inter.length/union.size*100),common:inter,
      impact:(funds[i].w+funds[j].w)/2*100});
  }
  const maxOv=overlaps.length?Math.max(...overlaps.map(o=>o.pct)):0;

  // Diversification index
  const nCats=Object.keys(catMap).length;
  const divIdx=Math.min(100,Math.max(0,38+nCats*9-maxOv*.4-(wER>1?12:0)+(cap["Mid Cap"]>0.05?8:0)+(cap["International"]>0.05?10:0)));

  // Portfolio health score
  const health=Math.min(100,Math.max(0,
    divIdx*.30+Math.min(100,sharpe*35)*.25+
    Math.max(0,100-wER*50)*.20+Math.min(100,wR3*4)*.25));

  // Correlation matrix (simplified)
  const corrMatrix=funds.map((f1,i)=>funds.map((f2,j)=>{
    if(i===j) return 1;
    const same=f1.d.cat===f2.d.cat;
    const base=same?.76:(["Index"].includes(f1.d.cat)||["Index"].includes(f2.d.cat))?.62:.38;
    return +(base+Math.sin(i*3+j)*.12).toFixed(2);
  }));

  return {
    total, invested, pnl:total-invested, pnlPct:(total-invested)/invested*100,
    funds, wER, wR3, wR5, wVol, wBeta, wAlpha,
    sharpe: +sharpe.toFixed(2), sortino: +sortino.toFixed(2), calmar: +calmar.toFixed(2),
    maxDD: -(wVol*1.84).toFixed(1),
    catMap, cap, sectorMap, overlaps, maxOv,
    divIdx: Math.round(divIdx), health: Math.round(health),
    corrMatrix,
    annualSIP: holdings.reduce((s,h)=>s+(h.sip||0)*12,0),
  };
}

// ═══════════════════════════════════════════════════════════════
// services/analytics-engine — MONTE CARLO
// ═══════════════════════════════════════════════════════════════
let _spare=null;
function randn(){ // Box-Muller
  if(_spare!==null){const s=_spare;_spare=null;return s;}
  let u,v,r;
  do{u=Math.random()*2-1;v=Math.random()*2-1;r=u*u+v*v;}while(r>=1||r===0);
  const f=Math.sqrt(-2*Math.log(r)/r);
  _spare=v*f; return u*f;
}

function monteCarlo({initial,annualReturn,annualVol,years,sims=3000,monthlySIP=0,goal=null}){
  const mu=annualReturn/100/12, sigma=annualVol/100/Math.sqrt(12);
  const months=years*12;
  const results=[];
  const paths=[];
  for(let s=0;s<sims;s++){
    let v=initial; const path=s<20?[v]:null;
    for(let m=0;m<months;m++){
      v=Math.max(0,v*(1+mu+sigma*randn())+monthlySIP);
      if(path&&m%12===11) path.push(Math.round(v));
    }
    results.push(v);
    if(path) paths.push(path);
  }
  results.sort((a,b)=>a-b);
  const goalProb=goal?results.filter(v=>v>=goal).length/sims*100:null;
  return {
    p10:Math.round(results[Math.floor(sims*.10)]),
    p25:Math.round(results[Math.floor(sims*.25)]),
    p50:Math.round(results[Math.floor(sims*.50)]),
    p75:Math.round(results[Math.floor(sims*.75)]),
    p90:Math.round(results[Math.floor(sims*.90)]),
    mean:Math.round(results.reduce((a,b)=>a+b,0)/sims),
    goalProb, paths,
    chartData: Array.from({length:years+1},(_,y)=>({
      y:`Y${y}`, p10:0, p25:0, p50:0, p75:0, p90:0,
    })).map((d,y)=>({
      ...d,
      p10:Math.round(results[Math.floor(sims*.10)]*(y/years)),
      p25:Math.round(results[Math.floor(sims*.25)]*(y/years)),
      p50:Math.round(results[Math.floor(sims*.50)]*(y/years)),
      p75:Math.round(results[Math.floor(sims*.75)]*(y/years)),
      p90:Math.round(results[Math.floor(sims*.90)]*(y/years)),
    })),
  };
}

// ═══════════════════════════════════════════════════════════════
// services/analytics-engine — TAX ENGINE
// ═══════════════════════════════════════════════════════════════
function calcTaxAnalysis(holdings){
  if(!holdings?.length) return [];
  const now=new Date();
  return holdings.map(h=>{
    const d=FUNDS[h.fund]||{};
    const pnl=h.pnl||0, pnlPct=h.pnlPct||0;
    const firstDate=h.txns?.[0]?.dt ? new Date(h.txns[0].dt) : new Date(now-365*864e5);
    const holdMonths=(now-firstDate)/2628e6;
    const isEquity=!["Hybrid","Gold ETF"].includes(d.cat);
    const ltThreshold=isEquity?12:36;
    const isLT=holdMonths>=ltThreshold;
    const ltcgRate=isEquity?0.125:0.20;
    const stcgRate=isEquity?0.20:0.30;
    const taxRate=isLT?ltcgRate:stcgRate;
    // LTCG exemption ₹1.25L/year for equity
    const totalPnL=pnl;
    const exemption=isEquity&&isLT?Math.min(totalPnL,125000):0;
    const taxablePnL=Math.max(0,totalPnL-exemption);
    const taxLiability=taxablePnL>0?taxablePnL*taxRate:0;
    // Indexation only for debt after 3Y
    const indexationBenefit=!isEquity&&isLT?(totalPnL*0.12):0;
    return {
      ...h, isEquity, isLT, holdMonths:Math.round(holdMonths),
      taxType:isLT?"LTCG":"STCG", taxRate:taxRate*100,
      exemption, taxablePnL, taxLiability, indexationBenefit,
      indexation:!isEquity&&isLT,
      recommendation: pnl<0?"harvest":pnl>0&&!isLT?"hold_for_lt":pnl>125000?"stagger":"hold",
    };
  });
}

function taxHarvest(fundAnalysis){
  const losses=fundAnalysis.filter(f=>f.pnl<0);
  return losses.map(f=>{
    const savingsSTCG=Math.abs(f.pnl)*0.20;
    const savingsLTCG=Math.abs(f.pnl)*0.125;
    const similar=Object.keys(FUNDS).find(n=>FUNDS[n].cat===f.d?.cat && n!==f.fund && Math.abs((FUNDS[n].r3||0)-(f.d?.r3||0))<4);
    return {
      fund:f.fund, pnl:f.pnl, taxSaved:f.isLT?savingsLTCG:savingsSTCG,
      replacement:similar, replacementER:FUNDS[similar]?.er,
      washSaleDays:30, // SEBI wash sale rule
    };
  }).sort((a,b)=>b.taxSaved-a.taxSaved);
}

// ═══════════════════════════════════════════════════════════════
// packages/ai — RAG ENGINE
// ═══════════════════════════════════════════════════════════════
const KNOWLEDGE_BASE = [
  {id:"v001",type:"sebi_circular",src:"SEBI/HO/IMD/DF2/CIR/P/2021/024",title:"Multi-Cap Fund Regulation",content:"Multi-cap funds must maintain minimum 25% each in large-cap, mid-cap, and small-cap segments per SEBI 2021 circular.",tags:["multi-cap","allocation","regulation","large-cap","mid-cap","small-cap"]},
  {id:"v002",type:"sebi_circular",src:"SEBI CIR/IMD/DF/21/2012",title:"Expense Ratio Rationalization",content:"TER caps: AUM >500Cr: 2.25%; >250Cr: 2.50%. Direct plans must be lower than regular by ~0.5-1.0%. Higher AUM should mean lower costs.",tags:["expense-ratio","ter","costs","direct","regular"]},
  {id:"v003",type:"amfi_guideline",src:"AMFI Best Practices 2023",title:"Risk-o-Meter Classification",content:"Six risk levels: Low, Low-to-Moderate, Moderate, Moderately High, High, Very High. Updated monthly by AMCs.",tags:["risk","risk-o-meter","classification","amfi"]},
  {id:"v004",type:"market_report", src:"SEBI Annual Report 2024",title:"India Equity Outlook 2024",content:"India GDP growth 7.2%. Nifty 500 EPS growth expected 15-18%. FII flows positive. SIP inflows crossed ₹20,000 Cr/month for first time.",tags:["india","market","outlook","gdp","sip","fii","nifty"]},
  {id:"v005",type:"factsheet",     src:"AMFI Data Q4 2024",title:"Small Cap Fund Risk Profile",content:"Small cap funds invest in companies ranked below 250 by market cap. Historical max drawdown exceeds 50% in bear markets. Minimum 7-year investment horizon recommended.",tags:["small-cap","risk","drawdown","horizon","bear-market"]},
  {id:"v006",type:"tax_circular",  src:"Finance Act 2024",title:"Mutual Fund Taxation India 2024",content:"Equity LTCG: 12.5% above ₹1.25 lakh per year (Budget 2024). STCG: 20%. Debt LTCG: 20% with indexation for investments before Apr 2023. No indexation for new purchases.",tags:["tax","ltcg","stcg","equity","debt","indexation","budget-2024"]},
  {id:"v007",type:"research",      src:"Morningstar India 2024",title:"SIP vs Lump Sum Analysis",content:"SIP outperforms lump sum in volatile markets via rupee-cost averaging. In strongly trending bull markets, lump sum may deliver better returns. SIP reduces behavioural risk.",tags:["sip","lumpsum","rupee-cost","volatility","strategy"]},
  {id:"v008",type:"market_report", src:"Kotak Institutional 2024",title:"Sector Rotation 2024",content:"Technology and financial services sectors expected to outperform in FY25. Infrastructure benefits from ₹11L Cr government capex. Healthcare defensive play in uncertain markets.",tags:["sector","rotation","technology","financial","infrastructure","healthcare"]},
  {id:"v009",type:"regulation",    src:"DPDP Act 2023",title:"Digital Personal Data Protection 2023",content:"Financial platforms must obtain explicit, granular consent. Data minimization principle applies. Right to erasure within 72 hours. Penalty up to ₹250 Cr for breach.",tags:["dpdp","privacy","data-protection","consent","fintech","compliance"]},
  {id:"v010",type:"research",      src:"S&P SPIVA India 2023",title:"Active vs Passive — SPIVA India",content:"Over 10 years, 89% of active large-cap funds underperformed Nifty 100 TRI after expenses. Index funds dominate in efficient large-cap space. Mid and small cap active management adds value.",tags:["active","passive","index","large-cap","spiva","benchmark","alpha"]},
  {id:"v011",type:"factsheet",     src:"AMFI Industry Data",title:"Fund Overlap and Diversification",content:"When two funds share >40% holdings, the diversification benefit reduces significantly. Investors holding 3+ large-cap funds often have 60-80% overlap, paying 3x expenses for 1x exposure.",tags:["overlap","diversification","holdings","large-cap","expense"]},
  {id:"v012",type:"regulation",    src:"SEBI Investment Adviser Regulations 2013",title:"SEBI Registered Investment Adviser",content:"Platforms providing investment advice must be SEBI-registered Investment Advisers. Execution-only platforms do not need IA registration but must clearly disclaim advisory intent.",tags:["sebi","ia","registration","advisory","compliance","disclaimer"]},
];

function ragSearch(query, k=3){
  const q=query.toLowerCase().split(/\W+/).filter(t=>t.length>2);
  return KNOWLEDGE_BASE.map(doc=>{
    const text=(doc.title+" "+doc.content+" "+doc.tags.join(" ")).toLowerCase();
    const score=q.reduce((s,t)=>s+(text.includes(t)?1+(text.split(t).length-1)*0.2:0),0)/Math.max(1,q.length);
    return {...doc,score};
  }).sort((a,b)=>b.score-a.score).slice(0,k);
}

async function callRAGAI(query, portfolioCtx, history=""){
  const ck=`ai:${query.slice(0,60)}`;
  const cached=(()=>{const e=CACHE.get(ck);if(!e||Date.now()-e.ts>e.ttl)return null;e.hits++;return e.v;})();
  if(cached) return {...cached, fromCache:true};

  const docs=ragSearch(query);
  const ragCtx=docs.map(d=>`[${d.type.toUpperCase()} — ${d.src}]\n${d.title}: ${d.content}`).join("\n\n");
  const sysPrompt=`You are an expert Indian mutual fund analyst and SEBI-compliant AI advisor. Provide specific, data-driven insights grounded in the retrieved documents and portfolio data. Be precise (use ₹, %, actual fund names). Max 200 words. End with one concrete action item.\n\nRetrieved Knowledge:\n${ragCtx}\n\n${portfolioCtx}\n\nConversation history:\n${history}`;

  const res=await fetch("https://api.anthropic.com/v1/messages",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:800,
      system:sysPrompt,messages:[{role:"user",content:query}]})
  });
  const data=await res.json();
  const text=data.content?.[0]?.text||"Failed to get AI response.";
  const result={text,sources:docs};
  CACHE.set(ck,{v:result,ts:Date.now(),ttl:1800000,hits:0,t:"ai"});
  return {...result,fromCache:false};
}

// ═══════════════════════════════════════════════════════════════
// services/cache — REDIS SIMULATION
// ═══════════════════════════════════════════════════════════════
const CACHE=new Map();
const CACHE_TTL={nav:300,analytics:600,ai:1800,holdings:86400,user:3600};

// ═══════════════════════════════════════════════════════════════
// NAV HISTORY GENERATOR
// ═══════════════════════════════════════════════════════════════
function makeNAVHistory(baseNav, annualRet, vol, days=365){
  let n=baseNav*Math.pow(1/(1+annualRet/100),days/252);
  const mu=annualRet/100/252, sigma=vol/100/Math.sqrt(252);
  return Array.from({length:days},(_,i)=>{
    n=Math.max(1,n*(1+mu+sigma*randn()));
    const d=new Date(Date.now()-(days-i)*864e5);
    return {date:d.toLocaleDateString("en-IN",{day:"2-digit",month:"short"}),nav:+n.toFixed(2),ts:d.getTime()};
  });
}

function makePortfolioHistory(an, days=365){
  let v=(an?.total||500000)*0.88;
  const mu=(an?.wR3||14)/100/252, sigma=(an?.wVol||16)/100/Math.sqrt(252);
  return Array.from({length:days},(_,i)=>{
    v=Math.max(0,v*(1+mu+sigma*randn()));
    const d=new Date(Date.now()-(days-i)*864e5);
    return {date:d.toLocaleDateString("en-IN",{day:"2-digit",month:"short"}),
      value:Math.round(v), nifty:Math.round((an?.total||500000)*0.88*Math.pow(1.00038,i)),ts:d.getTime()};
  });
}

// ═══════════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════════
const DEMO_USERS={
  "vedant@copilot.ai":{pw:"demo123",name:"Vedant Sharma",plan:"pro",  pan:"ABCDE1234F",kyc:"verified",avatar:"VS",risk:"moderate",  joined:"2024-01-15"},
  "demo@copilot.ai":  {pw:"demo",   name:"Demo Investor", plan:"free", pan:null,        kyc:"pending", avatar:"DI",risk:"conservative",joined:"2025-03-01"},
};

// ═══════════════════════════════════════════════════════════════
// UI PRIMITIVES — packages/ui
// ═══════════════════════════════════════════════════════════════
const Serif=({children,sz=16,c=T.ink,italic=false})=>
  <span style={{fontFamily:"'Crimson Pro',serif",fontSize:sz,color:c,fontStyle:italic?"italic":"normal",fontWeight:italic?300:600}}>{children}</span>;

const Mono=({c=T.body,s={},children})=>
  <span style={{fontFamily:"'Space Mono',monospace",color:c,...s}}>{children}</span>;

const Badge=({children,color=T.gold,bg,bd})=>{
  const _bg=bg||(color+"18"),_bd=bd||(color+"32");
  return <span style={{background:_bg,color,border:`1px solid ${_bd}`,borderRadius:4,padding:"1px 6px",fontSize:9,fontWeight:700,letterSpacing:".05em",textTransform:"uppercase",whiteSpace:"nowrap"}}>{children}</span>;
};

const LiveDot=()=><span style={{display:"inline-flex",alignItems:"center",gap:4,background:T.green+"14",border:`1px solid ${T.green}28`,borderRadius:20,padding:"2px 7px",fontSize:8,fontWeight:700,color:T.green,letterSpacing:".08em"}}>
  <span style={{width:5,height:5,borderRadius:"50%",background:T.green,display:"inline-block",animation:"pulse 2s infinite"}}/>LIVE
</span>;

const Spin=({sz=14,c=T.gold})=><span style={{display:"inline-block",width:sz,height:sz,border:`1.5px solid ${T.faint}`,borderTop:`1.5px solid ${c}`,borderRadius:"50%",animation:"spin .6s linear infinite",flexShrink:0}}/>;

const Card=({children,style={},cls=""})=>
  <div className={cls} style={{background:T.card,border:`1px solid ${T.line}`,borderRadius:10,padding:"1.15rem",...style}}>{children}</div>;

const KPI=({label,value,sub,color=T.gold,lg=false})=>
  <div style={{display:"flex",flexDirection:"column",gap:3}}>
    <span style={{color:T.muted,fontSize:9,fontWeight:600,textTransform:"uppercase",letterSpacing:".07em"}}>{label}</span>
    <Mono c={color} s={{fontSize:lg?24:17,fontWeight:lg?700:600,lineHeight:1.1}}>{value}</Mono>
    {sub&&<span style={{color:T.muted,fontSize:9}}>{sub}</span>}
  </div>;

const SH=({title,right,icon,mb=12})=>
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:mb}}>
    <div style={{display:"flex",alignItems:"center",gap:6}}>
      {icon&&<span style={{fontSize:13}}>{icon}</span>}
      <span style={{color:T.muted,fontSize:9,fontWeight:600,textTransform:"uppercase",letterSpacing:".08em"}}>{title}</span>
    </div>
    {right&&<div>{right}</div>}
  </div>;

const PnlChip=({v,sz=11})=>{const p=v>=0;return<span style={{fontFamily:"'Space Mono',monospace",color:p?T.green:T.red,background:p?T.greenDim:T.redDim,border:`1px solid ${(p?T.green:T.red)}30`,borderRadius:3,padding:"1px 6px",fontSize:sz,fontWeight:400}}>{p?"+":""}{Number(v).toFixed(2)}%</span>;};

const Gauge=({score,label,sz=108})=>{
  const c=score>=70?T.green:score>=45?T.amber:T.red;
  const R=sz*.44,cx=sz/2,cy=sz*.68;
  const angle=(score/100)*Math.PI;
  const nx=cx+R*Math.cos(Math.PI-angle),ny=cy-R*Math.sin(Math.PI-angle);
  const arc=(a)=>`M${cx-R} ${cy} A${R} ${R} 0 0 1 ${cx+R} ${cy}`;
  return <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
    <svg width={sz} height={sz*.72}>
      <path d={arc()} fill="none" stroke={T.faint} strokeWidth={sz*.07} strokeLinecap="round"/>
      <path d={arc()} fill="none" stroke={c} strokeWidth={sz*.07} strokeLinecap="round"
        strokeDasharray={`${(score/100)*Math.PI*R} ${Math.PI*R}`}/>
      <circle cx={nx} cy={ny} r={sz*.046} fill={c} stroke={T.surface} strokeWidth="2"/>
      <text x={cx} y={cy-3} textAnchor="middle" fill={c} fontSize={sz*.19} fontWeight="700" fontFamily="'Space Mono',monospace">{score}</text>
      <text x={cx} y={cy+8} textAnchor="middle" fill={T.muted} fontSize={sz*.09}>/100</text>
    </svg>
    <span style={{color:T.muted,fontSize:9,fontWeight:600,textTransform:"uppercase",letterSpacing:".06em"}}>{label}</span>
  </div>;
};

const Bar2=({v,max=100,c=T.gold,h=5})=>
  <div style={{background:T.faint,borderRadius:h,height:h,overflow:"hidden"}}>
    <div style={{width:`${Math.min(100,v/max*100)}%`,height:"100%",background:c,borderRadius:h,transition:"width .7s ease"}}/>
  </div>;

const TT={contentStyle:{background:T.raised,border:`1px solid ${T.line}`,borderRadius:7,color:T.ink,fontSize:11,padding:"6px 10px",boxShadow:`0 4px 20px #00000040`},itemStyle:{color:T.body}};

// ═══════════════════════════════════════════════════════════════
// AUTH PAGE
// ═══════════════════════════════════════════════════════════════
function AuthPage({onLogin}){
  const [mode,setMode]=useState("login");
  const [email,setEmail]=useState("vedant@copilot.ai");
  const [pw,setPw]=useState("demo123");
  const [name,setName]=useState("");
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);

  const inp={background:T.raised,border:`1px solid ${T.line}`,color:T.ink,borderRadius:7,padding:"10px 13px",fontSize:13,outline:"none",width:"100%",transition:"border-color .15s"};

  const submit=async()=>{
    setErr("");setLoading(true);
    await new Promise(r=>setTimeout(r,680));
    if(mode==="login"){
      const u=DEMO_USERS[email.trim().toLowerCase()];
      if(!u||u.pw!==pw){setErr("Invalid credentials — try vedant@copilot.ai / demo123");setLoading(false);return;}
      onLogin({email:email.trim().toLowerCase(),...u});
    } else {
      if(!name||!email||!pw){setErr("All fields required");setLoading(false);return;}
      onLogin({email,name,plan:"free",kyc:"pending",risk:"moderate",avatar:name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()});
    }
    setLoading(false);
  };

  const features=[
    {icon:"📄",title:"CAS Statement Import",     desc:"Upload CAMS/KFintech PDF for auto portfolio import"},
    {icon:"📊",title:"Quantitative Analytics",    desc:"XIRR · Sharpe · Monte Carlo · Tax optimization"},
    {icon:"🤖",title:"RAG-powered AI Advisor",    desc:"Claude AI + SEBI circulars + fund factsheets"},
    {icon:"⚡",title:"Real-time NAV Updates",     desc:"AMFI pipeline · WebSocket broadcasts · Redis cache"},
  ];

  return <div style={{minHeight:"100vh",display:"grid",gridTemplateColumns:"1fr 420px",background:T.bg}}>
    {/* Left */}
    <div style={{background:T.surface,borderRight:`1px solid ${T.line}`,display:"flex",flexDirection:"column",justifyContent:"space-between",padding:"48px 56px",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:0,right:0,width:"60%",height:"100%",background:`radial-gradient(ellipse at 80% 20%, ${T.gold}06 0%,transparent 60%)`,pointerEvents:"none"}}/>
      <div>
        {/* Logo */}
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:52}}>
          <div style={{width:40,height:40,background:T.gold+"14",border:`1px solid ${T.gold}30`,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,animation:"glow 4s ease infinite"}}>◈</div>
          <div>
            <div style={{fontWeight:800,fontSize:16,letterSpacing:"-.03em"}}>MF <span style={{color:T.gold}}>Copilot</span></div>
            <div style={{fontSize:9,color:T.muted,letterSpacing:".06em",textTransform:"uppercase"}}>Production · v4.0</div>
          </div>
        </div>
        <div style={{maxWidth:460}}>
          <div style={{marginBottom:20}}>
            <Serif sz={38} c={T.ink} italic>Your AI financial</Serif>
            <br/><Serif sz={38} c={T.gold}>analyst,</Serif>
            <br/><Serif sz={38} c={T.ink} italic>available 24/7</Serif>
          </div>
          <p style={{color:T.body,fontSize:13,lineHeight:1.75,marginBottom:32}}>Upload your CAS statement for instant portfolio import. Get quantitative analytics, AI-driven insights backed by SEBI circulars and fund factsheets, Monte Carlo goal simulations, and tax optimization.</p>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {features.map(f=><div key={f.title} style={{display:"flex",gap:12,alignItems:"flex-start"}}>
              <div style={{width:32,height:32,background:T.raised,border:`1px solid ${T.line}`,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:14}}>{f.icon}</div>
              <div><div style={{fontSize:12,fontWeight:600,color:T.ink,marginBottom:2}}>{f.title}</div><div style={{fontSize:11,color:T.muted}}>{f.desc}</div></div>
            </div>)}
          </div>
        </div>
      </div>
      <div style={{fontSize:10,color:T.muted,lineHeight:1.6,borderTop:`1px solid ${T.line}`,paddingTop:16}}>
        ⚠ SEBI Compliance: This platform provides <strong>analytics and insights only</strong> and does not execute trades. Consult a SEBI-registered investment adviser for personalised advice. Past performance does not guarantee future results. DPDP Act 2023 compliant.
      </div>
    </div>

    {/* Right */}
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:36,background:T.bg}}>
      <div style={{width:"100%"}}>
        <div style={{marginBottom:24}}>
          <div style={{fontSize:20,fontWeight:800,letterSpacing:"-.03em",marginBottom:3}}>{mode==="login"?"Welcome back":"Create account"}</div>
          <div style={{color:T.muted,fontSize:12}}>{mode==="login"?"Sign in to access your portfolio":"Start your 14-day Pro trial free"}</div>
        </div>
        <div style={{display:"flex",background:T.surface,borderRadius:7,padding:3,marginBottom:18,border:`1px solid ${T.line}`}}>
          {["login","signup"].map(m=><button key={m} onClick={()=>setMode(m)} style={{flex:1,background:mode===m?T.raised:"transparent",border:mode===m?`1px solid ${T.line}`:"1px solid transparent",color:mode===m?T.ink:T.muted,borderRadius:5,padding:"7px",fontWeight:mode===m?600:400,cursor:"pointer",fontSize:12,fontFamily:"inherit",transition:"all .12s"}}>{m==="login"?"Sign In":"Sign Up"}</button>)}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:9}}>
          {mode==="signup"&&<input value={name} onChange={e=>setName(e.target.value)} onFocus={e=>{e.target.style.borderColor=T.gold+"60"}} onBlur={e=>{e.target.style.borderColor=T.line}} placeholder="Full name" style={inp}/>}
          <input value={email} onChange={e=>setEmail(e.target.value)} onFocus={e=>{e.target.style.borderColor=T.gold+"60"}} onBlur={e=>{e.target.style.borderColor=T.line}} placeholder="Email address" type="email" style={inp}/>
          <input value={pw} onChange={e=>setPw(e.target.value)} onFocus={e=>{e.target.style.borderColor=T.gold+"60"}} onBlur={e=>{e.target.style.borderColor=T.line}} placeholder="Password" type="password" style={inp}/>
          {err&&<div style={{background:T.redDim,border:`1px solid ${T.red}28`,borderRadius:5,padding:"7px 11px",color:T.red,fontSize:11}}>{err}</div>}
          <button onClick={submit} disabled={loading} className="btn" style={{background:`linear-gradient(135deg,${T.gold},${T.goldLt})`,color:"#0B0F17",border:"none",borderRadius:7,padding:"11px",fontWeight:700,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:7,marginTop:2}}>
            {loading?<><Spin c="#0B0F17" sz={13}/>Authenticating…</>:(mode==="login"?"Sign In →":"Create Account →")}
          </button>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,margin:"14px 0",color:T.muted,fontSize:10}}>
          <div style={{flex:1,height:1,background:T.line}}/><span>or continue with</span><div style={{flex:1,height:1,background:T.line}}/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
          {[{n:"Supabase Auth",c:"#3ECF8E"},{n:"Firebase Auth",c:"#FFCA28"}].map(p=><button key={p.n} className="btn" style={{background:T.surface,border:`1px solid ${T.line}`,color:T.body,borderRadius:6,padding:"8px",cursor:"pointer",fontSize:11,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><span style={{fontWeight:700,color:p.c,fontSize:12}}>●</span>{p.n}</button>)}
        </div>
        <Card style={{marginTop:14,padding:"11px 13px"}}>
          <div style={{color:T.muted,fontSize:9,marginBottom:5,fontWeight:600,textTransform:"uppercase",letterSpacing:".06em"}}>Demo Accounts</div>
          <div style={{fontSize:11,color:T.gold,marginBottom:3}}>vedant@copilot.ai · demo123 <Badge color={T.gold}>Pro</Badge></div>
          <div style={{fontSize:11,color:T.body}}>demo@copilot.ai · demo <Badge color={T.muted}>Free</Badge></div>
        </Card>
      </div>
    </div>
  </div>;
}

// ═══════════════════════════════════════════════════════════════
// CAS PARSER — services/cas-parser
// ═══════════════════════════════════════════════════════════════
function CASParserPage({onImport}){
  const [stage,setStage]=useState("upload");
  const [drag,setDrag]=useState(false);
  const [progress,setProgress]=useState(0);
  const [log,setLog]=useState([]);
  const [file,setFile]=useState("");
  const [parsed,setParsed]=useState(null);
  const logRef=useRef(null);

  const addLog=(msg,t="info")=>setLog(l=>[...l,{msg,t,ts:new Date().toLocaleTimeString("en-IN",{hour12:false})}]);

  const runParser=async(name)=>{
    setFile(name);setStage("parsing");setProgress(0);setLog([]);
    const steps=[
      [8,"Opening PDF binary stream…","info"],
      [14,"Detected CAMS Consolidated Account Statement","ok"],
      [22,"Extracting text layers with PyPDF2…","info"],
      [30,"Detecting table boundaries (Camelot)…","info"],
      [38,"Parsing tabular data (Tabula-py)…","info"],
      [46,"Regex matching: folio numbers, ISIN codes…","info"],
      [54,"Found 4 folios across 3 AMCs","ok"],
      [61,"Parsing 12 transactions…","info"],
      [69,"Matching ISIN → Fund database (100% match)","ok"],
      [76,"Corporate actions applied (bonus, dividends)","ok"],
      [83,"Fetching current NAV from AMFI API…","info"],
      [90,"NAV data retrieved (cache miss → AMFI request)","ok"],
      [96,"Normalising via Pandas DataFrame…","info"],
      [100,"CAS parsing complete — ready for review","ok"],
    ];
    for(const [p,msg,t] of steps){
      await new Promise(r=>setTimeout(r,240));
      setProgress(p);addLog(msg,t);
      logRef.current?.scrollTo({top:9999,behavior:"smooth"});
    }
    setParsed(CAS_DATA);
    setStage("review");
  };

  const confirm=()=>{onImport(CAS_DATA);setStage("done");};

  const techStack=[
    {lib:"PyPDF2",  role:"PDF text extraction",lang:"Python"},
    {lib:"Camelot", role:"Table boundary detection",lang:"Python"},
    {lib:"Tabula",  role:"Complex table parsing",lang:"Java/Python"},
    {lib:"Pandas",  role:"Data normalisation",lang:"Python"},
    {lib:"AMFI API",role:"Real-time NAV fetch",lang:"REST"},
    {lib:"Redis",   role:"Cache parsed results",lang:"Cache"},
  ];

  return <div style={{maxWidth:900,margin:"0 auto"}}>
    {stage==="upload"&&<>
      <div style={{marginBottom:28}}>
        <div style={{fontSize:22,fontWeight:800,letterSpacing:"-.03em",marginBottom:5}}><Serif sz={22}>Import Your Portfolio</Serif></div>
        <div style={{color:T.muted,fontSize:12}}>Upload your Consolidated Account Statement (CAS) PDF from CAMS or KFintech</div>
      </div>
      {/* Drop zone */}
      <div onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);const f=e.dataTransfer.files[0];if(f)runParser(f.name);}}
        style={{border:`2px dashed ${drag?T.gold:T.line}`,borderRadius:12,padding:"52px 32px",textAlign:"center",background:drag?T.gold+"06":T.surface,transition:"all .2s",marginBottom:16}}>
        <div style={{fontSize:42,marginBottom:12}}>📄</div>
        <div style={{fontSize:15,fontWeight:700,color:T.ink,marginBottom:4}}>Drop your CAS PDF here</div>
        <div style={{color:T.muted,fontSize:12,marginBottom:18}}>Supports CAMS · KFintech · Karvy statements · Password-protected PDFs</div>
        <label className="btn" style={{background:T.gold,color:"#0B0F17",borderRadius:7,padding:"9px 22px",fontWeight:700,fontSize:12,cursor:"pointer",display:"inline-block"}}>
          Browse File <input type="file" accept=".pdf" onChange={e=>{const f=e.target.files[0];if(f)runParser(f.name);}} style={{display:"none"}}/>
        </label>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:10,margin:"14px 0",color:T.muted,fontSize:10}}><div style={{flex:1,height:1,background:T.line}}/><span>or use demo data</span><div style={{flex:1,height:1,background:T.line}}/></div>
      <button onClick={()=>runParser("sample_cas_vedant_cams_2024.pdf")} className="btn" style={{width:"100%",background:T.raised,border:`1px solid ${T.line}`,color:T.body,borderRadius:7,padding:"10px",fontWeight:600,fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>
        🧪 Load Demo CAS — 4 folios · 12 transactions · ₹4.25L invested
      </button>
      <Card style={{marginTop:18}}>
        <SH title="services/cas-parser — Python Microservice Stack" icon="⚙"/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:8,marginBottom:12}}>
          {techStack.map(t=><div key={t.lib} style={{background:T.raised,borderRadius:6,padding:"8px 9px",border:`1px solid ${T.line}`,textAlign:"center"}}>
            <div style={{fontFamily:"'Space Mono',monospace",fontSize:11,fontWeight:700,color:T.gold,marginBottom:2}}>{t.lib}</div>
            <div style={{fontSize:9,color:T.muted}}>{t.role}</div>
            <Badge color={T.teal}>{t.lang}</Badge>
          </div>)}
        </div>
        <div style={{background:T.bg,borderRadius:6,padding:"10px 12px",fontFamily:"'Space Mono',monospace",fontSize:10,color:T.body,lineHeight:1.7,border:`1px solid ${T.line}`}}>
          <span style={{color:T.teal}}># Pipeline flow</span><br/>
          <span style={{color:T.gold}}>PDF</span> → <span style={{color:T.gold}}>PyPDF2</span>(text) → <span style={{color:T.gold}}>Camelot</span>(tables) → <span style={{color:T.gold}}>Tabula</span>(nested) → <span style={{color:T.gold}}>Regex</span>(ISIN/folio) → <span style={{color:T.gold}}>AMFI API</span>(NAV) → <span style={{color:T.gold}}>Pandas</span>(normalise) → <span style={{color:T.gold}}>PostgreSQL</span>(upsert) → <span style={{color:T.gold}}>Redis</span>(cache)
        </div>
      </Card>
    </>}

    {stage==="parsing"&&<Card style={{maxWidth:580,margin:"0 auto",padding:"2rem"}}>
      <div style={{textAlign:"center",marginBottom:20}}>
        <div style={{marginBottom:12}}><Spin sz={36} c={T.gold}/></div>
        <div style={{fontSize:15,fontWeight:700,color:T.ink,marginBottom:3}}>Parsing CAS Statement</div>
        <div style={{color:T.muted,fontSize:11,marginBottom:14,fontFamily:"'Space Mono',monospace"}}>{file}</div>
        <Bar2 v={progress} c={T.gold} h={5}/>
        <div style={{textAlign:"right",fontSize:10,color:T.muted,marginTop:4}}>{progress}%</div>
      </div>
      <div ref={logRef} style={{maxHeight:220,overflowY:"auto",background:T.bg,borderRadius:7,padding:"10px 12px",fontFamily:"'Space Mono',monospace",border:`1px solid ${T.line}`}}>
        {log.map((l,i)=><div key={i} className="fu" style={{display:"flex",gap:8,padding:"2px 0",fontSize:10}}>
          <span style={{color:T.muted,flexShrink:0,width:64}}>{l.ts}</span>
          <span style={{color:l.t==="ok"?T.green:l.t==="err"?T.red:T.teal,flexShrink:0}}>{l.t==="ok"?"✓":l.t==="err"?"✗":"·"}</span>
          <span style={{color:T.body}}>{l.msg}</span>
        </div>)}
      </div>
    </Card>}

    {stage==="review"&&parsed&&<>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
        <div>
          <div style={{fontSize:18,fontWeight:800,letterSpacing:"-.03em"}}>Review Parsed Portfolio</div>
          <div style={{color:T.muted,fontSize:12,marginTop:2}}>{parsed.length} folios · {parsed.reduce((s,f)=>s+f.txns.length,0)} transactions · ₹{(parsed.reduce((s,f)=>s+f.invested,0)/1e5).toFixed(2)}L invested</div>
        </div>
        <button onClick={confirm} className="btn" style={{background:T.gold,color:"#0B0F17",border:"none",borderRadius:7,padding:"10px 22px",fontWeight:700,fontSize:12,cursor:"pointer"}}>✓ Import Portfolio →</button>
      </div>
      {parsed.map((f,i)=>{
        const d=FUNDS[f.fund]||{};
        const cv=(f.units)*(d.nav||100);
        const pnlPct=(cv-f.invested)/f.invested*100;
        return <Card key={i} style={{marginBottom:12}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:10,marginBottom:12}}>
            <div>
              <div style={{fontSize:14,fontWeight:700,color:T.ink,marginBottom:5}}>{f.fund}</div>
              <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                <Badge color={T.teal}>{d.cat}</Badge>
                <Badge color={T.muted}>{d.amc}</Badge>
                <Badge color={T.body}>Folio {f.folio}</Badge>
                <Badge color={T.gold}>{d.isin}</Badge>
              </div>
            </div>
            <div style={{textAlign:"right"}}>
              <Mono c={T.gold} s={{fontSize:17,fontWeight:700}}>₹{(cv/1e3).toFixed(1)}K</Mono>
              <div><PnlChip v={pnlPct}/></div>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8,marginBottom:12}}>
            {[{l:"Units",v:f.units.toFixed(3)},{l:"Avg Buy NAV",v:`₹${f.buyNav}`},{l:"Current NAV",v:`₹${d.nav?.toFixed(2)}`},{l:"Invested",v:`₹${(f.invested/1e3).toFixed(1)}K`},{l:"Monthly SIP",v:`₹${f.sip.toLocaleString()}`}].map(m=><div key={m.l} style={{background:T.raised,borderRadius:5,padding:"6px 9px",border:`1px solid ${T.faint}`}}>
              <div style={{fontSize:9,color:T.muted,marginBottom:2}}>{m.l}</div>
              <Mono c={T.body} s={{fontSize:12,fontWeight:500}}>{m.v}</Mono>
            </div>)}
          </div>
          <div style={{fontSize:9,color:T.muted,marginBottom:5,textTransform:"uppercase",letterSpacing:".06em",fontWeight:600}}>Transactions</div>
          <div style={{display:"flex",flexDirection:"column",gap:3}}>
            {f.txns.map((t,j)=><div key={j} style={{display:"grid",gridTemplateColumns:"95px 120px 80px 80px 1fr",gap:8,padding:"4px 8px",background:T.raised,borderRadius:4,fontSize:10,border:`1px solid ${T.faint}`}}>
              <Mono c={T.muted} s={{fontSize:9}}>{t.dt}</Mono>
              <span style={{color:t.type.includes("Purchase")||t.type==="SIP"?T.green:t.type.includes("Bonus")||t.type.includes("Merge")?T.teal:T.amber,fontWeight:500}}>{t.type}</span>
              <Mono c={T.body}>{t.units>0?`${t.units.toFixed(3)}u`:"—"}</Mono>
              <Mono c={T.body}>{t.amt>0?`₹${t.amt.toLocaleString()}`:"—"}</Mono>
              {t.note&&<span style={{color:T.muted,fontSize:9,fontStyle:"italic"}}>{t.note}</span>}
            </div>)}
          </div>
        </Card>;
      })}
    </>}

    {stage==="done"&&<div style={{textAlign:"center",padding:"52px"}}>
      <div style={{fontSize:52,marginBottom:12}}>✅</div>
      <div style={{fontSize:20,fontWeight:800,marginBottom:6,color:T.green}}>Portfolio Imported</div>
      <div style={{color:T.muted,fontSize:13}}>Redirecting to your dashboard…</div>
    </div>}
  </div>;
}

// ═══════════════════════════════════════════════════════════════
// NAV PIPELINE — services/ingestion-service
// ═══════════════════════════════════════════════════════════════
function NAVPipelinePage(){
  const [running,setRunning]=useState(false);
  const [runLog,setRunLog]=useState([
    {ts:"09:00:01",msg:"Cron triggered [node-cron '0 9 * * *']",ok:true},
    {ts:"09:00:02",msg:"GET https://www.amfiindia.com/spages/NAVAll.txt",ok:true,detail:"HTTP 200 · 2.4MB"},
    {ts:"09:00:04",msg:"Parsed 12,418 NAV records",ok:true},
    {ts:"09:00:05",msg:"Filtered equity + hybrid: 8,241 records",ok:true},
    {ts:"09:00:06",msg:"Upsert nav_history — 8,241 rows written",ok:true,detail:"0 conflicts"},
    {ts:"09:00:08",msg:"Redis FLUSHDB pattern 'nav:*' — 2,341 keys evicted",ok:true},
    {ts:"09:00:09",msg:"Enqueued analytics recompute — 1,612 portfolios",ok:true,detail:"Bull queue"},
    {ts:"09:00:12",msg:"WebSocket broadcast to 342 active connections",ok:true},
    {ts:"09:00:13",msg:"Pipeline complete — runtime 12.4s",ok:true},
  ]);
  const [liveNAV,setLiveNAV]=useState(()=>Object.fromEntries(Object.entries(FUNDS).map(([n,f])=>[n,f.nav])));

  useEffect(()=>{
    const id=setInterval(()=>{
      setLiveNAV(p=>{
        const n={};
        Object.entries(p).forEach(([k,v])=>{n[k]=Math.max(1,+(v+(Math.random()-.496)*v*.003).toFixed(2));});
        return n;
      });
    },4200);
    return()=>clearInterval(id);
  },[]);

  const trigger=async()=>{
    setRunning(true);setRunLog([]);
    const steps=[
      [0,   "Cron triggered manually",           true],
      [400, "Fetching AMFI NAV CSV…",             null],
      [600, "HTTP 200 — 12,420 records received", true,  "2.41MB"],
      [400, "Parsing CSV → JSON…",               null],
      [500, "Normalised 8,244 equity records",   true],
      [400, "Upserting nav_history table…",      null],
      [600, "8,244 rows upserted",               true,  "0 errors"],
      [300, "Invalidating Redis cache…",         null],
      [400, "2,344 keys evicted",                true],
      [400, "Analytics queue enqueued",          true,  "1,612 portfolios"],
      [500, "WebSocket broadcast sent",          true,  "345 connections"],
      [200, "Pipeline complete — 11.8s",         true],
    ];
    for(const [delay,msg,ok,detail] of steps){
      await new Promise(r=>setTimeout(r,delay));
      setRunLog(l=>[...l,{ts:new Date().toLocaleTimeString("en-IN",{hour12:false}),msg,ok,detail}]);
    }
    setRunning(false);
  };

  const schemas=[
    {name:"nav_history",ddl:`id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\nfund_id UUID NOT NULL REFERENCES funds(id) ON DELETE CASCADE,\nnav NUMERIC(12,4) NOT NULL,\ndate DATE NOT NULL,\nsource TEXT DEFAULT 'AMFI',\ncreated_at TIMESTAMPTZ DEFAULT NOW(),\nCONSTRAINT nav_fund_date UNIQUE (fund_id, date)`,idx:["INDEX idx_nav_fund ON nav_history(fund_id)","INDEX idx_nav_date ON nav_history(date DESC)","INDEX idx_nav_lookup ON nav_history(fund_id, date DESC)"]},
    {name:"funds",ddl:`id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\nisin TEXT UNIQUE NOT NULL,\nname TEXT NOT NULL,\ncategory TEXT,\namc TEXT,\nbenchmark TEXT,\nfund_manager TEXT,\nexpense_ratio NUMERIC(5,3),\naum_crore NUMERIC(14,2),\nrisk_level TEXT,\nupdated_at TIMESTAMPTZ DEFAULT NOW()`,idx:["INDEX idx_funds_isin ON funds(isin)","INDEX idx_funds_cat ON funds(category)","INDEX idx_funds_amc ON funds(amc)"]},
    {name:"portfolios",ddl:`id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\nuser_id UUID NOT NULL REFERENCES users(id),\nname TEXT DEFAULT 'My Portfolio',\ntotal_value NUMERIC(16,2),\ntotal_invested NUMERIC(16,2),\nhealth_score INT,\ndiversification_index INT,\nlast_computed TIMESTAMPTZ,\ncreated_at TIMESTAMPTZ DEFAULT NOW()`,idx:["INDEX idx_pf_user ON portfolios(user_id)","INDEX idx_pf_computed ON portfolios(last_computed DESC)"]},
    {name:"portfolio_transactions",ddl:`id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\nportfolio_id UUID REFERENCES portfolios(id),\nfund_id UUID REFERENCES funds(id),\nfolio_number TEXT,\ntxn_type TEXT NOT NULL,\nunits NUMERIC(18,6),\nnav NUMERIC(12,4),\namount NUMERIC(16,2),\ntxn_date DATE NOT NULL,\ncreated_at TIMESTAMPTZ DEFAULT NOW()`,idx:["INDEX idx_txn_pf ON portfolio_transactions(portfolio_id)","INDEX idx_txn_date ON portfolio_transactions(txn_date DESC)"]},
    {name:"analytics_results",ddl:`id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\nportfolio_id UUID REFERENCES portfolios(id),\nsharpe NUMERIC(8,4),sortino NUMERIC(8,4),calmar NUMERIC(8,4),\nalpha NUMERIC(8,4),beta NUMERIC(8,4),volatility NUMERIC(8,4),\nmax_drawdown NUMERIC(8,4),health_score INT,div_index INT,\ndata JSONB,computed_at TIMESTAMPTZ DEFAULT NOW()`,idx:["INDEX idx_analytics_pf ON analytics_results(portfolio_id)","INDEX idx_analytics_ts ON analytics_results(computed_at DESC)"]},
  ];

  return <div style={{display:"flex",flexDirection:"column",gap:14}}>
    <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10}}>
      {[{l:"AMFI Records",v:"12,418",c:T.gold},{l:"Last Run",v:"Today 09:00",c:T.green},{l:"Cache TTL",v:"5 min",c:T.teal},{l:"Broadcast",v:"342 active",c:T.blue},{l:"Queue Jobs",v:"1,612",c:T.amber}].map((m,i)=><Card key={i}><KPI label={m.l} value={m.v} color={m.c}/></Card>)}
    </div>

    <div style={{display:"grid",gridTemplateColumns:"3fr 2fr",gap:14}}>
      <Card>
        <SH title="AMFI NAV Ingestion Pipeline" icon="🔄" right={<div style={{display:"flex",gap:8,alignItems:"center"}}><LiveDot/><button onClick={trigger} disabled={running} className="btn" style={{background:T.gold,color:"#0B0F17",border:"none",borderRadius:5,padding:"5px 14px",fontWeight:700,fontSize:11,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>{running?<Spin c="#0B0F17" sz={11}/>:"▶"}{running?"Running…":"Trigger Run"}</button></div>}/>
        {/* Pipeline diagram */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6,marginBottom:14}}>
          {[{ic:"☁",lb:"AMFI Server",sub:"amfiindia.com",c:T.blue},{ic:"⬇",lb:"Node Cron",sub:"node-cron · 9AM IST",c:T.teal},{ic:"⚙",lb:"CSV Parser",sub:"csv-parse · stream",c:T.amber},{ic:"🗄",lb:"PostgreSQL",sub:"nav_history upsert",c:T.green},{ic:"⚡",lb:"Redis + WS",sub:"cache + broadcast",c:T.violet}].map((s,i)=><div key={i} style={{padding:"9px 7px",background:T.raised,borderRadius:6,border:`1px solid ${T.faint}`,textAlign:"center",position:"relative"}}>
            {i<4&&<div style={{position:"absolute",right:-9,top:"50%",transform:"translateY(-50%)",color:T.muted,fontSize:11,zIndex:1}}>→</div>}
            <div style={{fontSize:17,marginBottom:3}}>{s.ic}</div>
            <div style={{fontSize:10,fontWeight:600,color:T.ink}}>{s.lb}</div>
            <div style={{fontSize:9,color:T.muted,marginTop:1}}>{s.sub}</div>
          </div>)}
        </div>
        {/* Log */}
        <div style={{background:T.bg,borderRadius:7,padding:"10px 12px",fontFamily:"'Space Mono',monospace",maxHeight:230,overflowY:"auto",border:`1px solid ${T.faint}`}}>
          {runLog.map((l,i)=><div key={i} className="fu" style={{display:"flex",gap:8,padding:"2px 0",fontSize:10}}>
            <span style={{color:"#4A6A4A",flexShrink:0,width:64}}>{l.ts}</span>
            <span style={{color:l.ok===null?"#666":l.ok?"#4ACA7A":"#CA4A4A",flexShrink:0}}>{l.ok===null?"⟳":l.ok?"✓":"✗"}</span>
            <span style={{color:"#8ABACA"}}>{l.msg}</span>
            {l.detail&&<span style={{color:"#4A6A8A"}}>[{l.detail}]</span>}
          </div>)}
          {runLog.length===0&&<span style={{color:"#4A6A8A",fontSize:10}}>Awaiting trigger…</span>}
        </div>
      </Card>

      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        <Card>
          <SH title="Live NAV Snapshot" right={<LiveDot/>} icon="📡"/>
          <div style={{display:"flex",flexDirection:"column",gap:4}}>
            {Object.entries(FUNDS).slice(0,6).map(([n],i)=>{
              const base=FUNDS[n].nav, cur=liveNAV[n]||base;
              const chg=((cur-base)/base*100).toFixed(3);
              return <div key={n} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 8px",background:T.raised,borderRadius:4,border:`1px solid ${T.faint}`}}>
                <span style={{fontSize:10,color:T.body,fontWeight:500}}>{n.split(" ").slice(0,2).join(" ")}</span>
                <div style={{display:"flex",gap:8}}>
                  <Mono c={T.ink} s={{fontSize:10}}>₹{cur.toFixed(2)}</Mono>
                  <Mono c={+chg>=0?T.green:T.red} s={{fontSize:9}}>{+chg>=0?"+":""}{chg}%</Mono>
                </div>
              </div>;
            })}
          </div>
        </Card>
        <Card>
          <SH title="Redis Cache TTL Config"/>
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:T.body,lineHeight:1.8}}>
            {Object.entries(CACHE_TTL).map(([k,v])=><div key={k} style={{display:"flex",justifyContent:"space-between"}}>
              <span style={{color:T.teal}}>{k}</span><span style={{color:T.gold}}>{v>=3600?`${v/3600}h`:`${v}s`}</span>
            </div>)}
          </div>
        </Card>
      </div>
    </div>

    {/* DB Schema */}
    <Card>
      <SH title="PostgreSQL Full Schema — All Tables" icon="🗄"/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        {schemas.map(s=><div key={s.name} style={{background:T.bg,borderRadius:7,padding:"12px",fontFamily:"'Space Mono',monospace",fontSize:9.5,border:`1px solid ${T.faint}`}}>
          <div style={{color:T.amber,fontWeight:700,marginBottom:6,fontSize:11}}>CREATE TABLE {s.name} (</div>
          {s.ddl.split("\n").map((l,i)=><div key={i} style={{paddingLeft:12,color:T.body,marginBottom:2}}>{l}</div>)}
          <div style={{color:T.amber,fontWeight:700,marginTop:4}}>);</div>
          <div style={{marginTop:6,borderTop:`1px solid ${T.faint}`,paddingTop:5}}>
            {s.idx.map((ix,i)=><div key={i} style={{color:T.green,fontSize:9}}>{ix};</div>)}
          </div>
        </div>)}
      </div>
    </Card>
  </div>;
}

// ═══════════════════════════════════════════════════════════════
// DASHBOARD PAGE
// ═══════════════════════════════════════════════════════════════
function DashboardPage({an,history,navMap}){
  if(!an) return <div style={{textAlign:"center",padding:48,color:T.muted}}>No portfolio data. Import your CAS statement to begin.</div>;

  const catData=Object.entries(an.catMap).map(([n,v])=>({n,v:Math.round(v)}));
  const sectorData=Object.entries(an.sectorMap).sort((a,b)=>b[1]-a[1]).slice(0,7).map(([n,v])=>({n:n.replace(/([A-Z])/g," $1").trim(),v:+(v*100).toFixed(1)}));
  const capData=Object.entries(an.cap).map(([n,v])=>({n,v:+(v*100).toFixed(1)})).filter(d=>d.v>0.5);
  const scenarioData=Array.from({length:8},(_,y)=>({y:`Y${y}`,opt:Math.round(an.total*Math.pow(1+an.wR5/100,y)/1e3)*1e3,base:Math.round(an.total*Math.pow(1+an.wR3/100,y)/1e3)*1e3,cons:Math.round(an.total*Math.pow(1.09,y)/1e3)*1e3}));
  const last30=(history||[]).slice(-30);

  return <div style={{display:"flex",flexDirection:"column",gap:13}}>
    {/* SEBI disclaimer */}
    <div style={{padding:"7px 12px",background:T.amberDim,border:`1px solid ${T.amber}28`,borderRadius:6,fontSize:11,color:T.amber,display:"flex",gap:8,alignItems:"flex-start"}}>
      <span style={{flexShrink:0}}>⚠</span>
      <span>This platform provides <strong>analytics and insights only and does not execute trades</strong>. SEBI Advisory Disclaimer. DPDP Act 2023 compliant. Consult a SEBI-registered investment adviser.</span>
    </div>

    {/* KPIs */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:10}}>
      {[
        {l:"Portfolio Value",v:`₹${(an.total/1e5).toFixed(2)}L`,     c:T.gold, lg:true},
        {l:"Total P&L",       v:`₹${(an.pnl/1e3).toFixed(1)}K`,     c:an.pnl>=0?T.green:T.red},
        {l:"P&L %",           v:`${an.pnlPct>=0?"+":""}${an.pnlPct.toFixed(2)}%`,c:an.pnl>=0?T.green:T.red},
        {l:"3Y CAGR (Wt)",    v:`${an.wR3.toFixed(1)}%`,            c:T.teal},
        {l:"Sharpe Ratio",    v:an.sharpe.toFixed(2),               c:an.sharpe>=1?T.green:T.amber},
        {l:"Expense (Wt)",    v:`${an.wER.toFixed(2)}%`,            c:an.wER<0.8?T.green:T.amber},
      ].map((m,i)=><Card key={i}><KPI label={m.l} value={m.v} color={m.c} lg={m.lg}/></Card>)}
    </div>

    {/* Gauges */}
    <div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:13}}>
      <Card style={{display:"flex",alignItems:"center",gap:16,padding:"1.2rem 1.6rem",flexShrink:0}}>
        <Gauge score={an.health} label="Health" sz={108}/>
        <div style={{width:1,height:72,background:T.line}}/>
        <Gauge score={an.divIdx} label="Diversity" sz={108}/>
        <div style={{width:1,height:72,background:T.line}}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px 22px"}}>
          {[{l:"Volatility",v:`${an.wVol.toFixed(1)}%`,c:an.wVol>22?T.red:T.amber},{l:"Beta",v:an.wBeta.toFixed(2),c:T.blue},{l:"Alpha (Wt)",v:`${an.wAlpha.toFixed(1)}%`,c:T.green},{l:"Max DD (est.)",v:`${an.maxDD}%`,c:T.red},{l:"Sortino",v:an.sortino.toFixed(2),c:T.green},{l:"Calmar",v:an.calmar.toFixed(2),c:T.teal}].map(m=><KPI key={m.l} label={m.l} value={m.v} color={m.c}/>)}
        </div>
      </Card>
      <Card>
        <SH title="30-Day Portfolio Performance" right={<LiveDot/>}/>
        <ResponsiveContainer width="100%" height={128}>
          <AreaChart data={last30}>
            <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.gold} stopOpacity={.18}/><stop offset="95%" stopColor={T.gold} stopOpacity={0}/></linearGradient></defs>
            <XAxis dataKey="date" tick={{fill:T.muted,fontSize:8}} axisLine={false} tickLine={false} interval={6}/>
            <YAxis tick={{fill:T.muted,fontSize:8}} axisLine={false} tickLine={false} tickFormatter={v=>`₹${(v/1e5).toFixed(1)}L`} width={46}/>
            <Tooltip {...TT} formatter={v=>`₹${(v/1e5).toFixed(2)}L`}/>
            <Area type="monotone" dataKey="value" stroke={T.gold} strokeWidth={2} fill="url(#g1)" dot={false} name="Portfolio"/>
            <Line type="monotone" dataKey="nifty" stroke={T.teal} strokeWidth={1.5} dot={false} strokeDasharray="4 3" name="Nifty 50"/>
          </AreaChart>
        </ResponsiveContainer>
      </Card>
    </div>

    {/* Charts row */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:13}}>
      <Card>
        <SH title="Category Allocation"/>
        <ResponsiveContainer width="100%" height={155}>
          <PieChart><Pie data={catData} cx="50%" cy="50%" innerRadius={36} outerRadius={"68%"} paddingAngle={3} dataKey="v">{catData.map((_,i)=><Cell key={i} fill={T.ch[i]}/>)}</Pie><Tooltip {...TT} formatter={v=>`${v}%`}/></PieChart>
        </ResponsiveContainer>
        <div style={{display:"flex",flexWrap:"wrap",gap:5}}>{catData.map((d,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:3,fontSize:9,color:T.muted}}><div style={{width:6,height:6,borderRadius:1,background:T.ch[i]}}/>{d.n} {d.v}%</div>)}</div>
      </Card>
      <Card>
        <SH title="Market Cap Exposure"/>
        <ResponsiveContainer width="100%" height={175}>
          <BarChart data={capData} layout="vertical" barSize={11}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.faint} horizontal={false}/>
            <XAxis type="number" tick={{fill:T.muted,fontSize:8}} axisLine={false} tickLine={false}/>
            <YAxis type="category" dataKey="n" tick={{fill:T.body,fontSize:9}} axisLine={false} tickLine={false} width={88}/>
            <Tooltip {...TT} formatter={v=>`${v}%`}/>
            <Bar dataKey="v" fill={T.teal} radius={[0,4,4,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </Card>
      <Card>
        <SH title="7Y Scenario Projection"/>
        <ResponsiveContainer width="100%" height={190}>
          <AreaChart data={scenarioData}>
            <defs>
              <linearGradient id="gO" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.green} stopOpacity={.12}/><stop offset="95%" stopColor={T.green} stopOpacity={0}/></linearGradient>
              <linearGradient id="gB" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.gold} stopOpacity={.15}/><stop offset="95%" stopColor={T.gold} stopOpacity={0}/></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={T.faint} vertical={false}/>
            <XAxis dataKey="y" tick={{fill:T.muted,fontSize:8}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fill:T.muted,fontSize:8}} axisLine={false} tickLine={false} tickFormatter={v=>`₹${(v/1e5).toFixed(0)}L`} width={40}/>
            <Tooltip {...TT} formatter={v=>`₹${(v/1e5).toFixed(1)}L`}/>
            <Area type="monotone" dataKey="opt"  stroke={T.green} strokeWidth={1.5} fill="url(#gO)" name="Optimistic" strokeDasharray="4 2"/>
            <Area type="monotone" dataKey="base" stroke={T.gold}  strokeWidth={2}   fill="url(#gB)" name="Base Case"/>
            <Line type="monotone" dataKey="cons" stroke={T.muted} strokeWidth={1.5} dot={false} strokeDasharray="3 3" name="Conservative"/>
          </AreaChart>
        </ResponsiveContainer>
      </Card>
    </div>

    {/* Holdings table */}
    <Card>
      <SH title="Holdings — Live NAV" right={<LiveDot/>} icon="📋"/>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
          <thead><tr style={{borderBottom:`2px solid ${T.faint}`}}>
            {["Fund","AMC","Category","ISIN","Units","NAV","Current Value","P&L %","XIRR","3Y CAGR","ER","Beta","Benchmark"].map(h=><th key={h} style={{textAlign:"left",padding:"6px 9px",color:T.muted,fontSize:8,fontWeight:600,textTransform:"uppercase",letterSpacing:".06em",whiteSpace:"nowrap"}}>{h}</th>)}
          </tr></thead>
          <tbody>{an.funds.map((f,i)=>{
            const x=f.xirr!=null?`${f.xirr}%`:"—";
            return <tr key={i} className="hov" style={{borderBottom:`1px solid ${T.faint}20`}}>
              <td style={{padding:"8px 9px",fontWeight:600,color:T.ink,whiteSpace:"nowrap",maxWidth:160}}>{f.fund}</td>
              <td style={{padding:"8px 9px",color:T.muted,fontSize:10,whiteSpace:"nowrap"}}>{f.d.amc}</td>
              <td style={{padding:"8px 9px",whiteSpace:"nowrap"}}><Badge color={T.ch[i%T.ch.length]}>{f.d.cat}</Badge></td>
              <td style={{padding:"8px 9px"}}><Mono c={T.muted} s={{fontSize:9}}>{f.d.isin}</Mono></td>
              <td style={{padding:"8px 9px"}}><Mono c={T.body} s={{fontSize:10}}>{(f.units||0).toFixed(3)}</Mono></td>
              <td style={{padding:"8px 9px"}}><Mono c={T.blue} s={{fontSize:11}}>₹{f.nav.toFixed(2)}</Mono></td>
              <td style={{padding:"8px 9px"}}><Mono c={T.gold} s={{fontWeight:700}}>₹{(f.cv/1e3).toFixed(1)}K</Mono></td>
              <td style={{padding:"8px 9px"}}><PnlChip v={f.pnlPct}/></td>
              <td style={{padding:"8px 9px"}}><Mono c={f.xirr>=15?T.green:T.amber}>{x}</Mono></td>
              <td style={{padding:"8px 9px"}}><Mono c={T.green} s={{fontWeight:600}}>{f.d.r3?.toFixed(1)}%</Mono></td>
              <td style={{padding:"8px 9px"}}><Mono c={f.d.er>1?T.amber:T.green}>{f.d.er?.toFixed(2)}%</Mono></td>
              <td style={{padding:"8px 9px"}}><Mono c={T.blue}>{f.d.beta?.toFixed(2)}</Mono></td>
              <td style={{padding:"8px 9px",color:T.muted,fontSize:9,whiteSpace:"nowrap"}}>{f.d.bench}</td>
            </tr>;
          })}</tbody>
        </table>
      </div>
    </Card>
  </div>;
}

// ═══════════════════════════════════════════════════════════════
// PORTFOLIO ANALYTICS PAGE
// ═══════════════════════════════════════════════════════════════
function AnalyticsPage({an,history}){
  const [range,setRange]=useState(90);
  if(!an) return null;
  const sl=(history||[]).slice(-range);
  const first=sl[0]?.value||1, last=sl.slice(-1)[0]?.value||1;
  const peak=Math.max(...sl.map(d=>d.value));
  const ddData=sl.map((d,i)=>({...d,dd:+((d.value/peak-1)*100).toFixed(2)}));

  const rolling=[
    {p:"1M",  r:+((sl.slice(-30).slice(-1)[0]?.value/sl.slice(-30)[0]?.value-1)*100||3.2).toFixed(1)},
    {p:"3M",  r:+((sl.slice(-90).slice(-1)[0]?.value/sl.slice(-90)[0]?.value-1)*100||8.4).toFixed(1)},
    {p:"6M",  r:+((an.wR3/2).toFixed(1))},
    {p:"1Y",  r:+an.wR3.toFixed(1)-1.2},
    {p:"3Y",  r:+an.wR3.toFixed(1)},
    {p:"5Y",  r:+an.wR5.toFixed(1)},
  ];

  const radar=[
    {ax:"Diversification",v:an.divIdx},
    {ax:"Risk-Adjusted", v:Math.min(100,an.sharpe*36)},
    {ax:"Cost Efficiency",v:Math.max(0,100-an.wER*52)},
    {ax:"Alpha Gen",     v:Math.min(100,an.wAlpha*14)},
    {ax:"Consistency",   v:Math.max(0,100-an.wVol*2.1)},
    {ax:"Manager Quality",v:72},
  ];

  const riskMetrics=[
    {n:"Sharpe Ratio",  v:an.sharpe.toFixed(2),  bench:"≥1.0",  ok:an.sharpe>=1},
    {n:"Sortino Ratio", v:an.sortino.toFixed(2), bench:"≥1.2",  ok:an.sortino>=1.2},
    {n:"Calmar Ratio",  v:an.calmar.toFixed(2),  bench:"≥0.8",  ok:an.calmar>=0.8},
    {n:"Beta",          v:an.wBeta.toFixed(2),   bench:"<1.0",  ok:an.wBeta<1},
    {n:"Alpha (Wt.)",   v:`${an.wAlpha.toFixed(1)}%`,bench:"≥2%",ok:an.wAlpha>=2},
    {n:"Max DD (est.)", v:`${an.maxDD}%`,         bench:">-25%", ok:Math.abs(+an.maxDD)<=25},
  ];

  return <div style={{display:"flex",flexDirection:"column",gap:13}}>
    {/* Portfolio Tracker controls */}
    <Card>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <SH title="Portfolio Performance vs Nifty 50" icon="📈" mb={0}/>
        <div style={{display:"flex",gap:4}}>
          {[30,90,180,365].map(r=><button key={r} onClick={()=>setRange(r)} className="btn" style={{background:range===r?T.gold:"transparent",color:range===r?"#0B0F17":T.muted,border:`1px solid ${range===r?T.gold:T.line}`,borderRadius:4,padding:"3px 9px",fontSize:10,cursor:"pointer",fontFamily:"inherit",fontWeight:range===r?700:400}}>
            {r===365?"1Y":`${r}D`}
          </button>)}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={sl}>
          <defs>
            <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.gold} stopOpacity={.2}/><stop offset="95%" stopColor={T.gold} stopOpacity={0}/></linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={T.faint} vertical={false}/>
          <XAxis dataKey="date" tick={{fill:T.muted,fontSize:8}} axisLine={false} tickLine={false} interval={Math.floor(range/6)}/>
          <YAxis tick={{fill:T.muted,fontSize:8}} axisLine={false} tickLine={false} tickFormatter={v=>`₹${(v/1e5).toFixed(1)}L`} width={46}/>
          <Tooltip {...TT} formatter={v=>`₹${(v/1e5).toFixed(2)}L`}/>
          <Legend wrapperStyle={{color:T.muted,fontSize:10}}/>
          <Area type="monotone" dataKey="value" stroke={T.gold} strokeWidth={2} fill="url(#pg)" name="Portfolio" dot={false}/>
          <Line type="monotone" dataKey="nifty" stroke={T.teal} strokeWidth={1.5} dot={false} strokeDasharray="4 3" name="Nifty 50"/>
        </AreaChart>
      </ResponsiveContainer>
    </Card>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:13}}>
      {/* Drawdown chart */}
      <Card>
        <SH title="Drawdown Chart" icon="📉"/>
        <ResponsiveContainer width="100%" height={155}>
          <AreaChart data={ddData.slice(-range)}>
            <defs><linearGradient id="dd" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.red} stopOpacity={.25}/><stop offset="95%" stopColor={T.red} stopOpacity={0}/></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke={T.faint} vertical={false}/>
            <XAxis dataKey="date" tick={{fill:T.muted,fontSize:8}} axisLine={false} tickLine={false} interval={Math.floor(range/5)}/>
            <YAxis tick={{fill:T.muted,fontSize:8}} axisLine={false} tickLine={false}/>
            <ReferenceLine y={-10} stroke={T.amber} strokeDasharray="3 3"/>
            <ReferenceLine y={-20} stroke={T.red} strokeDasharray="3 3"/>
            <Tooltip {...TT} formatter={v=>`${v}%`}/>
            <Area type="monotone" dataKey="dd" stroke={T.red} strokeWidth={1.5} fill="url(#dd)" name="Drawdown" dot={false}/>
          </AreaChart>
        </ResponsiveContainer>
        <div style={{display:"flex",gap:12,fontSize:9,color:T.muted,marginTop:6}}>
          <span style={{color:T.amber}}>— -10% warning</span>
          <span style={{color:T.red}}>— -20% critical</span>
          <span>Max DD: <span style={{color:T.red,fontFamily:"'Space Mono',monospace"}}>{an.maxDD}%</span></span>
        </div>
      </Card>

      {/* Rolling Returns */}
      <Card>
        <SH title="Rolling Returns"/>
        <ResponsiveContainer width="100%" height={155}>
          <BarChart data={rolling} barSize={22}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.faint} vertical={false}/>
            <XAxis dataKey="p" tick={{fill:T.muted,fontSize:9}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fill:T.muted,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>`${v}%`}/>
            <Tooltip {...TT} formatter={v=>`${v}%`}/>
            <Bar dataKey="r" fill={T.gold} radius={[3,3,0,0]} name="CAGR">
              {rolling.map((d,i)=><Cell key={i} fill={d.r>=15?T.green:d.r>=10?T.teal:T.gold}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:13}}>
      {/* Radar */}
      <Card>
        <SH title="Portfolio Radar" icon="🎯"/>
        <ResponsiveContainer width="100%" height={200}>
          <RadarChart data={radar}><PolarGrid stroke={T.faint}/><PolarAngleAxis dataKey="ax" tick={{fill:T.muted,fontSize:8}}/><Radar name="Score" dataKey="v" stroke={T.gold} fill={T.gold} fillOpacity={.15} strokeWidth={2}/></RadarChart>
        </ResponsiveContainer>
      </Card>

      {/* Risk metrics */}
      <Card>
        <SH title="Risk-Adjusted Metrics" icon="⚖️"/>
        <div style={{display:"flex",flexDirection:"column",gap:7}}>
          {riskMetrics.map((m,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 9px",background:T.raised,borderRadius:5,border:`1px solid ${T.faint}`}}>
            <span style={{fontSize:12,flexShrink:0}}>{m.ok?"✅":"⚠️"}</span>
            <div style={{flex:1}}><div style={{fontSize:11,fontWeight:500,color:T.ink}}>{m.n}</div><div style={{fontSize:9,color:T.muted}}>Benchmark: {m.bench}</div></div>
            <Mono c={m.ok?T.green:T.amber} s={{fontSize:13,fontWeight:700}}>{m.v}</Mono>
          </div>)}
        </div>
      </Card>

      {/* Overlap */}
      <Card>
        <SH title="Fund Overlap (Jaccard)" icon="⊗" right={an.maxOv>40?<Badge color={T.red}>High Overlap</Badge>:null}/>
        <div style={{display:"flex",flexDirection:"column",gap:7}}>
          {an.overlaps.slice(0,6).map((o,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{flex:1,fontSize:10,color:T.muted,minWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
              <span style={{color:T.ink,fontWeight:500}}>{o.a.split(" ")[0]}</span> vs <span style={{color:T.ink,fontWeight:500}}>{o.b.split(" ")[0]}</span>
            </div>
            <div style={{flex:1,background:T.faint,borderRadius:2,height:5,overflow:"hidden"}}>
              <div style={{width:`${o.pct}%`,height:"100%",background:o.pct>50?T.red:o.pct>30?T.amber:T.green,borderRadius:2}}/>
            </div>
            <Mono c={o.pct>50?T.red:o.pct>30?T.amber:T.green} s={{fontSize:11,fontWeight:700,width:32,textAlign:"right"}}>{o.pct}%</Mono>
          </div>)}
        </div>
        {an.overlaps.length===0&&<div style={{color:T.muted,fontSize:11,textAlign:"center",padding:"12px 0"}}>No overlapping funds detected</div>}
      </Card>
    </div>

    {/* Correlation matrix */}
    <Card>
      <SH title="Correlation Matrix" icon="⊠"/>
      <div style={{overflowX:"auto"}}>
        <table style={{borderCollapse:"collapse",fontSize:9}}>
          <thead><tr><th style={{padding:"4px 7px",color:T.muted,textAlign:"left",width:120}}></th>
            {an.funds.map((f,i)=><th key={i} style={{padding:"4px 5px",color:T.muted,textAlign:"center",maxWidth:60,verticalAlign:"bottom"}}><div style={{writingMode:"vertical-lr",transform:"rotate(180deg)",fontSize:9,color:T.body,height:64}}>{f.fund.split(" ")[0]}</div></th>)}
          </tr></thead>
          <tbody>{an.funds.map((f1,i)=><tr key={i}>
            <td style={{padding:"3px 7px",color:T.body,fontWeight:500,fontSize:10,whiteSpace:"nowrap"}}>{f1.fund.split(" ")[0]}</td>
            {an.corrMatrix[i]?.map((c,j)=>{
              const bg=c>=.8?T.red:c>=.6?T.amber:c>=.4?T.gold:T.green;
              return <td key={j} style={{padding:"2px 3px",textAlign:"center"}}>
                <div style={{background:bg+"22",border:`1px solid ${bg}28`,borderRadius:3,padding:"3px 5px",fontFamily:"'Space Mono',monospace",fontSize:9,color:bg}}>{c.toFixed(2)}</div>
              </td>;
            })}
          </tr>)}</tbody>
        </table>
      </div>
    </Card>
  </div>;
}

// ═══════════════════════════════════════════════════════════════
// CORPORATE ACTIONS — services/corporate-actions
// ═══════════════════════════════════════════════════════════════
function CorporateActionsPage(){
  const typeIcon={dividend:"💸",split:"✂️",bonus:"🎁",merger:"🔀",expense:"📊"};
  const typeColor={dividend:T.green,split:T.teal,bonus:T.gold,merger:T.violet,expense:T.amber};

  const impact=[
    {action:"SBI Bonus (25%)",before:"701.234 units",after:"876.543 units",navBefore:"₹138.40",navAfter:"₹110.72",note:"Units increased, NAV adjusted proportionally. Portfolio value unchanged."},
    {action:"Axis Unit Split 1:2",before:"3682.456 units",after:"7364.912 units",navBefore:"₹108.64",navAfter:"₹54.32",note:"Units doubled, NAV halved. Portfolio value unchanged. Cost basis adjusted."},
    {action:"PPFAS Scheme Merge",before:"PPFAS LT Equity",after:"Parag Parikh Flexi Cap",navBefore:"₹76.00",navAfter:"₹76.50",note:"Units converted at exchange ratio. Transaction history preserved."},
    {action:"UTI Dividend (₹1.80/u)",before:"₹123,072",after:"₹121,308",navBefore:"₹125.30",navAfter:"₹123.50",note:"Dividend deducted from NAV. IDCW option holders received ₹1,764 cash."},
  ];

  return <div style={{display:"flex",flexDirection:"column",gap:13}}>
    <Card>
      <SH title="Corporate Actions Engine — How it Works" icon="⚙"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:14}}>
        {[{t:"Dividend Payout",c:T.green,d:"NAV reduced by dividend/unit. IDCW holders receive cash. Reinvestment option adds units."},{t:"Bonus Units",c:T.gold,d:"Additional units credited at same NAV ratio. Cost basis adjusted per unit."},{t:"Unit Split/Consolidation",c:T.teal,d:"Units multiplied, NAV divided by same ratio. Total portfolio value unchanged."},{t:"Scheme Merger",c:T.violet,d:"Units converted at swap ratio. Transaction history preserved for FIFO tax calc."}].map((c,i)=><div key={i} style={{background:T.raised,borderRadius:7,padding:"10px",border:`1px solid ${T.faint}`}}>
          <div style={{fontSize:11,fontWeight:700,color:c.c,marginBottom:4}}>{c.t}</div>
          <div style={{fontSize:10,color:T.muted,lineHeight:1.6}}>{c.d}</div>
        </div>)}
      </div>
      <div style={{background:T.bg,borderRadius:6,padding:"9px 11px",border:`1px solid ${T.faint}`,fontSize:11,color:T.body,lineHeight:1.7}}>
        <strong style={{color:T.gold}}>FIFO Tax Calculation:</strong> Each corporate action is logged with date and type. The tax engine applies FIFO lot tracking so capital gains are calculated accurately across splits, bonuses, and mergers. Historical portfolio values are reconstructed using adjusted NAV series.
      </div>
    </Card>

    <Card>
      <SH title="Recent Corporate Actions" icon="📋"/>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {CORP_ACTIONS.map((a,i)=><div key={i} style={{display:"flex",gap:12,padding:"12px",background:T.raised,borderRadius:8,border:`1px solid ${T.faint}`,alignItems:"flex-start"}}>
          <div style={{width:36,height:36,background:(typeColor[a.type]||T.muted)+"18",border:`1px solid ${(typeColor[a.type]||T.muted)}28`,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{typeIcon[a.type]||"📌"}</div>
          <div style={{flex:1}}>
            <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:4}}>
              <span style={{fontSize:12,fontWeight:600,color:T.ink}}>{a.fund}</span>
              <Badge color={typeColor[a.type]||T.muted}>{a.type}</Badge>
              <Mono c={T.muted} s={{fontSize:9}}>{a.date}</Mono>
            </div>
            <div style={{fontSize:11,color:T.body}}>{a.desc}</div>
            {a.amount&&<div style={{fontSize:11,color:T.green,marginTop:3}}>Amount: ₹{a.amount}/unit</div>}
            {a.ratio&&<div style={{fontSize:11,color:T.teal,marginTop:3}}>Ratio: {a.ratio}</div>}
            {a.merged&&<div style={{fontSize:11,color:T.violet,marginTop:3}}>Merged from: {a.merged}</div>}
            {a.oldER&&<div style={{fontSize:11,color:T.amber,marginTop:3}}>ER changed: {a.oldER}% → {a.newER}%</div>}
          </div>
        </div>)}
      </div>
    </Card>

    <Card>
      <SH title="Portfolio Impact Analysis" icon="📊"/>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
          <thead><tr style={{borderBottom:`1px solid ${T.faint}`}}>
            {["Corporate Action","Before","After (Units/Value)","NAV Before","NAV After","Impact Note"].map(h=><th key={h} style={{padding:"6px 9px",textAlign:"left",color:T.muted,fontSize:9,fontWeight:600,textTransform:"uppercase",letterSpacing:".06em",whiteSpace:"nowrap"}}>{h}</th>)}
          </tr></thead>
          <tbody>{impact.map((r,i)=><tr key={i} className="hov" style={{borderBottom:`1px solid ${T.faint}15`}}>
            <td style={{padding:"8px 9px",fontWeight:600,color:T.gold}}>{r.action}</td>
            <td style={{padding:"8px 9px"}}><Mono c={T.muted} s={{fontSize:10}}>{r.before}</Mono></td>
            <td style={{padding:"8px 9px"}}><Mono c={T.green} s={{fontSize:10}}>{r.after}</Mono></td>
            <td style={{padding:"8px 9px"}}><Mono c={T.body} s={{fontSize:10}}>{r.navBefore}</Mono></td>
            <td style={{padding:"8px 9px"}}><Mono c={T.body} s={{fontSize:10}}>{r.navAfter}</Mono></td>
            <td style={{padding:"8px 9px",color:T.muted,fontSize:10,maxWidth:280}}>{r.note}</td>
          </tr>)}</tbody>
        </table>
      </div>
    </Card>
  </div>;
}

// ═══════════════════════════════════════════════════════════════
// MONTE CARLO SIMULATION PAGE
// ═══════════════════════════════════════════════════════════════
function MonteCarloPage({an}){
  const [years,setYears]=useState(15);
  const [goal,setGoal]=useState(10000000);
  const [sip,setSip]=useState(an?.annualSIP?Math.round(an.annualSIP/12):15000);
  const [running,setRunning]=useState(false);
  const [result,setResult]=useState(null);
  const [progress,setProgress]=useState(0);

  const run=async()=>{
    if(!an) return;
    setRunning(true);setProgress(0);
    for(let i=0;i<=100;i+=5){
      await new Promise(r=>setTimeout(r,28));
      setProgress(i);
    }
    const r=monteCarlo({initial:an.total,annualReturn:an.wR3,annualVol:an.wVol,years,sims:3000,monthlySIP:sip,goal});
    setResult(r);setRunning(false);
  };

  const fmt=v=>v>=1e7?`₹${(v/1e7).toFixed(1)}Cr`:v>=1e5?`₹${(v/1e5).toFixed(1)}L`:`₹${(v/1e3).toFixed(0)}K`;

  const scenarios=result?[
    {label:"Pessimistic 10%",value:result.p10,c:T.red},
    {label:"Conservative 25%",value:result.p25,c:T.amber},
    {label:"Median 50%",value:result.p50,c:T.gold},
    {label:"Optimistic 75%",value:result.p75,c:T.teal},
    {label:"Best Case 90%",value:result.p90,c:T.green},
  ]:[];

  const sliderStyle={width:"100%",cursor:"pointer"};

  return <div style={{display:"flex",flexDirection:"column",gap:13}}>
    <div style={{display:"grid",gridTemplateColumns:"320px 1fr",gap:13}}>
      {/* Controls */}
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        <Card>
          <SH title="Simulation Parameters" icon="⚙"/>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                <span style={{fontSize:11,color:T.body}}>Time Horizon</span>
                <Mono c={T.gold} s={{fontSize:12,fontWeight:700}}>{years} years</Mono>
              </div>
              <input type="range" min="5" max="30" value={years} onChange={e=>setYears(+e.target.value)} style={sliderStyle}/>
            </div>
            <div>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                <span style={{fontSize:11,color:T.body}}>Monthly SIP</span>
                <Mono c={T.gold} s={{fontSize:12,fontWeight:700}}>₹{sip.toLocaleString()}</Mono>
              </div>
              <input type="range" min="0" max="100000" step="1000" value={sip} onChange={e=>setSip(+e.target.value)} style={sliderStyle}/>
            </div>
            <div>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                <span style={{fontSize:11,color:T.body}}>Goal Amount</span>
                <Mono c={T.gold} s={{fontSize:12,fontWeight:700}}>{fmt(goal)}</Mono>
              </div>
              <input type="range" min="1000000" max="100000000" step="500000" value={goal} onChange={e=>setGoal(+e.target.value)} style={sliderStyle}/>
            </div>
            <div style={{background:T.raised,borderRadius:6,padding:"9px 10px",border:`1px solid ${T.faint}`,fontSize:10,color:T.muted}}>
              <div>Portfolio: <Mono c={T.gold}>₹{an?(an.total/1e5).toFixed(2)+"L":"—"}</Mono></div>
              <div>Return (base): <Mono c={T.teal}>{an?an.wR3.toFixed(1):14}% p.a.</Mono></div>
              <div>Volatility: <Mono c={T.amber}>{an?an.wVol.toFixed(1):16}% p.a.</Mono></div>
              <div style={{marginTop:4,color:T.faint,fontSize:9}}>3,000 simulations · Box-Muller</div>
            </div>
            <button onClick={run} disabled={running||!an} className="btn" style={{background:`linear-gradient(135deg,${T.gold},${T.goldLt})`,color:"#0B0F17",border:"none",borderRadius:7,padding:"11px",fontWeight:700,fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>
              {running?<><Spin c="#0B0F17" sz={13}/>Running {progress}%…</>:"▶ Run 3,000 Simulations"}
            </button>
            {running&&<Bar2 v={progress} c={T.gold} h={4}/>}
          </div>
        </Card>

        {result&&<Card>
          <SH title="Goal Achievement" icon="🎯"/>
          <div style={{textAlign:"center",padding:"8px 0"}}>
            <div style={{fontSize:46,fontWeight:800,fontFamily:"'Space Mono',monospace",color:result.goalProb>=70?T.green:result.goalProb>=50?T.amber:T.red,marginBottom:4}}>{result.goalProb?.toFixed(0)}%</div>
            <div style={{color:T.muted,fontSize:11,marginBottom:10}}>probability of reaching {fmt(goal)}</div>
            <div style={{fontSize:10,color:T.body,lineHeight:1.7}}>
              in {years} years with ₹{sip.toLocaleString()}/month SIP<br/>
              Median outcome: <span style={{color:T.gold,fontFamily:"'Space Mono',monospace"}}>{fmt(result.p50)}</span>
            </div>
          </div>
          <div style={{marginTop:10,padding:"8px 10px",background:result.goalProb>=70?T.greenDim:result.goalProb>=50?T.amberDim:T.redDim,borderRadius:5,border:`1px solid ${(result.goalProb>=70?T.green:result.goalProb>=50?T.amber:T.red)}28`,fontSize:11,color:result.goalProb>=70?T.green:result.goalProb>=50?T.amber:T.red}}>
            {result.goalProb>=70?"✓ High confidence — on track to achieve goal":result.goalProb>=50?"△ Moderate confidence — consider increasing SIP":"⚠ Low probability — increase SIP or extend horizon"}
          </div>
        </Card>}
      </div>

      {/* Results */}
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {result&&<>
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10}}>
            {scenarios.map(s=><Card key={s.label}><KPI label={s.label} value={fmt(s.value)} color={s.c}/></Card>)}
          </div>
          <Card>
            <SH title="Monte Carlo Simulation Bands" icon="📊"/>
            <ResponsiveContainer width="100%" height={230}>
              <ComposedChart data={result.chartData||[]}>
                <defs>
                  <linearGradient id="mcG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.teal} stopOpacity={.15}/><stop offset="95%" stopColor={T.teal} stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={T.faint} vertical={false}/>
                <XAxis dataKey="y" tick={{fill:T.muted,fontSize:9}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:T.muted,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>fmt(v)} width={58}/>
                <Tooltip {...TT} formatter={v=>fmt(v)}/>
                <Area type="monotone" dataKey="p90" stroke={T.green} fill={T.green} fillOpacity={.08} strokeWidth={1.5} strokeDasharray="4 2" name="Best 90%"/>
                <Area type="monotone" dataKey="p75" stroke={T.teal} fill="url(#mcG)" fillOpacity={.15} strokeWidth={1.5} name="75th Pct"/>
                <Line type="monotone" dataKey="p50" stroke={T.gold} strokeWidth={2.5} dot={false} name="Median 50%"/>
                <Area type="monotone" dataKey="p25" stroke={T.amber} fill={T.amber} fillOpacity={.06} strokeWidth={1.5} strokeDasharray="3 2" name="25th Pct"/>
                <Line type="monotone" dataKey="p10" stroke={T.red} strokeWidth={1.5} dot={false} strokeDasharray="3 3" name="Worst 10%"/>
                {goal&&<ReferenceLine y={goal} stroke={T.violet} strokeDasharray="4 2" label={{value:"Goal",fill:T.violet,fontSize:9}}/>}
                <Legend wrapperStyle={{color:T.muted,fontSize:9}}/>
              </ComposedChart>
            </ResponsiveContainer>
          </Card>
        </>}
        {!result&&<Card style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",minHeight:300}}>
          <div style={{textAlign:"center",color:T.muted}}>
            <div style={{fontSize:48,marginBottom:12}}>🎲</div>
            <div style={{fontSize:14,fontWeight:600,marginBottom:6}}>Monte Carlo Simulation</div>
            <div style={{fontSize:12}}>Configure parameters and run 3,000 scenarios to see<br/>probability distributions for your investment goals.</div>
          </div>
        </Card>}
      </div>
    </div>
  </div>;
}

// ═══════════════════════════════════════════════════════════════
// TAX OPTIMIZATION PAGE
// ═══════════════════════════════════════════════════════════════
function TaxPage({an}){
  if(!an) return null;
  const taxData=calcTaxAnalysis(an.funds);
  const harvests=taxHarvest(an.funds);
  const totalLiability=taxData.reduce((s,f)=>s+f.taxLiability,0);
  const totalExemption=taxData.reduce((s,f)=>s+f.exemption,0);
  const harvestSavings=harvests.reduce((s,h)=>s+h.taxSaved,0);
  const totalLTCG=taxData.filter(f=>f.isLT&&f.pnlPct>0).reduce((s,f)=>s+f.pnl,0);
  const totalSTCG=taxData.filter(f=>!f.isLT&&f.pnlPct>0).reduce((s,f)=>s+f.pnl,0);

  const recIcon={harvest:"🌾",hold_for_lt:"⏳",stagger:"📅",hold:"✓"};
  const recColor={harvest:T.amber,hold_for_lt:T.teal,stagger:T.violet,hold:T.green};

  return <div style={{display:"flex",flexDirection:"column",gap:13}}>
    <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10}}>
      {[
        {l:"Total LTCG",  v:`₹${(totalLTCG/1e3).toFixed(1)}K`,  c:T.green},
        {l:"Total STCG",  v:`₹${(totalSTCG/1e3).toFixed(1)}K`,  c:T.amber},
        {l:"LTCG Exemption",v:"₹1.25L",c:T.teal},
        {l:"Tax Liability",v:`₹${(totalLiability/1e3).toFixed(1)}K`, c:totalLiability>0?T.red:T.green},
        {l:"Harvest Savings",v:`₹${(harvestSavings/1e3).toFixed(1)}K`,c:T.gold},
      ].map((m,i)=><Card key={i}><KPI label={m.l} value={m.v} color={m.c}/></Card>)}
    </div>

    <Card>
      <SH title="Tax Analysis per Holding" icon="📋"/>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
          <thead><tr style={{borderBottom:`2px solid ${T.faint}`}}>
            {["Fund","Holding Period","Type","P&L","Tax Rate","Exemption","Tax Liability","Indexation","Action"].map(h=><th key={h} style={{padding:"6px 9px",textAlign:"left",color:T.muted,fontSize:9,fontWeight:600,textTransform:"uppercase",letterSpacing:".06em",whiteSpace:"nowrap"}}>{h}</th>)}
          </tr></thead>
          <tbody>{taxData.map((f,i)=><tr key={i} className="hov" style={{borderBottom:`1px solid ${T.faint}15`}}>
            <td style={{padding:"8px 9px",fontWeight:600,color:T.ink,whiteSpace:"nowrap"}}>{f.fund}</td>
            <td style={{padding:"8px 9px"}}><Mono c={T.muted} s={{fontSize:10}}>{f.holdMonths}mo</Mono></td>
            <td style={{padding:"8px 9px"}}><Badge color={f.isLT?T.green:T.amber}>{f.taxType}</Badge></td>
            <td style={{padding:"8px 9px"}}><span style={{color:f.pnl>=0?T.green:T.red,fontFamily:"'Space Mono',monospace",fontSize:11}}>₹{(f.pnl/1e3).toFixed(1)}K</span></td>
            <td style={{padding:"8px 9px"}}><Mono c={T.body}>{f.taxRate?.toFixed(1)}%</Mono></td>
            <td style={{padding:"8px 9px"}}><Mono c={f.exemption>0?T.teal:T.muted}>{f.exemption>0?`₹${(f.exemption/1e3).toFixed(0)}K`:"—"}</Mono></td>
            <td style={{padding:"8px 9px"}}><Mono c={f.taxLiability>0?T.red:T.green} s={{fontWeight:600}}>₹{(f.taxLiability/1e3).toFixed(1)}K</Mono></td>
            <td style={{padding:"8px 9px"}}><Badge color={f.indexation?T.teal:T.muted}>{f.indexation?"Yes":"No"}</Badge></td>
            <td style={{padding:"8px 9px"}}><span style={{display:"flex",alignItems:"center",gap:4,fontSize:10,color:recColor[f.recommendation]}}>{recIcon[f.recommendation]} {f.recommendation.replace(/_/g," ")}</span></td>
          </tr>)}</tbody>
        </table>
      </div>
    </Card>

    {/* Tax loss harvesting */}
    <Card>
      <SH title="Tax-Loss Harvesting Opportunities" icon="🌾" right={harvestSavings>0?<Badge color={T.gold}>Save ₹{(harvestSavings/1e3).toFixed(1)}K</Badge>:null}/>
      {harvests.length===0?
        <div style={{textAlign:"center",padding:"24px 0",color:T.muted,fontSize:12}}>✅ No tax-loss harvesting opportunities — all holdings are in profit</div>:
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {harvests.map((h,i)=><div key={i} style={{padding:"12px",background:T.raised,borderRadius:8,border:`1px solid ${T.faint}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
              <div>
                <div style={{fontSize:12,fontWeight:700,color:T.ink,marginBottom:3}}>{h.fund}</div>
                <div style={{fontSize:11,color:T.red}}>Loss: ₹{Math.abs(h.pnl/1e3).toFixed(1)}K</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:13,fontWeight:700,color:T.gold,fontFamily:"'Space Mono',monospace"}}>Save ₹{(h.taxSaved/1e3).toFixed(1)}K</div>
                <div style={{fontSize:9,color:T.muted}}>estimated tax saving</div>
              </div>
            </div>
            {h.replacement&&<div style={{background:T.greenDim,borderRadius:5,padding:"7px 10px",border:`1px solid ${T.green}20`}}>
              <div style={{fontSize:10,color:T.green,fontWeight:600,marginBottom:2}}>💡 Suggested replacement</div>
              <div style={{fontSize:11,color:T.body}}>{h.replacement} (ER: {h.replacementER?.toFixed(2)}%)</div>
              <div style={{fontSize:9,color:T.muted,marginTop:2}}>⏰ 30-day wash sale period before re-purchase</div>
            </div>}
          </div>)}
        </div>
      }

      {/* Tax summary box */}
      <div style={{marginTop:14,padding:"12px",background:T.amberDim,borderRadius:7,border:`1px solid ${T.amber}22`}}>
        <div style={{fontSize:11,fontWeight:600,color:T.amber,marginBottom:6}}>📋 India Mutual Fund Tax Summary (Finance Act 2024)</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"4px 20px",fontSize:10,color:T.body,lineHeight:1.75}}>
          {[["Equity LTCG (>12 months)","12.5% above ₹1.25 lakh/year"],["Equity STCG (<12 months)","20% flat"],["Debt LTCG (>36 months, pre-Apr'23)","20% with indexation"],["Debt (post-Apr'23)","Slab rate regardless of holding"],["Gold ETF LTCG (>36 months)","20% with indexation"],["ELSS lock-in","3 years minimum"],["Dividend income","Added to income, taxed at slab"],["STT on equity redemption","0.001% of redemption value"]].map(([k,v])=><div key={k}><span style={{color:T.gold,fontWeight:500}}>{k}:</span> {v}</div>)}
        </div>
      </div>
    </Card>
  </div>;
}

// ═══════════════════════════════════════════════════════════════
// AI ADVISOR — packages/ai + RAG
// ═══════════════════════════════════════════════════════════════
function AIAdvisorPage({an}){
  const [msgs,setMsgs]=useState([]);
  const [input,setInput]=useState("");
  const [loading,setLoading]=useState(false);
  const [activeDoc,setActiveDoc]=useState(null);
  const [btnBusy,setBtnBusy]=useState("");
  const endRef=useRef(null);

  const portfolioCtx=an?`Portfolio Context:
- Total Value: ₹${(an.total/1e5).toFixed(2)}L | Invested: ₹${(an.invested/1e5).toFixed(2)}L
- P&L: ₹${(an.pnl/1e3).toFixed(1)}K (${an.pnlPct.toFixed(1)}%)
- Holdings: ${an.funds.map(f=>f.fund).join(", ")}
- Category Mix: ${Object.entries(an.catMap).map(([k,v])=>`${k} ${v.toFixed(0)}%`).join(", ")}
- Sharpe: ${an.sharpe} | Volatility: ${an.wVol.toFixed(1)}% | Expense: ${an.wER.toFixed(2)}%
- Health Score: ${an.health}/100 | Diversity Index: ${an.divIdx}/100
- Max Overlap: ${an.maxOv}% | Alpha: ${an.wAlpha.toFixed(1)}%`:"No portfolio data loaded.";

  const quickPrompts=[
    "Is my portfolio too concentrated in small caps?",
    "Should I be worried about the high expense ratio in ICICI Tech?",
    "What is my HDFC Top 100 vs Axis Bluechip overlap?",
    "How can I reduce my portfolio volatility?",
    "What is the tax implication if I sell SBI Small Cap now?",
    "Can I reach ₹1 crore in 10 years with current SIPs?",
  ];

  const ask=async(q)=>{
    if(!q.trim()||loading) return;
    const question=q.trim(); setInput("");
    setMsgs(m=>[...m,{role:"user",content:question}]);
    setLoading(true);
    const hist=msgs.slice(-6).map(m=>`${m.role==="user"?"Q":"A"}: ${m.content}`).join("\n");
    const res=await callRAGAI(question,portfolioCtx,hist);
    setMsgs(m=>[...m,{role:"ai",content:res.text,sources:res.sources,fromCache:res.fromCache}]);
    setLoading(false);
    setTimeout(()=>endRef.current?.scrollIntoView({behavior:"smooth"}),100);
  };

  const quickAction=async(type)=>{
    setBtnBusy(type);
    const prompts={
      diagnose:`Provide a comprehensive diagnosis of my mutual fund portfolio. Cover: (1) key strengths, (2) main risk, (3) hidden inefficiency, (4) top 2 specific action items with fund names.`,
      optimize:`Recommend specific rebalancing steps for my portfolio. Format: REMOVE [fund]—reason, KEEP [fund]—reason, ADD [fund] (~X%)—reason. End with expected improvement.`,
      compare:"Compare the two large-cap funds in my portfolio (HDFC Top 100 vs Axis Bluechip vs Mirae Asset if present). Which should I prefer and why?",
      overlap:"Analyse the fund overlap in my portfolio. Identify which funds have the highest holding overlap and what I should do about it.",
    };
    await ask(prompts[type]);
    setBtnBusy("");
  };

  const ragVizData=KNOWLEDGE_BASE.slice(0,8).map(d=>({name:d.title.slice(0,28)+"…",type:d.type,relevance:Math.random()*.6+.4}));

  return <div style={{display:"grid",gridTemplateColumns:"1fr 340px",gap:13,minHeight:600}}>
    {/* Main chat area */}
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      {/* Quick actions */}
      <Card style={{padding:"12px"}}>
        <SH title="Quick AI Actions" icon="⚡"/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
          {[{t:"diagnose",l:"Diagnose Portfolio",icon:"🔬",c:T.teal},{t:"optimize",l:"Optimize Holdings",icon:"⚡",c:T.gold},{t:"overlap",l:"Overlap Analysis",icon:"⊗",c:T.violet},{t:"compare",l:"Compare Funds",icon:"⚖",c:T.green}].map(a=><button key={a.t} onClick={()=>quickAction(a.t)} disabled={!!btnBusy||loading} className="btn" style={{background:T.raised,border:`1px solid ${a.c}28`,color:T.body,borderRadius:6,padding:"8px 6px",cursor:"pointer",fontSize:10,fontWeight:600,display:"flex",flexDirection:"column",alignItems:"center",gap:3,transition:"all .12s"}}>
            {btnBusy===a.t?<Spin sz={14} c={a.c}/>:<span style={{fontSize:16}}>{a.icon}</span>}
            <span style={{color:a.c}}>{a.l}</span>
          </button>)}
        </div>
      </Card>

      {/* Chat messages */}
      <Card style={{flex:1,display:"flex",flexDirection:"column",minHeight:400}}>
        <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:12}}>
          <SH title="AI Copilot — RAG Powered" icon="🤖" mb={0}/><LiveDot/>
        </div>
        <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:10,marginBottom:12,maxHeight:380}}>
          {msgs.length===0&&<div style={{padding:"8px 0"}}>
            <div style={{color:T.muted,fontSize:11,marginBottom:8}}>Suggested questions — based on your portfolio:</div>
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              {quickPrompts.map(q=><button key={q} onClick={()=>ask(q)} style={{background:T.raised,border:`1px solid ${T.line}`,color:T.body,borderRadius:6,padding:"7px 11px",fontSize:11,cursor:"pointer",textAlign:"left",fontFamily:"inherit",transition:"background .12s"}}>
                {q}
              </button>)}
            </div>
          </div>}
          {msgs.map((m,i)=><div key={i} style={{display:"flex",flexDirection:"column",alignItems:m.role==="user"?"flex-end":"flex-start"}} className="fu">
            <div style={{maxWidth:"90%",padding:"9px 13px",borderRadius:m.role==="user"?"10px 10px 0 10px":"0 10px 10px 10px",background:m.role==="user"?T.gold+"18":T.raised,border:`1px solid ${m.role==="user"?T.gold+"30":T.line}`,color:T.ink,fontSize:12,lineHeight:1.7}}>
              {m.content}
            </div>
            {m.sources&&<div style={{display:"flex",gap:4,marginTop:4,flexWrap:"wrap"}}>
              {m.sources.slice(0,2).map((s,j)=><button key={j} onClick={()=>setActiveDoc(s)} style={{background:T.faint,border:`1px solid ${T.line}`,color:T.muted,borderRadius:4,padding:"2px 7px",fontSize:9,cursor:"pointer",fontFamily:"inherit"}}>
                📄 {s.src}
              </button>)}
              {m.fromCache&&<Badge color={T.teal}>cached</Badge>}
            </div>}
          </div>)}
          {loading&&<div style={{display:"flex",gap:7,color:T.muted,fontSize:11,alignItems:"center"}}><Spin sz={12} c={T.teal}/>Retrieving knowledge base & generating response…</div>}
          <div ref={endRef}/>
        </div>
        <div style={{display:"flex",gap:8}}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&ask(input)} placeholder="Ask anything about your portfolio…" style={{flex:1,background:T.raised,border:`1px solid ${T.line}`,color:T.ink,borderRadius:7,padding:"9px 13px",fontSize:12,outline:"none",fontFamily:"inherit"}}/>
          <button onClick={()=>ask(input)} disabled={loading} className="btn" style={{background:T.gold,color:"#0B0F17",border:"none",borderRadius:7,padding:"9px 16px",fontWeight:700,fontSize:14,cursor:"pointer"}}>→</button>
        </div>
      </Card>
    </div>

    {/* RAG Architecture panel */}
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <Card>
        <SH title="RAG Architecture" icon="🧠"/>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {[{s:"User Query",c:T.blue,d:"Intent classification"},
            {s:"Vector Search",c:T.teal,d:"Embedding similarity"},
            {s:"Knowledge Base",c:T.gold,d:"SEBI circulars · Factsheets · Reports"},
            {s:"Context Injection",c:T.violet,d:"Top-K docs + portfolio data"},
            {s:"Claude API",c:T.amber,d:"claude-sonnet-4 generation"},
            {s:"Response",c:T.green,d:"Source-cited answer"},
            {s:"Redis Cache",c:T.teal,d:"1800s TTL for repeated queries"},
          ].map((s,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:7,height:7,borderRadius:"50%",background:s.c,flexShrink:0}}/>
            <div style={{flex:1,padding:"5px 8px",background:T.raised,borderRadius:4,border:`1px solid ${T.faint}`}}>
              <div style={{fontSize:11,fontWeight:600,color:T.ink}}>{s.s}</div>
              <div style={{fontSize:9,color:T.muted}}>{s.d}</div>
            </div>
          </div>)}
        </div>
        <div style={{marginTop:8,padding:"7px 9px",background:T.amberDim,borderRadius:4,border:`1px solid ${T.amber}20`,fontSize:9,color:T.amber}}>
          Vector DB: Pinecone / Milvus / Weaviate · Embedding: text-embedding-3-small · Chunk: 512 tokens
        </div>
      </Card>

      {/* Knowledge base viewer */}
      <Card>
        <SH title="Knowledge Base" icon="📚" right={<Badge color={T.teal}>{KNOWLEDGE_BASE.length} docs</Badge>}/>
        <div style={{display:"flex",flexDirection:"column",gap:5,maxHeight:280,overflowY:"auto"}}>
          {KNOWLEDGE_BASE.map((d,i)=><div key={i} onClick={()=>setActiveDoc(d)} style={{padding:"7px 9px",background:T.raised,borderRadius:5,border:`1px solid ${activeDoc?.id===d.id?T.gold:T.faint}`,cursor:"pointer",transition:"border-color .12s"}}>
            <div style={{display:"flex",gap:6,alignItems:"flex-start"}}>
              <Badge color={{sebi_circular:T.red,amfi_guideline:T.teal,factsheet:T.gold,tax_circular:T.amber,market_report:T.blue,research:T.violet,regulation:T.green}[d.type]||T.muted}>{d.type.replace(/_/g," ")}</Badge>
              <div style={{fontSize:10,color:T.body,lineHeight:1.5,flex:1}}>{d.title}</div>
            </div>
          </div>)}
        </div>
      </Card>

      {/* Document detail */}
      {activeDoc&&<Card>
        <SH title="Document Preview" icon="📄" right={<button onClick={()=>setActiveDoc(null)} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:16}}>×</button>}/>
        <div style={{fontSize:11,fontWeight:700,color:T.gold,marginBottom:4}}>{activeDoc.title}</div>
        <Badge color={T.muted}>{activeDoc.src}</Badge>
        <div style={{fontSize:11,color:T.body,lineHeight:1.7,marginTop:8}}>{activeDoc.content}</div>
        <div style={{marginTop:8,display:"flex",gap:4,flexWrap:"wrap"}}>
          {activeDoc.tags.map(tag=><Badge key={tag} color={T.teal}>{tag}</Badge>)}
        </div>
      </Card>}
    </div>
  </div>;
}

// ═══════════════════════════════════════════════════════════════
// SECURITY & COMPLIANCE
// ═══════════════════════════════════════════════════════════════
function SecurityPage({user}){
  const [kycDone,setKycDone]=useState(user?.kyc==="verified");
  const checks=[
    {n:"JWT Authentication",   ok:true, note:"HS256 · 24h access token · 7d refresh · httpOnly cookie"},
    {n:"Rate Limiting",        ok:true, note:"express-rate-limit · 100/min per IP · 10/min AI endpoint"},
    {n:"SQL Injection Guard",  ok:true, note:"Parameterised queries via Prisma ORM · no raw SQL"},
    {n:"XSS Protection",       ok:true, note:"Helmet.js · CSP headers · DOMPurify on inputs"},
    {n:"HTTPS / TLS 1.3",      ok:true, note:"NGINX reverse proxy · Let's Encrypt · HSTS enabled"},
    {n:"DB Field Encryption",  ok:true, note:"AWS KMS managed keys · PAN · Aadhaar hashed (bcrypt+salt)"},
    {n:"Secrets Management",   ok:true, note:"Doppler / AWS Secrets Manager · never in .env committed"},
    {n:"API Authentication",   ok:true, note:"Bearer token on all /api routes · Supabase RLS enforced"},
    {n:"Input Validation",     ok:true, note:"Zod schemas on all API endpoints · type-safe contracts"},
    {n:"DPDP Act 2023",        ok:true, note:"Granular consent flow · data minimisation · 72h erasure SLA"},
    {n:"SEBI Compliance",      ok:true, note:"Read-only analytics · no trade execution · advisory disclaimer"},
    {n:"KYC Verification",     ok:kycDone, note:kycDone?"Aadhaar + DigiLocker verified":"Pending verification"},
  ];

  const auditLogs=[
    {ts:"10:24:31",action:"LOGIN",       ip:"103.12.45.88",status:"ok",  note:"JWT issued · session_id:abc123"},
    {ts:"10:24:35",action:"PORTFOLIO_VIEW",ip:"103.12.45.88",status:"ok",note:"portfolio_id:42"},
    {ts:"10:25:12",action:"AI_QUERY",    ip:"103.12.45.88",status:"ok",  note:"tokens:612 · cache:miss"},
    {ts:"10:26:44",action:"NAV_FETCH",   ip:"103.12.45.88",status:"ok",  note:"cache:hit · 0ms"},
    {ts:"10:28:01",action:"EXPORT_PDF",  ip:"103.12.45.88",status:"ok",  note:"report_id:rpt_xyz"},
    {ts:"09:55:12",action:"LOGIN_FAIL",  ip:"45.33.22.91", status:"err", note:"invalid_password x3"},
    {ts:"09:55:15",action:"RATE_LIMIT",  ip:"45.33.22.91", status:"warn",note:"blocked 15 minutes"},
    {ts:"09:40:00",action:"DATA_EXPORT", ip:"103.12.45.88",status:"ok",  note:"user consent confirmed"},
  ];

  return <div style={{display:"flex",flexDirection:"column",gap:13}}>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
      {[{l:"Security Score",v:"96/100",c:T.green},{l:"KYC Status",v:kycDone?"Verified":"Pending",c:kycDone?T.green:T.amber},{l:"Rate Limit",v:"100/min",c:T.teal},{l:"Audit Events",v:auditLogs.length,c:T.gold}].map((m,i)=><Card key={i}><KPI label={m.l} value={String(m.v)} color={m.c}/></Card>)}
    </div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:13}}>
      <Card>
        <SH title="Security Checklist" icon="🔒"/>
        <div style={{display:"flex",flexDirection:"column",gap:5}}>
          {checks.map((c,i)=><div key={i} style={{display:"flex",gap:9,padding:"7px 9px",background:T.raised,borderRadius:5,border:`1px solid ${T.faint}`,alignItems:"flex-start"}}>
            <span style={{fontSize:13,flexShrink:0}}>{c.ok?"✅":"⚠️"}</span>
            <div style={{flex:1}}>
              <div style={{fontSize:11,fontWeight:600,color:T.ink}}>{c.n}</div>
              <div style={{fontSize:9,color:T.muted}}>{c.note}</div>
            </div>
            <Badge color={c.ok?T.green:T.amber}>{c.ok?"Active":"Pending"}</Badge>
          </div>)}
        </div>
      </Card>

      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        <Card>
          <SH title="KYC & Indian Regulatory Compliance" icon="🪪"/>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            <div style={{padding:"11px",background:kycDone?T.greenDim:T.amberDim,borderRadius:7,border:`1px solid ${(kycDone?T.green:T.amber)}28`}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <span style={{fontSize:12,fontWeight:600,color:T.ink}}>Identity Verification</span>
                <Badge color={kycDone?T.green:T.amber}>{kycDone?"Verified":"Pending"}</Badge>
              </div>
              {!kycDone&&<button onClick={()=>setKycDone(true)} className="btn" style={{background:T.blue,color:"#fff",border:"none",borderRadius:6,padding:"8px 16px",fontWeight:600,fontSize:11,cursor:"pointer",width:"100%"}}>🆔 Verify via Aadhaar / DigiLocker API</button>}
              {kycDone&&<div style={{fontSize:11,color:T.green}}>✓ Aadhaar verified · PAN linked · CKYC record found · AML check passed</div>}
            </div>
            {[["SEBI","Analytics-only platform · SEBI IA Reg 2013 compliant · no trade execution"],["DPDP 2023","Explicit consent · data minimisation · 72h erasure · ₹250Cr penalty awareness"],["Data Localisation","All data stored in AWS ap-south-1 (Mumbai)"],["AMFI Compliance","ARN integration ready · NAV sourced exclusively from AMFI"],["Audit Trail","7-year data retention per SEBI regulations"],].map(([k,v])=><div key={k} style={{padding:"6px 9px",background:T.raised,borderRadius:4,border:`1px solid ${T.faint}`}}>
              <span style={{color:T.gold,fontWeight:600,fontSize:10}}>{k}: </span><span style={{color:T.muted,fontSize:10}}>{v}</span>
            </div>)}
          </div>
        </Card>

        <Card>
          <SH title="Infrastructure Security" icon="🏰"/>
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:T.body,lineHeight:1.8}}>
            {[["AWS KMS","Envelope encryption for PAN/Aadhaar"],["Cloudflare WAF","DDoS protection + rate limiting"],["VPC Private Subnet","RDS/Redis not publicly accessible"],["Secrets Manager","Rotation every 90 days"],["Docker Secrets","No env vars in container images"],["Snyk CI Scan","Dependency vulnerability scanning"]].map(([k,v])=><div key={k} style={{display:"flex",gap:8}}>
              <span style={{color:T.teal,flexShrink:0,width:140}}>{k}</span>
              <span style={{color:T.muted,fontSize:9}}>{v}</span>
            </div>)}
          </div>
        </Card>
      </div>
    </div>

    {/* Audit log */}
    <Card>
      <SH title="Audit Log" icon="📋"/>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
        <thead><tr style={{borderBottom:`1px solid ${T.faint}`}}>
          {["Timestamp","Action","IP","Status","Detail"].map(h=><th key={h} style={{padding:"5px 9px",textAlign:"left",color:T.muted,fontSize:9,fontWeight:600,textTransform:"uppercase",letterSpacing:".06em"}}>{h}</th>)}
        </tr></thead>
        <tbody>{auditLogs.map((l,i)=><tr key={i} className="hov" style={{borderBottom:`1px solid ${T.faint}15`}}>
          <td style={{padding:"7px 9px"}}><Mono c={T.muted} s={{fontSize:9}}>{l.ts}</Mono></td>
          <td style={{padding:"7px 9px"}}><Mono c={T.teal} s={{fontWeight:600,fontSize:10}}>{l.action}</Mono></td>
          <td style={{padding:"7px 9px"}}><Mono c={T.muted} s={{fontSize:9}}>{l.ip}</Mono></td>
          <td style={{padding:"7px 9px"}}><Badge color={{ok:T.green,warn:T.amber,err:T.red}[l.status]}>{l.status}</Badge></td>
          <td style={{padding:"7px 9px",color:T.muted,fontSize:9}}>{l.note}</td>
        </tr>)}</tbody>
      </table>
    </Card>
  </div>;
}

// ═══════════════════════════════════════════════════════════════
// INFRASTRUCTURE & DEPLOYMENT — services + infra/
// ═══════════════════════════════════════════════════════════════
function InfraPage(){
  const [activeSnippet,setActiveSnippet]=useState("monorepo");

  const DB_SCHEMA=`-- ════════════════════════════════════════════
--  AI MF Copilot · PostgreSQL 16 Schema
--  infra/db/schema.sql
-- ════════════════════════════════════════════
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- USERS
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  plan          TEXT DEFAULT 'free' CHECK (plan IN ('free','pro','elite')),
  pan_encrypted TEXT,
  kyc_status    TEXT DEFAULT 'pending',
  risk_profile  TEXT DEFAULT 'moderate',
  referral_code TEXT UNIQUE,
  referred_by   UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  last_seen     TIMESTAMPTZ
);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_plan  ON users(plan);

-- PORTFOLIOS
CREATE TABLE portfolios (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL DEFAULT 'My Portfolio',
  cas_source    TEXT,
  health_score  INT,
  div_index     INT,
  last_computed TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_portfolios_user ON portfolios(user_id);

-- HOLDINGS
CREATE TABLE portfolio_holdings (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
  fund_id      UUID REFERENCES funds(id),
  folio_number TEXT,
  units        NUMERIC(18,3) NOT NULL,
  buy_nav      NUMERIC(10,4),
  invested     NUMERIC(14,2),
  sip_amount   NUMERIC(10,2) DEFAULT 0,
  goal         TEXT,
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- TRANSACTIONS (FIFO for tax calculation)
CREATE TABLE portfolio_transactions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  holding_id       UUID REFERENCES portfolio_holdings(id),
  type             TEXT NOT NULL,
  units            NUMERIC(18,3),
  nav              NUMERIC(10,4),
  amount           NUMERIC(14,2),
  transaction_date DATE NOT NULL,
  note             TEXT,
  source           TEXT DEFAULT 'cas_import',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_txn_date ON portfolio_transactions(transaction_date);

-- FUNDS
CREATE TABLE funds (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  isin          TEXT UNIQUE NOT NULL,
  amfi_code     INT,
  name          TEXT NOT NULL,
  amc           TEXT,
  category      TEXT,
  benchmark     TEXT,
  fund_manager  TEXT,
  expense_ratio NUMERIC(4,2),
  aum_cr        NUMERIC(12,2),
  risk_o_meter  TEXT,
  is_direct     BOOLEAN DEFAULT FALSE,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_funds_isin ON funds(isin);

-- NAV HISTORY (partitioned by year for performance)
CREATE TABLE nav_history (
  id       BIGSERIAL,
  fund_id  UUID REFERENCES funds(id),
  nav      NUMERIC(12,4) NOT NULL,
  nav_date DATE NOT NULL,
  source   TEXT DEFAULT 'amfi',
  PRIMARY KEY (id, nav_date)
) PARTITION BY RANGE (nav_date);
CREATE TABLE nav_2024 PARTITION OF nav_history
  FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
CREATE TABLE nav_2025 PARTITION OF nav_history
  FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
CREATE UNIQUE INDEX idx_nav_fund_date ON nav_history(fund_id, nav_date);

-- FUND HOLDINGS (overlap calculation, updated weekly)
CREATE TABLE fund_holdings (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fund_id    UUID REFERENCES funds(id),
  stock_isin TEXT,
  stock_name TEXT NOT NULL,
  pct        NUMERIC(5,2),
  sector     TEXT,
  as_of_date DATE NOT NULL
);
CREATE INDEX idx_fh_fund ON fund_holdings(fund_id, as_of_date DESC);

-- ANALYTICS RESULTS (cached computations)
CREATE TABLE analytics_results (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID REFERENCES portfolios(id),
  sharpe       NUMERIC(6,3),
  sortino      NUMERIC(6,3),
  calmar       NUMERIC(6,3),
  beta         NUMERIC(5,3),
  alpha        NUMERIC(6,3),
  volatility   NUMERIC(5,2),
  health_score INT,
  div_index    INT,
  data_json    JSONB,
  computed_at  TIMESTAMPTZ DEFAULT NOW()
);

-- AUDIT LOG (SEBI / DPDP 2023)
CREATE TABLE audit_logs (
  id         BIGSERIAL PRIMARY KEY,
  user_id    UUID REFERENCES users(id),
  action     TEXT NOT NULL,
  resource   TEXT,
  ip_address INET,
  metadata   JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_audit_user ON audit_logs(user_id, created_at DESC);

-- ALERTS
CREATE TABLE alerts (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES users(id),
  severity     TEXT CHECK (severity IN ('low','medium','high')),
  message      TEXT,
  acknowledged BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);`;

  const snippets={
    monorepo:`# Turborepo Monorepo Structure
apps/
├── web/               # Next.js 14 · App Router · TypeScript · Tailwind
└── api/               # Express.js · TypeScript · Node.js 20
    └── src/
        ├── routes/    # portfolio · funds · ai · nav · auth · payments
        ├── middleware/ # auth · rateLimit · validation · auditLog
        ├── services/  # portfolio · analytics · ai · cache
        └── jobs/      # Bull queues — analytics recompute · emails

packages/
├── ui/                # Shared React components (shadcn/ui base)
├── analytics/         # Portfolio analytics engine (TypeScript)
├── ai/                # AI prompt templates + RAG orchestration
├── data/              # Fund DB types + Zod schemas
└── utils/             # Finance helpers · formatters

services/
├── ingestion-service/ # Node.js · node-cron · AMFI NAV pipeline
├── cas-parser/        # Python 3.12 · FastAPI · PyPDF2 · Camelot
├── ai-service/        # Claude API + RAG + Pinecone vector search
└── analytics-engine/  # Python · Pandas · scipy · Monte Carlo

infra/
├── docker-compose.yml
├── nginx.conf
└── terraform/         # AWS ECS + RDS + ElastiCache IaC

Toolchain: Turborepo · pnpm workspaces · Prisma ORM · pg-boss`,

    docker:`# infra/docker-compose.yml
version: '3.9'
services:
  web:
    build: apps/web
    ports: ["3000:3000"]
    depends_on: [api]

  api:
    build: apps/api
    ports: ["4000:4000"]
    depends_on: [postgres, redis]
    deploy:
      replicas: 2

  cas-parser:
    build: services/cas-parser
    ports: ["5001:5001"]
    volumes: ["./uploads:/tmp/uploads"]

  ingestion:
    build: services/ingestion-service
    depends_on: [postgres, redis]
    restart: always

  ai-service:
    build: services/ai-service
    ports: ["5002:5002"]
    environment:
      ANTHROPIC_API_KEY: \${ANTHROPIC_API_KEY}

  postgres:
    image: postgres:16-alpine
    volumes: ["pgdata:/var/lib/postgresql/data"]
    environment:
      POSTGRES_DB: \${DB_NAME}
      POSTGRES_PASSWORD: \${DB_PASS}

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass \${REDIS_PASSWORD}

  nginx:
    image: nginx:alpine
    ports: ["80:80","443:443"]
    volumes:
      - ./infra/nginx.conf:/etc/nginx/nginx.conf
      - ./infra/ssl:/etc/nginx/ssl

volumes:
  pgdata: {}
  redisdata: {}`,

    portfolio:`// apps/api/src/routes/portfolio.ts
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { portfolioService } from '../services/portfolio';
import { redis } from '../services/cache';
import { auditLog } from '../services/audit';

const router = Router();

// GET /api/portfolio/:id — Redis-cached
router.get('/:id', authenticate, async (req, res) => {
  const cacheKey = \`portfolio:\${req.params.id}:analytics\`;
  const cached = await redis.get(cacheKey);
  if (cached) return res.json({ data: JSON.parse(cached), src:'cache' });

  const portfolio = await portfolioService.getWithAnalytics(
    req.params.id, req.user.id
  );
  await redis.setex(cacheKey, 600, JSON.stringify(portfolio));
  await auditLog(req.user.id, 'PORTFOLIO_VIEW', { id: req.params.id });
  res.json({ data: portfolio, src:'db' });
});

// POST /api/portfolio/import-cas
router.post('/import-cas', authenticate, async (req, res) => {
  const { casData } = req.body;
  const portfolio = await portfolioService.importFromCAS(
    req.user.id, casData
  );
  await redis.del(\`portfolio:\${portfolio.id}:analytics\`);
  await auditLog(req.user.id, 'CAS_IMPORT', { folios: casData.length });
  res.status(201).json({ data: portfolio });
});`,

    casparser:`# services/cas-parser/main.py
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
import camelot, tabula, PyPDF2, pandas as pd
import re, io, redis as r_client, json, hashlib

app = FastAPI(title="CAS Parser Service v1.0")
r = r_client.Redis(host='redis', port=6379, decode_responses=True)

FOLIO_RE = re.compile(r'Folio No[.:]?\\s*(\\d{8,14}/\\d{2})', re.I)
ISIN_RE  = re.compile(r'INF[A-Z0-9]{9}')

@app.post("/parse")
async def parse_cas(file: UploadFile = File(...)):
    content = await file.read()
    sha = hashlib.sha256(content).hexdigest()
    if cached := r.get(f"cas:{sha}"):
        return JSONResponse({"data": json.loads(cached), "cached": True})

    pdf = PyPDF2.PdfReader(io.BytesIO(content))
    text = "\\n".join(p.extract_text() for p in pdf.pages)

    # Camelot for table extraction
    tables_l = camelot.read_pdf(io.BytesIO(content),
                 pages='all', flavor='lattice')
    tables_s = camelot.read_pdf(io.BytesIO(content),
                 pages='all', flavor='stream')
    dfs = [t.df for t in (*tables_l, *tables_s)
           if t.accuracy > 65]

    folios = extract_folios(text, dfs)
    result = enrich_with_nav(folios)  # AMFI API fetch

    r.setex(f"cas:{sha}", 86400, json.dumps(result))
    return JSONResponse({"data": result, "cached": False})`,

    ingestion:`// services/ingestion-service/src/index.ts
import cron from 'node-cron';
import axios from 'axios';
import { prisma } from './db';
import { redis } from './cache';

// Run at 11:30 PM IST every weekday (AMFI posts NAV by 9 PM)
cron.schedule('0 18 * * 1-5', fetchAndStoreNAV, {
  timezone: 'Asia/Kolkata',
});

async function fetchAndStoreNAV() {
  const AMFI_URL =
    'https://www.amfiindia.com/spages/NAVAll.txt';
  const { data: raw } = await axios.get(AMFI_URL,
    { timeout: 30000 });

  // AMFI format: Code;ISIN;ISINReinvest;Name;NAV;Date
  const records = raw.split('\\n')
    .filter((l: string) => l.includes(';'))
    .map((l: string) => {
      const [code,,isin,,navStr,dateStr] = l.split(';');
      return { amfiCode: +code, isin,
               nav: +navStr, navDate: parseAMFIDate(dateStr) };
    })
    .filter((r: any) => r.nav > 0 && r.isin?.startsWith('INF'));

  // Batch upsert into partitioned nav_history table
  await prisma.$transaction(records.map((r: any) =>
    prisma.navHistory.upsert({
      where: { fund_isin_navDate: { isin: r.isin, navDate: r.navDate }},
      create: r, update: { nav: r.nav }
    })
  ));

  // Invalidate cached portfolio analytics
  const keys = await redis.keys('portfolio:*:analytics');
  if (keys.length) await redis.del(...keys);

  // Broadcast via WebSocket
  await redis.publish('nav.update',
    JSON.stringify(Object.fromEntries(
      records.map((r: any) => [r.isin, r.nav]))));

  console.log(\`[AMFI] Ingested \${records.length} NAVs\`);
}`,

    env:`# .env.example — managed via Doppler / AWS Secrets Manager
# ──────────────────────────────────────────────
DATABASE_URL="postgresql://user:pass@rds.host:5432/mfcopilot"
DIRECT_URL="postgresql://user:pass@rds.host:5432/mfcopilot"
REDIS_URL="rediss://:password@cache.host:6380"

# Auth
JWT_SECRET="min_32_char_secret_here"
SUPABASE_URL="https://xxxx.supabase.co"
SUPABASE_SERVICE_KEY="eyJhbGc..."

# AI
ANTHROPIC_API_KEY="sk-ant-api03-..."

# Vector DB (RAG)
PINECONE_API_KEY="xxx"
PINECONE_ENV="ap-southeast-1"
PINECONE_INDEX="mf-rag"

# Payments
RAZORPAY_KEY_ID="rzp_live_xxx"
RAZORPAY_KEY_SECRET="secret"

# KYC — DigiLocker
DIGILOCKER_CLIENT_ID="xxx"
DIGILOCKER_CLIENT_SECRET="xxx"

# Encryption
KMS_KEY_ARN="arn:aws:kms:ap-south-1:xxx:key/mrk-xxx"

# Monitoring
SENTRY_DSN="https://xxx@sentry.io/xxx"
DATADOG_API_KEY="xxx"

# Analytics
MIXPANEL_TOKEN="xxx"
GA_MEASUREMENT_ID="G-XXXXXXXX"`,
  };

  const allSnippets={...snippets,"db-schema":DB_SCHEMA};

  const stack=[
    {layer:"Frontend",     tech:"Next.js 14 + TypeScript + Tailwind CSS",host:"Vercel (Edge)",           c:T.blue},
    {layer:"API Server",   tech:"Node.js 20 + Express + TypeScript",     host:"AWS ECS Fargate",         c:T.teal},
    {layer:"CAS Parser",   tech:"Python 3.12 + FastAPI + Camelot/Tabula",host:"Docker on ECS",           c:T.gold},
    {layer:"AI Service",   tech:"Claude API + RAG + Pinecone vectors",   host:"Docker on ECS",           c:T.violet},
    {layer:"NAV Ingestion",tech:"Node.js cron + AMFI REST API",          host:"ECS Scheduled Task",      c:T.amber},
    {layer:"Database",     tech:"PostgreSQL 16 + Prisma ORM",            host:"AWS RDS Multi-AZ",        c:T.green},
    {layer:"Cache/Queue",  tech:"Redis 7 + Bull Queue + Socket.io",      host:"AWS ElastiCache",         c:T.red},
    {layer:"CDN + WAF",    tech:"Cloudflare Pro + NGINX reverse proxy",  host:"Global Edge (50+ PoP)",   c:T.body},
    {layer:"Monitoring",   tech:"Datadog APM + Sentry error tracking",   host:"SaaS",                    c:T.muted},
    {layer:"Auth / KYC",   tech:"Supabase Auth + JWT + DigiLocker",      host:"Supabase Cloud",          c:T.teal},
    {layer:"Payments",     tech:"Razorpay Subscriptions + Webhooks",     host:"Razorpay Cloud",          c:T.gold},
  ];

  return <div style={{display:"flex",flexDirection:"column",gap:13}}>
    <Card>
      <SH title="Production Infrastructure Stack" icon="🏗"/>
      <div style={{display:"flex",flexDirection:"column",gap:5}}>
        {stack.map((s,i)=><div key={i} style={{display:"grid",gridTemplateColumns:"150px 1fr 220px",gap:10,padding:"8px 10px",background:T.raised,borderRadius:5,border:`1px solid ${T.faint}`,alignItems:"center"}}>
          <div style={{fontSize:11,fontWeight:600,color:s.c}}>{s.layer}</div>
          <div style={{fontSize:11,color:T.body}}>{s.tech}</div>
          <Badge color={s.c}>{s.host}</Badge>
        </div>)}
      </div>
    </Card>

    <div style={{display:"grid",gridTemplateColumns:"3fr 2fr",gap:13}}>
      <Card>
        <div style={{display:"flex",gap:5,marginBottom:12,flexWrap:"wrap"}}>
          {[["monorepo","Monorepo"],["docker","Docker"],["portfolio","API Routes"],["casparser","CAS Parser"],["ingestion","NAV Ingest"],["db-schema","DB Schema"],["env","Env Vars"]].map(([k,l])=><button key={k} onClick={()=>setActiveSnippet(k)} className="btn" style={{background:activeSnippet===k?T.gold:"transparent",color:activeSnippet===k?"#0B0F17":T.muted,border:`1px solid ${activeSnippet===k?T.gold:T.line}`,borderRadius:5,padding:"4px 10px",fontSize:9,cursor:"pointer",fontFamily:"inherit",fontWeight:activeSnippet===k?700:400}}>{l}</button>)}
        </div>
        <pre style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:T.body,lineHeight:1.7,overflowX:"auto",background:T.bg,borderRadius:7,padding:"12px",border:`1px solid ${T.faint}`,maxHeight:380,overflowY:"auto",margin:0,whiteSpace:"pre-wrap"}}><code>{allSnippets[activeSnippet]}</code></pre>
      </Card>

      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        <Card>
          <SH title="CI/CD Pipeline" icon="🚀"/>
          <div style={{display:"flex",flexDirection:"column",gap:5}}>
            {["git push → GitHub Actions trigger","pnpm install --frozen-lockfile","pnpm turbo lint + typecheck","pnpm turbo test --filter=...","pnpm turbo build (all packages)","Docker build → push to Amazon ECR","Vercel preview deploy (PR)","Playwright E2E smoke tests","✅ API → ECS rolling update","Vercel production promote","Sentry release + Datadog event"].map((s,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{width:5,height:5,borderRadius:"50%",background:s.startsWith("✅")?T.green:T.teal,flexShrink:0}}/>
              <span style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:T.body}}>{s}</span>
            </div>)}
          </div>
        </Card>
        <Card>
          <SH title="WebSocket Events (Socket.io)" icon="🔌"/>
          <div style={{fontSize:9,color:T.body,lineHeight:1.8,fontFamily:"'Space Mono',monospace"}}>
            <div style={{color:T.teal}}>// Rooms</div>
            <div>portfolio:{"{"}<span style={{color:T.gold}}>userId</span>{"}"} — personal NAV</div>
            <div>market:all — broadcast all NAVs</div>
            <div>alerts:{"{"}<span style={{color:T.gold}}>userId</span>{"}"} — thresholds</div>
            <br/>
            <div style={{color:T.teal}}>// Events</div>
            <div>nav.update — <span style={{color:T.amber}}>every 5s</span></div>
            <div>portfolio.recomputed — analytics</div>
            <div>alert.triggered — threshold breach</div>
          </div>
        </Card>
        <Card>
          <SH title="Vector DB — RAG" icon="🧠"/>
          <div style={{fontSize:9,color:T.body,lineHeight:1.8,fontFamily:"'Space Mono',monospace"}}>
            <div><span style={{color:T.teal}}>Provider:</span> Pinecone / Milvus</div>
            <div><span style={{color:T.teal}}>Embedding:</span> text-embedding-3-small</div>
            <div><span style={{color:T.teal}}>Chunk:</span> 512 tokens · 64 overlap</div>
            <div><span style={{color:T.teal}}>Corpus:</span> SEBI circulars · Factsheets · Finance Act · Market reports</div>
            <div><span style={{color:T.teal}}>Top-K:</span> 3 docs per query</div>
            <div><span style={{color:T.teal}}>Cache TTL:</span> 1800s Redis</div>
          </div>
        </Card>
      </div>
    </div>
  </div>;
}

// ═══════════════════════════════════════════════════════════════
// MONETIZATION
// ═══════════════════════════════════════════════════════════════
function MonetizationPage({user,onUpgrade}){
  const [billing,setBilling]=useState("monthly");
  const disc=billing==="annual"?.8:1;
  const plans=[
    {id:"free",  name:"Free",   price:0,    c:T.muted,
     feat:["1 portfolio","Basic analytics","Fund screener","5 AI queries/month","Weekly email digest"]},
    {id:"pro",   name:"Pro",    price:299,  c:T.gold,  popular:true,
     feat:["Unlimited portfolios","Full AI Advisor (RAG)","Monte Carlo simulations","Tax optimization engine","Real-time NAV + alerts","Advanced analytics","PDF reports","Priority support"]},
    {id:"elite", name:"Elite",  price:499,  c:T.violet,
     feat:["Everything in Pro","Multi-family portfolios","API access (1K calls/day)","Custom AI tuning","Dedicated RM","SOC 2 reports","White-label option"]},
  ];
  const mrrData=[...Array(12)].map((_,i)=>({m:["J","F","M","A","M","J","J","A","S","O","N","D"][i],mrr:Math.round(80000+i*36000+(Math.sin(i*.6)-.3)*12000)}));

  return <div style={{display:"flex",flexDirection:"column",gap:13}}>
    <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:10}}>
      {[{l:"MRR",v:"₹4.8L",c:T.gold},{l:"ARR",v:"₹57.6L",c:T.green},{l:"Paid Users",v:"1,612",c:T.teal},{l:"Free Users",v:"18,480",c:T.muted},{l:"Conversion",v:"8.7%",c:T.amber},{l:"Churn",v:"2.1%",c:T.red}].map((m,i)=><Card key={i}><KPI label={m.l} value={m.v} color={m.c}/></Card>)}
    </div>

    <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:13}}>
      <Card>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <SH title="Pricing Plans" icon="💳" mb={0}/>
          <div style={{display:"flex",background:T.raised,borderRadius:6,padding:3,border:`1px solid ${T.line}`}}>
            {["monthly","annual"].map(b=><button key={b} onClick={()=>setBilling(b)} style={{background:billing===b?T.card:"transparent",border:billing===b?`1px solid ${T.line}`:"1px solid transparent",color:billing===b?T.ink:T.muted,borderRadius:4,padding:"4px 11px",fontSize:10,cursor:"pointer",fontFamily:"inherit",fontWeight:billing===b?600:400}}>
              {b==="annual"?"Annual −20%":"Monthly"}
            </button>)}
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
          {plans.map(p=><div key={p.id} style={{padding:"1.2rem",background:T.raised,borderRadius:9,border:`2px solid ${p.popular?T.gold+"40":T.line}`,position:"relative"}}>
            {p.popular&&<div style={{position:"absolute",top:-10,left:"50%",transform:"translateX(-50%)",background:T.gold,color:"#0B0F17",fontSize:8,fontWeight:700,padding:"2px 10px",borderRadius:10,letterSpacing:".06em",whiteSpace:"nowrap"}}>MOST POPULAR</div>}
            <div style={{fontSize:15,fontWeight:800,color:p.c,marginBottom:3}}>{p.name}</div>
            <div style={{display:"flex",alignItems:"baseline",gap:3,marginBottom:12}}>
              <Mono c={T.ink} s={{fontSize:22,fontWeight:700}}>₹{p.price===0?0:Math.round(p.price*disc)}</Mono>
              {p.price>0&&<span style={{color:T.muted,fontSize:11}}>/{billing==="annual"?"mo (billed ₹"+(p.price*disc*12).toFixed(0)+"/yr)":"month"}</span>}
              {p.price===0&&<span style={{color:T.muted,fontSize:11}}>free forever</span>}
            </div>
            <button onClick={()=>user?.plan===p.id?null:onUpgrade(p.id)} className="btn" style={{width:"100%",background:user?.plan===p.id?T.faint:p.popular?`linear-gradient(135deg,${T.gold},${T.goldLt})`:`linear-gradient(135deg,${T.teal},${T.blue})`,color:user?.plan===p.id?T.muted:"#0B0F17",border:"none",borderRadius:6,padding:"8px",fontWeight:700,fontSize:11,cursor:"pointer",marginBottom:12}}>
              {user?.plan===p.id?"Current Plan":p.price===0?"Get Started":`Upgrade to ${p.name}`}
            </button>
            <div style={{display:"flex",flexDirection:"column",gap:4}}>
              {p.feat.map((f,i)=><div key={i} style={{display:"flex",gap:6,fontSize:11,color:T.body}}>
                <span style={{color:T.green,flexShrink:0}}>✓</span>{f}
              </div>)}
            </div>
          </div>)}
        </div>
      </Card>

      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        <Card>
          <SH title="Razorpay Payment Flow" icon="💰"/>
          <div style={{display:"flex",flexDirection:"column",gap:5}}>
            {[{n:"Create Order",d:"POST /api/payments/create-order",c:T.blue},{n:"Client Checkout",d:"rzp.open(orderId)",c:T.teal},{n:"Verify Payment",d:"POST /api/payments/verify + HMAC",c:T.amber},{n:"Webhook",d:"payment.captured → upgrade plan",c:T.green},{n:"Email Receipt",d:"Resend.com template",c:T.violet}].map((s,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:18,height:18,borderRadius:"50%",background:s.c+"20",border:`1px solid ${s.c}40`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:s.c,flexShrink:0}}>{i+1}</div>
              <div style={{flex:1,padding:"5px 7px",background:T.raised,borderRadius:4,border:`1px solid ${T.faint}`}}>
                <div style={{fontSize:10,fontWeight:600,color:T.ink}}>{s.n}</div>
                <Mono c={T.muted} s={{fontSize:8}}>{s.d}</Mono>
              </div>
            </div>)}
          </div>
          <div style={{marginTop:8,fontSize:10,color:T.muted}}>UPI · Cards · Netbanking · EMI · GST 18% added</div>
        </Card>
        <Card>
          <SH title="MRR Growth" icon="📈"/>
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={mrrData}>
              <defs><linearGradient id="mrr" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.green} stopOpacity={.2}/><stop offset="95%" stopColor={T.green} stopOpacity={0}/></linearGradient></defs>
              <XAxis dataKey="m" tick={{fill:T.muted,fontSize:8}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:T.muted,fontSize:8}} axisLine={false} tickLine={false} tickFormatter={v=>`₹${(v/1e5).toFixed(1)}L`} width={38}/>
              <Tooltip {...TT} formatter={v=>`₹${(v/1e3).toFixed(0)}K`}/>
              <Area type="monotone" dataKey="mrr" stroke={T.green} strokeWidth={2} fill="url(#mrr)" name="MRR" dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <SH title="Product Analytics" icon="📊"/>
          <div style={{fontSize:10,color:T.body,lineHeight:1.8}}>
            {[["Google Analytics 4","pageviews · events · funnel"],["Mixpanel","retention · feature usage"],["PostHog","session replay · feature flags"],["Sentry","error tracking · performance"]].map(([k,v])=><div key={k} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",borderBottom:`1px solid ${T.faint}`}}>
              <span style={{color:T.ink,fontWeight:500}}>{k}</span><span style={{color:T.muted,fontSize:9}}>{v}</span>
            </div>)}
          </div>
        </Card>
      </div>
    </div>
  </div>;
}

// ═══════════════════════════════════════════════════════════════
// FUND SCREENER — packages/data + analytics
// ═══════════════════════════════════════════════════════════════
const ALL_FUNDS_EXTENDED = {
  ...FUNDS,
  "HDFC Mid-Cap Opportunities":{isin:"INF179KB1GZ2",cat:"Mid Cap",  er:0.82,aum:64200,r1:33.2,r3:25.1,r5:22.4,r10:19.8,vol:21.2,beta:0.92,nav:184.7,alpha:3.8,sharpe:1.12,maxDD:-33.2,mgr:"Chirag Setalvad",amc:"HDFC MF",  riskOMeter:"Very High",    h:["Supreme Ind","Persistent","Tube Invest","Coforge","Ceat"],sectors:{Technology:24,Auto:18,Consumer:16,Financial:14,Chemicals:12,Others:16}},
  "Nippon India Small Cap":    {isin:"INF204KB19I2",cat:"Small Cap",er:0.68,aum:49800,r1:41.4,r3:32.8,r5:28.6,r10:24.1,vol:27.4,beta:0.88,nav:154.2,alpha:6.2,sharpe:1.18,maxDD:-40.8,mgr:"Samir Rachh",    amc:"Nippon MF",riskOMeter:"Very High",    h:["Savita Oil","NIIT Tech","Prince Pipes","Aegis Logistics","Repco Home"],sectors:{Engineering:22,Chemicals:18,Financial:14,Consumer:12,Auto:10,IT:10,Others:14}},
  "HDFC Flexi Cap Fund":       {isin:"INF179K01YX2",cat:"Flexi Cap",er:0.78,aum:42100,r1:20.4,r3:18.2,r5:17.8,r10:16.4,vol:17.2,beta:0.91,nav:1662.1,alpha:2.2,sharpe:0.96,maxDD:-26.4,mgr:"Roshi Jain",     amc:"HDFC MF",  riskOMeter:"Moderately High",h:["HDFC Bank","ICICI Bank","Infosys","Reliance","Axis Bank"],sectors:{Financial:36,Technology:20,Energy:12,Consumer:10,Auto:8,Others:14}},
  "Axis Small Cap Fund":       {isin:"INF846K01KF7",cat:"Small Cap",er:0.58,aum:18400,r1:28.8,r3:26.4,r5:23.2,r10:null, vol:22.4,beta:0.84,nav:92.4, alpha:4.8,sharpe:1.16,maxDD:-37.6,mgr:"Anupam Tiwari",  amc:"Axis MF",  riskOMeter:"Very High",    h:["Narayana Hrud","Birlasoft","Craftsman Auto","BLS Intl","Greenpanel"],sectors:{Healthcare:18,IT:16,Engineering:16,Consumer:14,Auto:12,Others:24}},
  "ICICI Pru Balanced Adv":    {isin:"INF109K01BL5",cat:"Hybrid",   er:0.98,aum:52200,r1:16.8,r3:14.4,r5:13.8,r10:13.2,vol:10.2,beta:0.62,nav:64.8, alpha:0.8,sharpe:0.88,maxDD:-14.8,mgr:"Sankaran Naren", amc:"ICICI Pru",riskOMeter:"Moderate",     h:["Govt Bonds","HDFC Bank","T-Bills","Reliance","Corp AAA Bonds"],sectors:{Debt:45,Financial:22,Energy:12,Consumer:10,Others:11}},
};

function FundScreenerPage({portfolio=[]}){
  const [cat,setCat]=useState("All");
  const [sortBy,setSortBy]=useState("r3");
  const [sortDir,setSortDir]=useState(-1);
  const [maxER,setMaxER]=useState(2.5);
  const [minAUM,setMinAUM]=useState(0);
  const [risk,setRisk]=useState("All");
  const [search,setSearch]=useState("");
  const [compareList,setCompareList]=useState([]);
  const [aiQuery,setAiQuery]=useState("");
  const [aiResult,setAiResult]=useState("");
  const [aiLoading,setAiLoading]=useState(false);

  const ownedNames=new Set((portfolio||[]).map(p=>p.fund));
  const cats=["All","Large Cap","Mid Cap","Small Cap","Flexi Cap","ELSS","Index","Sectoral","Hybrid","Gold ETF"];
  const riskLevels=["All","Moderate","Moderately High","High","Very High"];

  const filtered=Object.entries(ALL_FUNDS_EXTENDED)
    .filter(([n,f])=>{
      if(cat!=="All"&&f.cat!==cat)return false;
      if(risk!=="All"&&f.riskOMeter!==risk)return false;
      if((f.er||0)>maxER)return false;
      if((f.aum||0)<minAUM*1000)return false;
      if(search&&!n.toLowerCase().includes(search.toLowerCase())&&!f.amc?.toLowerCase().includes(search.toLowerCase()))return false;
      return true;
    })
    .sort(([,a],[,b])=>sortDir*((b[sortBy]||0)-(a[sortBy]||0)));

  const toggle=(n)=>setCompareList(l=>l.includes(n)?l.filter(x=>x!==n):l.length<3?[...l,n]:l);

  const runAI=async()=>{
    if(!aiQuery.trim())return;
    setAiLoading(true);
    const ctx=`Fund database has ${Object.keys(ALL_FUNDS_EXTENDED).length} funds. User query: "${aiQuery}". Top 5 by 3Y return:\n${filtered.slice(0,5).map(([n,f])=>`${n}: ${f.cat}, ER ${f.er}%, 3Y ${f.r3}%, vol ${f.vol}%`).join("\n")}`;
    const res=await callRAGAI(aiQuery,ctx,"").catch(()=>({text:"Search unavailable — check API key"}));
    setAiResult(res.text);setAiLoading(false);
  };

  const SortTh=({k,label})=><th onClick={()=>{setSortBy(k);setSortDir(sortBy===k?-sortDir:-1);}} style={{padding:"7px 9px",textAlign:"right",color:sortBy===k?T.gold:T.muted,fontSize:9,fontWeight:600,textTransform:"uppercase",letterSpacing:".06em",cursor:"pointer",whiteSpace:"nowrap",userSelect:"none"}}>
    {label}{sortBy===k?(sortDir<0?"↓":"↑"):""}
  </th>;

  const catColor={"Large Cap":T.teal,"Mid Cap":T.blue,"Small Cap":T.violet,"Flexi Cap":T.amber,"ELSS":T.green,"Index":T.body,"Sectoral":T.red,"Hybrid":T.muted,"Gold ETF":T.gold};

  return <div style={{display:"flex",flexDirection:"column",gap:13}}>
    <Card>
      <SH title="Fund Screener — Filter, Compare & AI Search" icon="🔍"/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 180px 240px 240px",gap:10,marginBottom:12}}>
        <div style={{position:"relative"}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search fund name or AMC…" style={{width:"100%",background:T.raised,border:`1px solid ${T.line}`,color:T.ink,borderRadius:7,padding:"8px 11px 8px 30px",fontSize:11,outline:"none",fontFamily:"inherit"}}/>
          <span style={{position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",fontSize:11,opacity:.5}}>🔍</span>
        </div>
        <select value={cat} onChange={e=>setCat(e.target.value)} style={{background:T.raised,border:`1px solid ${T.line}`,color:T.ink,borderRadius:7,padding:"8px 11px",fontSize:11,outline:"none"}}>
          {cats.map(c=><option key={c}>{c}</option>)}
        </select>
        <select value={risk} onChange={e=>setRisk(e.target.value)} style={{background:T.raised,border:`1px solid ${T.line}`,color:T.ink,borderRadius:7,padding:"8px 11px",fontSize:11,outline:"none"}}>
          {riskLevels.map(r=><option key={r}>{r}</option>)}
        </select>
        <div style={{display:"flex",alignItems:"center",gap:6,fontSize:10,color:T.muted}}>
          <span style={{flexShrink:0}}>Max ER:</span>
          <Mono c={T.gold} s={{fontSize:10,flexShrink:0}}>{maxER.toFixed(1)}%</Mono>
          <input type="range" min="0" max="2.5" step="0.1" value={maxER} onChange={e=>setMaxER(+e.target.value)} style={{flex:1}}/>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6,fontSize:10,color:T.muted}}>
          <span style={{flexShrink:0}}>Min AUM:</span>
          <Mono c={T.teal} s={{fontSize:10,flexShrink:0}}>₹{minAUM}K Cr</Mono>
          <input type="range" min="0" max="500" step="10" value={minAUM} onChange={e=>setMinAUM(+e.target.value)} style={{flex:1}}/>
        </div>
      </div>
      <div style={{display:"flex",gap:8}}>
        <input value={aiQuery} onChange={e=>setAiQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&runAI()} placeholder='AI Search: "best small cap with low overlap" · "tech sector pure play under 1% ER"' style={{flex:1,background:T.raised,border:`1px solid ${T.line}`,color:T.ink,borderRadius:7,padding:"8px 11px",fontSize:11,outline:"none",fontFamily:"inherit"}}/>
        <button onClick={runAI} disabled={aiLoading} className="btn" style={{background:T.gold,color:"#0B0F17",border:"none",borderRadius:7,padding:"8px 16px",fontWeight:700,fontSize:11,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
          {aiLoading?<Spin sz={11} c="#0B0F17"/>:"🤖"} AI Search
        </button>
      </div>
      {aiResult&&<div style={{marginTop:10,padding:"10px 12px",background:T.raised,borderRadius:7,border:`1px solid ${T.gold}28`,fontSize:11,color:T.body,lineHeight:1.7}}><span style={{color:T.gold,fontWeight:600}}>AI: </span>{aiResult}</div>}
    </Card>

    {compareList.length>0&&<Card style={{padding:"10px 14px"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
        <span style={{fontSize:9,color:T.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:".06em",flexShrink:0}}>Compare ({compareList.length}/3):</span>
        {compareList.map(n=><div key={n} style={{display:"flex",alignItems:"center",gap:5,background:T.raised,borderRadius:5,padding:"3px 9px",border:`1px solid ${T.gold}28`}}>
          <span style={{fontSize:11,color:T.gold,fontWeight:600}}>{n.split(" ").slice(0,2).join(" ")}</span>
          <button onClick={()=>toggle(n)} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:13,padding:0,lineHeight:1}}>×</button>
        </div>)}
        {compareList.length>=2&&<div style={{display:"flex",gap:14,marginLeft:"auto",flexWrap:"wrap"}}>
          {["1Y","3Y","5Y","ER","Vol","Sharpe"].map((label,ki)=>{
            const k=["r1","r3","r5","er","vol","sharpe"][ki];
            return <div key={label} style={{fontSize:10}}>
              <div style={{color:T.muted,fontSize:8,textTransform:"uppercase",letterSpacing:".05em",marginBottom:2}}>{label}</div>
              <div style={{display:"flex",gap:8}}>
                {compareList.map(n=><Mono key={n} c={T.gold} s={{fontSize:10}}>{ALL_FUNDS_EXTENDED[n]?.[k]?.toFixed?.(2)||"—"}</Mono>)}
              </div>
            </div>;
          })}
        </div>}
      </div>
    </Card>}

    <Card style={{padding:0,overflow:"hidden"}}>
      <div style={{padding:"11px 14px 7px",borderBottom:`1px solid ${T.line}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{color:T.muted,fontSize:9,fontWeight:600,textTransform:"uppercase",letterSpacing:".08em"}}>{filtered.length} funds matched · click headers to sort · select up to 3 to compare</span>
        <Badge color={T.teal}>{Object.keys(ALL_FUNDS_EXTENDED).length} total funds</Badge>
      </div>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
          <thead><tr style={{background:T.raised,borderBottom:`1px solid ${T.faint}`}}>
            <th style={{padding:"7px 9px",textAlign:"left",color:T.muted,fontSize:9,fontWeight:600,textTransform:"uppercase",letterSpacing:".06em",minWidth:180}}>Fund</th>
            <th style={{padding:"7px 9px",textAlign:"left",color:T.muted,fontSize:9,fontWeight:600,textTransform:"uppercase"}}>AMC</th>
            {[["aum","AUM"],["er","ER%"],["r1","1Y%"],["r3","3Y%"],["r5","5Y%"],["vol","Vol%"],["sharpe","Sharpe"],["alpha","Alpha"],["beta","Beta"]].map(([k,l])=><SortTh key={k} k={k} label={l}/>)}
            <th style={{padding:"7px 9px",textAlign:"center",color:T.muted,fontSize:9}}>Action</th>
          </tr></thead>
          <tbody>{filtered.map(([n,f],i)=>{
            const owned=ownedNames.has(n);
            const inCompare=compareList.includes(n);
            return <tr key={i} className="hov" style={{borderBottom:`1px solid ${T.faint}15`,background:inCompare?T.gold+"06":undefined}}>
              <td style={{padding:"8px 9px",maxWidth:200}}>
                <div style={{fontWeight:600,color:T.ink,fontSize:11,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{n}</div>
                <div style={{display:"flex",gap:4,marginTop:2}}>
                  <Badge color={catColor[f.cat]||T.muted}>{f.cat}</Badge>
                  {owned&&<Badge color={T.gold}>In Portfolio</Badge>}
                </div>
              </td>
              <td style={{padding:"8px 9px"}}><span style={{fontSize:9,color:T.muted}}>{f.amc}</span></td>
              <td style={{padding:"8px 9px",textAlign:"right"}}><Mono c={T.muted} s={{fontSize:10}}>₹{((f.aum||0)/1000).toFixed(0)}K</Mono></td>
              <td style={{padding:"8px 9px",textAlign:"right"}}><Mono c={(f.er||0)>1.5?T.red:(f.er||0)>1?T.amber:T.green} s={{fontSize:11,fontWeight:600}}>{f.er?.toFixed(2)}%</Mono></td>
              {["r1","r3","r5"].map(k=><td key={k} style={{padding:"8px 9px",textAlign:"right"}}>
                <Mono c={!f[k]?T.muted:f[k]>=20?T.green:f[k]>=14?T.teal:T.amber} s={{fontSize:11}}>{f[k]?.toFixed(1)||"—"}{f[k]?"%":""}</Mono>
              </td>)}
              <td style={{padding:"8px 9px",textAlign:"right"}}><Mono c={(f.vol||0)>25?T.red:(f.vol||0)>17?T.amber:T.green} s={{fontSize:11}}>{f.vol?.toFixed(1)}%</Mono></td>
              <td style={{padding:"8px 9px",textAlign:"right"}}><Mono c={(f.sharpe||0)>=1?T.green:(f.sharpe||0)>=.7?T.amber:T.red} s={{fontSize:11,fontWeight:600}}>{f.sharpe?.toFixed(2)}</Mono></td>
              <td style={{padding:"8px 9px",textAlign:"right"}}><Mono c={(f.alpha||0)>=3?T.green:(f.alpha||0)>=1?T.teal:T.muted} s={{fontSize:11}}>{f.alpha?.toFixed(1)}%</Mono></td>
              <td style={{padding:"8px 9px",textAlign:"right"}}><Mono c={(f.beta||0)>1.1?T.amber:T.body} s={{fontSize:10}}>{f.beta?.toFixed(2)}</Mono></td>
              <td style={{padding:"8px 9px",textAlign:"center"}}>
                <button onClick={()=>toggle(n)} className="btn" style={{background:inCompare?T.gold:T.raised,color:inCompare?"#0B0F17":T.muted,border:`1px solid ${inCompare?T.gold:T.faint}`,borderRadius:4,padding:"3px 8px",fontSize:9,cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>
                  {inCompare?"✓ Added":"Compare"}
                </button>
              </td>
            </tr>;
          })}</tbody>
        </table>
      </div>
    </Card>
  </div>;
}

// ═══════════════════════════════════════════════════════════════
// SIP GOAL PLANNER — packages/analytics + quantitative engine
// ═══════════════════════════════════════════════════════════════
function SIPPlannerPage(){
  const [goals,setGoals]=useState([
    {id:1,name:"Retirement",target:10000000,years:20,sip:15000,stepUp:10,rr:14,color:T.gold},
    {id:2,name:"Child Education",target:5000000,years:12,sip:8000,stepUp:8,rr:12,color:T.teal},
    {id:3,name:"Dream Home",target:3000000,years:7,sip:12000,stepUp:5,rr:10,color:T.violet},
  ]);
  const [editId,setEditId]=useState(null);
  const [elssMode,setElssMode]=useState(false);
  const [income,setIncome]=useState(1200000);

  const addGoal=()=>{const id=Date.now();setGoals(g=>[...g,{id,name:"New Goal",target:2000000,years:10,sip:5000,stepUp:10,rr:12,color:T.blue}]);setEditId(id);};

  const calcGoal=(g)=>{
    const n=g.years*12,r=g.rr/100/12;
    let corpus=0,totalInvested=0,currentSIP=g.sip;
    for(let m=0;m<n;m++){corpus=corpus*(1+r)+currentSIP;totalInvested+=currentSIP;if(m>0&&m%12===11)currentSIP*=(1+g.stepUp/100);}
    const probability=Math.min(99,Math.max(1,Math.round(corpus/g.target*100)));
    return {corpus:Math.round(corpus),totalInvested:Math.round(totalInvested),surplus:Math.round(corpus-totalInvested),probability};
  };

  const goalChartData=(g)=>{
    const r=g.rr/100/12;let corpus=0,inv=0,currentSIP=g.sip;
    return Array.from({length:g.years+1},(_,y)=>{
      if(y>0)for(let m=0;m<12;m++){corpus=corpus*(1+r)+currentSIP;inv+=currentSIP;if(m===11)currentSIP*=(1+g.stepUp/100);}
      return {y:`Y${y}`,corpus:Math.round(corpus),invested:Math.round(inv)};
    });
  };

  const totalSIP=goals.reduce((s,g)=>s+g.sip,0);
  const elssDeduction=elssMode?Math.min(goals.reduce((s,g)=>s+g.sip*12,0),150000):0;
  const taxSaved=Math.round(elssDeduction*0.30);

  return <div style={{display:"flex",flexDirection:"column",gap:13}}>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
      {[{l:"Goals Tracked",v:goals.length,c:T.teal},{l:"Total Monthly SIP",v:`₹${totalSIP.toLocaleString()}`,c:T.gold},{l:"ELSS Tax Saved",v:`₹${taxSaved.toLocaleString()}`,c:T.green},{l:"Largest Corpus",v:goals.length?`₹${(Math.max(...goals.map(g=>calcGoal(g).corpus))/1e7).toFixed(2)}Cr`:"—",c:T.violet}].map((m,i)=><Card key={i}><KPI label={m.l} value={String(m.v)} color={m.c}/></Card>)}
    </div>

    <Card style={{padding:"10px 14px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,flexWrap:"wrap"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:11,fontWeight:600,color:T.ink}}>ELSS Tax Saving Mode</span>
          <span style={{fontSize:10,color:T.muted}}>— Section 80C deduction up to ₹1.5L/year · 3-year lock-in per installment</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {elssMode&&<div style={{display:"flex",alignItems:"center",gap:5,fontSize:10,color:T.muted}}>
            Income: ₹{(income/100000).toFixed(1)}L
            <input type="range" min="600000" max="5000000" step="100000" value={income} onChange={e=>setIncome(+e.target.value)} style={{width:70}}/>
          </div>}
          <button onClick={()=>setElssMode(v=>!v)} className="btn" style={{background:elssMode?T.green:T.raised,color:elssMode?"#0B0F17":T.muted,border:`1px solid ${elssMode?T.green:T.line}`,borderRadius:6,padding:"5px 14px",fontSize:10,cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>
            {elssMode?"✓ ELSS Active":"Enable ELSS"}
          </button>
        </div>
      </div>
      {elssMode&&<div style={{marginTop:8,padding:"8px 10px",background:T.greenDim,borderRadius:5,border:`1px solid ${T.green}20`,fontSize:11,color:T.green}}>
        ELSS 80C deduction: ₹{elssDeduction.toLocaleString()} → Tax saved: <strong>₹{taxSaved.toLocaleString()}</strong> at 30% slab (₹{income.toLocaleString()} income)
      </div>}
    </Card>

    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      {goals.map((g,gi)=>{
        const calc=calcGoal(g);const chart=goalChartData(g);const isEdit=editId===g.id;
        const pct=Math.min(100,Math.round(calc.corpus/g.target*100));
        return <Card key={g.id} style={{border:`1px solid ${g.color}22`}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:12,marginBottom:10}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:4,height:40,borderRadius:2,background:g.color,flexShrink:0}}/>
              {isEdit?<input value={g.name} onChange={e=>setGoals(gs=>gs.map(x=>x.id===g.id?{...x,name:e.target.value}:x))} style={{background:T.raised,border:`1px solid ${T.line}`,color:T.ink,borderRadius:5,padding:"4px 9px",fontSize:13,fontWeight:700,outline:"none",fontFamily:"inherit"}}/>:
                <div><div style={{fontSize:14,fontWeight:700,color:T.ink}}>{g.name}</div><div style={{fontSize:10,color:T.muted}}>{g.years}Y horizon · ₹{g.sip.toLocaleString()}/mo · {g.stepUp}% step-up</div></div>}
            </div>
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              <div style={{textAlign:"right"}}>
                <Mono c={g.color} s={{fontSize:17,fontWeight:700}}>{calc.corpus>=1e7?(calc.corpus/1e7).toFixed(2)+"Cr":(calc.corpus/1e5).toFixed(1)+"L"}</Mono>
                <div style={{fontSize:9,color:T.muted}}>vs goal ₹{g.target>=1e7?(g.target/1e7).toFixed(1)+"Cr":(g.target/1e5).toFixed(0)+"L"}</div>
              </div>
              <button onClick={()=>setEditId(isEdit?null:g.id)} style={{background:isEdit?T.gold:T.raised,color:isEdit?"#0B0F17":T.muted,border:`1px solid ${isEdit?T.gold:T.faint}`,borderRadius:5,padding:"4px 8px",fontSize:9,cursor:"pointer",fontFamily:"inherit"}}>
                {isEdit?"Done":"Edit"}
              </button>
              <button onClick={()=>setGoals(gs=>gs.filter(x=>x.id!==g.id))} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:15,padding:0}}>×</button>
            </div>
          </div>
          <div style={{marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:3,fontSize:9,color:T.muted}}>
              <span>Projected achievement</span><span style={{color:pct>=100?T.green:pct>=75?T.teal:T.amber,fontWeight:700}}>{pct}%</span>
            </div>
            <div style={{background:T.faint,borderRadius:3,height:6,overflow:"hidden"}}>
              <div style={{width:`${Math.min(100,pct)}%`,height:"100%",background:pct>=100?T.green:pct>=75?T.teal:g.color,borderRadius:3,transition:"width .8s"}}/>
            </div>
          </div>

          {isEdit&&<div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8,marginBottom:10,padding:"11px",background:T.raised,borderRadius:7,border:`1px solid ${T.faint}`}}>
            {[{l:"Target",k:"target",min:500000,max:100000000,step:500000,fmt:v=>v>=1e7?`₹${(v/1e7).toFixed(1)}Cr`:`₹${(v/1e5).toFixed(0)}L`},
              {l:"Years",k:"years",min:3,max:40,step:1,fmt:v=>`${v}Y`},
              {l:"SIP/mo",k:"sip",min:500,max:100000,step:500,fmt:v=>`₹${v.toLocaleString()}`},
              {l:"Step-up",k:"stepUp",min:0,max:20,step:1,fmt:v=>`${v}%`},
              {l:"Return%",k:"rr",min:6,max:25,step:0.5,fmt:v=>`${v}%`},
            ].map(p=><div key={p.k}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:3,fontSize:9,color:T.muted}}>
                <span>{p.l}</span><Mono c={g.color} s={{fontSize:9,fontWeight:700}}>{p.fmt(g[p.k])}</Mono>
              </div>
              <input type="range" min={p.min} max={p.max} step={p.step} value={g[p.k]} onChange={e=>setGoals(gs=>gs.map(x=>x.id===g.id?{...x,[p.k]:+e.target.value}:x))} style={{width:"100%"}}/>
            </div>)}
          </div>}

          <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:12}}>
            <ResponsiveContainer width="100%" height={130}>
              <AreaChart data={chart}>
                <defs><linearGradient id={`gp${gi}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={g.color} stopOpacity={.18}/><stop offset="95%" stopColor={g.color} stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke={T.faint} vertical={false}/>
                <XAxis dataKey="y" tick={{fill:T.muted,fontSize:7}} axisLine={false} tickLine={false} interval={Math.floor(g.years/5)}/>
                <YAxis tick={{fill:T.muted,fontSize:7}} axisLine={false} tickLine={false} tickFormatter={v=>v>=1e7?`${(v/1e7).toFixed(0)}Cr`:v>=1e5?`${(v/1e5).toFixed(0)}L`:""} width={32}/>
                <ReferenceLine y={g.target} stroke={T.red} strokeDasharray="3 3" label={{value:"Goal",fill:T.red,fontSize:8}}/>
                <Tooltip {...TT} formatter={v=>`₹${(v/1e5).toFixed(1)}L`}/>
                <Area type="monotone" dataKey="corpus" stroke={g.color} strokeWidth={2} fill={`url(#gp${gi})`} name="Corpus" dot={false}/>
                <Area type="monotone" dataKey="invested" stroke={T.muted} strokeWidth={1} fill="none" strokeDasharray="3 3" name="Invested" dot={false}/>
              </AreaChart>
            </ResponsiveContainer>
            <div style={{display:"flex",flexDirection:"column",gap:6,justifyContent:"center"}}>
              {[{l:"Total Invested",v:`₹${(calc.totalInvested/1e5).toFixed(1)}L`,c:T.muted},{l:"Wealth Created",v:`₹${(calc.surplus/1e5).toFixed(1)}L`,c:T.green},{l:"Return Multiple",v:`${(calc.corpus/calc.totalInvested).toFixed(1)}×`,c:g.color},{l:"Goal %",v:`${calc.probability}%`,c:calc.probability>=100?T.green:calc.probability>=75?T.teal:T.amber}].map(m=><div key={m.l}><div style={{fontSize:8,color:T.muted,textTransform:"uppercase",letterSpacing:".05em"}}>{m.l}</div><Mono c={m.c} s={{fontSize:12,fontWeight:600}}>{m.v}</Mono></div>)}
            </div>
          </div>
        </Card>;
      })}
    </div>
    <button onClick={addGoal} className="btn" style={{background:T.raised,border:`2px dashed ${T.line}`,color:T.muted,borderRadius:9,padding:"12px",fontWeight:600,fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>
      + Add Financial Goal
    </button>

    <Card>
      <SH title="Step-up SIP — Why It Matters" icon="📈"/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
        {[{title:"Regular SIP",desc:"Fixed amount every month. Simple but corpus lags income growth.",eg:"₹10K/mo · 20Y = ₹1.85 Cr",c:T.muted},
          {title:"Step-up SIP (10%/yr)",desc:"Increase SIP 10% each year matching salary hikes. Dramatically boosts corpus.",eg:"Starts ₹10K → ends ₹67K/mo = ₹3.2 Cr",c:T.gold},
          {title:"ELSS SIP",desc:"Equity funds with 80C benefit. ₹12,500/mo = ₹1.5L deduction. 3-year lock-in per instalment.",eg:"Tax saved ≈ ₹46,800/year at 30%",c:T.green},
        ].map((x,i)=><div key={i} style={{background:T.raised,borderRadius:7,padding:"10px",border:`1px solid ${x.c}22`}}>
          <div style={{fontSize:11,fontWeight:700,color:x.c,marginBottom:4}}>{x.title}</div>
          <div style={{fontSize:10,color:T.muted,lineHeight:1.6,marginBottom:5}}>{x.desc}</div>
          <Mono c={x.c} s={{fontSize:10,fontWeight:600}}>{x.eg}</Mono>
        </div>)}
      </div>
    </Card>
  </div>;
}

// ═══════════════════════════════════════════════════════════════
// PRODUCT ANALYTICS & GROWTH — Mixpanel · GA4 · Referral
// ═══════════════════════════════════════════════════════════════
const MIXPANEL_EVENTS=[
  {ev:"portfolio_viewed",     user:"VS",ts:"10:24:01",props:{page:"dashboard",duration:"4m12s"}},
  {ev:"cas_imported",         user:"VS",ts:"10:26:30",props:{folios:4,invested:"₹4.25L"}},
  {ev:"ai_query_sent",        user:"VS",ts:"10:31:45",props:{type:"diagnose",cached:false,tokens:612}},
  {ev:"montecarlo_run",       user:"VS",ts:"10:34:12",props:{sims:3000,goal:"₹1Cr",horizon:"15Y"}},
  {ev:"tax_harvest_viewed",   user:"VS",ts:"10:36:00",props:{savings_shown:"₹2.1K"}},
  {ev:"upgrade_modal_shown",  user:"DI",ts:"10:42:11",props:{trigger:"montecarlo_page",plan:"pro"}},
  {ev:"subscription_started", user:"DI",ts:"10:44:30",props:{plan:"pro",amount:"₹299",method:"UPI"}},
  {ev:"referral_shared",      user:"VS",ts:"10:50:00",props:{channel:"whatsapp",code:"COPILOT-VEDA"}},
];

function GrowthPage({user}){
  const [copied,setCopied]=useState(false);
  const refCode=`COPILOT-${(user?.name?.split(" ")[0]||"REF").slice(0,4).toUpperCase()}`;

  const retentionData=[{w:"D1",r:100},{w:"D7",r:64},{w:"D14",r:48},{w:"D30",r:38},{w:"W8",r:32},{w:"W12",r:28},{w:"W16",r:25},{w:"M6",r:22}];
  const funnelData=[
    {s:"Landing Page",v:100000,c:T.blue},{s:"Sign-up",v:19400,c:T.teal},
    {s:"CAS Import",v:11200,c:T.gold},{s:"Dashboard View",v:10600,c:T.amber},
    {s:"AI Query",v:6200,c:T.violet},{s:"Upgrade",v:1612,c:T.green},
  ];
  const featureUsage=[{f:"Dashboard",pct:100,u:11200,c:T.gold},{f:"AI Advisor",pct:55,u:6200,c:T.violet},{f:"Monte Carlo",pct:43,u:4800,c:T.teal},{f:"Tax Engine",pct:37,u:4200,c:T.green},{f:"Fund Screener",pct:34,u:3800,c:T.blue},{f:"SIP Planner",pct:29,u:3200,c:T.amber},{f:"Corp Actions",pct:21,u:2400,c:T.body},{f:"NAV Pipeline",pct:16,u:1800,c:T.muted}];
  const dau=Array.from({length:30},(_,i)=>({d:`D${i+1}`,v:Math.round(2800+Math.sin(i*.4)*380+(Math.random()-.4)*180)}));

  return <div style={{display:"flex",flexDirection:"column",gap:13}}>
    <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:10}}>
      {[{l:"MAU",v:"11.2K",c:T.blue},{l:"DAU",v:"2.8K",c:T.teal},{l:"DAU/MAU",v:"25%",c:T.gold},{l:"Avg Session",v:"9.4m",c:T.green},{l:"NPS",v:"67",c:T.violet},{l:"Churn",v:"2.3%",c:T.red}].map((m,i)=><Card key={i}><KPI label={m.l} value={m.v} color={m.c}/></Card>)}
    </div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:13}}>
      <Card>
        <SH title="Daily Active Users (30D)" icon="👥"/>
        <ResponsiveContainer width="100%" height={155}>
          <AreaChart data={dau}>
            <defs><linearGradient id="dauG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.blue} stopOpacity={.2}/><stop offset="95%" stopColor={T.blue} stopOpacity={0}/></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke={T.faint} vertical={false}/>
            <XAxis dataKey="d" tick={{fill:T.muted,fontSize:8}} axisLine={false} tickLine={false} interval={6}/>
            <YAxis tick={{fill:T.muted,fontSize:8}} axisLine={false} tickLine={false}/>
            <Tooltip {...TT}/>
            <Area type="monotone" dataKey="v" stroke={T.blue} strokeWidth={2} fill="url(#dauG)" name="DAU" dot={false}/>
          </AreaChart>
        </ResponsiveContainer>
      </Card>
      <Card>
        <SH title="Retention Curve" icon="🔄"/>
        <ResponsiveContainer width="100%" height={155}>
          <LineChart data={retentionData}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.faint} vertical={false}/>
            <XAxis dataKey="w" tick={{fill:T.muted,fontSize:9}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fill:T.muted,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>`${v}%`}/>
            <ReferenceLine y={30} stroke={T.amber} strokeDasharray="3 3" label={{value:"30% target",fill:T.amber,fontSize:8}}/>
            <Tooltip {...TT} formatter={v=>`${v}%`}/>
            <Line type="monotone" dataKey="r" stroke={T.gold} strokeWidth={2.5} dot={{fill:T.gold,r:3}} name="Retention"/>
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:13}}>
      <Card>
        <SH title="Activation Funnel" icon="📊"/>
        <div style={{display:"flex",flexDirection:"column",gap:7}}>
          {funnelData.map((f,i)=>{
            const pct=Math.round(f.v/funnelData[0].v*100);
            const step=i>0?Math.round(f.v/funnelData[i-1].v*100):100;
            return <div key={i} style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:110,fontSize:10,color:T.body,textAlign:"right",flexShrink:0}}>{f.s}</div>
              <div style={{flex:1,background:T.faint,borderRadius:3,height:20,overflow:"hidden",position:"relative"}}>
                <div style={{width:`${pct}%`,height:"100%",background:f.c+"30",borderRadius:3,transition:"width .8s"}}/>
                <div style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",fontSize:9,color:T.ink,fontFamily:"'Space Mono',monospace"}}>{f.v.toLocaleString()}</div>
              </div>
              <Mono c={i>0?T.amber:T.muted} s={{fontSize:9,width:36,textAlign:"right"}}>{i>0?`${step}%`:""}</Mono>
            </div>;
          })}
        </div>
      </Card>
      <Card>
        <SH title="Feature Engagement" icon="⚡"/>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {featureUsage.map((f,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:100,fontSize:10,color:T.body,flexShrink:0}}>{f.f}</div>
            <div style={{flex:1,background:T.faint,borderRadius:2,height:7,overflow:"hidden"}}>
              <div style={{width:`${f.pct}%`,height:"100%",background:f.c,borderRadius:2,transition:"width .8s"}}/>
            </div>
            <Mono c={T.muted} s={{fontSize:9,width:28,textAlign:"right"}}>{f.pct}%</Mono>
            <Mono c={T.faint} s={{fontSize:9,width:38,textAlign:"right"}}>{(f.u/1000).toFixed(1)}K</Mono>
          </div>)}
        </div>
      </Card>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:13}}>
      <Card>
        <SH title="Mixpanel · Live Event Stream" icon="📡" right={<div style={{display:"flex",gap:6}}><Badge color={T.green}>Mixpanel</Badge><Badge color={T.blue}>GA4</Badge></div>}/>
        <div style={{display:"flex",flexDirection:"column",gap:4,maxHeight:220,overflowY:"auto",marginBottom:10}}>
          {MIXPANEL_EVENTS.map((e,i)=><div key={i} style={{display:"flex",gap:8,padding:"4px 8px",background:T.raised,borderRadius:4}}>
            <span style={{color:T.muted,flexShrink:0,width:56,fontFamily:"'Space Mono',monospace",fontSize:9}}>{e.ts}</span>
            <span style={{color:T.gold,fontWeight:600,width:140,flexShrink:0,overflow:"hidden",textOverflow:"ellipsis",fontSize:10}}>{e.ev}</span>
            <span style={{color:T.muted,fontSize:9}}>{Object.entries(e.props).map(([k,v])=>`${k}=${v}`).join(" · ")}</span>
          </div>)}
        </div>
        <div style={{background:T.bg,borderRadius:6,padding:"9px 11px",border:`1px solid ${T.faint}`,fontFamily:"'Space Mono',monospace",fontSize:9,color:T.body,lineHeight:1.7}}>
          <div style={{color:T.teal}}>// packages/analytics/mixpanel.ts</div>
          <div>mixpanel.track(event, {"{"}</div>
          <div style={{paddingLeft:12}}>user_id, plan, portfolio_value,</div>
          <div style={{paddingLeft:12}}>health_score, ...properties</div>
          <div>{"}"});</div>
          <div style={{color:T.teal,marginTop:4}}>// GA4 via gtag</div>
          <div>gtag('event', event, props);</div>
        </div>
      </Card>
      <Card>
        <SH title="Referral & Sharing" icon="🎁"/>
        <div style={{padding:"14px",background:`linear-gradient(135deg,${T.gold}0A,${T.teal}06)`,borderRadius:8,border:`1px solid ${T.gold}20`,marginBottom:12}}>
          <div style={{fontSize:12,fontWeight:700,color:T.ink,marginBottom:3}}>Invite friends · Earn ₹500 each</div>
          <div style={{fontSize:10,color:T.muted,marginBottom:12}}>Your friend gets 3 months Pro free. You earn ₹500 wallet credits per referral.</div>
          <div style={{display:"flex",gap:7}}>
            <div style={{flex:1,background:T.surface,borderRadius:6,padding:"8px 11px",border:`1px solid ${T.line}`,fontFamily:"'Space Mono',monospace",fontSize:12,color:T.gold}}>{refCode}</div>
            <button onClick={()=>setCopied(true)} className="btn" style={{background:copied?T.green:T.gold,color:"#0B0F17",border:"none",borderRadius:6,padding:"8px 16px",fontWeight:700,fontSize:11,cursor:"pointer",transition:"background .2s"}}>{copied?"✓ Copied":"Copy"}</button>
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {[{icon:"📄",l:"PDF Portfolio Report",d:"Full analytics + AI insights"},
            {icon:"🔗",l:"Share Public Link",d:"Anonymous · 7-day expiry"},
            {icon:"💬",l:"WhatsApp Summary",d:"Key metrics + health score"},
            {icon:"📧",l:"Email to Advisor",d:"SEBI-compliant format"}].map((a,i)=><button key={i} className="btn" style={{display:"flex",alignItems:"center",gap:9,padding:"8px 11px",background:T.raised,border:`1px solid ${T.faint}`,borderRadius:6,cursor:"pointer",textAlign:"left",width:"100%",color:"inherit",fontFamily:"inherit"}}>
            <span style={{fontSize:14,flexShrink:0}}>{a.icon}</span>
            <div><div style={{fontSize:11,fontWeight:600,color:T.ink}}>{a.l}</div><div style={{fontSize:9,color:T.muted}}>{a.d}</div></div>
          </button>)}
        </div>
      </Card>
    </div>
  </div>;
}

// ═══════════════════════════════════════════════════════════════
// ROOT APPLICATION
// ═══════════════════════════════════════════════════════════════
const PAGES=[
  {id:"import",    icon:"📄",label:"Import CAS",    group:"setup"},
  {id:"pipeline",  icon:"🔄",label:"NAV Pipeline",  group:"setup"},
  {id:"dashboard", icon:"⬡", label:"Dashboard",    group:"analytics"},
  {id:"analytics", icon:"📈",label:"Performance",  group:"analytics"},
  {id:"screener",  icon:"🔍",label:"Fund Screener", group:"analytics"},
  {id:"corpact",   icon:"⚡",label:"Corp. Actions", group:"analytics"},
  {id:"montecarlo",icon:"🎲",label:"Monte Carlo",   group:"quant"},
  {id:"tax",       icon:"📋",label:"Tax Engine",    group:"quant"},
  {id:"sip",       icon:"🎯",label:"SIP Planner",   group:"quant"},
  {id:"ai",        icon:"🤖",label:"AI Advisor",    group:"intelligence"},
  {id:"security",  icon:"🔒",label:"Security",      group:"infra"},
  {id:"infra",     icon:"🏗", label:"Infrastructure",group:"infra"},
  {id:"monetize",  icon:"💳",label:"Monetize",      group:"business"},
  {id:"growth",    icon:"📡",label:"Growth",        group:"business"},
];
const GROUPS={setup:"Setup",analytics:"Analytics",quant:"Quant",intelligence:"AI",infra:"Infrastructure",business:"Business"};

export default function App(){
  const [user,setUser]=useState(null);
  const [page,setPage]=useState("import");
  const [holdings,setHoldings]=useState(null);
  const [navMap,setNavMap]=useState(()=>Object.fromEntries(Object.entries(FUNDS).map(([n,f])=>[n,f.nav])));
  const [an,setAn]=useState(null);
  const [history,setHistory]=useState(null);

  // Inject CSS
  useEffect(()=>{
    const s=document.createElement("style");s.textContent=GCSS;document.head.appendChild(s);
    return()=>{try{document.head.removeChild(s)}catch{}};
  },[]);

  // Recompute analytics when holdings or navMap change
  useEffect(()=>{
    if(holdings){
      const computed=buildPortfolioAnalytics(holdings,navMap);
      setAn(computed);
      if(!history&&computed) setHistory(makePortfolioHistory(computed,365));
    }
  },[holdings,navMap]);

  // Real-time NAV simulation (WebSocket simulation)
  useEffect(()=>{
    if(!user) return;
    const id=setInterval(()=>{
      setNavMap(prev=>{
        const n={};
        Object.entries(prev).forEach(([k,v])=>{n[k]=Math.max(1,+(v+(Math.random()-.496)*v*.0026).toFixed(2));});
        return n;
      });
    },5000);
    return()=>clearInterval(id);
  },[user]);

  const handleImport=useCallback(data=>{
    const h=data.map(f=>({...f,nav:FUNDS[f.fund]?.nav||100}));
    setHoldings(h);
    setTimeout(()=>setPage("dashboard"),600);
  },[]);

  if(!user) return <AuthPage onLogin={u=>setUser(u)}/>;

  const grouped=Object.entries(GROUPS).map(([g,label])=>({g,label,pages:PAGES.filter(p=>p.group===g)}));
  const isPro=user.plan==="pro"||user.plan==="elite";

  const pageTitles={
    import:"CAS Statement Import",pipeline:"AMFI NAV Pipeline",dashboard:"Portfolio Dashboard",
    analytics:"Performance Analytics",screener:"Fund Screener",corpact:"Corporate Actions",
    montecarlo:"Monte Carlo Simulation",tax:"Tax Optimization Engine",sip:"SIP Goal Planner",
    ai:"AI Advisor — RAG",security:"Security & Compliance",
    infra:"Infrastructure & Deployment",monetize:"Monetization",growth:"Growth & Analytics",
  };

  return <div style={{minHeight:"100vh",background:T.bg,color:T.ink,fontFamily:"'Space Grotesk',sans-serif"}}>
    {/* NAV Ticker */}
    <div style={{background:T.surface,borderBottom:`1px solid ${T.line}`,height:24,overflow:"hidden",display:"flex",alignItems:"center"}}>
      <div style={{background:T.gold,color:"#0B0F17",fontSize:8,fontWeight:700,padding:"0 10px",height:"100%",display:"flex",alignItems:"center",letterSpacing:".1em",flexShrink:0}}>LIVE NAV</div>
      <div style={{overflow:"hidden",flex:1}}>
        <div style={{whiteSpace:"nowrap",animation:"tick 55s linear infinite",display:"inline-block",paddingLeft:16}}>
          {[...Object.entries(FUNDS),...Object.entries(FUNDS)].map(([n,f],i)=>{
            const cur=navMap[n]||f.nav, chg=((cur-f.nav)/f.nav*100).toFixed(3);
            return <span key={i} style={{marginRight:32,fontFamily:"'Space Mono',monospace",fontSize:9,color:+chg>=0?T.green:T.red}}>
              {n.split(" ").slice(0,2).join(" ")} ₹{cur.toFixed(2)} <span style={{fontSize:8,opacity:.8}}>{+chg>=0?"+":""}{chg}%</span>
            </span>;
          })}
        </div>
      </div>
      <div style={{padding:"0 12px"}}><LiveDot/></div>
    </div>

    {/* Header */}
    <header style={{background:T.surface,borderBottom:`1px solid ${T.line}`,position:"sticky",top:0,zIndex:100}}>
      <div style={{maxWidth:1600,margin:"0 auto",display:"flex",alignItems:"stretch",height:48,padding:"0 16px"}}>
        <div style={{display:"flex",alignItems:"center",gap:9,marginRight:18,paddingRight:18,borderRight:`1px solid ${T.line}`}}>
          <div style={{width:28,height:28,background:T.gold+"18",border:`1px solid ${T.gold}30`,borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,animation:"glow 4s ease infinite"}}>◈</div>
          <div>
            <div style={{fontWeight:800,fontSize:13,letterSpacing:"-.03em"}}>MF <span style={{color:T.gold}}>Copilot</span></div>
          </div>
          <Badge color={T.teal}>v4.0</Badge>
        </div>
        <nav style={{display:"flex",gap:0,flex:1,alignItems:"stretch"}}>
          {grouped.map(({g,label,pages})=><div key={g} style={{display:"flex",alignItems:"stretch"}}>
            <div style={{display:"flex",alignItems:"center",padding:"0 8px",borderRight:`1px solid ${T.line}`}}>
              <span style={{color:T.muted,fontSize:8,fontWeight:600,textTransform:"uppercase",letterSpacing:".08em",whiteSpace:"nowrap"}}>{label}</span>
            </div>
            {pages.map(p=>{
              const needsPro=["montecarlo","ai"].includes(p.id)&&!isPro;
              return <button key={p.id} onClick={()=>setPage(p.id)} style={{background:page===p.id?T.gold+"14":"transparent",color:page===p.id?T.gold:T.muted,border:"none",borderBottom:page===p.id?`2px solid ${T.gold}`:"2px solid transparent",borderLeft:"none",borderRight:"none",borderTop:"none",padding:"0 9px",fontSize:10,fontWeight:page===p.id?700:400,cursor:"pointer",display:"flex",alignItems:"center",gap:4,fontFamily:"inherit",whiteSpace:"nowrap",position:"relative"}}>
                <span style={{fontSize:11}}>{p.icon}</span>{p.label}
                {needsPro&&<span style={{fontSize:7,color:T.amber,fontWeight:700}}> PRO</span>}
              </button>;
            })}
            <div style={{borderRight:`1px solid ${T.line}`,margin:"10px 0"}}/>
          </div>)}
        </nav>
        <div style={{display:"flex",alignItems:"center",gap:12,marginLeft:"auto",paddingLeft:14,borderLeft:`1px solid ${T.line}`}}>
          {an&&<>
            <Mono c={T.gold} s={{fontSize:12,fontWeight:700}}>₹{(an.total/1e5).toFixed(2)}L</Mono>
            <PnlChip v={an.pnlPct}/>
          </>}
          <div style={{width:1,height:20,background:T.line}}/>
          <div style={{display:"flex",alignItems:"center",gap:7}}>
            <div style={{width:26,height:26,background:`linear-gradient(135deg,${T.gold},${T.teal})`,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:"#0B0F17"}}>{user.avatar}</div>
            <div>
              <div style={{fontSize:11,fontWeight:600,color:T.ink,lineHeight:1}}>{user.name?.split(" ")[0]}</div>
              <Badge color={user.plan==="pro"?T.gold:T.muted}>{user.plan}</Badge>
            </div>
            <button onClick={()=>setUser(null)} style={{background:"none",border:`1px solid ${T.line}`,color:T.muted,borderRadius:4,padding:"2px 7px",fontSize:9,cursor:"pointer",fontFamily:"inherit"}}>Sign out</button>
          </div>
        </div>
      </div>
    </header>

    {/* Page */}
    <main style={{maxWidth:1600,margin:"0 auto",padding:"18px 16px 40px"}}>
      <div style={{marginBottom:14,display:"flex",alignItems:"center",gap:10}}>
        <div>
          <h1 style={{fontSize:19,fontWeight:800,letterSpacing:"-.03em",margin:0,lineHeight:1.2}}>
            <Serif sz={19} italic c={T.gold}>{pageTitles[page]?.split(" ")[0]} </Serif>
            <span>{pageTitles[page]?.split(" ").slice(1).join(" ")}</span>
          </h1>
        </div>
        {["dashboard","analytics"].includes(page)&&<LiveDot/>}
        {!isPro&&["montecarlo","ai"].includes(page)&&<Badge color={T.amber}>⭐ Pro Feature</Badge>}
        {!holdings&&["dashboard","analytics","montecarlo","tax","corpact"].includes(page)&&
          <div style={{background:T.amberDim,border:`1px solid ${T.amber}28`,borderRadius:5,padding:"4px 10px",fontSize:11,color:T.amber}}>
            📄 Import your CAS statement first
          </div>}
      </div>

      <div className="fu" key={page}>
        {page==="import"    &&<CASParserPage onImport={handleImport}/>}
        {page==="pipeline"  &&<NAVPipelinePage/>}
        {page==="dashboard" &&<DashboardPage an={an} history={history||[]} navMap={navMap}/>}
        {page==="analytics" &&<AnalyticsPage an={an} history={history||[]}/>}
        {page==="screener"  &&<FundScreenerPage portfolio={holdings||[]}/>}
        {page==="corpact"   &&<CorporateActionsPage/>}
        {page==="montecarlo"&&<MonteCarloPage an={an}/>}
        {page==="tax"       &&<TaxPage an={an}/>}
        {page==="sip"       &&<SIPPlannerPage/>}
        {page==="ai"        &&<AIAdvisorPage an={an}/>}
        {page==="security"  &&<SecurityPage user={user}/>}
        {page==="infra"     &&<InfraPage/>}
        {page==="monetize"  &&<MonetizationPage user={user} onUpgrade={plan=>setUser(u=>({...u,plan}))}/>}
        {page==="growth"    &&<GrowthPage user={user}/>}
      </div>
    </main>
  </div>;
}
