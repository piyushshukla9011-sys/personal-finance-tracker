# 🌐 Step-by-Step Hosting Guide (Vercel / Render)

Follow this guide to deploy your **Personal Finance Tracker** full-stack web application:

---

## ⚡ Option A: Deploy Entire Full-Stack App on Vercel (Recommended & Fast)

Your repository is now pre-configured for full-stack Vercel serverless deployment (`api/index.js` + `vercel.json`).

### 1. Set Up MongoDB Atlas (Cloud Database)
1. Sign up / log in at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free shared cluster (`M0`).
3. Under **Network Access**, add IP `0.0.0.0/0` (Allow access from anywhere).
4. Under **Database Access**, create a user (e.g. `admin`, password: `your_password`).
5. Copy your connection string:
   `mongodb+srv://admin:<password>@cluster0.mongodb.net/finance-tracker?retryWrites=true&w=majority`

### 2. Push Changes to GitHub
```bash
git add .
git commit -m "Add full-stack Vercel serverless configuration"
git push origin main
```

### 3. Configure Vercel Project
1. Log in to [Vercel](https://vercel.com) and go to your project (`personal-finance-tracker`).
2. Go to **Settings** -> **Environment Variables** and add:
   - `MONGODB_URI` = `mongodb+srv://admin:<password>@cluster0.mongodb.net/finance-tracker?retryWrites=true&w=majority`
   - `JWT_SECRET` = `your_super_secret_jwt_key_2026`
   - `NODE_ENV` = `production`
3. Go to **Deployments** tab -> click `Redeploy`.

Your site and backend `/api` routes will be live on `https://personal-finance-tracker-two-umber.vercel.app`!

---

## 🌐 Option B: Deploy Backend on Render + Frontend on Vercel

If you host your Node.js backend on **Render.com**:
1. Deploy `server/` folder to Render.
2. In Vercel Project Settings -> **Environment Variables**, add:
   - `VITE_API_URL` = `https://<your-render-backend-name>.onrender.com/api`
3. Redeploy on Vercel.

