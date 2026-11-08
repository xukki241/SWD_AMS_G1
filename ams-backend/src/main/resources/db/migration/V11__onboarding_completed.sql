ALTER TABLE users
    ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE;

-- Existing / seed accounts skip the first-login role chooser.
UPDATE users SET onboarding_completed = TRUE;
