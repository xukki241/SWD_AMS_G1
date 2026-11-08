"use client"

import { useQuery } from "@tanstack/react-query"
import { FileText } from "lucide-react"
import { submissionService } from "@/services/submission.service"
import { useI18n } from "@/i18n"

export default function SubmissionHistoryPage() {
  const { t, formatDateTime } = useI18n()
  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ["student-submissions"],
    queryFn: submissionService.getMySubmissions,
  })

  return (
    <main className="mx-auto max-w-4xl space-y-5 p-6">
      <header>
        <h1 className="text-2xl font-semibold">
          {t("dashboard.student.submissionsPage.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("dashboard.student.submissionsPage.subtitle")}
        </p>
      </header>

      {isLoading ? (
        <p>{t("dashboard.student.submissionsPage.loading")}</p>
      ) : submissions.length === 0 ? (
        <p className="rounded-xl border p-8 text-center text-muted-foreground">
          {t("dashboard.student.submissionsPage.empty")}
        </p>
      ) : (
        <div className="space-y-3">
          {[...submissions]
            .sort(
              (a, b) =>
                new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
            )
            .map((s) => (
              <article key={s.id} className="space-y-3 rounded-xl border bg-card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-medium">{s.assignmentTitle}</h2>
                    <p className="text-sm text-muted-foreground">
                      {t("dashboard.student.submissionsPage.submittedAt", {
                        date: formatDateTime(s.submittedAt),
                      })}
                    </p>
                  </div>
                  <span className="rounded-full bg-muted px-3 py-1 text-xs">
                    {s.evaluation?.published || s.submissionStatus === "GRADED"
                      ? t("dashboard.student.submissionsPage.published")
                      : t("dashboard.student.submissionsPage.grading")}
                  </span>
                </div>
                {s.secureFileReference && (
                  <a
                    href={s.secureFileReference}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary"
                  >
                    <FileText className="h-4 w-4" />
                    {t("dashboard.student.submissionsPage.viewFile")}
                  </a>
                )}
                {s.evaluation?.published && (
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="font-semibold">
                      {t("dashboard.student.submissionsPage.score", {
                        score: s.evaluation.score ?? "—",
                      })}
                    </p>
                    {s.evaluation.feedback && (
                      <p className="mt-1 whitespace-pre-line text-sm">
                        {s.evaluation.feedback}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-muted-foreground">
                      {s.evaluation.viewedAt
                        ? t("dashboard.student.submissionsPage.viewed")
                        : t("dashboard.student.submissionsPage.opened")}
                    </p>
                  </div>
                )}
              </article>
            ))}
        </div>
      )}
    </main>
  )
}
