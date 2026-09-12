const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- MODELS ---
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true },
    email: { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true },
    password: { type: String, required: [true, 'Password is required'], minlength: 6, select: false },
    country: { type: String, default: 'United States' },
    currency: { type: String, default: 'USD' },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.models.User || mongoose.model('User', userSchema);

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Category name is required'], trim: true },
    type: { type: String, enum: ['income', 'expense', 'both'], default: 'expense' },
    isPredefined: { type: Boolean, default: false },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    icon: { type: String, default: 'Tag' },
    color: { type: String, default: '#64748b' },
  },
  { timestamps: true }
);
const Category = mongoose.models.Category || mongoose.model('Category', categorySchema);

const transactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['income', 'expense'], required: true },
    amount: { type: Number, required: true, min: 0.01 },
    category: { type: String, required: true, trim: true },
    note: { type: String, trim: true, default: '' },
    date: { type: Date, required: true, default: Date.now, index: true },
  },
  { timestamps: true }
);
const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);

const budgetSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: { type: String, required: true, trim: true },
    monthlyLimit: { type: Number, required: true, min: 1 },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
  },
  { timestamps: true }
);
budgetSchema.index({ userId: 1, category: 1, month: 1, year: 1 }, { unique: true });
const Budget = mongoose.models.Budget || mongoose.model('Budget', budgetSchema);

// --- MIDDLEWARE ---
const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not set in Vercel Environment Variables');
  }
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
};

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'super_secret_jwt_key_finance_tracker_2026', {
    expiresIn: '30d',
  });
};

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_finance_tracker_2026');
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) return res.status(401).json({ message: 'Not authorized, user not found' });
      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }
  return res.status(401).json({ message: 'Not authorized, no token provided' });
};

app.use(async (req, res, next) => {
  if (req.path.includes('/health')) return next();
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Vercel DB Error:', err.message);
    return res.status(503).json({
      message: `Database Error: ${err.message}. Please check MONGODB_URI in Vercel settings and allow 0.0.0.0/0 in MongoDB Atlas Network Access.`
    });
  }
});

// --- HEALTH CHECK ---
app.all(['/api/health', '/health'], (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    dbState: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    hasMongoUri: !!process.env.MONGODB_URI,
    env: process.env.NODE_ENV
  });
});

// --- AUTH ROUTES ---
app.post(['/api/auth/register', '/auth/register'], async (req, res, next) => {
  try {
    const { name, email, password, country, currency } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Please provide all required fields' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) return res.status(400).json({ message: 'User already exists with this email' });

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      country: country || 'United States',
      currency: currency || 'USD',
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      country: user.country,
      currency: user.currency,
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
});

app.post(['/api/auth/login', '/auth/login'], async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Please provide email and password' });

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      country: user.country || 'United States',
      currency: user.currency || 'USD',
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
});

app.get(['/api/auth/me', '/auth/me'], protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      country: user.country || 'United States',
      currency: user.currency || 'USD',
      createdAt: user.createdAt,
    });
  } catch (error) {
    next(error);
  }
});

app.put(['/api/auth/profile', '/auth/profile'], protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const { name, country, currency } = req.body;
    if (name) user.name = name;
    if (country) user.country = country;
    if (currency) user.currency = currency;
    const updatedUser = await user.save();
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      country: updatedUser.country,
      currency: updatedUser.currency,
    });
  } catch (error) {
    next(error);
  }
});

