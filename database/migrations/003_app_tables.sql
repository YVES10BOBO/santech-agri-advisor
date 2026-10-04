-- Conversation sessions, messages (for follow-ups) and request logs.

CREATE TABLE IF NOT EXISTS sessions (
    id           UUID PRIMARY KEY,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_active  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
    id          BIGSERIAL PRIMARY KEY,
    session_id  UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    role        TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content     TEXT NOT NULL,
    language    TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS messages_session_idx ON messages (session_id, created_at);

CREATE TABLE IF NOT EXISTS request_logs (
    id                   BIGSERIAL PRIMARY KEY,
    request_id           UUID NOT NULL,
    session_id           UUID,
    question             TEXT NOT NULL,
    answer               TEXT,
    language             TEXT,
    crop                 TEXT,
    dimension            TEXT,
    model                TEXT,
    system_version       TEXT,
    prompt_version       TEXT,
    latency_ms           INT,
    retrieved_chunk_ids  BIGINT[],
    flags                TEXT[],
    status               TEXT,          -- ok | fallback
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS request_logs_created_idx ON request_logs (created_at);

ALTER TABLE sessions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages     ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_logs ENABLE ROW LEVEL SECURITY;
