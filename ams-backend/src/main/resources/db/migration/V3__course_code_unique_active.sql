-- Soft-deleted courses should not reserve their code forever.
-- Replace the table-wide UNIQUE constraint with a partial unique index that
-- only covers courses that are still active.
ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_code_key;

CREATE UNIQUE INDEX IF NOT EXISTS uq_courses_code_active
    ON courses (code)
    WHERE deleted = FALSE;
