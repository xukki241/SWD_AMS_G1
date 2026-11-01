# SePay IPN — hướng dẫn cầm tay (local)

Mục tiêu: SePay gọi được `POST /api/payment/sepay-ipn` trên máy bạn để **tự ACTIVE** registration sau khi thanh toán thành công (`ORDER_PAID`).

Tham chiếu tài liệu SePay: [How IPN works](https://developer.sepay.vn/en/cong-thanh-toan/IPN).

> IPN URL **bắt buộc** là endpoint **public HTTPS** (không dùng `localhost` / `127.0.0.1` / IP nội bộ). Local phải dùng tunnel (cloudflared / ngrok / localtunnel).

---

## 1. Chạy backend local (port 8080)

```bash
# từ root repo
docker compose up -d --build backend
# hoặc stack đầy đủ
docker compose up -d --build
```

Kiểm tra: mở `http://localhost:8080/api/payment/my` (cần JWT) hoặc xem log container `ams-backend` không lỗi.

---

## 2. Mở tunnel public → `localhost:8080`

### Cách A — Cloudflare Tunnel (`cloudflared`) — khuyến nghị

1. Cài [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/).
2. Mở terminal **mới**, chạy:

```bash
cloudflared tunnel --url http://localhost:8080
```

3. Đợi dòng dạng:

```text
https://xxxx-xxxx.trycloudflare.com
```

4. **Copy** URL đó (gọi là `TUNNEL`). Endpoint IPN sẽ là:

```text
https://xxxx-xxxx.trycloudflare.com/api/payment/sepay-ipn
```

### Cách B — ngrok

1. Cài ngrok, đăng nhập account.
2. Chạy:

```bash
ngrok http 8080
```

3. Copy `https://....ngrok-free.app` → IPN =

```text
https://....ngrok-free.app/api/payment/sepay-ipn
```

> Mỗi lần restart tunnel (trycloudflare / free ngrok), hostname **đổi** → phải cập nhật lại `.env` **và** portal SePay.

---

## 3. Cập nhật `.env` rồi restart backend

1. Copy `.env.example` → `.env` nếu chưa có.
2. Sửa:

```env
SEPAY_IPN_URL=https://<TUNNEL>/api/payment/sepay-ipn
SEPAY_SECRET_KEY=<secret key merchant của bạn>
SEPAY_MERCHANT_ID=<merchant id>
# Browser return vẫn dùng localhost (OK):
SEPAY_SUCCESS_URL=http://localhost:3000/payment/sepay-return
SEPAY_ERROR_URL=http://localhost:3000/payment/sepay-return?result=error
SEPAY_CANCEL_URL=http://localhost:3000/payment/sepay-return?result=cancel
```

3. Restart backend để nạp env:

```bash
docker compose up -d --build backend
```

`SEPAY_IPN_URL` trong app chủ yếu để **nhớ/document**; SePay gọi URL bạn cấu hình trên **portal**, không lấy từ form checkout. Hai URL (portal + `.env`) nên **trùng nhau** để khỏi nhầm.

---

## 4. Cấu hình IPN trên SePay portal

Theo docs SePay:

1. Đăng nhập SePay.
2. Vào **Payment Gateway → Configuration → IPN**.
3. Nhập endpoint URL: `https://<TUNNEL>/api/payment/sepay-ipn`.
4. Chọn auth type **SECRET_KEY** (SePay gửi header `X-Secret-Key`).
5. Secret key phải **khớp** `SEPAY_SECRET_KEY` trong `.env`.
6. **Save** configuration.

Backend sẽ:

- So khớp header `X-Secret-Key` với `sepay.secret-key` → sai = **401**
- Nhận `notification_type === ORDER_PAID`
- Đọc `order.order_invoice_number` → tìm txn `provider=SEPAY`
- Set **SUCCESS**, gọi `activateRegistration` (idempotent)
- Trả **200** `{"success": true}`

---

## 5. Test flow

1. Đăng nhập student trên frontend (`http://localhost:3000`).
2. Đăng ký lớp (PENDING) → chọn thanh toán SePay.
3. Thanh toán thành công trên SePay.
4. Kiểm tra:

```bash
docker logs ams-backend --tail 100 | findstr SEPAY_IPN
```

Log mong đợi:

```text
[SEPAY_IPN] ORDER_PAID → SUCCESS + activate registrationId=... txn=SEPAY...
```

5. UI / API: registration status = **ACTIVE**; payment txn = **SUCCESS**.

---

## Ghi chú return URL vs IPN

| Path | Vai trò |
|------|---------|
| **IPN** (`POST /api/payment/sepay-ipn`) | **Primary** — production nên dựa vào đây |
| **Return** (`GET /api/payment/sepay-return`) | Secondary / local demo khi chưa có tunnel; vẫn activate idempotent nếu `result` success |

Production: luôn cấu hình IPN public; đừng chỉ tin query `?result=success` từ browser.
