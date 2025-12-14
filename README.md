# 🎓 Zero Trust Access-Based Online Learning System  

> Developed by **Team ZTATeam6** — Secure. Scalable. Smart.  

---

## 🧩 Overview  

This project implements a **Zero Trust Access Model (ZTNA)** for an **Online Learning Platform**, ensuring that no entity — user, device, or service — is trusted by default.  
Each access request is authenticated, authorized, and continuously monitored.  

The system features **role-based hierarchical access control**, **real-time monitoring**, and **security analytics**, providing a secure and intelligent learning environment for all users.

---

## 🚀 Key Features  

- 🔐 **Zero Trust Authentication** – Every access request is verified (JWT / OAuth2)  
- 👥 **Role & Hierarchy Management** – Multi-level permissions (Student → Instructor → Head → Admin)  
- 🧑‍🏫 **Course & Content Management** – Upload, edit, and manage learning materials  
- 📊 **Real-time Dashboard** – Track users, sessions, and activity metrics  
- 🕵️ **Activity Logging & Auditing** – Detailed user activity and event tracking  
- ⚠️ **Anomaly Detection** – Identify unusual login patterns and IP anomalies  
- 📡 **Secure APIs** – Protected by HTTPS, WAF, and rate-limiting  
- 🔧 **Admin Tools** – Manage users, assign roles, and monitor performance  

---

## 🧱 Zero Trust Architecture  

### 🔑 Core Security Principles  

- **Never Trust, Always Verify** – Authentication at every access point  
- **Least Privilege Access** – Limit permissions to only what’s necessary  
- **Micro-Segmentation** – Isolate resources and services by security zone  
- **Continuous Monitoring** – Real-time audit logs and event tracking  

### 🧩 System Model  

[ Client (Browser / Mobile) ]
↓
[ API Gateway / Auth Service ]
↓
[ Service Layer (Business Logic) ]
↓
[ Database + Audit & Monitoring Layer ]

---

## 🧰 Tech Stack  

| Component | Technology |
|------------|-------------|
| **Frontend** | React (Vite) |
| **Backend** | Node.js (Express)|
| **Database** | MongoDB |
| **Authentication** | JWT / OAuth2 |
| **DevOps / CI-CD** | GitHub Actions |
| **Monitoring** | Prometheus / Grafana / ELK Stack |
| **Security Protocols** | HTTPS, MFA, ZTA |

---

## 🗂️ Project Structure  

ZTATeam6/
├── frontend/ # Frontend application
│ ├── src/
│ └── package.json
├── backend/ # Backend service (API + business logic)
│ ├── src/
│ └── package.json / pom.xml
├── data/ # Database scripts / migrations
├── infra/ #  Nginx, CI/CD configs
└── README.md

## ⚙️ Installation & Setup  

### 1️⃣ System Requirements  

- Node.js ≥ 18  
- Javascript ≥ 17  
- MongoDB ≥ 6.0  
---
👥 User Roles & Permissions
Role	Description	Permissions
Learner	Student	Enroll, view assigned courses
Instructor	Teacher	Create/manage courses and students
Department Head	Supervisor	Monitor instructors, view reports
Admin	System Admin	Full access to all resources

📊 Analytics & Monitoring
Activity Logs – Track all user/system actions

Reports – View engagement, active users, and session data

Security Alerts – Auto-detect login anomalies and suspicious behavior

⚙️ DevOps & Deployment
Tool	Purpose
GitHub Actions	CI/CD automation for testing and deployment
Nginx	Reverse proxy with HTTPS support
Prometheus + Grafana	Monitor performance and uptime
ELK Stack (Optional)	Centralized logging (Elasticsearch, Logstash, Kibana)

🔮 Future Improvements

💬 Real-time chat and collaboration tools

🌐 Multi-tenant deployment for institutions

🔐 Integration with Zero Trust Network Access (ZTNA) systems

---

## 🔢 OTP Verification (Email/SMS)

- Signup now supports delivering OTP via `email` or `sms`.
- Forgot password flow uses OTP via `email` or `sms` before resetting.

### Environment Variables

- Email (Nodemailer):
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`
- App base URL (for links):
  - `APP_BASE_URL` (default `http://localhost:4000`)
- SMS (Twilio REST API):
  - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`

If not configured, the app logs OTP codes to the console in dev mode.

### API Endpoints

- `POST /auth/register`
  - Body: `{ username, password, email, full_name?, phone?, channel?: 'email'|'sms' }`
  - Response: `201` with message to verify by chosen channel.

- `POST /auth/verify-email`
  - Body: `{ email, code }` (legacy email-only verification)

- `POST /auth/verify-signup`
  - Body: `{ identifier, code, channel?: 'email'|'sms' }`
  - `identifier` is email or phone; verifies OTP and creates the user.

- `POST /auth/forgot-password/request`
  - Body: `{ identifier, channel?: 'email'|'sms' }`
  - Sends OTP code to email or phone.

- `POST /auth/forgot-password/reset`
  - Body: `{ identifier, code, new_password }`
  - Verifies OTP and resets the password.

### cURL Examples

```bash
# Register with SMS OTP
curl -X POST http://localhost:4000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"username":"u1","password":"Passw0rd!","email":"u1@example.com","phone":"+15551234567","channel":"sms"}'

# Verify signup via SMS
curl -X POST http://localhost:4000/auth/verify-signup \
  -H 'Content-Type: application/json' \
  -d '{"identifier":"+15551234567","code":"123456","channel":"sms"}'

# Request forgot password via email
curl -X POST http://localhost:4000/auth/forgot-password/request \
  -H 'Content-Type: application/json' \
  -d '{"identifier":"u1@example.com","channel":"email"}'

# Reset password with code
curl -X POST http://localhost:4000/auth/forgot-password/reset \
  -H 'Content-Type: application/json' \
  - d '{"identifier":"u1@example.com","code":"123456","new_password":"NewPassw0rd!"}'
```
