# Video AI CRM — Backend API

Backend cho hệ thống CRM quản lý khách hàng & dự án Video AI.
**Công nghệ:** Node.js + Express + JWT Authentication + MySQL (connection pool, hỗ trợ nhiều nhân viên dùng đồng thời).

---

## 1. Cài đặt

### Yêu cầu
- Node.js >= 18
- MySQL >= 5.7 (hoặc MariaDB)

### Bước 1 — Cài thư viện
```bash
npm install
```

### Bước 2 — Tạo cơ sở dữ liệu
```bash
mysql -u root -p < database/schema.sql
```
Lệnh này tạo database `video_ai_crm` và toàn bộ bảng: `users`, `customers`, `projects`,
`project_resources`, `payments`, `activity_logs`.

### Bước 3 — Tạo file `.env`
```bash
cp .env.example .env
```
Mở `.env` và điền thông tin MySQL thật + một `JWT_SECRET` ngẫu nhiên dài (vd dùng lệnh
`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`).

### Bước 4 — Tạo tài khoản Admin đầu tiên + dữ liệu mẫu
```bash
npm run seed
```
Tạo 2 tài khoản:
| Vai trò   | Email             | Mật khẩu |
|-----------|-------------------|----------|
| Admin     | admin@crm.vn      | admin123 |
| Nhân viên | nhanvien@crm.vn   | 123456   |

⚠️ **Đổi mật khẩu admin ngay sau khi đăng nhập lần đầu** (xem mục 5).

### Bước 4b — Tài nguyên dự án (ảnh/video) lưu ở đâu?
File được lưu trên đĩa tại thư mục `UPLOAD_DIR` (mặc định `backend/uploads/`, tự tạo khi cần).
Đặt `STORAGE_QUOTA_GB` trong `.env` để cấu hình "Tổng dung lượng" hiển thị trong trang
**Cài đặt → Quản lý dung lượng** (Admin). Chỉ cho phép ảnh JPG/PNG/WEBP và video MP4/MOV,
tối đa 200MB/file. Nhớ backup thư mục `uploads/` cùng với database.

### Bước 5 — Chạy server
```bash
npm start          # chạy production
npm run dev        # chạy dev, tự reload khi sửa code
```
Server chạy tại `http://localhost:4000` (đổi qua biến `PORT` trong `.env`).

---

## 2. Triển khai lên VPS (gợi ý)

1. Upload toàn bộ thư mục `backend/` lên VPS (vd `/var/www/crm-api`).
2. Cài Node.js, MySQL trên VPS, thực hiện lại bước 1–4 ở trên.
3. Dùng **PM2** để chạy server nền và tự khởi động lại khi crash/reboot:
   ```bash
   npm install -g pm2
   pm2 start src/server.js --name crm-api
   pm2 save
   pm2 startup
   ```
