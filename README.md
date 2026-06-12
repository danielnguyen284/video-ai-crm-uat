# Video AI CRM — Hệ thống quản lý khách hàng & dự án Video AI

Gói đầy đủ gồm 2 phần độc lập:

```
video-ai-crm/
├── backend/    -> Node.js + Express + JWT + MySQL (REST API)
└── frontend/   -> React + Vite + Tailwind CSS (giao diện web)
```

## Thứ tự triển khai lên Hosting/VPS

### 1) Backend (API)
```bash
cd backend
npm install
mysql -u root -p < database/schema.sql
cp .env.example .env      # điền MySQL + JWT_SECRET + CORS_ORIGINS
npm run seed               # tạo tài khoản admin@crm.vn / admin123
npm start                   # hoặc dùng PM2 để chạy nền
```
Chi tiết đầy đủ (deploy VPS, Nginx, backup, danh sách API, đổi mật khẩu...): xem `backend/README.md`.

### 2) Frontend (Web)
```bash
cd frontend
npm install
cp .env.example .env       # VITE_API_URL = https://api.tencongty.vn/api
npm run build                # tạo thư mục dist/
```
Upload toàn bộ nội dung `frontend/dist/` lên hosting (thư mục gốc website, ví dụ `public_html/`).
Nhớ cấu hình SPA rewrite (.htaccess hoặc Nginx) — xem `frontend/README.md`.

## Tài khoản đăng nhập mặc định (sau khi `npm run seed`)
| Vai trò   | Email           | Mật khẩu |
|-----------|-----------------|----------|
| Admin     | admin@crm.vn    | admin123 |
| Nhân viên | nhanvien@crm.vn | 123456   |

⚠️ Đổi mật khẩu ngay sau khi đăng nhập lần đầu (icon 🔑 ở sidebar, hoặc Admin reset
mật khẩu cho nhân viên trong trang "Nhân viên").

## Tính năng đã hoàn thiện
- Đăng nhập JWT, phân quyền Admin / Nhân viên
- Dashboard: thống kê, biểu đồ doanh thu & trạng thái dự án
- Quản lý khách hàng: CRUD, lọc, tìm kiếm, xuất Excel
- Quản lý dự án: danh sách + Kanban kéo-thả, xuất báo giá/hợp đồng PDF
- Tài nguyên dự án: link Drive/CapCut/Canva/Kling/Hailuo..., prompt, kịch bản, caption
- Thanh toán & công nợ: ghi nhận giao dịch, tự tính còn nợ, xuất Excel doanh thu
- Quản lý nhân viên: thêm, khóa/mở khóa, **đổi mật khẩu / reset mật khẩu**
- Lịch sử hoạt động toàn hệ thống
- Thông báo: dự án sắp đến hạn, khách hàng còn nợ
- Tìm kiếm toàn hệ thống
- Giao diện hiện đại, Dark/Light Mode tự động theo thiết bị, responsive
