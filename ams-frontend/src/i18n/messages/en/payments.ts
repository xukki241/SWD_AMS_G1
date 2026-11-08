const payments = {
  dialog: {
    gateway: "Gateway",
    order: "Order",
    amount: "Amount",
  },
  payos: {
    title: "Pay tuition — PayOS",
    description: "You will be redirected to PayOS to pay {amount} by QR code or bank transfer.",
    creating: "Creating PayOS payment link…",
    createError: "Could not start PayOS payment.",
    gatewayValue: "PayOS · QR / bank transfer",
    open: "Open PayOS",
  },
  sepay: {
    title: "Pay tuition — SePay (bank transfer)",
    description: "You will be redirected to SePay to complete a bank transfer of {amount}.",
    redirecting: "Redirecting to SePay…",
    preparing: "Preparing checkout…",
    createError: "Could not start SePay payment.",
    gatewayValue: "SePay · Bank transfer",
    open: "Open SePay",
  },
  vietqr: {
    title: "Pay tuition — VietQR (sandbox)",
    description:
      "Scan the code with any banking app, then confirm below. This is a demo environment: no real money moves.",
    sandboxNote: "Sandbox mode — confirmations are simulated and no funds are transferred.",
    qrAlt: "VietQR payment code",
    bank: "Bank",
    account: "Account",
    holder: "Holder",
    transferNote: "Transfer note",
    confirm: "I have transferred",
    confirmedToast: "Transfer confirmed (sandbox)",
    confirmedDescription: "Your course enrollment is now active.",
    failedToast: "Confirmation failed",
    failedFallback: "Could not confirm the transfer.",
  },
  return: {
    title: "Payment result",
    success: "Payment successful",
    failed: "Payment failed",
    pending: "Payment is being processed",
    backHome: "Back to courses",
    successTitle: "Payment Successful!",
    failedTitle: "Payment Failed",
    notConfirmedTitle: "Payment Not Confirmed",
    returnDashboard: "Return to Student Dashboard",
    loading: "Loading transaction details...",
    vnpayError: "Failed to process payment callback.",
    payosError: "Failed to verify the PayOS payment.",
    sepayError: "Failed to process the SePay callback.",
  },
}

export type PaymentsMessages = typeof payments
export default payments
