-- Knowledge base: source documents and their embedded text chunks.

CREATE TABLE IF NOT EXISTS documents (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       TEXT NOT NULL,
    source      TEXT,                 -- e.g. RAB, MINAGRI, CIP, CIMMYT, FAO
    url         TEXT,
    crop        TEXT NOT NULL,        -- maize | beans | potato | general
    language    TEXT NOT NULL DEFAULT 'en',
    file_hash   TEXT UNIQUE,          -- prevents ingesting the same file twice
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chunks (
    id           BIGSERIAL PRIMARY KEY,
    document_id  UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index  INT NOT NULL,
    content      TEXT NOT NULL,
    crop         TEXT NOT NULL,
    embedding    VECTOR(1536) NOT NULL,   -- must equal EMBEDDING_DIM
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chunks_embedding_idx
    ON chunks USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS chunks_crop_idx ON chunks (crop);

-- Supabase exposes the public schema through its REST API.
-- Enabling RLS with no policies blocks that access; the backend
-- connects as the database owner and is not affected.
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE chunks    ENABLE ROW LEVEL SECURITY;
