-- ============================================================
-- V3__classroom_model.sql
-- Google-Classroom model: join codes, capacity, per-class fee,
-- assignment max score, and the class stream (posts + materials)
-- ============================================================

-- 1) Enrich subject_classes: join code + capacity + registration fee
ALTER TABLE subject_classes
    ADD COLUMN join_code VARCHAR(6),
    ADD COLUMN capacity INT NOT NULL DEFAULT 0,            -- 0 = unlimited
    ADD COLUMN registration_fee DECIMAL(15,2) NOT NULL DEFAULT 0;

ALTER TABLE subject_classes ADD CONSTRAINT uq_subject_classes_join_code UNIQUE (join_code);

-- Backfill join codes for existing classes
UPDATE subject_classes SET join_code = 'K7Q2M9' WHERE id = 1;  -- SWD392-G1701
UPDATE subject_classes SET join_code = 'Q2M9K7' WHERE id = 2;  -- SWD392-G1702
UPDATE subject_classes SET join_code = 'B7X4NP' WHERE id = 3;  -- SWD392-G1801
UPDATE subject_classes SET join_code = 'M4T8ZD' WHERE id = 4;  -- PRJ301-G1703
UPDATE subject_classes SET join_code = 'X9R3VC' WHERE id = 5;  -- PRJ301-G1704
UPDATE subject_classes SET join_code = 'P6H2WS' WHERE id = 6;  -- DBI202-G1705
UPDATE subject_classes SET join_code = 'Z5J7QB' WHERE id = 7;  -- MAE101-G1806
UPDATE subject_classes SET join_code = 'T8N4LM' WHERE id = 8;  -- DBI202-G1807

-- Capacities (0 = unlimited) + registration fees (0 = free class, no payment needed)
UPDATE subject_classes SET capacity = 25, registration_fee = 5000000   WHERE id = 1;
UPDATE subject_classes SET capacity = 25, registration_fee = 5000000   WHERE id = 2;
UPDATE subject_classes SET capacity = 30, registration_fee = 5000000   WHERE id = 3;
UPDATE subject_classes SET capacity = 40, registration_fee = 0         WHERE id = 4;  -- free lab class
UPDATE subject_classes SET capacity = 40, registration_fee = 0         WHERE id = 5;  -- free lab class
UPDATE subject_classes SET capacity = 20, registration_fee = 2500000   WHERE id = 6;
UPDATE subject_classes SET capacity = 15, registration_fee = 1500000   WHERE id = 7;
UPDATE subject_classes SET capacity = 15, registration_fee = 2500000   WHERE id = 8;

-- 2) Assignment max score (SRS lists max_score as a key attribute)
ALTER TABLE assignments
    ADD COLUMN max_score DECIMAL(5,2) NOT NULL DEFAULT 10;

-- 3) Class stream: posts (announcements + material sharing)
CREATE TABLE class_posts (
    id                   BIGSERIAL   PRIMARY KEY,
    subject_class_id     BIGINT      NOT NULL REFERENCES subject_classes(id) ON DELETE CASCADE,
    author_id            BIGINT      NOT NULL REFERENCES users(id),
    body                 TEXT,
    attachment_reference VARCHAR(1000),   -- secure Cloudinary URL
    attachment_filename  VARCHAR(255),
    attachment_size      BIGINT,
    created_at           TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMP
);

CREATE INDEX idx_class_posts_class_id ON class_posts(subject_class_id);
CREATE INDEX idx_class_posts_author_id ON class_posts(author_id);

-- Seed sample stream posts (English)
INSERT INTO class_posts (subject_class_id, author_id, body, attachment_filename, attachment_size, created_at) VALUES
(1, 4, 'Welcome to SWD392 - Group 1701! Course materials and the updated Gantt template are attached. Remember the project proposal is due in 14 days.', 'swd392_gantt_template.xlsx', 48230, NOW() - INTERVAL '9 days'),
(1, 4, 'Sprint 1 starts Monday. Each group should book a 30-minute slot with me for a planning session.', NULL, NULL, NOW() - INTERVAL '5 days'),
(1, 4, 'Reminder: the Sprint 1 report template is in the shared folder. Keep the burndown chart updated every Friday.', NULL, NULL, NOW() - INTERVAL '2 days'),
(4, 5, 'Servlet Lab instructions: deploy on your local Tomcat and submit the zip with a README. Sample skeleton attached.', 'servlet_lab_skeleton.zip', 310720, NOW() - INTERVAL '6 days'),
(6, 6, 'Hospital ERD week: bring your draft entities to class so we can review the 3NF normalization together.', NULL, NULL, NOW() - INTERVAL '3 days');
