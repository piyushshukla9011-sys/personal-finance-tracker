const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const { protect } = require('../middleware/auth');

// @route   GET /api/dashboard/summary
// @desc    Get dashboard metrics, pie chart data, historical trends, and recent transactions
// @access  Private
router.get('/summary', protect, async (req, res, next) => {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const startOfCurrentMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfCurrentMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

    // 1. Current Month Aggregates (Income, Expense, Net)
    const currentMonthAggregates = await Transaction.aggregate([
      {
        $match: {
          userId: req.user._id,
          date: { $gte: startOfCurrentMonth, $lte: endOfCurrentMonth },
        },
      },
      {
        $group: {
          _id: '$type',
          totalAmount: { $sum: '$amount' },
        },
      },
    ]);

    let totalIncome = 0;
    let totalExpense = 0;
    currentMonthAggregates.forEach((item) => {
      if (item._id === 'income') totalIncome = item.totalAmount;
      if (item._id === 'expense') totalExpense = item.totalAmount;
    });

    const netBalance = totalIncome - totalExpense;

    // 2. Spending by Category (Pie Chart data for current month)
    const categorySpending = await Transaction.aggregate([
      {
        $match: {
          userId: req.user._id,
          type: 'expense',
          date: { $gte: startOfCurrentMonth, $lte: endOfCurrentMonth },
        },
      },
      {
        $group: {
          _id: '$category',
          value: { $sum: '$amount' },
        },
      },
      { $sort: { value: -1 } },
    ]);

    const pieChartData = categorySpending.map((item) => ({
      name: item._id,
      value: Math.round(item.value * 100) / 100,
    }));

    // 3. Historical Income vs Expense over last 6 months (Monthly trend)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const historicalAggregates = await Transaction.aggregate([
      {
        $match: {
          userId: req.user._id,
          date: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type',
          },
          total: { $sum: '$amount' },
        },
      },
    ]);

    // Format 6 months array
    const monthlyTrendData = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const label = `${monthNames[m - 1]} ${y}`;

      const incMatch = historicalAggregates.find(
        (h) => h._id.year === y && h._id.month === m && h._id.type === 'income'
      );
      const expMatch = historicalAggregates.find(
        (h) => h._id.year === y && h._id.month === m && h._id.type === 'expense'
      );

      monthlyTrendData.push({
        month: label,
        income: incMatch ? Math.round(incMatch.total * 100) / 100 : 0,
        expense: expMatch ? Math.round(expMatch.total * 100) / 100 : 0,
      });
    }

    // 4. Recent 5 Transactions
    const recentTransactions = await Transaction.find({ userId: req.user._id })
      .sort({ date: -1, createdAt: -1 })
      .limit(5);

    // 5. Budget Alert Alerts check
    const currentBudgets = await Budget.find({
      userId: req.user._id,
      month: currentMonth,
      year: currentYear,
    });

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
      budgetAlerts: {
        warningCount,
        exceededCount,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
