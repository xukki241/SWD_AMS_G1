-- ============================================================
-- V8__demo_seed_sync.sql
-- Idempotent demo sync for Docker Compose clones.
-- Ensures critical demo rows after V1–V7 so `docker compose up --build`
-- yields a consistent golden path on a fresh volume.
-- Safe on existing volumes: UPDATE / INSERT … WHERE NOT EXISTS only.
-- Does NOT wipe data. SePay stays in env — nothing SePay-specific in DB.
-- ============================================================

-- 1) System default registration fee = 50_000 VND
UPDATE system_configurations
SET business_value = '50000',
    last_reviewed_at = NOW()
WHERE configuration_name = 'registration.fee.default'
  AND business_value IS DISTINCT FROM '50000';

INSERT INTO system_configurations (configuration_name, business_value, effective_status, last_reviewed_at)
SELECT 'registration.fee.default', '50000', 'ACTIVE', NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM system_configurations WHERE configuration_name = 'registration.fee.default'
);

-- 2) Documented join codes + ACTIVE status for seed classes
--    (skip if another row already owns the join_code — UNIQUE constraint)
UPDATE subject_classes sc
SET join_code = v.join_code,
    status = 'ACTIVE'
FROM (VALUES
    ('SWD392-G1701', 'K7Q2M9'),
    ('SWD392-G1702', 'Q2M9K7'),
    ('SWD392-G1801', 'B7X4NP'),
    ('PRJ301-G1703', 'M4T8ZD'),
    ('PRJ301-G1704', 'X9R3VC'),
    ('DBI202-G1705', 'P6H2WS'),
    ('MAE101-G1806', 'Z5J7QB'),
    ('DBI202-G1807', 'T8N4LM')
) AS v(class_code, join_code)
WHERE sc.class_code = v.class_code
  AND (
      sc.join_code IS DISTINCT FROM v.join_code
      OR sc.status IS DISTINCT FROM 'ACTIVE'
  )
  AND NOT EXISTS (
      SELECT 1 FROM subject_classes other
      WHERE other.join_code = v.join_code
        AND other.id <> sc.id
  );

-- 3) Demo fees: teacher1 paid classes + student1 payment class = 50k; free labs = 0
UPDATE subject_classes
SET registration_fee = 50000,
    status = 'ACTIVE',
    capacity = CASE WHEN capacity = 0 THEN 25 ELSE capacity END
WHERE class_code IN ('SWD392-G1701', 'SWD392-G1702');

UPDATE subject_classes
SET registration_fee = 50000,
    status = 'ACTIVE',
    capacity = CASE WHEN capacity = 0 THEN 30 ELSE capacity END
WHERE class_code = 'SWD392-G1801';

UPDATE subject_classes
SET registration_fee = 0,
    status = 'ACTIVE',
    capacity = CASE WHEN capacity = 0 THEN 40 ELSE capacity END
WHERE class_code IN ('PRJ301-G1703', 'PRJ301-G1704');

-- 4) Assignment topics for seed titles (fill only when blank)
UPDATE assignments SET topic = 'Đồ án môn học'
WHERE title IN (
    'Project Proposal - G1701',
    'Sprint 1 Report - G1701',
    'Project Proposal - G1702',
    'Final Demo - G1801'
)
AND (topic IS NULL OR btrim(topic) = '');

UPDATE assignments SET topic = 'Chuyên đề 1'
WHERE title IN (
    'Servlet Lab - G1703',
    'Spring MVC App - G1703',
    'Servlet Lab - G1704'
)
AND (topic IS NULL OR btrim(topic) = '');

UPDATE assignments SET topic = 'Bài tập thực hành'
WHERE title IN (
    'Hospital ERD - G1705',
    'SQL Queries - G1705',
    'Linear Algebra - G1806'
)
AND (topic IS NULL OR btrim(topic) = '');

-- 5) student1 ACTIVE on teacher1 primary class (G1701) if missing
INSERT INTO class_registrations (student_id, subject_class_id, registration_reference, status, activated_at)
SELECT u.id,
       sc.id,
       'REG-DEMO-S1-G1701',
       'ACTIVE',
       NOW() - INTERVAL '9 days'
FROM users u
CROSS JOIN subject_classes sc
WHERE u.username = 'student1'
  AND sc.class_code = 'SWD392-G1701'
  AND NOT EXISTS (
      SELECT 1 FROM class_registrations cr
      WHERE cr.student_id = u.id AND cr.subject_class_id = sc.id
  );

-- 6) student1 PENDING_PAYMENT on 50k ACTIVE class G1801 (golden SePay/VNPay path)
INSERT INTO class_registrations (student_id, subject_class_id, registration_reference, status, activated_at)
SELECT u.id,
       sc.id,
       'REG-DEMO-S1-G1801-PENDING',
       'PENDING_PAYMENT',
       NULL
FROM users u
CROSS JOIN subject_classes sc
WHERE u.username = 'student1'
  AND sc.class_code = 'SWD392-G1801'
  AND sc.status = 'ACTIVE'
  AND sc.registration_fee = 50000
  AND NOT EXISTS (
      SELECT 1 FROM class_registrations cr
      WHERE cr.student_id = u.id AND cr.subject_class_id = sc.id
  );

-- If an earlier cancel left student1 CANCELLED on G1801, restore PENDING_PAYMENT for demos
UPDATE class_registrations cr
SET status = 'PENDING_PAYMENT',
    activated_at = NULL
FROM users u
JOIN subject_classes sc ON sc.class_code = 'SWD392-G1801'
WHERE cr.student_id = u.id
  AND cr.subject_class_id = sc.id
  AND u.username = 'student1'
  AND cr.status = 'CANCELLED'
  AND sc.registration_fee = 50000
  AND sc.status = 'ACTIVE';