// --- CATEGORY ROUTES ---
const DEFAULT_CATEGORIES = [
  { name: 'Salary', type: 'income', isPredefined: true, icon: 'Wallet', color: '#10b981' },
  { name: 'Freelance', type: 'income', isPredefined: true, icon: 'Briefcase', color: '#06b6d4' },
  { name: 'Investments', type: 'income', isPredefined: true, icon: 'TrendingUp', color: '#8b5cf6' },
  { name: 'Gift / Bonus', type: 'income', isPredefined: true, icon: 'Gift', color: '#f59e0b' },
  { name: 'Food & Dining', type: 'expense', isPredefined: true, icon: 'Utensils', color: '#ef4444' },
  { name: 'Rent & Housing', type: 'expense', isPredefined: true, icon: 'Home', color: '#3b82f6' },
  { name: 'Shopping', type: 'expense', isPredefined: true, icon: 'ShoppingBag', color: '#ec4899' },
  { name: 'Transportation', type: 'expense', isPredefined: true, icon: 'Car', color: '#f97316' },
  { name: 'Entertainment', type: 'expense', isPredefined: true, icon: 'Film', color: '#a855f7' },
  { name: 'Utilities & Bills', type: 'expense', isPredefined: true, icon: 'Zap', color: '#eab308' },
  { name: 'Healthcare', type: 'expense', isPredefined: true, icon: 'HeartPulse', color: '#14b8a6' },
  { name: 'Travel', type: 'expense', isPredefined: true, icon: 'Plane', color: '#6366f1' },
  { name: 'Education', type: 'expense', isPredefined: true, icon: 'GraduationCap', color: '#0284c7' },
  { name: 'Miscellaneous', type: 'expense', isPredefined: true, icon: 'MoreHorizontal', color: '#64748b' },
];

app.get(['/api/categories', '/categories'], protect, async (req, res, next) => {
  try {
    let categories = await Category.find({
      $or: [{ isPredefined: true }, { userId: req.user._id }],
    }).sort({ isPredefined: -1, name: 1 });

    if (categories.length === 0) {
      await Category.insertMany(DEFAULT_CATEGORIES);
      categories = await Category.find({
        $or: [{ isPredefined: true }, { userId: req.user._id }],
      }).sort({ isPredefined: -1, name: 1 });
    }

    res.json(categories);
  } catch (error) {
    next(error);
  }
});

app.post(['/api/categories', '/categories'], protect, async (req, res, next) => {
  try {
    const { name, type, icon, color } = req.body;
    if (!name) return res.status(400).json({ message: 'Category name is required' });

    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      $or: [{ isPredefined: true }, { userId: req.user._id }],
    });

    if (existingCategory) return res.status(400).json({ message: 'Category with this name already exists' });

    const category = await Category.create({
      name: name.trim(),
      type: type || 'expense',
      isPredefined: false,
      userId: req.user._id,
      icon: icon || 'Tag',
      color: color || '#3b82f6',
    });

    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
});

// --- TRANSACTION ROUTES ---
app.get(['/api/transactions/export/csv', '/transactions/export/csv'], protect, async (req, res, next) => {
  try {
    const { type, category, startDate, endDate, search } = req.query;
    const query = { userId: req.user._id };

    if (type && type !== 'all') query.type = type;
    if (category && category !== 'all') query.category = category;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }
    if (search) {
      query.$or = [{ note: { $regex: search, $options: 'i' } }, { category: { $regex: search, $options: 'i' } }];
    }

    const transactions = await Transaction.find(query).sort({ date: -1 });

    let csvContent = 'ID,Date,Type,Category,Amount,Note\n';
    transactions.forEach((t) => {
      const formattedDate = new Date(t.date).toISOString().split('T')[0];
      const escapedNote = `"${(t.note || '').replace(/"/g, '""')}"`;
      const escapedCategory = `"${(t.category || '').replace(/"/g, '""')}"`;
      csvContent += `${t._id},${formattedDate},${t.type},${escapedCategory},${t.amount},${escapedNote}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=transactions_${Date.now()}.csv`);
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
});

app.get(['/api/transactions', '/transactions'], protect, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const { type, category, startDate, endDate, search } = req.query;

    const query = { userId: req.user._id };
    if (type && type !== 'all') query.type = type;
    if (category && category !== 'all') query.category = category;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }
    if (search) {
      query.$or = [{ note: { $regex: search, $options: 'i' } }, { category: { $regex: search, $options: 'i' } }];
    }

    const totalCount = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query).sort({ date: -1, createdAt: -1 }).skip(skip).limit(limit);

    res.json({
      transactions,
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit) || 1,
    });
  } catch (error) {
    next(error);
  }
});

