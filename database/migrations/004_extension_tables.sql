-- Extension officer tools: field visit records and escalations to MINAGRI/RAB.
-- Farmers are referred to by a code or first name only: no phone numbers or IDs
-- (Rwanda Law No. 058/2021 on personal data protection).

CREATE TABLE IF NOT EXISTS field_records (
    id               BIGSERIAL PRIMARY KEY,
    officer          TEXT NOT NULL,
    farmer_ref       TEXT,                 -- farmer code or first name, never a phone number
    district         TEXT,
    sector           TEXT,
    crop             TEXT,                 -- maize | beans | potato | other
    dimension        TEXT,                 -- one of the eight advisory topics
    problem          TEXT NOT NULL,
    advice           TEXT,
    follow_up_date   DATE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS field_records_created_idx ON field_records (created_at);
CREATE INDEX IF NOT EXISTS field_records_officer_idx ON field_records (officer);

CREATE TABLE IF NOT EXISTS escalations (
    id                BIGSERIAL PRIMARY KEY,
    officer           TEXT NOT NULL,
    district          TEXT,
    sector            TEXT,
    crop              TEXT,
    dimension         TEXT,
    issue             TEXT NOT NULL,
    farmers_affected  INT CHECK (farmers_affected IS NULL OR farmers_affected >= 0),
    severity          TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
    status            TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewing', 'resolved')),
    response          TEXT,                -- reply from MINAGRI/RAB
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS escalations_status_idx ON escalations (status, created_at);

ALTER TABLE field_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalations   ENABLE ROW LEVEL SECURITY;
