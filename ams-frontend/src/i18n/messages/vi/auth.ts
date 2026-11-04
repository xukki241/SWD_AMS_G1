import type { AuthMessages } from "../en/auth"

const auth: AuthMessages = {
  login: {
    title: "Đăng nhập",
    subtitle: "Sử dụng tài khoản AMS của bạn",
    username: "Tên đăng nhập",
    password: "Mật khẩu",
    usernamePlaceholder: "ví dụ: student1, teacher1, admin",
    submit: "Đăng nhập",
    submitting: "Đang đăng nhập…",
    noAccount: "Chưa có tài khoản AMS?",
    createOne: "Tạo tài khoản",
    demoTitle: "Tài khoản demo · mật khẩu Password@123",
    errorFallback: "Thông tin đăng nhập không đúng. Vui lòng thử lại.",
  },
  register: {
    title: "Tạo tài khoản",
    subtitle: "Đăng ký để tham gia khóa học và nộp bài tập",
    fullName: "Họ và tên",
    fullNamePlaceholder: "Nguyễn Văn A",
    email: "Email",
    emailPlaceholder: "example@student.edu.vn",
    username: "Tên đăng nhập",
    usernamePlaceholder: "ma_sinh_vien",
    password: "Mật khẩu",
    passwordPlaceholder: "Tối thiểu 6 ký tự",
    submit: "Tạo tài khoản",
    submitting: "Đang tạo tài khoản…",
    haveAccount: "Đã có tài khoản?",
    signIn: "Đăng nhập",
    errorFallback: "Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.",
    passwordMismatch: "Mật khẩu nhập lại không khớp.",
  },
}

export default auth