app.post(['/api/transactions', '/transactions'], protect, async (req, res, next) => {
  try {
    const { type, amount, category, note, date } = req.body;
    if (!type || !amount || !category) return res.status(400).json({ message: 'Type, amount, and category are required' });
    if (!['income', 'expense'].includes(type)) return res.status(400).json({ message: 'Type must be income or expense' });
    if (amount <= 0) return res.status(400).json({ message: 'Amount must be greater than 0' });

    const transaction = await Transaction.create({
      userId: req.user._id,
      type,
      amount: Number(amount),
      category: category.trim(),
      note: note ? note.trim() : '',
      date: date ? new Date(date) : new Date(),
    });

    res.status(201).json(transaction);
  } catch (error) {
    next(error);
  }
});

app.put(['/api/transactions/:id', '/transactions/:id'], protect, async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    if (transaction.userId.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });

    const { type, amount, category, note, date } = req.body;
    if (type) transaction.type = type;
    if (amount !== undefined) transaction.amount = Number(amount);
    if (category) transaction.category = category.trim();
    if (note !== undefined) transaction.note = note.trim();
    if (date) transaction.date = new Date(date);

    const updatedTransaction = await transaction.save();
    res.json(updatedTransaction);
  } catch (error) {
    next(error);
  }
});

app.delete(['/api/transactions/:id', '/transactions/:id'], protect, async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    if (transaction.userId.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });
    await transaction.deleteOne();
    res.json({ message: 'Transaction removed' });
  } catch (error) {
    next(error);
  }
});

// --- BUDGET ROUTES ---
app.get(['/api/budgets', '/budgets'], protect, async (req, res, next) => {
  try {
    const now = new Date();
    const month = parseInt(req.query.month, 10) || now.getMonth() + 1;
    const year = parseInt(req.query.year, 10) || now.getFullYear();

    const budgets = await Budget.find({ userId: req.user._id, month, year });
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const expenseAggregates = await Transaction.aggregate([
      { $match: { userId: req.user._id, type: 'expense', date: { $gte: startOfMonth, $lte: endOfMonth } } },
      { $group: { _id: '$category', totalSpent: { $sum: '$amount' } } },
    ]);

    const spentMap = {};
    expenseAggregates.forEach((item) => { spentMap[item._id] = item.totalSpent; });

    const budgetsWithSpent = budgets.map((b) => {
      const spent = spentMap[b.category] || 0;
      const percentage = b.monthlyLimit > 0 ? (spent / b.monthlyLimit) * 100 : 0;
      let status = 'normal';
      if (percentage >= 100) status = 'exceeded';
      else if (percentage >= 80) status = 'warning';

      return {
        _id: b._id,
        category: b.category,
        monthlyLimit: b.monthlyLimit,
        month: b.month,
        year: b.year,
        spent,
        remaining: Math.max(0, b.monthlyLimit - spent),
        percentage: Math.min(Math.round(percentage * 10) / 10, 999),
        status,
      };
    });

    res.json({ month, year, budgets: budgetsWithSpent });
  } catch (error) {
    next(error);
  }
});

app.post(['/api/budgets', '/budgets'], protect, async (req, res, next) => {
  try {
    const { category, monthlyLimit, month, year } = req.body;
    if (!category || monthlyLimit === undefined) return res.status(400).json({ message: 'Category and monthlyLimit are required' });
    if (Number(monthlyLimit) <= 0) return res.status(400).json({ message: 'Monthly limit must be greater than 0' });

    const targetMonth = month ? parseInt(month, 10) : new Date().getMonth() + 1;
    const targetYear = year ? parseInt(year, 10) : new Date().getFullYear();

    const budget = await Budget.findOneAndUpdate(
      { userId: req.user._id, category: category.trim(), month: targetMonth, year: targetYear },
      { monthlyLimit: Number(monthlyLimit) },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(201).json(budget);
  } catch (error) {
    next(error);
  }
});

app.put(['/api/budgets/:id', '/budgets/:id'], protect, async (req, res, next) => {
  try {
    const budget = await Budget.findById(req.params.id);
    if (!budget) return res.status(404).json({ message: 'Budget not found' });
    if (budget.userId.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });

    const { monthlyLimit } = req.body;
    if (monthlyLimit !== undefined) {
      if (Number(monthlyLimit) <= 0) return res.status(400).json({ message: 'Monthly limit must be greater than 0' });
      budget.monthlyLimit = Number(monthlyLimit);
    }

    const updatedBudget = await budget.save();
    res.json(updatedBudget);
  } catch (error) {
    next(error);
  }
});

