import type { PaymentsMessages } from "../en/payments"

const payments: PaymentsMessages = {
  dialog: {
    gateway: "Cổng thanh toán",
    order: "Mã đơn hàng",
    amount: "Số tiền",
  },
  payos: {
    title: "Thanh toán học phí — PayOS",
    description:
      "Bạn sẽ được chuyển đến PayOS để thanh toán {amount} qua mã QR hoặc chuyển khoản ngân hàng.",
    creating: "Đang tạo liên kết thanh toán PayOS…",
    createError: "Không thể khởi tạo thanh toán PayOS.",
    gatewayValue: "PayOS · QR / chuyển khoản",
    open: "Mở PayOS",
  },
  sepay: {
    title: "Thanh toán học phí — SePay (chuyển khoản)",
    description: "Bạn sẽ được chuyển đến SePay để thực hiện chuyển khoản {amount}.",
    redirecting: "Đang chuyển đến SePay…",
    preparing: "Đang chuẩn bị thanh toán…",
    createError: "Không thể khởi tạo thanh toán SePay.",
    gatewayValue: "SePay · Chuyển khoản",
    open: "Mở SePay",
  },
  vietqr: {
    title: "Thanh toán học phí — VietQR (sandbox)",
    description:
      "Quét mã bằng ứng dụng ngân hàng bất kỳ, sau đó xác nhận bên dưới. Đây là môi trường demo: không có tiền thật được chuyển.",
    sandboxNote: "Chế độ sandbox — xác nhận chỉ mô phỏng, không chuyển tiền thật.",
    qrAlt: "Mã QR thanh toán VietQR",
    bank: "Ngân hàng",
    account: "Số tài khoản",
    holder: "Chủ tài khoản",
    transferNote: "Nội dung chuyển khoản",
    confirm: "Tôi đã chuyển khoản",
    confirmedToast: "Đã xác nhận chuyển khoản (sandbox)",
    confirmedDescription: "Khóa học của bạn đã được kích hoạt.",
    failedToast: "Xác nhận thất bại",
    failedFallback: "Không thể xác nhận giao dịch chuyển khoản.",
  },
  return: {
    title: "Kết quả thanh toán",
    success: "Thanh toán thành công",
    failed: "Thanh toán thất bại",
    pending: "Thanh toán đang được xử lý",
    backHome: "Quay lại khóa học",
    successTitle: "Thanh toán thành công!",
    failedTitle: "Thanh toán thất bại",
    notConfirmedTitle: "Chưa xác nhận thanh toán",
    returnDashboard: "Về trang sinh viên",
    loading: "Đang tải thông tin giao dịch...",
    vnpayError: "Không thể xử lý kết quả thanh toán.",
    payosError: "Không thể xác minh thanh toán PayOS.",
    sepayError: "Không thể xử lý kết quả SePay.",
  },
}

export default payments
