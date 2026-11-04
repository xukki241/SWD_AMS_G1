import { translate, type TranslationKey } from "./runtime"

/** Exact English API messages emitted by the backend. */
const EXACT: Record<string, TranslationKey> = {
  "Invalid username or password": "errors.invalidCredentials",
  "Account is suspended. Contact an administrator.": "errors.accountSuspended",
  "Access denied": "errors.forbidden",
  "Course code already exists": "errors.courseCodeExists",
  "Cannot delete this course because it already has enrollments":
    "errors.cannotDeleteWithEnrollments",
  "Status must be DRAFT or PUBLISHED": "errors.statusMustBeDraftOrPublished",
  "Only the course owner or an administrator can access this course":
    "errors.onlyOwnerCanAccess",
  "Thumbnail must be 5MB or smaller": "errors.thumbnailTooLarge",
  "Thumbnail must be a PNG or JPG image": "errors.thumbnailType",
  "Could not read the thumbnail": "errors.thumbnailReadFailed",
  "Could not upload thumbnail": "errors.thumbnailUploadFailed",
  "AI is not configured. Ask an administrator to set the GEMINI_API_KEY environment variable.":
    "errors.aiNotConfigured",
  "AI quota exceeded. Please wait a moment and try again.": "errors.aiQuota",
  "The AI request was rejected. Check that GEMINI_API_KEY is valid.": "errors.aiInvalidKey",
  "The AI request timed out. Please try again.": "errors.aiTimeout",
  "The AI service is unavailable. Please try again.": "errors.aiUnavailable",
  "The AI returned an empty outline. Please try again.": "errors.aiEmpty",
  "The AI response was not valid JSON. Please regenerate the outline.": "errors.aiInvalidJson",
  "The AI response could not be understood. Please regenerate the outline.":
    "errors.aiUnreadable",
  "The AI did not return any modules. Please regenerate the outline.": "errors.aiNoModules",
  "The AI outline contains a module without a title. Please regenerate.":
    "errors.aiModuleNoTitle",
  "The AI outline contains a lesson without a title. Please regenerate.":
    "errors.aiLessonNoTitle",
  "The outline has no modules to save": "errors.aiNothingToSave",
  "Enrollment is already paid and active": "errors.enrollmentAlreadyPaid",
  "Enrollment is not active. Please complete tuition payment first.":
    "errors.enrollmentNotActive",
  "You are already enrolled in this course": "errors.alreadyEnrolled",
  "Only the assignment owner can modify this assignment": "errors.onlyOwnerCanModifyAssignment",
  "Only the course instructor can add assignments to this course":
    "errors.onlyInstructorCanAddAssignment",
  "You can only unsubmit your own work": "errors.onlyOwnerCanUnsubmit",
  "You can only submit for your own enrollment": "errors.canOnlySubmitOwn",
  "You can only view evaluations of your own submissions": "errors.canOnlyViewOwnEvaluations",
  "This submission has already been graded and cannot be re-graded": "errors.alreadyGraded",
  "Graded work cannot be unsubmitted": "errors.gradedCannotUnsubmit",
  "PayOS is not configured (missing client id / api key / checksum key)":
    "errors.payosNotConfigured",
  "SePay is not configured (merchant or secret key).": "errors.sepayNotConfigured",
  "Validation failed": "errors.validationFailed",

  // Bean-validation messages (see ams-backend .../dto)
  "At least one module is required": "errors.validation.atLeastOneModule",
  "Category is required": "errors.validation.categoryRequired",
  "Course code is required": "errors.validation.courseCodeRequired",
  "Course code may contain only letters, numbers, hyphens and underscores":
    "errors.validation.courseCodePattern",
  "Course code must be 50 characters or fewer": "errors.validation.courseCodeTooLong",
  "Course title is required": "errors.validation.courseTitleRequired",
  "Course title must be 255 characters or fewer": "errors.validation.courseTitleTooLong",
  "Description is required": "errors.validation.descriptionRequired",
  "Duration is required": "errors.validation.durationRequired",
  "Duration is too large": "errors.validation.durationTooLarge",
  "Duration must be 0 or greater": "errors.validation.durationInvalid",
  "Email is required": "errors.validation.emailRequired",
  "Full name is required": "errors.validation.fullNameRequired",
  "Invalid email format": "errors.validation.emailInvalid",
  "Lesson ids are required": "errors.validation.lessonIdsRequired",
  "Lesson title is required": "errors.validation.lessonTitleRequired",
  "Lesson title must be 255 characters or fewer": "errors.validation.lessonTitleTooLong",
  "Lesson type is required": "errors.validation.lessonTypeRequired",
  "Level is too long": "errors.validation.levelTooLong",
  "Module count must be 12 or fewer": "errors.validation.moduleCountTooLarge",
  "Module count must be at least 1": "errors.validation.moduleCountTooSmall",
  "Module id is required": "errors.validation.moduleIdRequired",
  "Module lessons are required": "errors.validation.moduleLessonsRequired",
  "Module title is required": "errors.validation.moduleTitleRequired",
  "Module title must be 255 characters or fewer": "errors.validation.moduleTitleTooLong",
  "Modules are required": "errors.validation.modulesRequired",
  "Password is required": "errors.validation.passwordRequired",
  "Password must be at least 6 characters": "errors.validation.passwordTooShort",
  "Price is required": "errors.validation.priceRequired",
  "Price must be greater than or equal to 0": "errors.validation.priceInvalid",
  "Price supports up to 2 decimal places": "errors.validation.priceDecimals",
  "Thumbnail URL is too long": "errors.validation.thumbnailUrlTooLong",
  "Topic is too long": "errors.validation.topicTooLong",
  "Username is required": "errors.validation.usernameRequired",
}

