# 🌐 Step-by-Step Hosting Guide (Render + Vercel)

Follow this guide to deploy your **Personal Finance Tracker** full-stack monorepo for free:
- **Database**: MongoDB Atlas (Free Cloud Database)
- **Backend API**: Render (Free Web Service)
- **Frontend App**: Vercel (Free Static / Single Page App Hosting)

---

## Step 1: Set Up MongoDB Atlas (Cloud Database)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign up / log in.
2. Click **Create Cluster** (Choose the **Free Shared M0** tier).
3. In **Network Access**, click **Add IP Address** -> Select **Allow Access From Anywhere** (`0.0.0.0/0`).
4. In **Database Access**, create a database user (e.g., username: `admin`, password: `your_secure_password`).
5. Click **Connect** -> **Drivers** -> Copy your MongoDB Connection String:
   `mongodb+srv://admin:<password>@cluster0.mongodb.net/finance-tracker?retryWrites=true&w=majority`

---

## Step 2: Push Project to GitHub

1. Initialize git and commit your code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Personal Finance Tracker"
   ```
2. Create a new repository on [GitHub](https://github.com/new).
3. Push your repository:
   ```bash
   git remote add origin https://github.com/<your-username>/personal-finance-tracker.git
   git branch -M main
   git push -u origin main
   ```

---

## Step 3: Deploy Backend API on Render

1. Sign up / log in at [Render.com](https://render.com).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository (`personal-finance-tracker`).
4. Configure settings:
   - **Name**: `finance-tracker-api`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. Add **Environment Variables**:
   - `MONGODB_URI` = `mongodb+srv://admin:<password>@cluster0.mongodb.net/finance-tracker?retryWrites=true&w=majority`
   - `JWT_SECRET` = `your_custom_super_secret_jwt_key_2026`
   - `NODE_ENV` = `production`
6. Click **Create Web Service**.
7. Once deployed, Render will give you a backend URL (e.g., `https://finance-tracker-api.onrender.com`). Copy this URL!

---

## Step 4: Seed Cloud Database (Optional)

To seed your production database on MongoDB Atlas with demo data:

From your local machine terminal:
1. Update `server/.env` with your cloud `MONGODB_URI`.
2. Run:
   ```bash
   npm run seed
   ```

---

## Step 5: Deploy Frontend React App on Vercel

1. Sign up / log in at [Vercel.com](https://vercel.com).
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository (`personal-finance-tracker`).
4. Configure Project Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click **Edit** and select `client`.
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add **Environment Variables**:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://finance-tracker-api.onrender.com/api` *(Your Render backend URL + `/api`)*
6. Click **Deploy**.

---

## 🎉 Done!

Your website is live globally:
- **Frontend App**: `https://personal-finance-tracker.vercel.app`
- **Backend API**: `https://finance-tracker-api.onrender.com`
