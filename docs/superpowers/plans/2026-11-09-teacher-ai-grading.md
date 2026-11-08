# Teacher-triggered AI Grading Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver teacher-triggered, rubric-based Gemini draft grading for individual and selected submissions, with exclusive review claims and teacher-controlled publication.

**Architecture:** Keep Gemini calls server-side behind `AiClient`. Store structured rubric criteria with assignments, draft/final criterion scores with the existing one-to-one evaluation, and an expiring claim on each submission. Expose claim, AI draft, save, and publish operations through Spring APIs; connect them to the existing teacher classwork list and grade dialog.

**Tech Stack:** Java 21, Spring Boot 3.2, PostgreSQL/Flyway, Next.js 14, TypeScript, TanStack Query, existing `AiClient`/`GeminiAiClient`.

**Spec:** `docs/superpowers/specs/2026-11-09-teacher-ai-grading-design.md`

## Global Constraints

- AI grading is teacher-triggered and never publishes automatically.
- Gemini credentials stay server-side; use the existing configurable model and timeout.
- Only the course owner, assignment teacher, or admin may grade.
- Legacy free-text rubrics remain readable and are not silently converted into criterion scores.
- Batch requests process at most five submissions per request, report per-submission results, and never publish grades automatically.
- Existing Flyway migrations V1–V12 remain immutable; add a new migration.
- Do not add dependencies, queue infrastructure, or a new AI provider.
- Per instruction, do not add or execute tests as part of this run unless the user asks for test/verification.

## Review Focus

- Legacy assignments with no structured rubric must remain manually gradable and must allow teachers to add criteria before AI grading.
- A claim must be atomic under two simultaneous teacher opens, renew while open, release on close, and become available after expiry.
- Gemini JSON with missing, duplicate, unknown, invalid, or out-of-range criterion values must not overwrite a saved draft.
- Batch grading must preserve successes and clearly report failures/conflicts for other selected submissions.
- A student must not see a draft, and publish must not allow invalid or already-final grades.

---

### Task 1: Structured rubric data and authoring

**Files:**
- Modify: `ams-backend/src/main/java/com/ams/entity/Assignment.java`
- Modify: `ams-backend/src/main/java/com/ams/dto/AssignmentDTO.java`
- Modify: `ams-backend/src/main/java/com/ams/service/AssignmentService.java`
- Modify: `ams-frontend/src/types/index.ts`
- Modify: `ams-frontend/src/services/assignment.service.ts`
- Modify: `ams-frontend/src/components/classroom/CreateAssignmentDialog.tsx`
- Modify: `ams-frontend/src/components/classroom/TeacherClassworkPanel.tsx`
- Create: `ams-frontend/src/components/classroom/RubricCriteriaEditor.tsx`
- Create: `ams-frontend/src/components/classroom/EditRubricDialog.tsx`
- Modify: `ams-frontend/src/i18n/messages/en/classroom.ts`
- Modify: `ams-frontend/src/i18n/messages/vi/classroom.ts`
- Create: `ams-backend/src/main/resources/db/migration/V13__assignment_rubric_criteria.sql`

**Interfaces:**
- Assignment criteria: `{ id: string, name: string, description: string, maxScore: number }[]`.
- Sum of criterion max scores must equal assignment max score within 0.01; each max score is positive.
- Assignment create/update responses expose `rubricCriteria`; legacy `rubric` remains unchanged.

- [x] Add a nullable JSONB `rubric_criteria` column through V13 and map it in `Assignment`.
- [x] Add DTO validation and service validation for nonempty criterion IDs/names, positive maximums, unique IDs, and total equal to assignment max score.
- [x] Add a create/edit rubric criteria editor with add/remove rows; permit editing criteria on existing assignments and preserve the legacy text field.
- [x] Keep manual total-only grading available when there are no structured criteria.

### Task 2: Submission review claims

**Files:**
- Modify: `ams-backend/src/main/java/com/ams/entity/Submission.java`
- Modify: `ams-backend/src/main/java/com/ams/repository/SubmissionRepository.java`
- Modify: `ams-backend/src/main/java/com/ams/service/SubmissionService.java`
- Modify: `ams-backend/src/main/java/com/ams/controller/SubmissionController.java`
- Modify: `ams-backend/src/main/java/com/ams/dto/SubmissionDTO.java`
- Modify: `ams-frontend/src/services/submission.service.ts`
- Modify: `ams-frontend/src/components/classroom/TeacherClassworkPanel.tsx`
- Modify: `ams-frontend/src/components/classroom/GradeDialog.tsx`
- Create: `ams-backend/src/main/resources/db/migration/V14__submission_grading_claim.sql`

**Interfaces:**
- Claim operations: acquire, renew, release by submission ID; acquire returns current owner/expiry or a conflict.
- Claims last five minutes, renew every minute while the grading view is open, and require current owner for save/publish.

- [x] Add claim owner and expiry columns and an atomic repository claim operation that accepts unclaimed, expired, or same-owner claims only.
- [x] Add authorized acquire/renew/release endpoints and reject claims on published submissions.
- [x] Acquire before opening GradeDialog; show a clear conflict state if another teacher owns the live claim.
- [x] Renew while open and release on dialog close; rely on expiry after tab/browser termination.

