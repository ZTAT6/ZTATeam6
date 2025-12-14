🎓 Zero Trust Access-Based Online Learning System

Developed by Team ZTATeam6
Secure by Design · Scalable by Architecture · Intelligent by Data

🧩 Project Overview

This project delivers a Zero Trust Network Access (ZTNA)–based Online Learning Platform, where no user, device, or service is trusted by default.
Every access request is explicitly authenticated, authorized, and continuously evaluated.

By combining role-based hierarchical access control, real-time monitoring, and security analytics, the system ensures a highly secure, scalable, and intelligent digital learning environment.

🚀 Key Features

🔐 Zero Trust Authentication
Continuous verification using JWT / OAuth2 for every request

👥 Role-Based & Hierarchical Access Control
Structured permissions: Learner → Instructor → Department Head → Admin

🧑‍🏫 Course & Content Management
Create, update, and manage learning materials securely

📊 Real-Time Dashboard
Monitor active users, sessions, and system activity

🕵️ Audit Logging & Activity Tracking
Full visibility into user actions and system events

⚠️ Anomaly Detection
Detect suspicious behavior such as unusual IPs or login patterns

📡 Secure APIs
Protected by HTTPS, WAF, and rate-limiting

🔧 Administrative Controls
Centralized user, role, and system management

🧱 Zero Trust Architecture
🔑 Core Security Principles

Never Trust, Always Verify – Every request is authenticated

Least Privilege Access – Users only get what they need

Micro-Segmentation – Services isolated by security zones

Continuous Monitoring – Real-time auditing and analytics

🧩 High-Level System Flow
[ Client (Web / Mobile) ]
          ↓
[ API Gateway / Auth Service ]
          ↓
[ Service Layer (Business Logic) ]
          ↓
[ Database + Audit & Monitoring ]

🧰 Technology Stack
Layer	Technology
Frontend	React (Vite)
Backend	Node.js (Express)
Database	MongoDB
Authentication	JWT / OAuth2
CI/CD	GitHub Actions
Security	HTTPS, MFA, Zero Trust Model
🗂️ Project Structure
ZTATeam6/
├── frontend/        # Client-side application
│   ├── src/
│   └── package.json
├── backend/         # API & business logic
│   ├── src/
│   └── package.json
├── data/            # Database scripts / migrations
├── infra/           # Nginx, CI/CD, infrastructure configs
└── README.md

⚙️ Installation & Setup
🔧 System Requirements

Node.js ≥ 18

JavaScript ≥ ES17

MongoDB ≥ 6.0

👥 User Roles & Permissions
Role	Description	Permissions
Learner	Student	Enroll and view assigned courses
Instructor	Teacher	Create and manage courses & students
Department Head	Supervisor	Monitor instructors and view reports
Admin	System Administrator	Full system access
📊 Analytics & Monitoring

Activity Logs – Track all user and system actions

Reports – User engagement, active sessions, and usage trends

Security Alerts – Automatic detection of suspicious behavior

⚙️ DevOps & Deployment
Tool	Purpose
GitHub Actions	CI/CD automation
Nginx	Reverse proxy with HTTPS
Prometheus + Grafana	Performance & uptime monitoring
ELK Stack (Optional)	Centralized logging & analytics
🔢 OTP Verification (Email / SMS)

The system supports One-Time Password (OTP) verification via Email or SMS for both account registration and password recovery.

✉️ Supported Flows

Signup Verification – OTP via Email or SMS

Forgot Password – OTP verification before reset

🔐 Environment Variables

Email (Nodemailer)

SMTP_HOST

SMTP_PORT

SMTP_USER

SMTP_PASS

EMAIL_FROM

Application URL

APP_BASE_URL (default: http://localhost:5176)

SMS (Twilio)

TWILIO_ACCOUNT_SID

TWILIO_AUTH_TOKEN

TWILIO_FROM_NUMBER

⚠️ In development mode, OTP codes are logged to the console if Email/SMS is not configured.

🔗 Authentication API Endpoints
🔸 Register User

POST /auth/register

{
  "username": "string",
  "password": "string",
  "email": "string",
  "full_name": "string (optional)",
  "phone": "string (optional)",
  "channel": "email | sms"
}

🔸 Verify Signup OTP

POST /auth/verify-signup

{
  "identifier": "email or phone",
  "code": "OTP",
  "channel": "email | sms"
}

🔸 Forgot Password – Request OTP

POST /auth/forgot-password/request

{
  "identifier": "email or phone",
  "channel": "email | sms"
}

🔸 Reset Password

POST /auth/forgot-password/reset

{
  "identifier": "email or phone",
  "code": "OTP",
  "new_password": "string"
}

🧪 cURL Examples
# Register with SMS OTP
  -H 'Content-Type: application/json' \
  -d '{"username":"u1","password":"Passw0rd!","email":"u1@example.com","phone":"+15551234567","channel":"sms"}'

🔮 Future Enhancements

💬 Real-time chat & collaboration

🌐 Multi-tenant support for institutions

🔐 Integration with enterprise ZTNA solutions
