const dotenv = require('dotenv');
const connectDB = require('./config/db');
const User = require('./models/User');
const Category = require('./models/Category');
const Transaction = require('./models/Transaction');
const Budget = require('./models/Budget');

dotenv.config();

const DEFAULT_CATEGORIES = [
  { name: 'Salary', type: 'income', isPredefined: true, icon: 'Wallet', color: '#10b981' },
  { name: 'Freelance', type: 'income', isPredefined: true, icon: 'Briefcase', color: '#06b6d4' },
  { name: 'Investments', type: 'income', isPredefined: true, icon: 'TrendingUp', color: '#8b5cf6' },
  { name: 'Food & Dining', type: 'expense', isPredefined: true, icon: 'Utensils', color: '#ef4444' },
  { name: 'Rent & Housing', type: 'expense', isPredefined: true, icon: 'Home', color: '#3b82f6' },
  { name: 'Shopping', type: 'expense', isPredefined: true, icon: 'ShoppingBag', color: '#ec4899' },
  { name: 'Transportation', type: 'expense', isPredefined: true, icon: 'Car', color: '#f97316' },
  { name: 'Entertainment', type: 'expense', isPredefined: true, icon: 'Film', color: '#a855f7' },
  { name: 'Utilities & Bills', type: 'expense', isPredefined: true, icon: 'Zap', color: '#eab308' },
  { name: 'Healthcare', type: 'expense', isPredefined: true, icon: 'HeartPulse', color: '#14b8a6' },
  { name: 'Travel', type: 'expense', isPredefined: true, icon: 'Plane', color: '#6366f1' },
];

const seedData = async () => {
  try {
    await connectDB();
    console.log('Clearing old sample data...');

    const demoEmail = 'demo@finance.com';
    let demoUser = await User.findOne({ email: demoEmail });

    if (demoUser) {
      await Transaction.deleteMany({ userId: demoUser._id });
      await Budget.deleteMany({ userId: demoUser._id });
      await User.deleteOne({ _id: demoUser._id });
    }

    await Category.deleteMany({ isPredefined: true });

    console.log('Creating demo user...');
    demoUser = await User.create({
      name: 'Alex Johnson',
      email: demoEmail,
      password: 'password123',
      country: 'India',
      currency: 'INR',
    });

    console.log('Inserting default predefined categories...');
    await Category.insertMany(DEFAULT_CATEGORIES);

    console.log('Generating realistic sample transactions & budgets for the last 6 months...');
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const sampleTransactions = [];

    // Helper to get past date
    const getPastDate = (monthsAgo, day) => {
      const d = new Date();
      d.setMonth(d.getMonth() - monthsAgo);
      d.setDate(day);
      return d;
    };

    // Generate monthly recurring salary and freelance income + expenses for past 6 months
    for (let m = 5; m >= 0; m--) {
      // Income
      sampleTransactions.push({
        userId: demoUser._id,
        type: 'income',
        amount: 4500,
        category: 'Salary',
        note: 'Monthly Salary Payment',
        date: getPastDate(m, 1),
      });

      sampleTransactions.push({
        userId: demoUser._id,
        type: 'income',
        amount: m % 2 === 0 ? 850 : 1200,
        category: 'Freelance',
        note: 'UI Design Contract Work',
        date: getPastDate(m, 15),
      });

      // Fixed Expense: Rent
      sampleTransactions.push({
        userId: demoUser._id,
        type: 'expense',
        amount: 1400,
        category: 'Rent & Housing',
        note: 'Apartment Monthly Rent',
        date: getPastDate(m, 2),
      });

      // Fixed Expense: Utilities
      sampleTransactions.push({
        userId: demoUser._id,
        type: 'expense',
        amount: 220,
        category: 'Utilities & Bills',
        note: 'Electricity, Water & Fiber High-Speed Internet',
        date: getPastDate(m, 5),
      });

      // Variable Expenses: Food
      sampleTransactions.push({
        userId: demoUser._id,
        type: 'expense',
        amount: 185.50,
        category: 'Food & Dining',
        note: 'Grocery haul at Whole Foods Market',
        date: getPastDate(m, 7),
      });

      sampleTransactions.push({
        userId: demoUser._id,
        type: 'expense',
        amount: 68.40,
        category: 'Food & Dining',
        note: 'Dinner with friends at Italian Trattoria',
        date: getPastDate(m, 18),
      });

      // Shopping
      sampleTransactions.push({
        userId: demoUser._id,
        type: 'expense',
        amount: m === 0 ? 480 : 160,
        category: 'Shopping',
        note: m === 0 ? 'Ergonomic Standing Desk Purchase' : 'Clothing & Essentials',
        date: getPastDate(m, 12),
      });

      // Transportation
      sampleTransactions.push({
        userId: demoUser._id,
        type: 'expense',
        amount: 75.00,
        category: 'Transportation',
        note: 'Subway Pass & Fuel Refill',
        date: getPastDate(m, 10),
      });

      // Entertainment
      sampleTransactions.push({
        userId: demoUser._id,
        type: 'expense',
        amount: m === 0 ? 320 : 95,
        category: 'Entertainment',
        note: m === 0 ? 'Weekend Music Festival Tickets' : 'Streaming Subscriptions & Movies',
        date: getPastDate(m, 20),
      });
    }

    await Transaction.insertMany(sampleTransactions);

    console.log('Creating monthly budget allocations for current month...');
    // Create budgets designed to showcase normal, warning (>80%), and exceeded (>100%) statuses!
    // Current month expenses from above:
    // Food: 253.90 -> Limit 300 (84% -> Warning!)
    // Rent: 1400 -> Limit 1500 (93% -> Warning!)
    // Shopping: 480 -> Limit 400 (120% -> Exceeded Red Alert!)
    // Entertainment: 320 -> Limit 400 (80% -> Warning!)
    // Utilities: 220 -> Limit 350 (62% -> Normal Green)

    const sampleBudgets = [
      { userId: demoUser._id, category: 'Food & Dining', monthlyLimit: 300, month: currentMonth, year: currentYear },
      { userId: demoUser._id, category: 'Rent & Housing', monthlyLimit: 1500, month: currentMonth, year: currentYear },
      { userId: demoUser._id, category: 'Shopping', monthlyLimit: 400, month: currentMonth, year: currentYear },
      { userId: demoUser._id, category: 'Entertainment', monthlyLimit: 400, month: currentMonth, year: currentYear },
      { userId: demoUser._id, category: 'Utilities & Bills', monthlyLimit: 350, month: currentMonth, year: currentYear },
      { userId: demoUser._id, category: 'Transportation', monthlyLimit: 200, month: currentMonth, year: currentYear },
    ];

    await Budget.insertMany(sampleBudgets);

    console.log('--------------------------------------------------');
    console.log('🎉 SEED COMPLETED SUCCESSFULLY!');
    console.log('Demo Credentials for Login:');
    console.log(`   Email:    demo@finance.com`);
    console.log(`   Password: password123`);
    console.log('--------------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
