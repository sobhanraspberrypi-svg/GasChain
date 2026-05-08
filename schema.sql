-- GasChain Database Schema
-- PostgreSQL

-- ─────────────────────────────────────────────────────────
-- CONSUMERS
-- ─────────────────────────────────────────────────────────
CREATE TABLE consumers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aadhar_token    VARCHAR(64) UNIQUE NOT NULL,  -- UIDAI token, never raw Aadhar
    name            VARCHAR(120) NOT NULL,
    phone           VARCHAR(15) NOT NULL,
    address         TEXT NOT NULL,
    district        VARCHAR(80) NOT NULL,
    state           VARCHAR(80) NOT NULL,
    pincode         VARCHAR(10) NOT NULL,
    lat             DECIMAL(10,7),
    lng             DECIMAL(10,7),
    category        VARCHAR(20) CHECK (category IN ('PMUY', 'GENERAL', 'COMMERCIAL')),
    status          VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'BLOCKED')),
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────
-- GAS CONNECTIONS
-- ─────────────────────────────────────────────────────────
CREATE TABLE connections (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consumer_id     UUID REFERENCES consumers(id),
    connection_type VARCHAR(20) CHECK (connection_type IN ('LPG_DOMESTIC', 'LPG_COMMERCIAL', 'PNG', 'CBG')),
    provider        VARCHAR(20) CHECK (provider IN ('HPCL', 'BPCL', 'IOCL', 'JYOTHI', 'CBG_LOCAL', 'OTHER')),
    agency_id       UUID,  -- FK to agencies table
    monthly_quota   INTEGER DEFAULT 2,  -- cylinders per month
    deposit_paid    DECIMAL(10,2),
    status          VARCHAR(20) DEFAULT 'ACTIVE',
    created_at      TIMESTAMP DEFAULT NOW()
);

-- Only one active connection per consumer per type
CREATE UNIQUE INDEX idx_one_active_connection
    ON connections(consumer_id, connection_type)
    WHERE status = 'ACTIVE';

