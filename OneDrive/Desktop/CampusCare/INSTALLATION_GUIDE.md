# CAMPUSCARE – STEP-BY-STEP INSTALLATION & DEPLOYMENT GUIDE
## VFSTR HYDERABAD CAMPUS COMPLAINT MANAGEMENT SYSTEM

---

## 1. System Requirements

Before beginning the installation, ensure the following tools are available on the host machine:

- **Operating System**: Windows 10/11, macOS, or Linux (Ubuntu 20.04+)
- **Node.js**: v18.0.0 or higher (`node -v`)
- **NPM**: v9.0.0 or higher (`npm -v`)
- **Database**:
  - **MongoDB Atlas** (Cloud-hosted free tier recommended for submissions) **OR**
  - **Local MongoDB Community Server** (`v6.0+`) running on `mongodb://127.0.0.1:27017`

---

## 2. Step-by-Step Setup Instructions

### Step 1: Open Terminal & Navigate to Project
```bash
cd CampusCare
```

### Step 2: Install Required Dependencies
Run `npm install` to install all packages declared in `package.json`:
```bash
npm install
```

### Step 3: Configure Environment Variables
Copy `.env.example` to create your active `.env` file:

**On Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```
**On Linux / macOS:**
```bash
cp .env.example .env
```

Open `.env` in any text editor and adjust the parameters:
```ini
PORT=5000
NODE_ENV=development

# MongoDB Connection String (Atlas or Local)
MONGODB_URI=mongodb://127.0.0.1:27017/campuscare_vfstr

# Cryptographic Session & JWT Secrets
SESSION_SECRET=campuscare_vfstr_super_secret_session_key_2026
JWT_SECRET=campuscare_vfstr_jwt_secret_token_key_2026

# Institution Info
COLLEGE_NAME=VFSTR Hyderabad Campus
APP_NAME=CampusCare
```

---

## 3. Connecting to MongoDB Atlas (Cloud Database)

To connect CampusCare to a live MongoDB Atlas cloud database:

1. Sign in or register at [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create a free shared cluster (M0 sandbox).
3. Under **Database Access**, create a user with read and write permissions (e.g. `campuscare_admin` and a strong password).
4. Under **Network Access**, add IP Address `0.0.0.0/0` (Allow Access from Anywhere) for testing.
5. In your cluster dashboard, click **Connect** ➔ **Drivers** (Node.js).
6. Copy the connection string format:
   ```text
   mongodb+srv://campuscare_admin:<password>@cluster0.xxxx.mongodb.net/campuscare?retryWrites=true&w=majority
   ```
7. Paste this connection string into your `.env` file under `MONGODB_URI`, replacing `<password>` with your database user password.

---

## 4. Database Seeding (Populate Demonstration Data)

To populate the system with standard VFSTR departments, administration accounts, staff members, demo students, and sample complaints with complete audit history:

```bash
npm run seed
```

> **Note**: The application also includes an automated check on boot—if the database contains zero admin records, it seeds essential records automatically!

---

## 5. Running the Application

### Development Mode:
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

### Run Full Test Suite:
```bash
npm test
```

Once started, open your web browser and navigate to:
👉 **`http://localhost:5000`**

---

## 6. Default Login Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Administrator** | `admin@vfstr.ac.in` | `Admin@123` |
| **Staff (CSE)** | `staff.cse@vfstr.ac.in` | `Staff@123` |
| **Staff (Maintenance)** | `staff.maint@vfstr.ac.in` | `Staff@123` |
| **Staff (Hostel)** | `staff.hostel@vfstr.ac.in` | `Staff@123` |
| **Student 1** | `student1@vfstr.ac.in` | `Student@123` |
| **Student 2** | `student2@vfstr.ac.in` | `Student@123` |

*(Note: The login page also features one-click buttons to autofill these credentials during your project demonstration!)*

---

## 7. Troubleshooting & FAQ

#### Q: Error `EADDRINUSE: address already in use :::5000`
Another process is using port 5000. In `.env`, change `PORT=5000` to `PORT=5002` or `PORT=8080`, then restart the server.

#### Q: Multer uploads fail or permissions denied
Verify that `public/uploads/complaints` and `public/uploads/profiles` directories exist. The app automatically creates them on boot.

#### Q: How to reset the database to a clean state?
Run `npm run seed`. This purges old test data and seeds fresh demonstration accounts and grievances.

