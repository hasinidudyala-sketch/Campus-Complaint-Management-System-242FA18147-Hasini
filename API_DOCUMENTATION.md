# CAMPUSCARE – REST ROUTE & CONTROLLER SPECIFICATION
## VFSTR HYDERABAD CAMPUS COMPLAINT MANAGEMENT SYSTEM

---

## 1. Authentication & Session Endpoints

| HTTP Method | Route | Access Level | Description | Request Body / Parameters |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/auth/login` | Public (Unauthenticated) | Render member sign-in page | None |
| `POST` | `/auth/login` | Public (Unauthenticated) | Validate credentials & create session | `{ email, password }` |
| `GET` | `/auth/register` | Public (Unauthenticated) | Render student registration form | None |
| `POST` | `/auth/register` | Public (Unauthenticated) | Register new student account | `{ fullName, email, password, confirmPassword, regNo, phone, department }` |
| `GET` | `/auth/logout` | Authenticated (Any) | Destroy session & redirect | None |
| `GET` | `/auth/forgot-password`| Public | Render password reset request form | None |
| `POST`| `/auth/forgot-password`| Public | Generate reset token | `{ email }` |
| `GET` | `/auth/reset-password/:token` | Public | Render new password entry form | `:token` (URL parameter) |
| `POST`| `/auth/reset-password/:token` | Public | Update password & invalidate token | `{ password, confirmPassword }` |

---

## 2. Public Endpoints

| HTTP Method | Route | Access Level | Description | Request Body / Parameters |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | Public | CampusCare modern landing page with live institutional stats | None |
| `GET` | `/track` | Public | Quick grievance status tracking portal | Query: `?complaintId=CC-2026-XXXX` |

---

## 3. Student Portal Endpoints (`/student/*`)
*Guarded by `ensureAuthenticated` & `authorizeRoles('STUDENT')`*

| HTTP Method | Route | Description | Request Body / Parameters |
| :--- | :--- | :--- | :--- |
| `GET` | `/student/dashboard` | Student dashboard overview, recent complaints, stats cards | None |
| `GET` | `/student/submit-complaint` | Grievance registration form | None |
| `POST` | `/student/submit-complaint` | Lodge grievance with Multer attachments | `multipart/form-data`: `{ title, description, category, department, priority, attachments[] }` |
| `GET` | `/student/complaints` | My Complaints table with search & filters | Query: `?search=&status=&category=&priority=` |
| `GET` | `/student/complaint/:id` | View complaint details, attachments, and timeline | `:id` (Complaint MongoDB ObjectId) |
| `POST` | `/student/complaint/:id/feedback` | Submit 1–5 star rating & review | `{ rating, description }` |
| `GET` | `/student/notifications` | View student alerts list | None |
| `GET` | `/student/profile` | View profile information | None |
| `POST` | `/student/profile/update` | Update personal info & profile picture | `multipart/form-data`: `{ fullName, phone, profileImage }` |
| `POST` | `/student/profile/change-password` | Update account password | `{ currentPassword, newPassword, confirmPassword }` |

---

## 4. Staff / Faculty Endpoints (`/staff/*`)
*Guarded by `ensureAuthenticated` & `authorizeRoles('STAFF')`*

| HTTP Method | Route | Description | Request Body / Parameters |
| :--- | :--- | :--- | :--- |
| `GET` | `/staff/dashboard` | Staff action center, assigned metrics, urgent alerts | None |
| `GET` | `/staff/complaints` | Filtered list of assigned complaints | Query: `?search=&status=&priority=` |
| `GET` | `/staff/complaint/:id` | View assigned complaint, student context, and action form | `:id` (Complaint MongoDB ObjectId) |
| `POST` | `/staff/complaint/:id/update-status` | Update progress, add remarks, or mark resolved | `{ status, staffRemarks, resolutionDetails }` |
| `GET` | `/staff/notifications` | View assigned task alerts | None |
| `GET` | `/staff/profile` | View staff profile & department | None |
| `POST` | `/staff/profile/update` | Update designation & contact details | `multipart/form-data`: `{ fullName, phone, designation, profileImage }` |
| `POST` | `/staff/profile/change-password` | Update staff password | `{ currentPassword, newPassword, confirmPassword }` |

---

## 5. Campus Administrator Endpoints (`/admin/*`)
*Guarded by `ensureAuthenticated` & `authorizeRoles('ADMIN')`*

| HTTP Method | Route | Description | Request Body / Parameters |
| :--- | :--- | :--- | :--- |
| `GET` | `/admin/dashboard` | Main analytics dashboard, Chart.js visualizations | None |
| `GET` | `/admin/complaints` | Master directory of all campus grievances | Query: `?search=&department=&status=&priority=&category=` |
| `GET` | `/admin/complaint/:id` | Detailed complaint review & administrative delegation | `:id` (Complaint ObjectId) |
| `POST` | `/admin/complaint/:id/assign` | Assign department, assign staff member, set priority | `{ departmentId, staffId, priority, adminRemarks }` |
| `POST` | `/admin/complaint/:id/update-status`| Administrative override of grievance pipeline status | `{ status, adminRemarks }` |
| `GET` | `/admin/departments` | Manage campus departments & HODs | None |
| `POST` | `/admin/departments` | Create new department | `{ name, code, description, head }` |
| `POST` | `/admin/departments/:id/edit` | Edit existing department | `{ name, code, description, head, isActive }` |
| `GET` | `/admin/staff` | Staff directory & active counts | None |
| `POST` | `/admin/staff` | Securely provision a new staff account | `{ fullName, email, password, phone, department, designation }` |
| `POST` | `/admin/staff/:id/toggle-status` | Activate or deactivate staff member | None |
| `GET` | `/admin/students` | Enrolled student directory & search | Query: `?search=&department=&status=` |
| `POST` | `/admin/students/:id/toggle-status` | Toggle student status (Active / Suspended)| None |
| `GET` | `/admin/feedback` | View student ratings & satisfaction breakdown | None |
| `GET` | `/admin/reports` | View department performance matrix | None |
| `GET` | `/admin/reports/export-complaints` | Stream downloadable CSV of all grievances | None (Returns `text/csv`) |
| `GET` | `/admin/reports/export-feedback` | Stream downloadable CSV of student feedback | None (Returns `text/csv`) |
| `GET` | `/admin/notifications` | View administrative alerts | None |
| `GET` | `/admin/profile` | Super-admin profile settings | None |

---

## 6. Shared Notification Endpoints (`/notifications/*`)
*Guarded by `ensureAuthenticated`*

| HTTP Method | Route | Description | Response |
| :--- | :--- | :--- | :--- |
| `POST` | `/notifications/:id/mark-read` | Mark single notification as read | Redirect back or JSON `{ success: true }` |
| `POST` | `/notifications/mark-all-read` | Mark all user notifications as read | Redirect back or JSON `{ success: true }` |
| `POST` | `/notifications/:id/delete` | Delete notification from user inbox | Redirect back or JSON `{ success: true }` |

