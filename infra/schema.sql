-- ============================================================
-- MF COPILOT — PostgreSQL Schema v4.0
-- ============================================================
-- Run: psql -U postgres -d mfcopilot -f schema.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email           TEXT UNIQUE NOT NULL,
  name            TEXT NOT NULL,
  -- encrypted PAN (AES-256 via pgcrypto)
  pan_encrypted   BYTEA,
  phone_encrypted BYTEA,
  plan            TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free','pro','elite')),
  kyc_status      TEXT NOT NULL DEFAULT 'pending' CHECK (kyc_status IN ('pending','submitted','verified','rejected')),
  risk_profile    TEXT DEFAULT 'moderate' CHECK (risk_profile IN ('conservative','moderate','aggressive')),
  avatar          TEXT,
  referral_code   TEXT UNIQUE DEFAULT substr(md5(random()::text),1,8),
  referred_by     UUID REFERENCES users(id),
  plan_expires_at TIMESTAMPTZ,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_plan ON users(plan);

-- ─────────────────────────────────────────────────────────────
-- KYC DOCUMENTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE kyc_documents (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  doc_type      TEXT NOT NULL CHECK (doc_type IN ('aadhaar','pan','digilocker')),
  status        TEXT NOT NULL DEFAULT 'pending',
  verified_at   TIMESTAMPTZ,
  digilocker_id TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_kyc_user ON kyc_documents(user_id);

-- ─────────────────────────────────────────────────────────────
-- FUNDS MASTER
-- ─────────────────────────────────────────────────────────────
CREATE TABLE funds (
  isin            TEXT PRIMARY KEY,
  amfi_code       INTEGER UNIQUE,
  name            TEXT NOT NULL,
  amc             TEXT NOT NULL,
  category        TEXT NOT NULL,  -- Large Cap, Mid Cap, Small Cap, etc.
  sub_category    TEXT,
  bench_index     TEXT,
  risk_o_meter    TEXT,
  expense_ratio   NUMERIC(5,3),
  aum_cr          NUMERIC(12,2),
  manager_name    TEXT,
  fund_type       TEXT DEFAULT 'open' CHECK (fund_type IN ('open','close','interval')),
  launch_date     DATE,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_funds_category ON funds(category);
CREATE INDEX idx_funds_amc ON funds(amc);

-- ─────────────────────────────────────────────────────────────
-- NAV HISTORY (partitioned by year for performance)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE nav_history (
  id          BIGSERIAL,
  fund_isin   TEXT NOT NULL REFERENCES funds(isin),
  nav_date    DATE NOT NULL,
  nav         NUMERIC(12,4) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (fund_isin, nav_date)
) PARTITION BY RANGE (nav_date);

-- Yearly partitions
CREATE TABLE nav_history_2022 PARTITION OF nav_history
  FOR VALUES FROM ('2022-01-01') TO ('2023-01-01');
CREATE TABLE nav_history_2023 PARTITION OF nav_history
  FOR VALUES FROM ('2023-01-01') TO ('2024-01-01');
CREATE TABLE nav_history_2024 PARTITION OF nav_history
  FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
CREATE TABLE nav_history_2025 PARTITION OF nav_history
  FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

CREATE INDEX idx_nav_isin_date ON nav_history(fund_isin, nav_date DESC);

-- ─────────────────────────────────────────────────────────────
-- FUND HOLDINGS (quarterly snapshots)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE fund_holdings (
  id            BIGSERIAL PRIMARY KEY,
  fund_isin     TEXT NOT NULL REFERENCES funds(isin),
  as_of_date    DATE NOT NULL,
  stock_name    TEXT NOT NULL,
  stock_isin    TEXT,
  sector        TEXT,
  market_cap    TEXT CHECK (market_cap IN ('large','mid','small','micro')),
  weight_pct    NUMERIC(6,3) NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (fund_isin, as_of_date, stock_isin)
);

CREATE INDEX idx_holdings_fund_date ON fund_holdings(fund_isin, as_of_date DESC);
CREATE INDEX idx_holdings_stock ON fund_holdings(stock_isin);

-- ─────────────────────────────────────────────────────────────
-- PORTFOLIOS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE portfolios (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL DEFAULT 'My Portfolio',
  goal          TEXT,
  target_amount NUMERIC(15,2),
  target_date   DATE,
  is_primary    BOOLEAN DEFAULT FALSE,
  cas_imported  BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_portfolios_user ON portfolios(user_id);

-- ─────────────────────────────────────────────────────────────
-- PORTFOLIO HOLDINGS (current positions)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE portfolio_holdings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id    UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  fund_isin       TEXT NOT NULL REFERENCES funds(isin),
  folio_number    TEXT,
  units           NUMERIC(16,4) NOT NULL,
  avg_buy_nav     NUMERIC(12,4),
  invested_amount NUMERIC(15,2),
  sip_amount      NUMERIC(10,2) DEFAULT 0,
  goal_tag        TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (portfolio_id, fund_isin, folio_number)
);

CREATE INDEX idx_ph_portfolio ON portfolio_holdings(portfolio_id);
CREATE INDEX idx_ph_fund ON portfolio_holdings(fund_isin);

-- ─────────────────────────────────────────────────────────────
-- PORTFOLIO TRANSACTIONS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE portfolio_transactions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  holding_id    UUID NOT NULL REFERENCES portfolio_holdings(id) ON DELETE CASCADE,
  portfolio_id  UUID NOT NULL REFERENCES portfolios(id),
  fund_isin     TEXT NOT NULL,
  txn_date      DATE NOT NULL,
  txn_type      TEXT NOT NULL CHECK (txn_type IN (
                  'purchase','redemption','sip','switch_in','switch_out',
                  'dividend_payout','dividend_reinvest','bonus','merger_in','merger_out'
                )),
  units         NUMERIC(16,4),
  nav           NUMERIC(12,4),
  amount        NUMERIC(15,2),
  note          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_txn_holding ON portfolio_transactions(holding_id);
CREATE INDEX idx_txn_portfolio ON portfolio_transactions(portfolio_id);
CREATE INDEX idx_txn_date ON portfolio_transactions(txn_date DESC);

-- ─────────────────────────────────────────────────────────────
-- ANALYTICS RESULTS (cached computed metrics)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE analytics_results (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id    UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  computed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_value     NUMERIC(15,2),
  total_invested  NUMERIC(15,2),
  pnl             NUMERIC(15,2),
  pnl_pct         NUMERIC(8,4),
  xirr            NUMERIC(8,4),
  cagr_1y         NUMERIC(8,4),
  cagr_3y         NUMERIC(8,4),
  cagr_5y         NUMERIC(8,4),
  volatility      NUMERIC(8,4),
  sharpe          NUMERIC(8,4),
  sortino         NUMERIC(8,4),
  max_drawdown    NUMERIC(8,4),
  beta            NUMERIC(8,4),
  alpha           NUMERIC(8,4),
  health_score    INTEGER,
  diversity_score INTEGER,
  -- JSONB for full breakdown
  sector_exposure JSONB,
  marketcap_exp   JSONB,
  overlap_matrix  JSONB,
  rolling_returns JSONB,
  UNIQUE (portfolio_id, computed_at)
);

CREATE INDEX idx_analytics_portfolio ON analytics_results(portfolio_id, computed_at DESC);

-- ─────────────────────────────────────────────────────────────
-- CORPORATE ACTIONS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE corporate_actions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fund_isin     TEXT NOT NULL REFERENCES funds(isin),
  action_type   TEXT NOT NULL CHECK (action_type IN ('dividend','bonus','split','merger','wind_up')),
  ex_date       DATE NOT NULL,
  record_date   DATE,
  ratio         NUMERIC(10,4),  -- bonus ratio or split ratio
  amount        NUMERIC(10,4),  -- dividend per unit
  merged_into   TEXT REFERENCES funds(isin),
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_corpact_fund ON corporate_actions(fund_isin, ex_date DESC);

-- ─────────────────────────────────────────────────────────────
-- PAYMENT SUBSCRIPTIONS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE subscriptions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES users(id),
  razorpay_sub_id   TEXT UNIQUE,
  plan              TEXT NOT NULL CHECK (plan IN ('pro','elite')),
  status            TEXT NOT NULL DEFAULT 'created',
  amount_paise      INTEGER NOT NULL,
  billing_cycle     TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly','annual')),
  started_at        TIMESTAMPTZ,
  expires_at        TIMESTAMPTZ,
  cancelled_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subs_user ON subscriptions(user_id);

-- ─────────────────────────────────────────────────────────────
-- AUDIT LOG (DPDP Act compliance)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE audit_log (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID REFERENCES users(id),
  action      TEXT NOT NULL,
  resource    TEXT,
  ip_address  INET,
  user_agent  TEXT,
  status      TEXT DEFAULT 'ok',
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_log(user_id, created_at DESC);
CREATE INDEX idx_audit_created ON audit_log(created_at DESC);

-- ─────────────────────────────────────────────────────────────
-- INGESTION LOG
-- ─────────────────────────────────────────────────────────────
CREATE TABLE ingestion_log (
  id            BIGSERIAL PRIMARY KEY,
  source        TEXT NOT NULL,  -- 'amfi', 'cas_parser'
  status        TEXT NOT NULL CHECK (status IN ('running','success','failed')),
  records_in    INTEGER DEFAULT 0,
  records_out   INTEGER DEFAULT 0,
  error_msg     TEXT,
  started_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at   TIMESTAMPTZ,
  duration_ms   INTEGER
);

-- ─────────────────────────────────────────────────────────────
-- TRIGGERS — updated_at auto-update
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_portfolios_updated BEFORE UPDATE ON portfolios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_holdings_updated BEFORE UPDATE ON portfolio_holdings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
