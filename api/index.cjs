const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('../server/config/db');
const errorHandler = require('../server/middleware/errorHandler');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect DB middleware for Serverless environment
app.use(async (req, res, next) => {
  if (req.path === '/api/health') return next();
  try {
    await connectDB();
    if (mongoose.connection.readyState < 1) {
      return res.status(503).json({
        message: 'Database connection is not ready. Please verify MongoDB Atlas IP Whitelist (0.0.0.0/0) and credentials.'
      });
    }
    next();
  } catch (err) {
    console.error('DB connection error in serverless function:', err);
    return res.status(503).json({
      message: `Database Connection Error: ${err.message}. Ensure MongoDB Atlas Network Access allows 0.0.0.0/0.`
    });
  }
});

// API Routes
app.use('/api/auth', require('../server/routes/authRoutes'));
app.use('/api/categories', require('../server/routes/categoryRoutes'));
app.use('/api/transactions', require('../server/routes/transactionRoutes'));
app.use('/api/budgets', require('../server/routes/budgetRoutes'));
app.use('/api/dashboard', require('../server/routes/dashboardRoutes'));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    dbState: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    env: process.env.NODE_ENV
  });
});

app.use(errorHandler);

module.exports = app;
