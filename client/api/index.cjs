const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database Connection
const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI environment variable is missing in Vercel settings.');
  }
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
};

app.use(async (req, res, next) => {
  if (req.path === '/api/health') return next();
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Vercel DB connection error:', err.message);
    return res.status(503).json({
      message: `Database Connection Error: ${err.message}. Ensure MONGODB_URI is set in Vercel and MongoDB Atlas Network Access allows 0.0.0.0/0.`
    });
  }
});

// Import routes
const authRoutes = require('../server/routes/authRoutes');
const categoryRoutes = require('../server/routes/categoryRoutes');
const transactionRoutes = require('../server/routes/transactionRoutes');
const budgetRoutes = require('../server/routes/budgetRoutes');
const dashboardRoutes = require('../server/routes/dashboardRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    dbState: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    env: process.env.NODE_ENV
  });
});

app.use(require('../server/middleware/errorHandler'));

module.exports = app;
