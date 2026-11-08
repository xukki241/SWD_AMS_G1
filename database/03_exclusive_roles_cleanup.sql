-- ============================================================
-- Exclusive Student / Teacher cleanup (same as Flyway V12)
-- Run only if demo DB was seeded before exclusive-role rules.
-- Safe to skip on a fresh apply of 01 + 02.
-- ============================================================

UPDATE user_roles ur
SET assignment_status = 'REVOKED',
    assignment_note = COALESCE(assignment_note || ' | ', '') || 'exclusive: revoke STUDENT (user teaches)'
WHERE ur.assignment_status = 'ACTIVE'
  AND ur.role_id = (SELECT id FROM roles WHERE role_name = 'STUDENT')
  AND EXISTS (
      SELECT 1 FROM user_roles ut
      JOIN roles rt ON rt.id = ut.role_id
      WHERE ut.user_id = ur.user_id AND ut.assignment_status = 'ACTIVE' AND rt.role_name = 'TEACHER'
  )
  AND EXISTS (
      SELECT 1 FROM courses c WHERE c.instructor_id = ur.user_id AND c.deleted = FALSE
  )
  AND NOT EXISTS (
      SELECT 1 FROM user_roles ua
      JOIN roles ra ON ra.id = ua.role_id
      WHERE ua.user_id = ur.user_id AND ua.assignment_status = 'ACTIVE' AND ra.role_name = 'ADMIN'
  );

UPDATE user_roles ur
SET assignment_status = 'REVOKED',
    assignment_note = COALESCE(assignment_note || ' | ', '') || 'exclusive: revoke TEACHER (student-only)'
WHERE ur.assignment_status = 'ACTIVE'
  AND ur.role_id = (SELECT id FROM roles WHERE role_name = 'TEACHER')
  AND EXISTS (
      SELECT 1 FROM user_roles us
      JOIN roles rs ON rs.id = us.role_id
      WHERE us.user_id = ur.user_id AND us.assignment_status = 'ACTIVE' AND rs.role_name = 'STUDENT'
  )
  AND NOT EXISTS (
      SELECT 1 FROM courses c WHERE c.instructor_id = ur.user_id AND c.deleted = FALSE
  )
  AND NOT EXISTS (
      SELECT 1 FROM user_roles ua
      JOIN roles ra ON ra.id = ua.role_id
      WHERE ua.user_id = ur.user_id AND ua.assignment_status = 'ACTIVE' AND ra.role_name = 'ADMIN'
  );

UPDATE user_roles ur
SET assignment_status = 'REVOKED',
    assignment_note = COALESCE(assignment_note || ' | ', '') || 'exclusive: revoke STUDENT (teacher account)'
WHERE ur.assignment_status = 'ACTIVE'
  AND ur.role_id = (SELECT id FROM roles WHERE role_name = 'STUDENT')
  AND EXISTS (
      SELECT 1 FROM user_roles ut
      JOIN roles rt ON rt.id = ut.role_id
      WHERE ut.user_id = ur.user_id AND ut.assignment_status = 'ACTIVE' AND rt.role_name = 'TEACHER'
  )
  AND NOT EXISTS (
      SELECT 1 FROM user_roles ua
      JOIN roles ra ON ra.id = ua.role_id
      WHERE ua.user_id = ur.user_id AND ua.assignment_status = 'ACTIVE' AND ra.role_name = 'ADMIN'
  );