const PATTERNS: Array<[RegExp, TranslationKey]> = [
  [/^Access denied/i, "errors.forbidden"],
  [/^Course not found/i, "errors.courseNotFound"],
  [/^Category not found/i, "errors.categoryNotFound"],
  [/^Module not found/i, "errors.moduleNotFound"],
  [/^Lesson not found/i, "errors.lessonNotFound"],
  [/^Assignment not found/i, "errors.assignmentNotFound"],
  [/^Submission not found/i, "errors.submissionNotFound"],
  [/^Evaluation not found/i, "errors.evaluationNotFound"],
  [/^Username '.*' already exists/i, "errors.usernameExists"],
  [/^Email '.*' already exists/i, "errors.emailExists"],
  [/already exists/i, "errors.generic"],
  [/^The configured Gemini model was not found/i, "errors.aiModelNotFound"],
  [/^The AI service returned an error/i, "errors.aiUnavailable"],
]

/** Map a canonical English API message to the active locale (null when unknown). */
export function localizeApiMessage(message?: string | null): string | null {
  if (!message) return null
  const exact = EXACT[message.trim()]
  if (exact) return translate(exact)
  for (const [pattern, key] of PATTERNS) {
    if (pattern.test(message)) return translate(key)
  }
  return null
}

export function localizeValidationErrors(
  errors?: Record<string, string> | null
): Record<string, string> {
  if (!errors) return {}
  return Object.fromEntries(
    Object.entries(errors).map(([field, message]) => [
      field,
      localizeApiMessage(message) ?? message,
    ])
  )
}

type ApiErrorShape = {
  code?: string
  message?: string
  response?: {
    status?: number
    data?: {
      message?: string
      validationErrors?: Record<string, string>
    }
  }
}

function asApiError(error: unknown): ApiErrorShape {
  return (error ?? {}) as ApiErrorShape
}

/**
 * One entry point for showing API failures: prefers a translated backend
 * message, then status-based copy, then the caller's localized fallback.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  const err = asApiError(error)
  const status = err.response?.status
  const message = err.response?.data?.message

  const localized = localizeApiMessage(message)
  if (localized) return localized

  if (err.code === "ECONNABORTED" || (err.message ?? "").toLowerCase().includes("timeout")) {
    return translate("errors.network")
  }
  if (status === 401) return translate("errors.unauthorized")
  if (status === 403) return translate("errors.forbidden")
  if (status === 404) return translate("errors.notFound")
  if (status !== undefined && status >= 500) return fallback
  return message || fallback
}

export function getValidationErrors(error: unknown): Record<string, string> {
  const err = asApiError(error)
  return localizeValidationErrors(err.response?.data?.validationErrors)
}
