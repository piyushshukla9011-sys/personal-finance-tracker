const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('../server/config/db');
const errorHandler = require('../server/middleware/errorHandler');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect DB middleware for Serverless environment
app.use(async (req, res, next) => {
  try {
    await connectDB();
  } catch (err) {
    console.error('DB connection error in serverless function:', err);
  }
  next();
});

// API Routes
app.use('/api/auth', require('../server/routes/authRoutes'));
app.use('/api/categories', require('../server/routes/categoryRoutes'));
app.use('/api/transactions', require('../server/routes/transactionRoutes'));
app.use('/api/budgets', require('../server/routes/budgetRoutes'));
app.use('/api/dashboard', require('../server/routes/dashboardRoutes'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date(), env: process.env.NODE_ENV });
});

app.use(errorHandler);

module.exports = app;
