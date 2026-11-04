# CampusCare – Campus Complaint Management System

**Project Maintainer: Hasini Dudyala**

[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-v4.21+-blue.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-brightgreen.svg)](https://www.mongodb.com/)
[![EJS](https://img.shields.io/badge/Template%20Engine-EJS-orange.svg)](https://ejs.co/)

CampusCare is a web-based college complaint redressal and grievance management system designed to simplify the process of submitting, tracking, assigning, and resolving campus complaints.

The application provides separate portals for students, staff/faculty, and administrators, helping streamline communication and complaint management within an educational institution.

---

## 👩‍💻 Project Maintainer

**Hasini Dudyala**

- B.Tech – Artificial Intelligence & Machine Learning
- GitHub: [hasinidudyala-sketch](https://github.com/hasinidudyala-sketch)
- Email: hasinidudyala@gmail.com

---

## 📌 Project Overview

Students and staff may face various campus-related issues involving academics, laboratory infrastructure, hostel facilities, transportation, hygiene, and other services.

CampusCare provides a centralized platform where users can submit complaints, monitor their status, and receive updates.

### Key Features

- **Role-Based Access Control:** Separate access for Students, Staff, and Administrators.
- **Complaint Management:** Submit, assign, review, and resolve complaints.
- **Complaint Tracking:** Track grievances using unique tracking IDs.
- **Evidence Attachments:** Upload supporting documents and images.
- **Notifications:** Receive alerts about complaint assignments and status updates.
- **Feedback System:** Submit ratings and remarks after complaint resolution.
- **Analytics Dashboard:** View complaint statistics and reports.
- **CSV Export:** Export complaint and feedback data.

### Complaint Lifecycle

`SUBMITTED → UNDER REVIEW → ASSIGNED → IN PROGRESS → RESOLVED → CLOSED`

The system also supports reopening complaints when required.

---

## 🛠️ Technology Stack

| Category | Technologies |
|---|---|
| Frontend | HTML5, CSS3, JavaScript, EJS |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas / Local MongoDB |
| ODM | Mongoose |
| Authentication | Bcrypt.js, Express Sessions |
| Session Storage | Connect-Mongo |
| Security | Helmet, CORS, Express Rate Limit |
| Validation | Express Validator |
| File Uploads | Multer |
| Charts | Chart.js |
| Reporting | JSON2CSV |

---

## 📂 Project Structure

```text
campus-complaint-management-system/
│
├── config/
│   ├── db.js
│   └── constants.js
│
├── controllers/
│   ├── authController.js
│   ├── studentController.js
│   ├── staffController.js
│   ├── adminController.js
│   └── notificationController.js
│
├── middleware/
│   ├── auth.js
│   ├── upload.js
│   ├── validator.js
│   └── errorHandler.js
│
├── models/
│   ├── User.js
│   ├── Complaint.js
│   ├── Department.js
│   ├── Feedback.js
│   └── Notification.js
│
├── routes/
│   ├── indexRoutes.js
│   ├── authRoutes.js
│   ├── studentRoutes.js
│   ├── staffRoutes.js
│   ├── adminRoutes.js
│   └── notificationRoutes.js
│
├── utils/
│   ├── idGenerator.js
│   ├── csvExporter.js
│   └── seeder.js
│
├── views/
│   ├── partials/
│   ├── auth/
│   ├── student/
│   ├── staff/
│   ├── admin/
│   ├── index.ejs
│   ├── track.ejs
│   ├── 404.ejs
│   └── 500.ejs
│
├── public/
│   ├── css/
│   ├── js/
│   ├── images/
│   └── uploads/
│
├── test.js
├── .env.example
├── package.json
└── server.js
```

---

## ⚙️ Installation and Setup

### 1. Prerequisites

Install the following software:

- Node.js (v18 or higher)
- npm
- MongoDB Atlas account or local MongoDB installation
- Visual Studio Code (recommended)

### 2. Clone the Repository

```bash
git clone https://github.com/hasinidudyala-sketch/campus-complaint-management-system.git
```

If you are working with an existing downloaded folder, open that folder directly instead.

### 3. Navigate to the Project

```bash
cd campus-complaint-management-system
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Configure Environment Variables

Create a `.env` file in the root project directory.

Add the following configuration:

```env
PORT=5000
NODE_ENV=development

MONGODB_URI=mongodb://127.0.0.1:27017/campuscare_vfstr

SESSION_SECRET=replace_with_a_long_random_secret
JWT_SECRET=replace_with_another_long_random_secret

COLLEGE_NAME=VFSTR Hyderabad Campus
APP_NAME=CampusCare
```

For MongoDB Atlas, replace the local MongoDB URI with your Atlas connection string.

**Important:** Never upload your actual `.env` file, database password, or secret keys to GitHub.

### 6. Seed Initial Data (Optional)

```bash
npm run seed
```

This command runs the project's database seeding script if configured.

### 7. Start the Application

```bash
npm start
```

For development:

```bash
npm run dev
```

### 8. Open in Browser

```text
http://localhost:5000
```

---

## 🔑 Demonstration Login Credentials

The project documentation provides the following demonstration accounts. These credentials are intended for local testing only.

| Role | Email | Password |
|---|---|---|
| Administrator | admin@vfstr.ac.in | Admin@123 |
| Staff (CSE) | staff.cse@vfstr.ac.in | Staff@123 |
| Staff (Maintenance) | staff.maint@vfstr.ac.in | Staff@123 |
| Staff (Hostel) | staff.hostel@vfstr.ac.in | Staff@123 |
| Student 1 | student1@vfstr.ac.in | Student@123 |
| Student 2 | student2@vfstr.ac.in | Student@123 |

Use these accounts only if the corresponding demo records have been created in your database.

---

## 🧪 Testing

Run the automated test suite using:

```bash
npm test
```

The included test suite is intended to verify functionality such as:

1. MongoDB connection
2. Student registration
3. Student login
4. Staff login
5. Administrator login
6. Invalid login handling
7. Logout functionality
8. Protected routes
9. Role-based access control
10. Complaint submission
11. Public complaint tracking
12. File upload validation
13. Department and staff management
14. Complaint status updates
15. Resolution details
16. Student feedback
17. Notifications
18. User status management
19. Department configuration
20. Dashboard analytics
21. Search and filtering
22. CSV report generation
23. Campus branding
24. Error handling
25. Database persistence

---

## 📄 Project Documentation

The repository includes supporting documentation:

- `PROJECT_DOCUMENTATION.md` – Project overview, objectives, and architecture.
- `DATABASE_SCHEMA.md` – Database structure and schemas.
- `API_DOCUMENTATION.md` – Application routes and API details.
- `INSTALLATION_GUIDE.md` – Setup instructions.
- `TESTING_REPORT.md` – Testing documentation.

---

## 🎯 Project Objectives

- Digitize the campus complaint management process.
- Make complaint submission easier for students.
- Improve communication between students, staff, and administrators.
- Provide transparent complaint tracking.
- Maintain organized complaint records.
- Support efficient grievance resolution.
- Provide useful reports and analytics.

---

## 🔮 Future Enhancements

- Email and SMS notifications.
- AI-based complaint categorization.
- Priority prediction for submitted complaints.
- Advanced analytics and reporting.
- Mobile-friendly application improvements.
- Cloud deployment and production database hosting.

---

## 🏛️ Application Context

**Institution:** Vignan's Foundation for Science, Technology & Research (VFSTR)  
**Campus:** Hyderabad, Telangana, India  
**Project:** CampusCare – Complaint Redressal Management System

---

## 📬 Contact

**Hasini Dudyala**

GitHub: https://github.com/hasinidudyala-sketch

Email: hasinidudyala@gmail.com

---

*CampusCare – Making campus grievance management simpler, organized, and more transparent.*