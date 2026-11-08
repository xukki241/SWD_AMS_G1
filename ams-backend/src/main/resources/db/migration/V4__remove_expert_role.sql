-- Move existing expert accounts to teacher so they keep access after the role is removed.
UPDATE user_roles
SET role_id = (SELECT id FROM roles WHERE role_name = 'TEACHER')
WHERE role_id = (SELECT id FROM roles WHERE role_name = 'EXPERT');

DELETE FROM roles WHERE role_name = 'EXPERT';

ALTER TABLE roles DROP CONSTRAINT IF EXISTS roles_role_name_check;
ALTER TABLE roles ADD CONSTRAINT roles_role_name_check
    CHECK (role_name IN ('ADMIN', 'TEACHER', 'STUDENT'));

-- Template ownership is independent of a role; keep existing templates and authors.
ALTER TABLE assignment_templates RENAME COLUMN expert_id TO created_by_id;
