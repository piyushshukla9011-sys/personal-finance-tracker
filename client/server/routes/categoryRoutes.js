const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { protect } = require('../middleware/auth');

// Default categories to seed if database has none
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

// @route   GET /api/categories
// @desc    Get user's available categories (predefined + custom)
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    let categories = await Category.find({
      $or: [{ isPredefined: true }, { userId: req.user._id }],
    }).sort({ isPredefined: -1, name: 1 });

    // Auto-seed predefined categories if DB is empty
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

// @route   POST /api/categories
// @desc    Add custom category
// @access  Private
router.post('/', protect, async (req, res, next) => {
  try {
    const { name, type, icon, color } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    // Check if category already exists for user or system
    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      $or: [{ isPredefined: true }, { userId: req.user._id }],
    });

    if (existingCategory) {
      return res.status(400).json({ message: 'Category with this name already exists' });
    }

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

module.exports = router;