// --- DASHBOARD ROUTE ---
app.get(['/api/dashboard/summary', '/dashboard/summary'], protect, async (req, res, next) => {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const startOfCurrentMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfCurrentMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

    const currentMonthAggregates = await Transaction.aggregate([
      { $match: { userId: req.user._id, date: { $gte: startOfCurrentMonth, $lte: endOfCurrentMonth } } },
      { $group: { _id: '$type', totalAmount: { $sum: '$amount' } } },
    ]);

    let totalIncome = 0;
    let totalExpense = 0;
    currentMonthAggregates.forEach((item) => {
      if (item._id === 'income') totalIncome = item.totalAmount;
      if (item._id === 'expense') totalExpense = item.totalAmount;
    });

    const netBalance = totalIncome - totalExpense;

    const categorySpending = await Transaction.aggregate([
      { $match: { userId: req.user._id, type: 'expense', date: { $gte: startOfCurrentMonth, $lte: endOfCurrentMonth } } },
      { $group: { _id: '$category', value: { $sum: '$amount' } } },
      { $sort: { value: -1 } },
    ]);

    const pieChartData = categorySpending.map((item) => ({
      name: item._id,
      value: Math.round(item.value * 100) / 100,
    }));

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const historicalAggregates = await Transaction.aggregate([
      { $match: { userId: req.user._id, date: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: '$date' }, month: { $month: '$date' }, type: '$type' }, total: { $sum: '$amount' } } },
    ]);

    const monthlyTrendData = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const label = `${monthNames[m - 1]} ${y}`;

      const incMatch = historicalAggregates.find((h) => h._id.year === y && h._id.month === m && h._id.type === 'income');
      const expMatch = historicalAggregates.find((h) => h._id.year === y && h._id.month === m && h._id.type === 'expense');

      monthlyTrendData.push({
        month: label,
        income: incMatch ? Math.round(incMatch.total * 100) / 100 : 0,
        expense: expMatch ? Math.round(expMatch.total * 100) / 100 : 0,
      });
    }

    const recentTransactions = await Transaction.find({ userId: req.user._id }).sort({ date: -1, createdAt: -1 }).limit(5);

    const currentBudgets = await Budget.find({ userId: req.user._id, month: currentMonth, year: currentYear });
    let warningCount = 0;
    let exceededCount = 0;

    currentBudgets.forEach((b) => {
      const catSpent = categorySpending.find((c) => c._id === b.category)?.value || 0;
      const pct = (catSpent / b.monthlyLimit) * 100;
      if (pct >= 100) exceededCount++;
      else if (pct >= 80) warningCount++;
    });

    res.json({
      summary: {
        totalIncome: Math.round(totalIncome * 100) / 100,
        totalExpense: Math.round(totalExpense * 100) / 100,
        netBalance: Math.round(netBalance * 100) / 100,
      },
      pieChartData,
      monthlyTrendData,
      recentTransactions,
      budgetAlerts: { warningCount, exceededCount },
    });
  } catch (error) {
    next(error);
  }
});

// --- ERROR HANDLER ---
app.use((err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Server Error';

  if (err.name === 'CastError') { message = 'Resource not found'; statusCode = 404; }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    message = field ? `Duplicate value entered for ${field}` : 'Duplicate value entered';
    statusCode = 400;
  }
  if (err.name === 'ValidationError') {
    message = Object.values(err.errors).map((val) => val.message).join(', ');
    statusCode = 400;
  }

  res.status(statusCode).json({ message });
});

module.exports = app;