4. Dùng **Nginx** làm reverse proxy + SSL (Let's Encrypt/Certbot), trỏ domain
   `api.tencongty.vn` → `http://localhost:4000`.
5. Trong `.env`, đặt `CORS_ORIGINS=https://crm.tencongty.vn` (domain frontend thật) để
   chỉ frontend của bạn được gọi API.
6. Sao lưu dữ liệu tự động — đặt cron job hàng ngày:
   ```bash
   mysqldump -u crm_user -p video_ai_crm | gzip > /backups/crm_$(date +%F).sql.gz
   ```

---

## 3. Cấu trúc dự án

```
backend/
├── database/
│   ├── schema.sql        # Cấu trúc database (chạy 1 lần khi khởi tạo)
│   └── seed.js           # Tạo admin + dữ liệu mẫu (npm run seed)
├── src/
│   ├── config/db.js      # Kết nối MySQL (connection pool)
│   ├── middleware/auth.js# Xác thực JWT + phân quyền Admin/Nhân viên
│   ├── utils/
│   │   ├── logger.js     # Ghi activity_logs
│   │   └── recalc.js     # Tự tính lại công nợ (remaining)
│   ├── routes/
│   │   ├── auth.js        # Đăng nhập, đổi mật khẩu
│   │   ├── users.js        # Quản lý nhân viên (Admin)
│   │   ├── customers.js     # Quản lý khách hàng
│   │   ├── projects.js      # Quản lý dự án + Kanban
│   │   ├── resources.js     # Tài nguyên dự án (link, prompt, kịch bản, caption)
│   │   ├── payments.js       # Thanh toán & công nợ
│   │   ├── logs.js            # Lịch sử hoạt động (Admin)
│   │   ├── dashboard.js       # Số liệu & biểu đồ tổng quan
│   │   ├── search.js          # Tìm kiếm toàn hệ thống
│   │   └── notifications.js   # Thông báo sắp đến hạn / công nợ
│   ├── app.js            # Cấu hình Express + đăng ký routes
│   └── server.js         # Điểm khởi động server
├── .env.example
└── package.json
```

---

## 4. Phân quyền

| Hành động | Admin | Nhân viên |
|---|---|---|
| Xem khách hàng / dự án | Tất cả | Chỉ khách/dự án được phân công (hoặc tự tạo) |
| Thêm / sửa khách hàng, dự án | ✅ | ✅ |
| **Xóa** khách hàng, dự án, giao dịch | ✅ | ❌ |
| Ghi nhận / xóa thanh toán | ✅ | ❌ (chỉ xem) |
| Quản lý nhân viên (thêm, khóa, reset mật khẩu) | ✅ | ❌ |
| Xem lịch sử hoạt động toàn hệ thống | ✅ | ❌ |
| Đổi mật khẩu của chính mình | ✅ | ✅ |

Middleware `requireAuth` kiểm tra mọi request có JWT hợp lệ. Middleware `requireAdmin`
chặn các route chỉ dành cho Admin. Với `customers` và `projects`, các route GET/PUT tự
động lọc theo `assigned_to`/`created_by` nếu người gọi là nhân viên.

---

## 5. 🔑 Tính năng đổi mật khẩu (Admin & Nhân viên)

### a) Tự đổi mật khẩu của chính mình (cả Admin và Nhân viên)
```
PUT /api/auth/change-password
Headers: Authorization: Bearer <token>
Body: { "old_password": "admin123", "new_password": "MatKhauMoiManh@123" }
```
- Yêu cầu nhập đúng mật khẩu cũ.
- Mật khẩu mới tối thiểu 6 ký tự.
- Trả về `200 { "message": "Đã đổi mật khẩu" }`.

### b) Admin đổi mật khẩu cho nhân viên khác
```
PUT /api/users/:id/reset-password
Headers: Authorization: Bearer <token-cua-admin>
Body: { "new_password": "MatKhauMoi123" }   // bắt buộc, tối thiểu 6 ký tự
```
- Chỉ Admin gọi được.
- Trả về `{ "message": "Đổi mật khẩu thành công" }`.
- Hành động này được ghi vào lịch sử hoạt động: "Đổi mật khẩu cho <Tên nhân viên>".

### c) Admin khóa / mở khóa tài khoản nhân viên
```
PUT /api/users/:id/lock
Body: { "status": "locked" }   // hoặc "active"
```
- Tài khoản bị khóa sẽ bị từ chối đăng nhập (`403 Tài khoản đã bị khóa`).
- Admin không thể tự khóa chính mình — trả lỗi `400 Không thể thao tác với tài khoản hiện tại.`
- Ghi log: "Khóa tài khoản <Tên>" / "Mở khóa tài khoản <Tên>".

### d) Admin xóa nhân viên
```
DELETE /api/users/:id
```
- Chỉ Admin. Không thể tự xóa chính mình (lỗi `400 Không thể thao tác với tài khoản hiện tại.`).
- Các bản ghi khách hàng/dự án do nhân viên này phụ trách sẽ tự chuyển về "Chưa phân công" (ON DELETE SET NULL).

### e) Nhân viên tự cập nhật thông tin cá nhân
```
PUT /api/auth/me
Body: { "name": "Trần Minh Khoa", "phone": "0900000002", "position": "Editor Video AI" }
```
- Mọi vai trò gọi được, chỉ cập nhật được hồ sơ của chính mình (không đổi được email/vai trò).

---

## 6. Tổng hợp API chính

| Method | Endpoint | Quyền | Mô tả |
|---|---|---|---|
| POST | /api/auth/login | Public | Đăng nhập, trả về JWT |
| GET | /api/auth/me | Đăng nhập | Thông tin tài khoản hiện tại |
| PUT | /api/auth/change-password | Đăng nhập | Tự đổi mật khẩu |
| GET/PUT | /api/users | Admin (POST/PUT) | Danh sách / thêm / sửa nhân viên |
| PUT | /api/users/:id/lock | Admin | Khóa / mở khóa (không tự khóa được chính mình) |
| PUT | /api/users/:id/reset-password | Admin | Admin đặt mật khẩu mới cho nhân viên |
| DELETE | /api/users/:id | Admin | Xóa nhân viên (không tự xóa được chính mình) |
| PUT | /api/auth/me | Đăng nhập | Tự cập nhật thông tin cá nhân (tên/SĐT/chức vụ) |
| GET/POST/PUT/DELETE | /api/customers | — | Quản lý khách hàng (DELETE: Admin) |
| GET/POST/PUT/DELETE | /api/projects | — | Quản lý dự án (DELETE: Admin) |
| PATCH | /api/projects/:id/status | — | Đổi trạng thái (kéo-thả Kanban) |
| GET/PUT | /api/projects/:projectId/resources | — | Tài nguyên dự án (link ChatGPT/Gemini/Kling/Hailuo/CapCut, prompt, kịch bản, caption...) |
| GET/POST | /api/projects/:projectId/files | — | Danh sách / tải lên file tài nguyên dự án (ảnh JPG/PNG/WEBP, video MP4/MOV, tối đa 200MB) |
| GET | /api/projects/:projectId/files/:fileId/view | — | Xem file (hỗ trợ `?token=` cho `<img>`/`<video>`) |
| GET | /api/projects/:projectId/files/:fileId/download | — | Tải xuống file (hỗ trợ `?token=`) |
| DELETE | /api/projects/:projectId/files/:fileId | — | Xóa file tài nguyên dự án |
| GET | /api/storage/overview | Admin | Tổng dung lượng / đã dùng / còn trống |
| GET | /api/storage/files?sort=oldest\|newest\|largest | Admin | Danh sách toàn bộ file tài nguyên (sắp xếp) |
| GET | /api/storage/old-files?days=90 | Admin | Đề xuất file cũ hơn N ngày + tổng dung lượng có thể giải phóng |
| POST | /api/storage/delete | Admin | Xóa nhiều file đã chọn (cần xác nhận ở giao diện, không tự động) |
| GET | /api/payments | — | Lịch sử thanh toán |
| GET | /api/payments/debts | Admin | Khách hàng còn công nợ |
| POST/DELETE | /api/payments | Admin | Ghi nhận / xóa thanh toán |
| GET | /api/logs | Admin | Lịch sử hoạt động |
| GET/PUT | /api/settings/default-resources | Admin | Mẫu link mặc định (ChatGPT, Gemini, Kling, Hailuo, CapCut) cho dự án mới |
| GET | /api/dashboard | — | Thống kê + biểu đồ |
| GET | /api/search?q= | — | Tìm kiếm toàn hệ thống |
| GET | /api/notifications | — | Thông báo sắp đến hạn / công nợ |

---

## 7. Ví dụ gọi API (đăng nhập)
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@crm.vn","password":"admin123"}'
```
Lấy `token` trả về, dùng cho các request tiếp theo:
```bash
curl http://localhost:4000/api/dashboard \
  -H "Authorization: Bearer <token>"
```
