# CAMPUSCARE – VFSTR HYDERABAD CAMPUS COMPLAINT MANAGEMENT SYSTEM

[![Node.js](https://img.shields.io/badge/Node.js-v24+-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-v4.21+-blue.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB%20Atlas-brightgreen.svg)](https://www.mongodb.com/atlas)
[![EJS](https://img.shields.io/badge/Template%20Engine-EJS-orange.svg)](https://ejs.co/)
[![Tests](https://img.shields.io/badge/Tests-61%20Passed-success.svg)](#testing--verification)

> **CampusCare** is a modern, enterprise-grade college complaint redressal and grievance management web application developed from scratch for **Vignan's Foundation for Science, Technology & Research (VFSTR) Hyderabad Campus**.

---

## 📌 Project Overview

In collegiate institutions, grievances across academics, lab infrastructure, hostel living conditions, transport, hygiene, and fees frequently face coordination bottlenecks. **CampusCare** centralizes, streamlines, and audits the entire grievance lifecycle across three distinct stakeholder roles: **Students**, **Staff / Faculty**, and **Campus Administration**.

### Key Highlights
- **Strict Role-Based Access Control (RBAC)**: Dedicated portal experiences for Student, Staff, and Admin.
- **Audited 6-Stage Redressal Lifecycle**: `SUBMITTED` ➔ `UNDER REVIEW` ➔ `ASSIGNED` ➔ `IN PROGRESS` ➔ `RESOLVED` ➔ `CLOSED` (with `REOPENED` support).
- **Public Grievance Tracker**: Direct lookup via unique tracking IDs (`CC-YYYY-XXXXX`) without leaking student privacy.
- **Evidence Attachments**: Multer-powered document and image uploads (JPG, PNG, PDF up to 5MB).
- **In-App Notifications**: Real-time alerts for assignments, status updates, and feedback requests.
- **Student Quality Feedback**: 1 to 5 star rating loop with feedback remarks preventing duplicate reviews.
- **Interactive Analytics**: Visual charts (Chart.js) and one-click administrative CSV data export.

---

## 🛠️ Technology Stack (Strictly Implemented)

- **Frontend**: HTML5, CSS3, Vanilla JavaScript, EJS (Embedded JavaScript Templates), Bootstrap Icons
- **Backend**: Node.js, Express.js
- **Database**: MongoDB Atlas / Local MongoDB with Mongoose ODM
- **Authentication**: Bcrypt.js password hashing, Express Sessions with Connect-Mongo store
- **Security**: Helmet, CORS, Express-Rate-Limit, Express-Validator, NoSQL input sanitization
- **File Uploads**: Multer disk storage with MIME and extension filtering
- **Reporting**: JSON2CSV export engine

---

## 📂 Project Structure

```text
CampusCare/
│
├── config/
│   ├── db.js                   # Resilient Mongoose connection with Atlas/local support
│   └── constants.js            # Enums for Roles, Statuses, Categories, Priorities
├── controllers/
│   ├── authController.js       # Login, student registration, password reset, profile
│   ├── studentController.js    # Grievance lodgement, tracking, my complaints, feedback
│   ├── staffController.js      # Assigned complaints, status updates, resolution details
│   ├── adminController.js      # System analytics, delegation, departments, users
│   └── notificationController.js # Mark read, mark all read, delete notifications
├── middleware/
│   ├── auth.js                 # Session authentication & role-based authorization guards
│   ├── upload.js               # Multer configuration with MIME & size validation
│   ├── validator.js            # Express-validator input sanitization & rules
│   └── errorHandler.js         # Centralized error handling & 404/500 rendering
├── models/
│   ├── User.js                 # User schema (Student, Staff, Admin) with bcrypt hooks
│   ├── Complaint.js            # Master grievance schema with status history & attachments
│   ├── Department.js           # Academic & administrative units
│   ├── Feedback.js             # 5-star rating and student satisfaction records
│   └── Notification.js         # Database-backed in-app user notifications
├── routes/
│   ├── indexRoutes.js          # Public landing page & public tracker (/track)
│   ├── authRoutes.js           # Authentication & password recovery
│   ├── studentRoutes.js        # Protected student portal routes
│   ├── staffRoutes.js          # Protected staff action center routes
│   ├── adminRoutes.js          # Protected administrative management routes
│   └── notificationRoutes.js   # Notification actions
├── utils/
│   ├── idGenerator.js          # Unique complaint tracking ID sequence generator
│   ├── csvExporter.js          # CSV report generator for complaints & feedback
│   └── seeder.js               # Automated seed script for initial demo data
├── views/
│   ├── partials/               # Header, footer, navbar, sidebar, alerts, status badges
│   ├── auth/                   # Login, register, forgot-password, reset-password
│   ├── student/                # Dashboard, lodge grievance, tracking, profile, feedback
│   ├── staff/                  # Dashboard, assigned queue, action details, profile
│   ├── admin/                  # Analytics dashboard, departments, staff, students, reports
│   ├── index.ejs               # Modern responsive landing page
│   ├── track.ejs               # Public grievance tracking page
│   ├── 404.ejs & 500.ejs       # Error pages
├── public/
│   ├── css/                    # Custom CSS design system (style.css, dashboard.css, auth.css)
│   ├── js/                     # Vanilla JS interactions & Chart.js integration
│   ├── images/                 # SVG logos and avatar assets
│   └── uploads/                # Secured file upload storage
├── test.js                     # 25-point comprehensive integration test suite
├── .env.example                # Sample environment variables
├── package.json
└── server.js                   # Application entry point
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **NPM**: v9.0.0 or higher
- **MongoDB**: MongoDB Atlas connection URI or local MongoDB daemon

### 2. Installation
```bash
# Clone or navigate to the project directory
cd CampusCare

# Install all dependencies
npm install
```

### 3. Environment Configuration
Create a `.env` file from the provided `.env.example`:
```ini
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/campuscare_vfstr
SESSION_SECRET=campuscare_vfstr_super_secret_session_key_2026
JWT_SECRET=campuscare_vfstr_jwt_secret_token_key_2026
COLLEGE_NAME=VFSTR Hyderabad Campus
APP_NAME=CampusCare
```
> *For MongoDB Atlas, replace `MONGODB_URI` with your connection string: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/campuscare?retryWrites=true&w=majority`.*

### 4. Seed Initial Demonstration Data (Optional)
```bash
npm run seed
```
*(The server also auto-seeds baseline demonstration records on first startup if the database is empty).*

### 5. Start the Application
```bash
npm start
# or for development
npm run dev
```

Visit the application in your browser:
👉 **http://localhost:5000**

---

## 🔑 Demonstration Credentials (For Viva & Review)

The sign-in page includes one-click autofill buttons for testing each role:

| Role | Email Address | Password | Privileges |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@vfstr.ac.in` | `Admin@123` | Full access, analytics, user & dept management, assign & close |
| **Staff (CSE)** | `staff.cse@vfstr.ac.in` | `Staff@123` | View assigned complaints, update progress & resolution |
| **Staff (Maint)** | `staff.maint@vfstr.ac.in` | `Staff@123` | Facilities & maintenance grievances queue |
| **Staff (Hostel)**| `staff.hostel@vfstr.ac.in` | `Staff@123` | Hostel & mess grievances queue |
| **Student 1** | `student1@vfstr.ac.in` | `Student@123` | Submit complaints, upload proofs, view audit history, rate |
| **Student 2** | `student2@vfstr.ac.in` | `Student@123` | Second student profile with active complaints |

---

## 🧪 Testing & Verification

An automated integration test suite is included in `test.js` validating all 25 core functionalities:

```bash
npm test
```

### Verified Test Categories:
1. MongoDB Atlas / Local Connection
2. Student Account Registration
3. Student Portal Login
4. Staff Portal Login
5. Admin Console Login
6. Invalid Credentials Handling
7. Session Termination & Logout
8. Protected Routes Redirection
9. Role-Based Access Control (RBAC)
10. Complaint Lodgement & ID Generation (`CC-YYYY-XXXX`)
11. Public Grievance Tracking (`/track`)
12. Multer Upload Validation & Integrity
13. Administrative Department & Staff Delegation
14. Staff Status Transition to `IN PROGRESS`
15. Staff Resolution Details & Timestamps
16. Student 1-5 Star Feedback & Duplicate Guard
17. In-App Notifications Lifecycle (Create, Mark Read)
18. User Status Management (`ACTIVE` / `SUSPENDED`)
19. Dynamic Department Configuration
20. Real MongoDB Aggregation Dashboard Metrics
21. Multi-Parameter Search & Filtering
22. CSV Report Generation (Complaints & Feedback)
23. Institutional VFSTR Hyderabad Campus Branding
24. Centralized Error Handlers (404 and 500)
25. Database Persistence & Graceful Teardown

---

## 📄 Project Documentation

Comprehensive academic documentation files are provided in the repository:
- 📖 [PROJECT_DOCUMENTATION.md](file:///c:/Users/bhavy/OneDrive/Desktop/CampusCare/PROJECT_DOCUMENTATION.md) – Project synopsis, objectives, system architecture, and module breakdown.
- 🗄️ [DATABASE_SCHEMA.md](file:///c:/Users/bhavy/OneDrive/Desktop/CampusCare/DATABASE_SCHEMA.md) – Entity relationships, Mongoose schemas, and indexes.
- 🔌 [API_DOCUMENTATION.md](file:///c:/Users/bhavy/OneDrive/Desktop/CampusCare/API_DOCUMENTATION.md) – Full catalog of routes, controllers, and payload formats.
- ⚙️ [INSTALLATION_GUIDE.md](file:///c:/Users/bhavy/OneDrive/Desktop/CampusCare/INSTALLATION_GUIDE.md) – Step-by-step setup and deployment guide.
- 📊 [TESTING_REPORT.md](file:///c:/Users/bhavy/OneDrive/Desktop/CampusCare/TESTING_REPORT.md) – Formal test execution log and viva readiness report.

---

## 🏛️ Institutional Information

**Vignan's Foundation for Science, Technology & Research (VFSTR)**  
*Off-Campus Centre: Hyderabad, Telangana, India*  
Department of Computer Science & Engineering  
*Project: CampusCare Complaint Redressal Management System*

