# Video AI CRM — Frontend

React + Vite + Tailwind CSS, kết nối tới backend qua REST API (JWT).
Dark/Light Mode tự động theo thiết bị (`prefers-color-scheme`).

## Cài đặt & chạy thử (local)
```bash
npm install
cp .env.example .env     # sửa VITE_API_URL trỏ tới backend
npm run dev               # http://localhost:5173
```

## Build để deploy lên Hosting
```bash
npm install
cp .env.example .env
# Sửa VITE_API_URL = https://api.tencongty.vn/api  (domain backend thật)
npm run build
```
Lệnh trên tạo thư mục `dist/` — đây là **toàn bộ file HTML/CSS/JS tĩnh**, chỉ cần
upload nội dung thư mục `dist/` lên hosting (file `index.html`, `assets/...`).

### Lưu ý khi deploy là Single Page App (SPA)
Vì dùng React Router, cần cấu hình hosting trả về `index.html` cho mọi route
(để tải lại trang `/projects`, `/customers`... không bị lỗi 404):

- **Apache** (.htaccess đặt trong thư mục dist):
  ```
  <IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
  </IfModule>
  ```
- **Nginx**:
  ```
  location / {
    try_files $uri $uri/ /index.html;
  }
  ```

## Tài khoản đăng nhập (sau khi backend đã `npm run seed`)
| Vai trò   | Email           | Mật khẩu |
|-----------|-----------------|----------|
| Admin     | admin@crm.vn    | admin123 |
| Nhân viên | nhanvien@crm.vn | 123456   |

Đổi mật khẩu qua icon 🔑 cạnh tên người dùng ở sidebar (Admin & Nhân viên đều dùng được).