### Task 3: Teacher-triggered Gemini draft grading

**Files:**
- Create: `ams-backend/src/main/java/com/ams/service/AiGradingService.java`
- Create: `ams-backend/src/main/java/com/ams/service/AiDraftPersistenceService.java`
- Create: `ams-backend/src/main/java/com/ams/controller/AiGradingController.java`
- Create: `ams-backend/src/main/java/com/ams/dto/AiGradingDTO.java`
- Modify: `ams-backend/src/main/java/com/ams/entity/AssignmentEvaluation.java`
- Modify: `ams-backend/src/main/java/com/ams/dto/EvaluationDTO.java`
- Modify: `ams-backend/src/main/java/com/ams/service/SubmissionService.java`
- Modify: `ams-backend/src/main/java/com/ams/service/FileUploadService.java`
- Modify: `ams-frontend/src/services/evaluation.service.ts`
- Modify: `ams-frontend/src/types/index.ts`
- Modify: `ams-frontend/src/components/classroom/GradeDialog.tsx`
- Create: `ams-frontend/src/components/classroom/aiGradingSupport.ts`
- Modify: `ams-frontend/src/i18n/messages/en/classroom.ts`
- Modify: `ams-frontend/src/i18n/messages/vi/classroom.ts`
- Create: `ams-backend/src/main/resources/db/migration/V15__evaluation_criterion_scores.sql`

**Interfaces:**
- AI response JSON: `{ criteria: [{ id, score, feedback }], totalScore, feedback }`.
- Draft data is stored separately from final teacher score/criteria and is not student-visible.

- [x] Remove the automatic Gemini call from student submission while retaining answer/file persistence.
- [x] Add explicit authorized AI-grade endpoint requiring the live claim and structured rubric.
- [x] Prompt Gemini with assignment title/instructions, rubric criteria, max score, and submitted answer/file.
- [x] Parse and validate strict JSON, exact criterion set, each score in `[0, criterion.maxScore]`, total equal to criterion sum within 0.01 and within assignment max, and required feedback fields.
- [x] Save valid results into AI draft total, feedback, and criteria without modifying final teacher grade; return helpful errors without overwriting a prior draft.
- [x] Add a **Grade with AI** action in the teacher review dialog and load the validated draft into editable fields.

### Task 4: Teacher save and publish integrity

**Files:**
- Modify: `ams-backend/src/main/java/com/ams/service/EvaluationService.java`
- Modify: `ams-backend/src/main/java/com/ams/controller/EvaluationController.java`
- Modify: `ams-backend/src/main/java/com/ams/dto/EvaluationDTO.java`
- Modify: `ams-backend/src/main/java/com/ams/entity/AssignmentEvaluation.java`
- Modify: `ams-frontend/src/services/evaluation.service.ts`
- Modify: `ams-frontend/src/components/classroom/GradeDialog.tsx`

**Interfaces:**
- Save accepts final total, overall feedback, and optional criterion scores/feedback; publish continues to target one submission.
- Both operations require the active claim and teacher authorization.

- [x] Validate final score and criterion IDs/ranges/sum on the backend when saving, even if the grade is manual.
- [x] Update the existing one-to-one evaluation row rather than creating duplicates; reject edits after publication.
- [x] Require a saved, valid final evaluation for publish and revalidate all bounds before changing state.
- [x] Keep the status change, published flag, and submission graded state in one transaction; preserve the existing email notification behavior.
- [x] Keep unpublished draft/final evaluation details hidden from students.

### Task 5: Batch AI grading from classwork list

**Files:**
- Modify: `ams-frontend/src/components/classroom/TeacherClassworkPanel.tsx`
- Modify: `ams-frontend/src/services/evaluation.service.ts`
- Modify: `ams-backend/src/main/java/com/ams/controller/AiGradingController.java`
- Modify: `ams-backend/src/main/java/com/ams/service/AiGradingService.java`
- Modify: `ams-frontend/src/i18n/messages/en/classroom.ts`
- Modify: `ams-frontend/src/i18n/messages/vi/classroom.ts`

**Interfaces:**
- Batch request: selected submission IDs; response: per-ID `success` or `failure` with a user-safe reason.
- Batch operation performs AI drafts only and never saves final grades or publishes.

- [x] Add selection controls for submitted, not-yet-published rows and a batch **Grade with AI** action.
- [x] Process selected submissions independently, claiming each for the request and releasing after draft completion; skip live claims held by another teacher.
- [x] Limit each batch request to five submissions, mark unreadable file types before selection, and return per-submission results so one failure does not erase successful drafts.
- [x] Show a summary and per-row outcomes, then refresh the submissions query so teachers can open/edit successful drafts.

## Execution notes

- Implement tasks in dependency order (1 → 2 → 3 → 4 → 5).
- Preserve unrelated working-tree changes already present before this feature.
- Do not commit unless the user requests a commit.
