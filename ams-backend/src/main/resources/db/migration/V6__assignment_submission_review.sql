ALTER TABLE submissions ADD COLUMN answer_text TEXT NULL;

ALTER TABLE assignment_evaluations
    ALTER COLUMN evaluator_id DROP NOT NULL,
    ADD COLUMN ai_draft_score NUMERIC(5,2) NULL,
    ADD COLUMN ai_draft_feedback TEXT NULL,
    ADD COLUMN is_published BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN viewed_at TIMESTAMP NULL;
