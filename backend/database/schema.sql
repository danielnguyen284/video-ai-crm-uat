-- =========================================================
-- VIDEO AI CRM - Cấu trúc cơ sở dữ liệu MySQL
-- Chạy: mysql -u root -p < database/schema.sql
-- =========================================================
CREATE DATABASE IF NOT EXISTS video_ai_crm
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE video_ai_crm;

-- ------------------ NHÂN VIÊN / NGƯỜI DÙNG ------------------
CREATE TABLE IF NOT EXISTS users (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(120) NOT NULL,
  email       VARCHAR(150) NOT NULL UNIQUE,
  phone       VARCHAR(20),
  password    VARCHAR(255) NOT NULL,            -- bcrypt hash
  role        ENUM('admin','staff') NOT NULL DEFAULT 'staff',
  position    VARCHAR(100),                     -- chức vụ
  avatar      VARCHAR(255),
  status      ENUM('active','locked') NOT NULL DEFAULT 'active',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------ KHÁCH HÀNG ------------------
CREATE TABLE IF NOT EXISTS customers (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(150) NOT NULL,
  phone       VARCHAR(20) NOT NULL,
  facebook    VARCHAR(255),
  zalo        VARCHAR(100),
  email       VARCHAR(150),
  address     VARCHAR(255),
  industry    VARCHAR(100),
  source      ENUM('Facebook','TikTok','Google','Giới thiệu','Khác') DEFAULT 'Khác',
  status      ENUM('tiem_nang','tu_van','da_chot','khach_cu') NOT NULL DEFAULT 'tiem_nang',
  note        TEXT,
  assigned_to INT UNSIGNED NULL,                -- nhân viên phụ trách (phục vụ phân quyền)
  created_by  INT UNSIGNED NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_cus_phone (phone),
  INDEX idx_cus_status (status),
  CONSTRAINT fk_cus_assigned FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_cus_creator  FOREIGN KEY (created_by)  REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ------------------ DỰ ÁN VIDEO AI ------------------
CREATE TABLE IF NOT EXISTS projects (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customer_id INT UNSIGNED NOT NULL,
  assigned_to INT UNSIGNED NULL,
  title       VARCHAR(200) NOT NULL,
  description TEXT,
  price       DECIMAL(15,0) NOT NULL DEFAULT 0,  -- giá trị hợp đồng (VND)
  deposit     DECIMAL(15,0) NOT NULL DEFAULT 0,  -- tiền cọc
  remaining   DECIMAL(15,0) NOT NULL DEFAULT 0,  -- còn nợ = price - tổng thanh toán (tự cập nhật)
  status      ENUM('moi_nhan','kich_ban','anh_ai','video_ai','chinh_sua','cho_duyet','hoan_thanh','huy')
              NOT NULL DEFAULT 'moi_nhan',
  start_date  DATE,
  deadline    DATE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_prj_status (status),
  INDEX idx_prj_deadline (deadline),
  CONSTRAINT fk_prj_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  CONSTRAINT fk_prj_assigned FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ------------------ TÀI NGUYÊN DỰ ÁN ------------------
CREATE TABLE IF NOT EXISTS project_resources (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_id          INT UNSIGNED NOT NULL UNIQUE,
  drive_link          VARCHAR(500),
  capcut_link         VARCHAR(500),
  canva_link          VARCHAR(500),
  chatgpt_link        VARCHAR(500),
  gemini_link         VARCHAR(500),
  kling_link          VARCHAR(500),
  hailuo_link         VARCHAR(500),
  delivery_video_link VARCHAR(500),
  image_prompt        TEXT,
  video_prompt        TEXT,
  script_content      MEDIUMTEXT,
  facebook_caption    TEXT,
  tiktok_caption      TEXT,
  hashtags            TEXT,
  updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_res_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------ THANH TOÁN ------------------
CREATE TABLE IF NOT EXISTS payments (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_id     INT UNSIGNED NOT NULL,
  amount         DECIMAL(15,0) NOT NULL,
  payment_method ENUM('Chuyển khoản','Tiền mặt','Momo','ZaloPay','Khác') DEFAULT 'Chuyển khoản',
  note           VARCHAR(255),
  payment_date   DATE NOT NULL,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_pay_date (payment_date),
  CONSTRAINT fk_pay_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------ LỊCH SỬ HOẠT ĐỘNG ------------------
CREATE TABLE IF NOT EXISTS activity_logs (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NULL,
  action      ENUM('create','update','delete','login') NOT NULL,
  module      VARCHAR(50) NOT NULL,              -- customers / projects / payments / users / resources
  record_id   VARCHAR(50),
  description VARCHAR(500),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_log_module (module),
  CONSTRAINT fk_log_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ------------------ TÀI KHOẢN ADMIN MẶC ĐỊNH ------------------
-- Đăng nhập lần đầu: chạy "npm run seed" (xem README) để tạo admin với mật khẩu đã hash chuẩn.

-- ------------------ MẪU LINK MẶC ĐỊNH CHO DỰ ÁN MỚI (Admin cấu hình) ------------------
CREATE TABLE IF NOT EXISTS default_resources (
  id           INT UNSIGNED PRIMARY KEY DEFAULT 1,
  chatgpt_link VARCHAR(500),
  gemini_link  VARCHAR(500),
  kling_link   VARCHAR(500),
  hailuo_link  VARCHAR(500),
  capcut_link  VARCHAR(500),
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO default_resources (id) VALUES (1)
  ON DUPLICATE KEY UPDATE id = id;

-- ------------------ FILE TÀI NGUYÊN DỰ ÁN (ảnh / video) ------------------
CREATE TABLE IF NOT EXISTS project_files (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_id    INT UNSIGNED NOT NULL,
  filename      VARCHAR(255) NOT NULL,   -- tên file lưu trên đĩa (duy nhất)
  original_name VARCHAR(255) NOT NULL,   -- tên file gốc do người dùng tải lên
  mime_type     VARCHAR(100),
  size          BIGINT UNSIGNED NOT NULL,
  file_type     ENUM('image','video') NOT NULL,
  uploaded_by   INT UNSIGNED NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_pf_project (project_id),
  INDEX idx_pf_created (created_at),
  CONSTRAINT fk_pf_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_pf_user FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;
