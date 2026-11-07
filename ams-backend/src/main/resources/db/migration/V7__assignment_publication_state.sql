ALTER TABLE assignments
    ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'PUBLISHED';

ALTER TABLE assignments
    ADD CONSTRAINT chk_assignments_status CHECK (status IN ('DRAFT', 'PUBLISHED'));
