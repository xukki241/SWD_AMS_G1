const landing = {
  brand: {
    name: "AMS",
    tagline: "Assignment Management System",
  },
  nav: {
    logIn: "Log in",
    signUp: "Sign up",
  },
  hero: {
    titlePrefix: "AMS",
    titleSuffix: " · your learning, organized",
    subtitle:
      "Enroll in a course, follow the lessons, submit your work, pay tuition — all in one place.",
    getStarted: "Get started",
    createStudentAccount: "Create a student account",
    footnote:
      "Published courses · VNPay & VietQR sandbox · lessons, assignments & grading",
  },
  catalog: {
    title: "Featured courses",
    subtitle: "Currently published courses. Log in as a student to enroll.",
    count: "{count} courses",
    emptyTitle: "No published courses yet",
    emptyDescription: "Teachers and experts publish courses that will appear here.",
    enroll: "Enroll",
    free: "Free",
  },
  difficulty: {
    BEGINNER: "Beginner",
    INTERMEDIATE: "Intermediate",
    ADVANCED: "Advanced",
  },
  footer: "AMS POC · SWD392 Group 1 · Demo only — payments run on sandbox providers",
}

export type LandingMessages = typeof landing
export default landing
