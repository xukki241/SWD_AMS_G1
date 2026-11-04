const auth = {
  login: {
    title: "Sign in",
    subtitle: "Use your AMS account",
    username: "Username",
    password: "Password",
    usernamePlaceholder: "e.g. student1, teacher1, admin",
    submit: "Sign in",
    submitting: "Signing in…",
    noAccount: "New to AMS?",
    createOne: "Create account",
    demoTitle: "Demo accounts · password Password@123",
    errorFallback: "Invalid credentials. Please try again.",
  },
  register: {
    title: "Create your account",
    subtitle: "Register to enroll in courses and submit assignments",
    fullName: "Full name",
    fullNamePlaceholder: "Nguyen Van A",
    email: "Email",
    emailPlaceholder: "example@student.edu.vn",
    username: "Username",
    usernamePlaceholder: "student_code",
    password: "Password",
    passwordPlaceholder: "Minimum 6 characters",
    submit: "Create account",
    submitting: "Creating account…",
    haveAccount: "Already have an account?",
    signIn: "Sign in",
    errorFallback: "Registration failed. Please check your information.",
    passwordMismatch: "Passwords do not match.",
  },
}

export type AuthMessages = typeof auth
export default auth
