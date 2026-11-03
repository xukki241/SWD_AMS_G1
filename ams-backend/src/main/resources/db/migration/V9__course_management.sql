-- ============================================================
-- V9__course_management.sql
-- Manage Courses: categories, courses, modules, lessons.
-- Course -> Module -> Lesson with contiguous order_index per parent.
-- Courses are soft-deleted (deleted flag).
-- ============================================================

CREATE TABLE categories (
    id   BIGSERIAL    PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE courses (
    id                      BIGSERIAL      PRIMARY KEY,
    title                   VARCHAR(255)   NOT NULL,
    code                    VARCHAR(50)    NOT NULL UNIQUE,
    category_id             BIGINT         NOT NULL REFERENCES categories(id),
    description             TEXT           NOT NULL,
    thumbnail_url           VARCHAR(1000),
    price                   DECIMAL(15,2)  NOT NULL DEFAULT 0 CHECK (price >= 0),
    is_free                 BOOLEAN        NOT NULL DEFAULT FALSE,
    status                  VARCHAR(20)    NOT NULL DEFAULT 'DRAFT'
                                           CHECK (status IN ('DRAFT','PUBLISHED')),
    difficulty_level        VARCHAR(20)    NOT NULL DEFAULT 'BEGINNER'
                                           CHECK (difficulty_level IN ('BEGINNER','INTERMEDIATE','ADVANCED')),
    about                   TEXT,
    what_students_will_learn TEXT,
    prerequisites           TEXT,
    instructor_id           BIGINT         NOT NULL REFERENCES users(id),
    created_at              TIMESTAMP      NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP      NOT NULL DEFAULT NOW(),
    deleted                 BOOLEAN        NOT NULL DEFAULT FALSE
);

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

-- Minimal enrollment guard table. Course enrollment is outside this feature,
-- but deleting a course that already has enrollments must be blocked.
CREATE TABLE course_enrollments (
    id         BIGSERIAL   PRIMARY KEY,
    course_id  BIGINT      NOT NULL REFERENCES courses(id),
    student_id BIGINT      NOT NULL REFERENCES users(id),
    status     VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
                           CHECK (status IN ('ACTIVE','CANCELLED','COMPLETED')),
    created_at TIMESTAMP   NOT NULL DEFAULT NOW(),
    UNIQUE (course_id, student_id)
);

CREATE INDEX idx_course_enrollments_course_id ON course_enrollments(course_id);

INSERT INTO categories (name) VALUES
    ('Programming'),
    ('Web Development'),
    ('Database'),
    ('Software Engineering'),
    ('Data Science'),
    ('Mobile Development');
