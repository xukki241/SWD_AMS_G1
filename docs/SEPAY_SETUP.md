# SePay VietQR (Tài khoản ảo MBBank) & Webhook tự động kích hoạt

Mục tiêu: Học viên chọn **Thanh toán SePay** → hiển thị popup mã **VietQR MBBank** (VA `VQRQANNCD2590`) trực tiếp trên web. Khi chuyển khoản thành công, SePay gửi Webhook đến server để **tự động kích hoạt (ACTIVE)** khóa học ngay lập tức.

---

## 1. Thông tin cấu hình SePay trong [.env](.env)

```env
SEPAY_ENV=production
SEPAY_BANK_NAME=MBBank
SEPAY_BANK_ACCOUNT=VQRQANNCD2590
SEPAY_ACCOUNT_NAME=DOAN KHANH DUONG
SEPAY_SECRET_KEY=VSOMXTKSR1NJ74SBAFZNSGJCMCZ0UH0HOPPHU6I7GUIYWH9TW2E5EVXXZ8Y3RXDT
SEPAY_IPN_SECRET_KEY=VSOMXTKSR1NJ74SBAFZNSGJCMCZ0UH0HOPPHU6I7GUIYWH9TW2E5EVXXZ8Y3RXDT
SEPAY_IPN_URL=http://localhost:8080/api/payment/sepay-webhook
```

---

## 2. Tạo URL Webhook nhận thông báo từ SePay

SePay cần gửi webhook vào server backend. Chọn 1 trong các cách sau:

### Cách A — Localtunnel (Nhanh nhất — không cần đăng ký tài khoản)

```bash
npx localtunnel --port 8080
```
Nhận URL dạng: `https://xxxx.loca.lt` → Webhook URL:
```text
https://xxxx.loca.lt/api/payment/sepay-webhook
```

### Cách B — ngrok

```bash
ngrok http 8080
```
Webhook URL:
```text
https://xxxx.ngrok-free.app/api/payment/sepay-webhook
```

---

## 3. Cấu hình Webhook trên portal SePay (my.sepay.vn)

1. Đăng nhập [my.sepay.vn](https://my.sepay.vn).
2. Vào **Tích hợp Web → Webhooks** (hoặc Cổng thanh toán → IPN):
   - **URL Webhook**: `https://<TUNNEL_URL>/api/payment/sepay-webhook`
   - **Kiểu xác thực (Authentication)**: Chọn API Key hoặc Secret Key.
   - **Key**: `VSOMXTKSR1NJ74SBAFZNSGJCMCZ0UH0HOPPHU6I7GUIYWH9TW2E5EVXXZ8Y3RXDT`
3. Bấm **Lưu cấu hình**.

---

## 4. Test offline không cần tunnel (bắn Webhook giả lập)

Chạy lệnh cURL sau với mã giao dịch (ví dụ `AMS1T12345`):

```bash
curl -X POST http://localhost:8080/api/payment/sepay-webhook \
  -H "Content-Type: application/json" \
  -H "X-Secret-Key: VSOMXTKSR1NJ74SBAFZNSGJCMCZ0UH0HOPPHU6I7GUIYWH9TW2E5EVXXZ8Y3RXDT" \
  -d "{\"transferType\":\"in\",\"content\":\"Chuyen tien AMS1T12345 hoc phi\",\"transferAmount\":500000}"
```
