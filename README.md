# 💎 FinanceFlow - Personal Finance Tracker

A full-stack Personal Finance Tracker web application designed to track income and expenses, set monthly category budgets with automated warning alerts, and visualize financial spending habits through interactive charts.

---

## 🚀 Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Recharts, Lucide Icons, Axios, React Router DOM v6
- **Backend**: Node.js, Express, Mongoose (MongoDB ODM), JWT, bcryptjs, Cors, dotenv
- **Database**: MongoDB (with automatic `mongodb-memory-server` fallback for zero-configuration execution)

---

## ✨ Features

1. **JWT Authentication & Protected Session**
   - User Registration & Login with bcrypt password hashing.
   - 1-Click Demo Login button for fast showcase.
   - Protected routes with authorization interceptors.

2. **Transactions Management (Full CRUD)**
   - Add, edit, and delete income & expense transactions.
   - Multi-filter controls: Filter by transaction type (`income` / `expense`), category, and date range.
   - Live search by note/description.
   - Server-side pagination.
   - **CSV Data Export**: Export transactions based on current filter selection.

3. **Monthly Category Budgets & Alerts**
   - Set monthly spending limits per category.
   - Real-time progress bars calculating percentage of budget used.
   - **Threshold Highlights**:
     - 🟡 **Amber Warning Badge** when category spending reaches **≥ 80%**.
     - 🔴 **Red Exceeded Alert Badge** when category spending reaches **≥ 100%**.

4. **Interactive Dashboard**
   - Monthly Summary Metrics: Total Income, Total Expenses, Net Savings Balance.
   - **Spending by Category**: Interactive Recharts Pie Chart.
   - **Income vs Expense Trends**: 6-Month historical cashflow Recharts Bar Chart.
   - Recent Transactions list with quick status icons.

5. **Categories**
   - System predefined categories (Salary, Freelance, Food, Rent, Shopping, Entertainment, etc.).
   - Ability to add custom user categories with custom color accents.

---

## 📁 Monorepo Folder Structure

```text
personal-finance-tracker/
├── package.json              # Monorepo root orchestrator (concurrently)
├── README.md                 # Project documentation & setup instructions
├── server/                   # Express API Backend
│   ├── config/               # Database connection (with MongoDB Memory Server fallback)
│   ├── middleware/           # Auth JWT & Global error handler
│   ├── models/               # User, Category, Transaction, Budget Mongoose models
│   ├── routes/               # API route handlers
│   ├── seed.js               # Seed script for demo data & user
│   ├── server.js             # Express app entry point
│   ├── .env.example          # Environment variables template
│   └── package.json
└── client/                   # React + Vite + Tailwind CSS Frontend
    ├── src/
    │   ├── api/              # Axios client instance & auth interceptor
    │   ├── components/       # Layout, Header, Sidebar, TransactionModal
    │   ├── context/          # AuthContext & ToastContext
    │   ├── pages/            # Login, Register, Dashboard, Transactions, Budgets, Categories
    │   ├── App.jsx           # Main router
    │   └── index.css         # Tailwind & custom glassmorphism styles
    ├── vite.config.js        # API proxy to http://localhost:5000
    └── package.json
```

---

## 🛠️ Installation & Setup Guide

### 1. Clone & Install Dependencies

Run the monorepo installer to install packages for root, server, and client concurrently:

```bash
npm run install:all
```

### 2. Environment Variables

The backend uses environment variables specified in `server/.env`. A pre-configured `.env` is included:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/finance-tracker
JWT_SECRET=super_secret_jwt_key_finance_tracker_2026
NODE_ENV=development
```

> 💡 **Zero Setup Note**: If a local MongoDB instance is not running on port 27017, the application automatically falls back to an in-memory MongoDB database (`mongodb-memory-server`).

### 3. Seed Demo Data

Populate the database with predefined categories, 6 months of sample income/expense transactions, monthly budget allocations, and the demo user account:

```bash
npm run seed
```

### 4. Run Application (Concurrently)

Start both the backend Express API (Port `5000`) and the Vite React frontend (Port `3000`) concurrently:

```bash
npm run dev
```

Open your browser at: **[http://localhost:3000](http://localhost:3000)**

---

## 🔑 Demo Account Credentials

You can sign in using the **1-Click Demo Login** button on the login screen or manually enter:

- **Email**: `demo@finance.com`
- **Password**: `password123`

---

## 📡 API Endpoints Reference

| Method | Endpoint | Description | Protected |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register a new user | Public |
| `POST` | `/api/auth/login` | Authenticate user & receive JWT token | Public |
| `GET` | `/api/auth/me` | Fetch current logged-in user profile | Yes |
| `GET` | `/api/transactions` | Fetch paginated & filtered transactions | Yes |
| `POST` | `/api/transactions` | Create a new transaction | Yes |
| `PUT` | `/api/transactions/:id` | Update an existing transaction | Yes |
| `DELETE` | `/api/transactions/:id` | Delete a transaction | Yes |
| `GET` | `/api/transactions/export/csv` | Download transactions as CSV file | Yes |
| `GET` | `/api/categories` | Fetch system predefined & user custom categories | Yes |
| `POST` | `/api/categories` | Add a new custom category | Yes |
| `GET` | `/api/budgets` | Fetch monthly budgets with spending calculations & alert status | Yes |
| `POST` | `/api/budgets` | Create or update category monthly budget limit | Yes |
| `GET` | `/api/dashboard/summary` | Fetch dashboard metrics, pie chart & 6-month trends data | Yes |

---

## 📄 License

MIT License. Built for Personal Finance Management.
