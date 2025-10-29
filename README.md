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
| **Backend** | Node.js (Express) / Spring Boot |
| **Database** | MySQL / MongoDB |
| **Authentication** | JWT / OAuth2 |
| **DevOps / CI-CD** | GitHub Actions + Docker |
| **Monitoring** | Prometheus / Grafana / ELK Stack |
| **Security Protocols** | HTTPS, MFA, WAF |

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
├── infra/ # Dockerfile, Nginx, CI/CD configs
└── README.md

## ⚙️ Installation & Setup  

### 1️⃣ System Requirements  

- Node.js ≥ 18  
- Java ≥ 17 (if Spring Boot backend)  
- MySQL ≥ 8.0 or MongoDB ≥ 6.0  
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
Docker & Docker Compose	Build, run, and orchestrate containers
Nginx	Reverse proxy with HTTPS support
Prometheus + Grafana	Monitor performance and uptime
ELK Stack (Optional)	Centralized logging (Elasticsearch, Logstash, Kibana)

🔮 Future Improvements
🤖 AI-based adaptive access control

💬 Real-time chat and collaboration tools

🌐 Multi-tenant deployment for institutions

🔐 Integration with Zero Trust Network Access (ZTNA) systems
