-- Soft archive for class offerings (Google Classroom parity)
ALTER TABLE subject_classes
    ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';

ALTER TABLE subject_classes
    ADD CONSTRAINT chk_subject_classes_status CHECK (status IN ('ACTIVE', 'ARCHIVED'));
