ALTER TABLE assignments
    ADD COLUMN IF NOT EXISTS attachment_url VARCHAR(1000),
    ADD COLUMN IF NOT EXISTS attachment_metadata TEXT;
