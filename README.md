# 🧾 FSVP Tool

The **Foreign Supplier Verification Program (FSVP) Tool** is a web-based compliance platform that streamlines collaboration between **foreign suppliers** and **U.S. importers/distributors** to meet FDA’s FSVP requirements.

Originally built as a prototype on **Replit**, the project is now migrated to **GitHub** for active development using **Cursor**, with planned deployment on **Render** and database hosting via **Neon PostgreSQL**.

---

## 🎯 Core Purpose

To simplify and digitize FDA compliance workflows under the **FSVP Rule (21 CFR 1 Subpart L)** by allowing suppliers and importers to:
- Upload, review, and verify food safety documents  
- Maintain centralized digital records  
- Track certification validity and renewal deadlines  

---

## 🧩 Key Features (MVP)

### User Roles
- **Foreign Supplier:** Upload HACCP, BRC/ISO/GMP certificates, and third-party audits  
- **U.S. Importer / Distributor:** Review and approve supplier submissions, track compliance status  

### Core Functions
- Secure document upload and version control  
- Compliance dashboard with status tracking  
- Role-based access management  
- Document categories include:  
  - HACCP  
  - Third-Party Audits  
  - BRC / ISO / GMP Certificates  

---

## 🧠 Product Roadmap

| Phase | Features | Status |
|-------|-----------|--------|
| MVP | User roles, upload/review, dashboard | ✅ In progress |
| v1.1 | Supplier onboarding flow, importer notifications | 🔄 Planned |
| v1.2 | AI-assisted document validation (OpenAI GPT-5 API) | 🚧 Research |
| v1.3 | FDA API integration for verification | 🔄 Planned |
| v1.4 | Automated alerts for expiring documents | 🕒 Pending |
| v2.0 | Multi-language UI + audit log | 🧩 Future scope |

---

## 🏗️ Tech Stack

| Layer | Technology |
|--------|-------------|
| **Frontend** | React + Vite |
| **Backend** | Node.js / Express |
| **Database** | PostgreSQL (via Drizzle ORM) |
| **ORM** | Drizzle |
| **Hosting** | Render |
| **Database Hosting** | Neon PostgreSQL |
| **AI Layer (Future)** | OpenAI GPT-5 API |
| **Dev Environment** | Cursor IDE + GitHub |
| **Storage (Optional)** | Railway or Replit Object Storage |

---

## 📁 Folder Structure