-- ─────────────────────────────────────────────────────────
-- CYLINDERS
-- ─────────────────────────────────────────────────────────
CREATE TABLE cylinders (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    serial_number       VARCHAR(50) UNIQUE NOT NULL,
    qr_code             VARCHAR(100) UNIQUE NOT NULL,
    rfid_tag            VARCHAR(50),
    size_kg             DECIMAL(5,2) NOT NULL,  -- 5, 10, 14.2, 19, 33
    cylinder_type       VARCHAR(20) CHECK (cylinder_type IN ('LPG', 'CBG', 'PNG_METER')),
    provider            VARCHAR(20),
    manufacture_date    DATE,
    last_inspection     DATE,
    next_inspection     DATE,
    status              VARCHAR(20) DEFAULT 'IN_SERVICE',
    current_agency_id   UUID,
    created_at          TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────
-- AGENCIES (distributors / retailers)
-- ─────────────────────────────────────────────────────────
CREATE TABLE agencies (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(150) NOT NULL,
    owner_name      VARCHAR(120),
    phone           VARCHAR(15),
    address         TEXT,
    district        VARCHAR(80),
    state           VARCHAR(80),
    lat             DECIMAL(10,7),
    lng             DECIMAL(10,7),
    provider        VARCHAR(20),
    license_number  VARCHAR(50),
    monthly_quota   INTEGER,  -- cylinders allocated per month
    status          VARCHAR(20) DEFAULT 'ACTIVE',
    anomaly_score   DECIMAL(5,3) DEFAULT 0.0,  -- 0 = clean, >1.5 = flagged
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────
-- TRANSACTIONS (every cylinder dispensed)
-- ─────────────────────────────────────────────────────────
CREATE TABLE transactions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cylinder_id         UUID REFERENCES cylinders(id),
    consumer_id         UUID REFERENCES consumers(id),
    agency_id           UUID REFERENCES agencies(id),
    connection_id       UUID REFERENCES connections(id),
    transaction_type    VARCHAR(20) CHECK (transaction_type IN ('REFILL', 'NEW_CONNECTION', 'EXCHANGE', 'RETURN')),
    aadhar_verified     BOOLEAN DEFAULT FALSE,
    amount_paid         DECIMAL(10,2),
    subsidy_applied     DECIMAL(10,2) DEFAULT 0,
    price_per_kg        DECIMAL(8,2),
    gas_type            VARCHAR(20),
    lat                 DECIMAL(10,7),
    lng                 DECIMAL(10,7),
    anomaly_flag        BOOLEAN DEFAULT FALSE,
    anomaly_reason      TEXT,
    platform_fee        DECIMAL(8,2),  -- GasChain's revenue per transaction
    created_at          TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_transactions_consumer ON transactions(consumer_id, created_at);
CREATE INDEX idx_transactions_agency ON transactions(agency_id, created_at);
CREATE INDEX idx_transactions_anomaly ON transactions(anomaly_flag) WHERE anomaly_flag = TRUE;

-- ─────────────────────────────────────────────────────────
-- CBG PRODUCERS (marketplace)
-- ─────────────────────────────────────────────────────────
CREATE TABLE cbg_producers (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(150) NOT NULL,
    producer_type       VARCHAR(30) CHECK (producer_type IN (
                            'DAIRY_FARM', 'GOBAR_GAS', 'MSW_PLANT',
                            'STP_BIOGAS', 'FOOD_WASTE', 'AGRI_RESIDUE',
                            'INDUSTRIAL'
                        )),
    feedstock_source    TEXT,
    daily_capacity_kg   DECIMAL(10,2),
    price_per_kg        DECIMAL(8,2),
    satat_registered    BOOLEAN DEFAULT FALSE,
    satat_id            VARCHAR(50),
    lat                 DECIMAL(10,7),
    lng                 DECIMAL(10,7),
    district            VARCHAR(80),
    state               VARCHAR(80),
    cbg_quality_pct     DECIMAL(5,2),  -- methane % in output
    is_15087_certified  BOOLEAN DEFAULT FALSE,  -- IS 16087:2016 compliance
    status              VARCHAR(20) DEFAULT 'ACTIVE',
    created_at          TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────
-- ANOMALY ALERTS
-- ─────────────────────────────────────────────────────────
CREATE TABLE anomaly_alerts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id       UUID REFERENCES agencies(id),
    alert_type      VARCHAR(50) CHECK (alert_type IN (
                        'EXCESS_DISPENSE', 'AADHAR_MISMATCH',
                        'QUOTA_BREACH', 'COMMERCIAL_DIVERSION',
                        'GHOST_CONNECTION', 'DUPLICATE_AADHAR',
                        'TIME_PATTERN_ANOMALY'
                    )),
    severity        VARCHAR(10) CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    description     TEXT,
    anomaly_score   DECIMAL(5,3),
    transaction_id  UUID REFERENCES transactions(id),
    resolved        BOOLEAN DEFAULT FALSE,
    resolved_at     TIMESTAMP,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────
-- DEMAND INTELLIGENCE (for digital twin)
-- ─────────────────────────────────────────────────────────
CREATE TABLE demand_snapshots (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    district        VARCHAR(80) NOT NULL,
    state           VARCHAR(80) NOT NULL,
    snapshot_date   DATE NOT NULL,
    cylinders_lpg   INTEGER DEFAULT 0,
    cylinders_cbg   INTEGER DEFAULT 0,
    cylinders_png   INTEGER DEFAULT 0,
    subsidy_total   DECIMAL(15,2) DEFAULT 0,
    anomaly_count   INTEGER DEFAULT 0,
    cbg_blend_pct   DECIMAL(5,2),
    demand_index    DECIMAL(5,2),  -- normalised 0-100
    created_at      TIMESTAMP DEFAULT NOW(),
    UNIQUE(district, snapshot_date)
);

-- ─────────────────────────────────────────────────────────
-- STP BIOGAS SOURCES (new module)
-- ─────────────────────────────────────────────────────────
CREATE TABLE stp_sources (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stp_name            VARCHAR(150) NOT NULL,
    operator            VARCHAR(100),  -- e.g. BWSSB, municipal corp
    city                VARCHAR(80),
    state               VARCHAR(80),
    capacity_mld        DECIMAL(10,2),  -- million litres per day
    daily_biogas_m3     DECIMAL(10,2),  -- raw biogas potential
    daily_cbg_kg        DECIMAL(10,2),  -- CBG after purification
    concession_status   VARCHAR(30) DEFAULT 'AVAILABLE',  -- AVAILABLE, UNDER_NEGOTIATION, SIGNED, OPERATIONAL
    lat                 DECIMAL(10,7),
    lng                 DECIMAL(10,7),
    contact_officer     VARCHAR(100),
    contact_email       VARCHAR(100),
    notes               TEXT,
    created_at          TIMESTAMP DEFAULT NOW()
);
