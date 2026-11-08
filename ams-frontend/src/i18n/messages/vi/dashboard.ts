import type { DashboardMessages } from "../en/dashboard"

const dashboard: DashboardMessages = {
  nav: {
    dashboard: "Bảng điều khiển",
    usersRoles: "Người dùng & vai trò",
    auditTrail: "Nhật ký hoạt động",
    manageCourses: "Quản lý khóa học",
    courseCatalog: "Danh mục khóa học",
    myCourses: "Khóa học của tôi",
    publishedCourses: "Khóa học đã xuất bản",
    templates: "Biểu mẫu",
    payments: "Thanh toán",
    myWork: "Bài làm của tôi",
    findCourse: "Tìm khóa học",
    toDo: "Việc cần làm",
    courses: "Khóa học",
  },
  courseList: {
    teaching: "Giảng dạy",
    published: "Đã xuất bản",
    emptyStudent: "Đăng ký khóa học để xem tại đây.",
    emptyTeacher: "Tạo khóa học để xem tại đây.",
  },
  difficulty: {
    beginner: "Cơ bản",
    intermediate: "Trung cấp",
    advanced: "Nâng cao",
  },
  admin: {
    title: "Quản trị",
    subtitle: "Quản lý tài khoản và vai trò, duyệt khóa học và nhật ký hoạt động.",
    tabs: {
      users: "Người dùng",
      courses: "Khóa học",
      audit: "Nhật ký hoạt động",
    },
    kpi: {
      users: "Người dùng",
      usersHint: "{students} học viên · {teachers} giảng viên",
      courses: "Khóa học",
      coursesHint: "danh mục khóa học đã xuất bản",
      enrollments: "Lượt đăng ký",
      enrollmentsHint: "lượt đăng ký của học viên",
      subjects: "Môn học",
      subjectsHint: "môn học trong chương trình",
    },
    users: {
      title: "Người dùng & vai trò",
      description:
        "Gán vai trò cho người dùng — vai trò mới được thêm song song với các vai trò hiện có.",
      id: "Mã",
      name: "Họ tên",
      email: "Email",
      roles: "Vai trò",
      status: "Trạng thái",
      assignRole: "Gán vai trò",
      pickRole: "Chọn vai trò",
      apply: "Áp dụng",
      roleAssigned: "Đã gán vai trò",
      roleAssignFailed: "Không thể gán vai trò",
      unlock: "Mở khóa",
    },
    courses: {
      description:
        "Xem danh mục khóa học ở chế độ chỉ đọc. Giảng viên tạo và sở hữu khóa học.",
      emptyTitle: "Chưa có khóa học",
      emptyDescription: "Khóa học sẽ xuất hiện tại đây sau khi giảng viên tạo.",
    },
    audit: {
      recent: "{count} sự kiện hệ thống gần nhất (mới nhất trước)",
      when: "Thời điểm",
      action: "Hành động",
      resource: "Đối tượng",
      ref: "Tham chiếu",
      emptyTitle: "Chưa có sự kiện",
      emptyDescription: "Hành động sẽ xuất hiện tại đây khi diễn ra.",
    },
  },
  student: {
    title: "Học tập của tôi",
    subtitle: "Khóa học, bài tập sắp đến hạn và thanh toán tại một nơi.",
    kpi: {
      enrolled: "Khóa học đã đăng ký",
      active: "Khóa học đang học",
      submitted: "Đã nộp",
      averageScore: "Điểm trung bình",
    },
    courses: {
      description:
        "Các khóa học bạn đã đăng ký. Mở một khóa học để học và nộp bài.",
      emptyTitle: "Chưa có khóa học",
      emptyDescription: "Xem danh mục và đăng ký khóa học để bắt đầu.",
    },
    work: {
      title: "Bài chưa nộp",
      description: "Bài tập đang chờ bạn nộp",
      dueItem: "{code} · hạn {date}",
      overdue: "(trễ hạn)",
      emptyTitle: "Không có bài nào",
      emptyDescription: "Bạn đã hoàn thành hết — bài tập mới sẽ xuất hiện tại đây.",
    },
    payments: {
      title: "Học phí & thanh toán",
      description: "Thanh toán qua SePay (chuyển khoản)",
      awaiting: "Chờ thanh toán",
      ref: "Mã: {ref}",
      history: "Lịch sử thanh toán",
      noTransactions: "Chưa có giao dịch nào.",
      payFailed: "Không thể bắt đầu thanh toán",
    },
  },
  teacher: {
    title: "Bảng điều khiển giảng viên",
    subtitle: "Quản lý khóa học và chấm bài của bạn.",
    kpi: {
      courses: "Khóa học của tôi",
      coursesHint: "khóa học bạn giảng dạy",
      assignments: "Bài tập",
      assignmentsHint: "bài tập đã xuất bản",
      toGrade: "Chờ chấm",
      toGradeHint: "đang chờ điểm",
      graded: "Đã chấm",
      gradedHint: "lượt chấm hoàn tất",
    },
    courses: {
      description:
        "Mở khóa học để quản lý nội dung, bài tập và học viên.",
      emptyTitle: "Chưa có khóa học",
      emptyDescription: "Khóa học được phân công cho bạn sẽ xuất hiện tại đây.",
    },
    todo: {
      description: "Bài tập có bài nộp đang chờ chấm điểm.",
      queue: "Hàng chờ chấm bài",
      statsOne: "{count} bài nộp đang chờ điểm",
      statsMany: "{count} bài nộp đang chờ điểm",
      statsFallback: "Xem bài chưa chấm theo từng bài tập",
      ungradedOne: "{code} · {count} bài nộp chưa chấm",
      ungradedMany: "{code} · {count} bài nộp chưa chấm",
      grade: "Chấm",
      emptyTitle: "Không có bài cần chấm",
      emptyDescription:
        "Khi học viên nộp bài, các bài tập cần chấm sẽ xuất hiện tại đây.",
    },
  },
}

export default dashboard
