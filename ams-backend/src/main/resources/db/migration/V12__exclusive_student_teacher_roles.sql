-- ============================================================
-- Exclusive roles: a user must not be both STUDENT and TEACHER.
-- - Owns course(s) → keep TEACHER, revoke STUDENT
-- - Otherwise → keep STUDENT, revoke TEACHER
-- Admins are left unchanged.
-- ============================================================

-- 1) Dual accounts that teach: drop STUDENT
UPDATE user_roles ur
SET assignment_status = 'REVOKED',
    assignment_note = COALESCE(assignment_note || ' | ', '') || 'V12 exclusive: revoke STUDENT (user teaches)'
WHERE ur.assignment_status = 'ACTIVE'
  AND ur.role_id = (SELECT id FROM roles WHERE role_name = 'STUDENT')
  AND EXISTS (
      SELECT 1
      FROM user_roles ut
      JOIN roles rt ON rt.id = ut.role_id
      WHERE ut.user_id = ur.user_id
        AND ut.assignment_status = 'ACTIVE'
        AND rt.role_name = 'TEACHER'
  )
  AND EXISTS (
      SELECT 1 FROM courses c
      WHERE c.instructor_id = ur.user_id AND c.deleted = FALSE
  )
  AND NOT EXISTS (
      SELECT 1
      FROM user_roles ua
      JOIN roles ra ON ra.id = ua.role_id
      WHERE ua.user_id = ur.user_id
        AND ua.assignment_status = 'ACTIVE'
        AND ra.role_name = 'ADMIN'
  );

-- 2) Remaining dual accounts (students who got TEACHER): drop TEACHER
UPDATE user_roles ur
SET assignment_status = 'REVOKED',
    assignment_note = COALESCE(assignment_note || ' | ', '') || 'V12 exclusive: revoke TEACHER (student-only)'
WHERE ur.assignment_status = 'ACTIVE'
  AND ur.role_id = (SELECT id FROM roles WHERE role_name = 'TEACHER')
  AND EXISTS (
      SELECT 1
      FROM user_roles us
      JOIN roles rs ON rs.id = us.role_id
      WHERE us.user_id = ur.user_id
        AND us.assignment_status = 'ACTIVE'
        AND rs.role_name = 'STUDENT'
  )
  AND NOT EXISTS (
      SELECT 1 FROM courses c
      WHERE c.instructor_id = ur.user_id AND c.deleted = FALSE
  )
  AND NOT EXISTS (
      SELECT 1
      FROM user_roles ua
      JOIN roles ra ON ra.id = ua.role_id
      WHERE ua.user_id = ur.user_id
        AND ua.assignment_status = 'ACTIVE'
        AND ra.role_name = 'ADMIN'
  );

-- 3) Teachers who still carry STUDENT (no course yet, e.g. new teacher): drop STUDENT
UPDATE user_roles ur
SET assignment_status = 'REVOKED',
    assignment_note = COALESCE(assignment_note || ' | ', '') || 'V12 exclusive: revoke STUDENT (teacher account)'
WHERE ur.assignment_status = 'ACTIVE'
  AND ur.role_id = (SELECT id FROM roles WHERE role_name = 'STUDENT')
  AND EXISTS (
      SELECT 1
      FROM user_roles ut
      JOIN roles rt ON rt.id = ut.role_id
      WHERE ut.user_id = ur.user_id
        AND ut.assignment_status = 'ACTIVE'
        AND rt.role_name = 'TEACHER'
  )
  AND NOT EXISTS (
      SELECT 1
      FROM user_roles ua
      JOIN roles ra ON ra.id = ua.role_id
      WHERE ua.user_id = ur.user_id
        AND ua.assignment_status = 'ACTIVE'
        AND ra.role_name = 'ADMIN'
  );
