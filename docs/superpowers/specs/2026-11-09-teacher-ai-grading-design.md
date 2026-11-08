# Teacher-triggered AI grading design

## Intent

Let a teacher explicitly ask Gemini to draft a rubric-based grade for one or more student submissions. The teacher remains the decision maker: they can review and edit AI suggestions or grade manually, and only a teacher-published evaluation becomes visible to a student.

## Current state

- `SubmissionService` currently calls Gemini automatically when a student submits work.
- That path asks only for one overall score and concise feedback, and silently leaves no draft when AI parsing or generation fails.
- `GradeDialog` lets a teacher edit a suggested total and feedback, or enter them manually.
- `EvaluationService` validates teacher-entered total scores, saves an unpublished evaluation and publishes it with an email notification.
- `AssignmentEvaluation` is one-to-one with a submission, but opening the dialog does not claim/lock the submission.
- Assignment rubric is currently free text, so criterion scores and their bounds cannot be validated reliably.

## Goals

1. Remove automatic AI grading from student submission.
2. Add teacher-triggered Gemini grading for one submission and selected batches.
3. Represent rubric criteria and maximum points explicitly; have Gemini return per-criterion scores, criterion feedback, a total, and overall feedback.
4. Validate AI output shape, criterion identity/completeness, per-criterion score bounds, and total consistency/bounds before saving a draft.
5. Claim a submission when the teacher opens it so only one teacher can review it at a time; release on close and expire abandoned claims safely.
6. Keep manual grading available, allow editing AI drafts, publish only valid teacher-approved grades, and notify the student.
7. Preserve at most one evaluation record for each submission.

## Non-goals

- AI grades are never automatically published.
- No student-facing AI feedback before publication.
- No queue or background-worker infrastructure; batch requests process at most five submissions per request and report per-submission outcomes.
- Do not infer rubric criterion weights from legacy free-text rubric content.

## Behavior and decisions

### Rubric model

Add a structured list of criteria alongside the existing free-text rubric. Each criterion has a stable ID, name, description, and positive maximum score. Criterion maxima must sum to the assignment maximum score (within 0.01). Teachers can add or edit structured criteria on existing assignments as well as new ones until grading starts; after an evaluation exists, rubric changes are rejected so saved criterion IDs and marks stay meaningful. Existing legacy rubric text remains readable as context, but is not treated as structured scoring criteria; teachers must define criteria before using rubric-based AI grading. Manual total-only grading remains available for legacy assignments.

### Teacher-triggered AI

- Opening the teacher's grading view claims the submission for the current teacher.
- The view shows **Grade with AI** only when structured criteria are available. Manual grading is always available.
- The AI request includes assignment title/instructions/rubric/max score and the submitted text and/or supported file content.
- AI-readable files are PDF, images, plain text/CSV/Markdown, DOCX, PPTX, and ZIP archives containing text/source files. Legacy DOC/PPT and unknown formats remain manually gradable and are marked unsupported for AI before selection.
- Gemini returns strict JSON with each criterion ID, score, criterion feedback, total, and overall feedback.
- Backend validation rejects missing/duplicate/unknown criteria, nonnumeric or out-of-range scores, and a total that differs from the criterion sum or exceeds the assignment maximum.
- A valid result is saved only in draft fields. An invalid/unavailable result returns a useful error and does not alter a prior draft.
- Batch selection runs one request per submission, with per-item success/failure results. Each request takes and releases its claim independently; a submission already claimed by another teacher is skipped with an explicit conflict result.

### Claims and concurrency

Persist a claim owner and expiry on each submission. Claims last five minutes and are renewed every minute while the grading view is open. Claim acquisition is atomic and succeeds only if unclaimed, expired, or already owned by the requesting teacher. Save/publish operations require the live claim owner. Closing the view releases the claim; browser termination is handled by expiry. Published submissions cannot be claimed for editing.

Gemini calls run outside database transactions. Persisting a validated draft rechecks the live claim and current rubric in a short transaction. Batch requests process at most five submissions so a single HTTP request has a bounded wait.

### Review and publication

- AI and teacher-edited draft criteria/feedback are visible only to authorized teachers.
- The teacher may copy the AI draft into editable final fields or grade from scratch.
- Save draft validates the total and criterion scores, creates or updates the single evaluation row, and keeps it unpublished.
- Publish revalidates all score bounds and rubric consistency, requires a saved final grade, marks the evaluation published and submission graded in one transaction, then sends the existing grade notification.
- Student reads continue to expose evaluation data only after publication.
- Manual total-only grading is supported when no structured rubric is configured.

## Constraints

- Use the existing Next.js 14, TypeScript, Spring Boot 3.2, PostgreSQL/Flyway, TanStack Query, and `AiClient`/`GeminiAiClient` stack.
- Keep Gemini credentials server-side and use the existing configurable model and timeout.
- Keep course-owner/admin authorization for grading.
- Do not add a new AI SDK, queue, or external grading service.
- Existing V1–V12 migrations are immutable; schema changes use a new Flyway migration.
- Batch behavior must tolerate partial failures and must not publish any grades automatically.

## Files likely involved

- Backend: `Assignment`, `Submission`, `AssignmentEvaluation`, assignment/evaluation/submission DTOs and services, evaluation controller, repositories, and a new Flyway migration.
- Frontend: assignment rubric authoring, classroom types/services, `TeacherClassworkPanel`, `GradeDialog`, evaluation service, and Vietnamese/English classroom messages.
- Backend service tests and frontend checks should cover criteria validation, lock contention/expiry, AI draft persistence, manual grading, publish visibility, and partial batch outcomes.

## Open to implementation

- Exact endpoint names and JSON DTO names, following existing controller conventions.
- The API representation of criterion lists, provided stable IDs and decimal max scores are preserved end to end.
- The visual treatment of per-submission batch errors, provided each selected row exposes its outcome.
