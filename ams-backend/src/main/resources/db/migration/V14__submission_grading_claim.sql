ALTER TABLE submissions
    ADD COLUMN grading_claim_owner BIGINT NULL REFERENCES users(id),
    ADD COLUMN grading_claim_expires_at TIMESTAMP NULL;
