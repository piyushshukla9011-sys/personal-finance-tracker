const express = require('express');
const router = express.Router();
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');

// @route   GET /api/budgets
// @desc    Get user's monthly budgets with calculated actual spending & status alerts
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const now = new Date();
    const month = parseInt(req.query.month, 10) || now.getMonth() + 1;
    const year = parseInt(req.query.year, 10) || now.getFullYear();

    const budgets = await Budget.find({
      userId: req.user._id,
      month,
      year,
    });

    // Calculate spent amount for each budgeted category in this month/year
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const expenseAggregates = await Transaction.aggregate([
      {
        $match: {
          userId: req.user._id,
          type: 'expense',
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: '$category',
          totalSpent: { $sum: '$amount' },
        },
      },
    ]);

    const spentMap = {};
    expenseAggregates.forEach((item) => {
      spentMap[item._id] = item.totalSpent;
    });

    const budgetsWithSpent = budgets.map((b) => {
      const spent = spentMap[b.category] || 0;
      const percentage = b.monthlyLimit > 0 ? (spent / b.monthlyLimit) * 100 : 0;
      let status = 'normal';
      if (percentage >= 100) {
        status = 'exceeded'; // Red alert (>100%)
      } else if (percentage >= 80) {
        status = 'warning'; // Amber warning (80-99%)
      }

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

    res.json({
      month,
      year,
      budgets: budgetsWithSpent,
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/budgets
// @desc    Create or update monthly budget for category
// @access  Private
router.post('/', protect, async (req, res, next) => {
  try {
    const { category, monthlyLimit, month, year } = req.body;

    if (!category || monthlyLimit === undefined) {
      return res.status(400).json({ message: 'Category and monthlyLimit are required' });
    }

    if (Number(monthlyLimit) <= 0) {
      return res.status(400).json({ message: 'Monthly limit must be greater than 0' });
    }

    const targetMonth = month ? parseInt(month, 10) : new Date().getMonth() + 1;
    const targetYear = year ? parseInt(year, 10) : new Date().getFullYear();

    const budget = await Budget.findOneAndUpdate(
      {
        userId: req.user._id,
        category: category.trim(),
        month: targetMonth,
        year: targetYear,
      },
      {
        monthlyLimit: Number(monthlyLimit),
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(201).json(budget);
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/budgets/:id
// @desc    Update budget limit
// @access  Private
router.put('/:id', protect, async (req, res, next) => {
  try {
    const budget = await Budget.findById(req.params.id);

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    if (budget.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { monthlyLimit } = req.body;
    if (monthlyLimit !== undefined) {
      if (Number(monthlyLimit) <= 0) {
        return res.status(400).json({ message: 'Monthly limit must be greater than 0' });
      }
      budget.monthlyLimit = Number(monthlyLimit);
    }

    const updatedBudget = await budget.save();
    res.json(updatedBudget);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
