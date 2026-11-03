# PayOS — cấu hình thanh toán

Luồng tích hợp: tạo payment link qua PayOS merchant API → trình duyệt chuyển sang `checkoutUrl` (QR / chuyển khoản) → **webhook** xác nhận và tự ACTIVE enrollment; trang return chỉ kiểm tra lại trạng thái đơn với PayOS.

## 1. Lấy thông tin kênh thanh toán

1. Đăng nhập [my.payos.vn](https://my.payos.vn) và xác thực doanh nghiệp/cá nhân.
2. Tạo **Kênh thanh toán** (Payment Channel).
3. Lấy 3 giá trị: **Client ID**, **API Key**, **Checksum Key**.

## 2. Cấu hình `.env` và restart backend

```env
PAYOS_CLIENT_ID=<client id>
PAYOS_API_KEY=<api key>
PAYOS_CHECKSUM_KEY=<checksum key>
PAYOS_BASE_URL=https://api-merchant.payos.vn
PAYOS_RETURN_URL=http://localhost:3000/payment/payos-return
PAYOS_CANCEL_URL=http://localhost:3000/payment/payos-return
```

```bash
docker compose up -d --build backend
```

Thiếu 1 trong 3 khóa thì `POST /api/payment/course/create-payos/{enrollmentId}` trả `400` với thông báo PayOS chưa được cấu hình. Các cổng khác (SePay, VNPay) vẫn hoạt động bình thường.

## 3. Đăng ký webhook

Webhook **bắt buộc là URL public HTTPS** (dùng cloudflared/ngrok như [docs/SEPAY_SETUP.md](SEPAY_SETUP.md)).

```text
https://<TUNNEL>/api/payment/payos-webhook
```

Nhập URL này vào phần cấu hình webhook của kênh thanh toán trên PayOS (hoặc gọi API `POST /confirm-webhook` của PayOS). PayOS sẽ gửi một payload mẫu để kiểm tra; backend xác thực chữ ký rồi trả `200` để xác nhận.

## 4. Endpoint backend

| Endpoint | Vai trò |
|----------|---------|
| `POST /api/payment/course/create-payos/{enrollmentId}` | Tạo payment link, lưu txn `PAYOS` PENDING, trả `checkoutUrl` |
| `POST /api/payment/payos-webhook` | **Primary** — xác thực HMAC-SHA256 của `data`, set SUCCESS + ACTIVE (idempotent), luôn trả 2xx |
| `GET /api/payment/payos-return` | Secondary — gọi PayOS API kiểm tra `status` (`PAID`/`PENDING`/`CANCELLED`) rồi mới ACTIVE |

Chữ ký:

- Tạo link: `HMAC_SHA256(checksumKey, "amount=..&cancelUrl=..&description=..&orderCode=..&returnUrl=..")` (đúng thứ tự).
- Webhook: `HMAC_SHA256(checksumKey, "key=value" các field trong data, sort theo alphabet, nối bằng &)`.

## 5. Test nhanh

1. Student đăng nhập → **Payments** → chọn **PayOS** ở một enrollment `PENDING_PAYMENT`.
2. Thanh toán trên trang PayOS.
3. Log backend sẽ có:

```text
[PAYOS_WEBHOOK] PAID → SUCCESS + activate enrollmentId=... orderCode=...
```

4. Enrollment chuyển **ACTIVE**, lịch sử thanh toán hiện giao dịch `PAYOS` **SUCCESS**.

Nếu webhook chưa tới kịp, trang return hiển thị "PayOS has not confirmed this payment yet" — enrollment sẽ tự ACTIVE khi webhook đến. Không cần thao tác thủ công.
