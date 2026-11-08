ALTER TABLE assignment_evaluations
    ADD COLUMN ai_draft_criteria JSONB NULL,
    ADD COLUMN criteria_scores JSONB NULL;
