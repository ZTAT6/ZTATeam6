# 🎓 Triển khai Website theo mô hình Zero Trust Access cho Hệ thống Học tập Trực tuyến  

## 🧩 Giới thiệu  
Dự án này phát triển **một nền tảng học tập trực tuyến** áp dụng mô hình **Zero Trust Access** (“Không tin tưởng mặc định, luôn xác minh”).  
Mọi yêu cầu truy cập đều được xác thực và kiểm tra quyền hạn, giúp đảm bảo tính bảo mật, phân quyền rõ ràng và khả năng theo dõi toàn diện trong toàn bộ hệ thống.  
Hệ thống hỗ trợ **phân cấp bậc truy cập** (học viên → giảng viên → trưởng bộ môn → quản trị viên), đồng thời tích hợp **thống kê, giám sát, báo cáo và cảnh báo bảo mật**.

---

## 🚀 Tính năng chính  
- 🔐 Xác thực người dùng (JWT / OAuth2)  
- 👥 Phân quyền & phân cấp truy cập (RBAC + Hierarchical Access Control)  
- 🧑‍🏫 Quản lý người dùng, khóa học, bài giảng, nội dung học tập  
- 📊 Thống kê & báo cáo: số lượng người dùng, lượt truy cập, hoạt động học tập  
- 🕵️ Ghi log & theo dõi hoạt động (Activity Log, Audit Trail)  
- 🧠 Phát hiện hành vi bất thường và cảnh báo bảo mật  
- ⚙️ Dashboard quản trị hệ thống: giám sát, phân quyền, báo cáo  

---

## 🧱 Kiến trúc & Mô hình Zero Trust  

### Nguyên tắc cốt lõi  
- **Never Trust, Always Verify** – Mọi truy cập đều phải xác minh.  
- **Least-Privilege Access** – Cấp quyền tối thiểu cần thiết.  
- **Micro-Segmentation** – Phân tách mạng và người dùng theo khu vực truy cập.  
- **Continuous Monitoring** – Giám sát và ghi log toàn bộ hoạt động.  

### Mô hình triển khai tổng quan  
Client (Browser/Mobile)
↓
API Gateway / Auth Layer
↓
Service Layer (Business Logic)
↓
Database + Audit Logs

---

## 🧰 Công nghệ sử dụng  
| Thành phần | Công nghệ gợi ý |
|-------------|-----------------|
| **Frontend** | React |
| **Backend** |  Node.js (Express)e |
| **CSDL** | MongoDB |
| **Xác thực & Bảo mật** | JWT / OAuth2 |
| **DevOps** | GitHub |
| **Giao thức bảo mật** | HTTPS, MFA, WAF |

---

## 🗂️ Cấu trúc dự án  
/project-root
├── frontend/ # Giao diện người dùng
│ ├── src/
│ └── package.json
├── backend/ # API & business logic
│ ├── src/
│ └── pom.xml / package.json
├── data/ # Script khởi tạo DB, migration
├── infra/ # Dockerfile, CI/CD config
└── README.md

---

## ⚙️ Hướng dẫn cài đặt & chạy  

### 1️⃣ Yêu cầu hệ thống  
- Node.js ≥ 18  
- Java ≥ 17  
- MySQL ≥ 8.0  
- Docker (tùy chọn)

### 2️⃣ Thiết lập cơ sở dữ liệu  
```sql
CREATE DATABASE e_learning CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'elearn_user'@'%' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON e_learning.* TO 'elearn_user'@'%';
3️⃣ Chạy backend
cd backend
./mvnw spring-boot:run     # nếu dùng Spring Boot
4️⃣ Chạy frontend

cd frontend
npm install
npm run dev
👉 Truy cập tại: http://localhost:3000

🔧 Cấu hình môi trường
Frontend (.env)

VITE_API_BASE_URL=http://localhost:8080/api  
VITE_APP_NAME=E-LearningZeroTrust  
Backend (application.properties)

spring.datasource.url=jdbc:mysql://localhost:3306/e_learning
spring.datasource.username=elearn_user
spring.datasource.password=your_password

jwt.secret=your_jwt_secret_key
logging.level.root=INFO
👥 Phân quyền & Vai trò người dùng
Vai trò	Quyền hạn
Learner (Học viên)	Đăng ký khóa học, tham gia, xem nội dung được phép
Instructor (Giảng viên)	Tạo & quản lý khóa học, học viên
Department Head (Trưởng bộ môn)	Giám sát giảng viên, thống kê nội bộ
Admin (Quản trị viên)	Toàn quyền quản lý hệ thống, logs, bảo mật

📊 Thống kê & Theo dõi
Activity Log: ghi lại mọi hành động người dùng

Báo cáo: số học viên, khóa học, lượt truy cập, thời lượng học

Cảnh báo: phát hiện truy cập bất thường, IP lạ, lỗi xác thực
