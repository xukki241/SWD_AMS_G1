-- ============================================================
-- AMS – CREATE SCHEMA (final state after Flyway V1–V11)
-- For grading / DBeaver / pgAdmin. Docker normally applies the
-- same structure via Flyway on backend startup — do not run both
-- against the same empty database.
-- ============================================================

-- IDENTITY & ACCESS

CREATE TABLE roles (
    id          BIGSERIAL    PRIMARY KEY,
    role_name   VARCHAR(20)  NOT NULL UNIQUE
                             CHECK (role_name IN ('ADMIN','TEACHER','STUDENT')),
    description VARCHAR(500),
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE TABLE users (
    id                     BIGSERIAL    PRIMARY KEY,
    username               VARCHAR(50)  NOT NULL UNIQUE,
    email                  VARCHAR(255) NOT NULL UNIQUE,
    password               VARCHAR(255) NOT NULL,
    full_name              VARCHAR(255) NOT NULL,
    account_status         VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE'
                                        CHECK (account_status IN ('ACTIVE','INACTIVE','SUSPENDED')),
    created_at             TIMESTAMP    NOT NULL DEFAULT NOW(),
    email_verified         BOOLEAN      NOT NULL DEFAULT TRUE,
    failed_login_attempts  INTEGER      NOT NULL DEFAULT 0,
    avatar_url             VARCHAR(1000),
    onboarding_completed   BOOLEAN      NOT NULL DEFAULT FALSE
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

CREATE TABLE auth_tokens (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    token_type VARCHAR(20) NOT NULL CHECK (token_type IN ('VERIFY_EMAIL', 'RESET_PASSWORD')),
    expires_at TIMESTAMP NOT NULL,
    used_at    TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_auth_tokens_user_type ON auth_tokens(user_id, token_type);

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

-- ACADEMIC

CREATE TABLE subjects (
    id           BIGSERIAL    PRIMARY KEY,
    subject_code VARCHAR(20)  NOT NULL UNIQUE,
    subject_name VARCHAR(255) NOT NULL,
    description  TEXT,
    status       VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE'
                             CHECK (status IN ('ACTIVE','INACTIVE'))
);

-- COURSE CATALOG

CREATE TABLE categories (
    id   BIGSERIAL    PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE courses (
    id                       BIGSERIAL      PRIMARY KEY,
    title                    VARCHAR(255)   NOT NULL,
    code                     VARCHAR(50)    NOT NULL,
    category_id              BIGINT         NOT NULL REFERENCES categories(id),
    description              TEXT           NOT NULL,
    thumbnail_url            VARCHAR(1000),
    price                    DECIMAL(15,2)  NOT NULL DEFAULT 0 CHECK (price >= 0),
    is_free                  BOOLEAN        NOT NULL DEFAULT FALSE,
    status                   VARCHAR(20)    NOT NULL DEFAULT 'DRAFT'
                                            CHECK (status IN ('DRAFT','PUBLISHED')),
    difficulty_level         VARCHAR(20)    NOT NULL DEFAULT 'BEGINNER'
                                            CHECK (difficulty_level IN ('BEGINNER','INTERMEDIATE','ADVANCED')),
    about                    TEXT,
    what_students_will_learn TEXT,
    prerequisites            TEXT,
    instructor_id            BIGINT         NOT NULL REFERENCES users(id),
    created_at               TIMESTAMP      NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMP      NOT NULL DEFAULT NOW(),
    deleted                  BOOLEAN        NOT NULL DEFAULT FALSE
);

CREATE UNIQUE INDEX uq_courses_code_active ON courses (code) WHERE deleted = FALSE;
CREATE INDEX idx_courses_instructor_id ON courses(instructor_id);
CREATE INDEX idx_courses_category_id   ON courses(category_id);
CREATE INDEX idx_courses_status        ON courses(status);
CREATE INDEX idx_courses_deleted       ON courses(deleted);

CREATE TABLE modules (
    id          BIGSERIAL    PRIMARY KEY,
    course_id   BIGINT       NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title       VARCHAR(255) NOT NULL,
    order_index INT          NOT NULL DEFAULT 0 CHECK (order_index >= 0)
);

CREATE INDEX idx_modules_course_id ON modules(course_id);
CREATE INDEX idx_modules_order     ON modules(course_id, order_index);

CREATE TABLE lessons (
    id          BIGSERIAL   PRIMARY KEY,
    module_id   BIGINT      NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    title       VARCHAR(255) NOT NULL,
    type        VARCHAR(20) NOT NULL DEFAULT 'READING'
                            CHECK (type IN ('VIDEO','READING','ASSIGNMENT')),
    duration    INT         NOT NULL DEFAULT 0 CHECK (duration >= 0),
    status      VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
                            CHECK (status IN ('DRAFT','PUBLISHED')),
    order_index INT         NOT NULL DEFAULT 0 CHECK (order_index >= 0)
);

CREATE INDEX idx_lessons_module_id ON lessons(module_id);
CREATE INDEX idx_lessons_order     ON lessons(module_id, order_index);

-- ENROLLMENT + PAYMENT

CREATE TABLE course_enrollments (
    id                     BIGSERIAL      PRIMARY KEY,
    course_id              BIGINT         NOT NULL REFERENCES courses(id),
    student_id             BIGINT         NOT NULL REFERENCES users(id),
    registration_reference VARCHAR(100)   NOT NULL UNIQUE,
    status                 VARCHAR(30)    NOT NULL DEFAULT 'PENDING_PAYMENT'
                                          CHECK (status IN ('PENDING_PAYMENT','ACTIVE','CANCELLED','COMPLETED')),
    amount                 DECIMAL(15,2)  NOT NULL DEFAULT 0,
    registered_at          TIMESTAMP      NOT NULL DEFAULT NOW(),
    activated_at           TIMESTAMP,
    UNIQUE (course_id, student_id)
);

CREATE INDEX idx_course_enrollments_course_id  ON course_enrollments(course_id);
CREATE INDEX idx_course_enrollments_student_id ON course_enrollments(student_id);

CREATE TABLE assignment_templates (
    id               BIGSERIAL    PRIMARY KEY,
    subject_id       BIGINT       NOT NULL REFERENCES subjects(id),
    created_by_id    BIGINT       NOT NULL REFERENCES users(id),
    title            VARCHAR(255) NOT NULL,
    instructions     TEXT,
    default_due_rule VARCHAR(255),
    UNIQUE (subject_id, title)
);

CREATE TABLE assignments (
    id                BIGSERIAL      PRIMARY KEY,
    course_id         BIGINT         NOT NULL REFERENCES courses(id),
    teacher_id        BIGINT         NOT NULL REFERENCES users(id),
    template_id       BIGINT         REFERENCES assignment_templates(id),
    title             VARCHAR(255)   NOT NULL,
    instructions      TEXT,
    topic             VARCHAR(100),
    max_score         DECIMAL(5,2)   NOT NULL DEFAULT 10 CHECK (max_score > 0),
    due_at            TIMESTAMP      NOT NULL,
    status            VARCHAR(20)    NOT NULL DEFAULT 'PUBLISHED'
                                     CHECK (status IN ('DRAFT', 'PUBLISHED')),
    rubric            TEXT,
    attachment_url    VARCHAR(1000),
    attachment_metadata TEXT
);

CREATE INDEX idx_assignments_course_id  ON assignments(course_id);
CREATE INDEX idx_assignments_teacher_id ON assignments(teacher_id);

CREATE TABLE payment_transactions (
    id                   BIGSERIAL      PRIMARY KEY,
    course_enrollment_id BIGINT         NOT NULL REFERENCES course_enrollments(id),
    provider             VARCHAR(20)    NOT NULL DEFAULT 'VNPAY',
    provider_reference   VARCHAR(255),
    amount               DECIMAL(15,2)  NOT NULL,
    transaction_status   VARCHAR(20)    NOT NULL DEFAULT 'PENDING'
                                        CHECK (transaction_status IN ('PENDING','SUCCESS','FAILED','REFUNDED')),
    created_at           TIMESTAMP      NOT NULL DEFAULT NOW(),
    UNIQUE (provider, provider_reference)
);

CREATE INDEX idx_payment_transactions_enrollment_id ON payment_transactions(course_enrollment_id);

CREATE TABLE submissions (
    id                    BIGSERIAL    PRIMARY KEY,
    course_enrollment_id  BIGINT       NOT NULL REFERENCES course_enrollments(id),
    assignment_id         BIGINT       NOT NULL REFERENCES assignments(id),
    submitted_at          TIMESTAMP    NOT NULL DEFAULT NOW(),
    secure_file_reference VARCHAR(1000),
    file_metadata         TEXT,
    submission_status     VARCHAR(20)  NOT NULL DEFAULT 'DRAFT'
                                       CHECK (submission_status IN ('DRAFT','SUBMITTED','LATE','GRADED')),
    answer_text           TEXT,
    UNIQUE (course_enrollment_id, assignment_id)
);

CREATE INDEX idx_submissions_enrollment_id ON submissions(course_enrollment_id);
CREATE INDEX idx_submissions_assignment_id ON submissions(assignment_id);

CREATE TABLE assignment_evaluations (
    id                BIGSERIAL     PRIMARY KEY,
    submission_id     BIGINT        NOT NULL UNIQUE REFERENCES submissions(id),
    evaluator_id      BIGINT        REFERENCES users(id),
    score             DECIMAL(5,2),
    feedback          TEXT,
    evaluation_status VARCHAR(20)   NOT NULL DEFAULT 'PENDING'
                                    CHECK (evaluation_status IN ('PENDING','COMPLETED','APPEALED')),
    ai_draft_score    NUMERIC(5,2),
    ai_draft_feedback TEXT,
    is_published      BOOLEAN       NOT NULL DEFAULT TRUE,
    viewed_at         TIMESTAMP
);

CREATE INDEX idx_user_roles_user_id      ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id      ON user_roles(role_id);
CREATE INDEX idx_audit_logs_actor_id     ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_occurred_at  ON audit_logs(occurred_at DESC);
