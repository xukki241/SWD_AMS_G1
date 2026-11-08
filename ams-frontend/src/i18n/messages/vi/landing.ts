import type { LandingMessages } from "../en/landing"

const landing: LandingMessages = {
  brand: {
    name: "AMS",
    tagline: "Hệ thống quản lý bài tập",
  },
  nav: {
    logIn: "Đăng nhập",
    signUp: "Đăng ký",
  },
  hero: {
    titlePrefix: "AMS",
    titleSuffix: " · việc học của bạn, ngăn nắp",
    subtitle:
      "Đăng ký khóa học, theo dõi bài học, nộp bài và thanh toán học phí — tất cả trong một nơi.",
    getStarted: "Bắt đầu",
    createStudentAccount: "Tạo tài khoản học viên",
    footnote:
      "Khóa học đã xuất bản · thanh toán SePay · bài học, bài tập & chấm điểm",
  },
  catalog: {
    title: "Khóa học nổi bật",
    subtitle: "Các khóa học đang được xuất bản. Đăng nhập bằng tài khoản học viên để đăng ký.",
    count: "{count} khóa học",
    emptyTitle: "Chưa có khóa học nào được xuất bản",
    emptyDescription: "Khóa học do giảng viên và chuyên gia xuất bản sẽ xuất hiện tại đây.",
    enroll: "Đăng ký",
    free: "Miễn phí",
  },
  difficulty: {
    BEGINNER: "Cơ bản",
    INTERMEDIATE: "Trung cấp",
    ADVANCED: "Nâng cao",
  },
  footer: "AMS POC · SWD392 Nhóm 1 · Chỉ là bản demo — thanh toán chạy trên môi trường sandbox",
}

export default landing
