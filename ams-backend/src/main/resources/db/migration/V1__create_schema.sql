-- ============================================================
-- V1__create_schema.sql
-- AMS – Assignment Management System – Initial Schema
-- ============================================================

-- IDENTITY & ACCESS

CREATE TABLE roles (
    id          BIGSERIAL    PRIMARY KEY,
    role_name   VARCHAR(20)  NOT NULL UNIQUE
                             CHECK (role_name IN ('ADMIN','EXPERT','TEACHER','STUDENT')),
    description VARCHAR(500),
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE TABLE users (
    id             BIGSERIAL    PRIMARY KEY,
    username       VARCHAR(50)  NOT NULL UNIQUE,
    email          VARCHAR(255) NOT NULL UNIQUE,
    password       VARCHAR(255) NOT NULL,
    full_name      VARCHAR(255) NOT NULL,
    account_status VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE'
                                CHECK (account_status IN ('ACTIVE','INACTIVE','SUSPENDED')),
    created_at     TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE user_roles (
    id                BIGSERIAL   PRIMARY KEY,
    user_id           BIGINT      NOT NULL REFERENCES users(id),
    role_id           BIGINT      NOT NULL REFERENCES roles(id),
    assigned_at       TIMESTAMP   NOT NULL DEFAULT NOW(),
    assignment_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
                                  CHECK (assignment_status IN ('ACTIVE','REVOKED')),
    assignment_note   VARCHAR(500)
);

-- GOVERNANCE

CREATE TABLE system_configurations (
    id                  BIGSERIAL    PRIMARY KEY,
    configuration_name  VARCHAR(100) NOT NULL UNIQUE,
    business_value      TEXT,
    effective_status    VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE'
                                    CHECK (effective_status IN ('ACTIVE','INACTIVE')),
    last_reviewed_at    TIMESTAMP
);

CREATE TABLE audit_logs (
    id                 BIGSERIAL    PRIMARY KEY,
    actor_id           BIGINT       REFERENCES users(id) ON DELETE SET NULL,
    action             VARCHAR(100) NOT NULL,
    resource_type      VARCHAR(50)  NOT NULL,
    resource_reference VARCHAR(255),
    occurred_at        TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ACADEMIC & ASSIGNMENT

CREATE TABLE subjects (
    id           BIGSERIAL    PRIMARY KEY,
    subject_code VARCHAR(20)  NOT NULL UNIQUE,
    subject_name VARCHAR(255) NOT NULL,
    description  TEXT,
    status       VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE'
                             CHECK (status IN ('ACTIVE','INACTIVE'))
);

CREATE TABLE subject_classes (
    id         BIGSERIAL    PRIMARY KEY,
    subject_id BIGINT       NOT NULL REFERENCES subjects(id),
    expert_id  BIGINT       REFERENCES users(id),
    teacher_id BIGINT       REFERENCES users(id),
    class_code VARCHAR(20)  NOT NULL UNIQUE,
    class_name VARCHAR(255) NOT NULL,
    term       VARCHAR(20)  NOT NULL
);

CREATE TABLE assignment_templates (
    id               BIGSERIAL    PRIMARY KEY,
    subject_id       BIGINT       NOT NULL REFERENCES subjects(id),
    expert_id        BIGINT       NOT NULL REFERENCES users(id),
    title            VARCHAR(255) NOT NULL,
    instructions     TEXT,
    default_due_rule VARCHAR(255),
    UNIQUE (subject_id, title)
);

CREATE TABLE assignments (
    id           BIGSERIAL    PRIMARY KEY,
    teacher_id   BIGINT       NOT NULL REFERENCES users(id),
    template_id  BIGINT       REFERENCES assignment_templates(id),
    title        VARCHAR(255) NOT NULL,
    instructions TEXT,
    due_at       TIMESTAMP    NOT NULL
);

CREATE TABLE assignment_classes (
    id                BIGSERIAL   PRIMARY KEY,
    assignment_id     BIGINT      NOT NULL REFERENCES assignments(id),
    subject_class_id  BIGINT      NOT NULL REFERENCES subject_classes(id),
    allocated_at      TIMESTAMP   NOT NULL DEFAULT NOW(),
    allocation_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
                                  CHECK (allocation_status IN ('ACTIVE','CANCELLED')),
    class_note        TEXT,
    UNIQUE (assignment_id, subject_class_id)
);

-- REGISTRATION, SUBMISSION & ASSESSMENT

CREATE TABLE class_registrations (
    id                     BIGSERIAL    PRIMARY KEY,
    student_id             BIGINT       NOT NULL REFERENCES users(id),
    subject_class_id       BIGINT       NOT NULL REFERENCES subject_classes(id),
    registered_at          TIMESTAMP    NOT NULL DEFAULT NOW(),
    registration_reference VARCHAR(100) NOT NULL UNIQUE,
    status                 VARCHAR(30)  NOT NULL DEFAULT 'PENDING_PAYMENT'
                                        CHECK (status IN ('PENDING_PAYMENT','ACTIVE','CANCELLED')),
    activated_at           TIMESTAMP,
    UNIQUE (student_id, subject_class_id)
);

CREATE TABLE payment_transactions (
    id                   BIGSERIAL      PRIMARY KEY,
    class_registration_id BIGINT        NOT NULL REFERENCES class_registrations(id),
    provider             VARCHAR(20)    NOT NULL DEFAULT 'VNPAY',
    provider_reference   VARCHAR(255),
    amount               DECIMAL(15,2)  NOT NULL,
    transaction_status   VARCHAR(20)    NOT NULL DEFAULT 'PENDING'
                                        CHECK (transaction_status IN ('PENDING','SUCCESS','FAILED','REFUNDED')),
    created_at           TIMESTAMP      NOT NULL DEFAULT NOW(),
    UNIQUE (provider, provider_reference)
);

CREATE TABLE submissions (
    id                    BIGSERIAL    PRIMARY KEY,
    class_registration_id BIGINT       NOT NULL REFERENCES class_registrations(id),
    assignment_id         BIGINT       NOT NULL REFERENCES assignments(id),
    submitted_at          TIMESTAMP    NOT NULL DEFAULT NOW(),
    secure_file_reference VARCHAR(1000),
    file_metadata         TEXT,
    submission_status     VARCHAR(20)  NOT NULL DEFAULT 'DRAFT'
                                       CHECK (submission_status IN ('DRAFT','SUBMITTED','LATE','GRADED')),
    UNIQUE (class_registration_id, assignment_id)
);

CREATE TABLE assignment_evaluations (
    id               BIGSERIAL     PRIMARY KEY,
    submission_id    BIGINT        NOT NULL UNIQUE REFERENCES submissions(id),
    evaluator_id     BIGINT        NOT NULL REFERENCES users(id),
    score            DECIMAL(5,2),
    feedback         TEXT,
    evaluation_status VARCHAR(20)  NOT NULL DEFAULT 'PENDING'
                                   CHECK (evaluation_status IN ('PENDING','COMPLETED','APPEALED'))
);

-- INDEXES

CREATE INDEX idx_user_roles_user_id         ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id         ON user_roles(role_id);
CREATE INDEX idx_subject_classes_subject_id ON subject_classes(subject_id);
CREATE INDEX idx_subject_classes_teacher_id ON subject_classes(teacher_id);
CREATE INDEX idx_assignments_teacher_id     ON assignments(teacher_id);
CREATE INDEX idx_class_registrations_student_id ON class_registrations(student_id);
CREATE INDEX idx_class_registrations_class_id   ON class_registrations(subject_class_id);
CREATE INDEX idx_submissions_registration_id    ON submissions(class_registration_id);
CREATE INDEX idx_submissions_assignment_id      ON submissions(assignment_id);
CREATE INDEX idx_audit_logs_actor_id            ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_occurred_at         ON audit_logs(occurred_at DESC);
