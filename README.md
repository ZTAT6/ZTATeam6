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

```text
┌─────────────────────────────┐
│       🧑‍💻 Client Layer       │
│  (Web Browser / Mobile App) │
└──────────────┬──────────────┘
               │ HTTPS / REST API
               ▼
┌─────────────────────────────┐
│  🚪 API Gateway / Auth Service │
│ - Handles authentication & tokens  │
│ - Enforces Zero Trust policies     │
│ - Routes verified requests         │
└──────────────┬──────────────┘
               │ Internal secure channel
               ▼
┌─────────────────────────────┐
│ ⚙️ Service Layer (Business Logic) │
│ - Processes learning operations     │
│ - Applies RBAC & validation rules   │
│ - Interacts with database securely  │
└──────────────┬──────────────┘
               │ SQL / NoSQL queries + audit logs
               ▼
┌─────────────────────────────┐
│ 🗄️ Data & Monitoring Layer   │
│ - Database (MySQL / MongoDB) │
│ - Audit logs & event records │
│ - Monitoring (Grafana, ELK)  │
└─────────────────────────────┘
```


## 🧰 Tech Stack  

| Component | Technology |
|------------|-------------|
| **Frontend** | React (Vite) |
| **Backend** | Node.js (Express)  |
| **Database** |  MongoDB |
| **Authentication** | JWT / OAuth2 |
| **DevOps / CI-CD** | GitHub |
| **Security Protocols** | HTTPS, MFA, WAF |

---

---

## ⚙️ Installation & Setup  

### 1️⃣ System Requirements  

- Node.js ≥ 18  
- Java ≥ 17 (if Spring Boot backend)  
- MongoDB ≥ 6.0  

---

🔮 Future Improvements
🤖 AI-based adaptive access control

💬 Real-time chat and collaboration tools

🌐 Multi-tenant deployment for institutions

🔐 Integration with Zero Trust Network Access (ZTNA) systems
