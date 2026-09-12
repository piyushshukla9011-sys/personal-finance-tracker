import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Plus,
  ChevronRight,
  PieChart as PieChartIcon,
  BarChart3,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import api from '../api/axios';
import Header from '../components/Layout/Header';
import TransactionModal from '../components/TransactionModal';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, getCurrencyData } from '../utils/currencies';
import { Link } from 'react-router-dom';

const COLORS = [
  '#ef4444', '#3b82f6', '#ec4899', '#f97316',
  '#a855f7', '#eab308', '#14b8a6', '#6366f1',
  '#10b981', '#06b6d4', '#8b5cf6', '#64748b'
];

const Dashboard = ({ onMenuToggle }) => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/dashboard/summary');
      setData(res.data);
    } catch (error) {
      console.error('Failed to fetch dashboard metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderCurrency = (val) => {
    return formatCurrency(val, user?.currency);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-950 pb-12">
      <Header
        title="Dashboard Overview"
        onMenuToggle={onMenuToggle}
        onOpenAddTransaction={() => setIsModalOpen(true)}
      />

      <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
        {loading ? (
          <div className="h-96 flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
            <p className="mt-3 text-sm text-slate-400">Loading your summary...</p>
          </div>
        ) : (
          <>
            {/* Budget Alert Banner */}
            {(data?.budgetAlerts?.exceededCount > 0 || data?.budgetAlerts?.warningCount > 0) && (
              <div className="glass-card p-4 rounded-2xl border border-amber-500/30 bg-amber-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-white">Monthly Budget Alert</h4>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {data.budgetAlerts.exceededCount > 0 && (
                        <span className="text-rose-400 font-bold mr-2">
                          {data.budgetAlerts.exceededCount} category exceeded limit!
                        </span>
                      )}
                      {data.budgetAlerts.warningCount > 0 && (
                        <span className="text-amber-400 font-medium">
                          {data.budgetAlerts.warningCount} category near 80% limit.
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <Link
                  to="/budgets"
                  className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 font-semibold text-xs transition-colors shrink-0"
                >
                  View Budgets
                </Link>
              </div>
            )}

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Total Income */}
              <div className="glass-card p-6 rounded-2xl glass-card-hover relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Total Income (This Month)
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <ArrowUpRight className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-3xl font-extrabold text-white tracking-tight">
                    {renderCurrency(data?.summary?.totalIncome)}
                  </h3>
                  <p className="text-xs text-emerald-400 mt-2 font-medium flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Incoming Cash Flow
                  </p>
                </div>
              </div>

              {/* Total Expenses */}
              <div className="glass-card p-6 rounded-2xl glass-card-hover relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Total Expenses (This Month)
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                    <ArrowDownRight className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-3xl font-extrabold text-white tracking-tight">
                    {renderCurrency(data?.summary?.totalExpense)}
                  </h3>
                  <p className="text-xs text-rose-400 mt-2 font-medium flex items-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5" />
                    Outgoing Outflows
                  </p>
                </div>
              </div>

              {/* Net Balance */}
              <div className="glass-card p-6 rounded-2xl glass-card-hover relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Net Balance (This Month)
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Wallet className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <h3
                    className={`text-3xl font-extrabold tracking-tight ${
                      (data?.summary?.netBalance || 0) >= 0
                        ? 'text-indigo-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {renderCurrency(data?.summary?.netBalance)}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 font-medium">
                    Savings & Surplus
                  </p>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* 6-Month Income vs Expense Bar Chart */}
              <div className="lg:col-span-7 glass-card p-6 rounded-2xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-indigo-400" />
                      Income vs Expenses (Last 6 Months)
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Historical financial cashflow</p>
                  </div>
                </div>

                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data?.monthlyTrendData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '12px',
                          color: '#fff',
                        }}
                        formatter={(value) => renderCurrency(value)}
                      />
                      <Legend wrapperStyle={{ paddingTop: '10px' }} />
                      <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Spending by Category Pie Chart */}
              <div className="lg:col-span-5 glass-card p-6 rounded-2xl flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
                    <PieChartIcon className="w-5 h-5 text-indigo-400" />
                    Spending by Category
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">Current month expense distribution</p>

                  {data?.pieChartData?.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-sm">
                      No expense transactions logged this month
                    </div>
                  ) : (
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={data?.pieChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={85}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {data?.pieChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip
                            contentStyle={{
                              backgroundColor: '#0f172a',
                              borderColor: '#334155',
                              borderRadius: '12px',
                              color: '#fff',
                            }}
                            formatter={(val) => renderCurrency(val)}
                          />
                          <Legend
                            layout="horizontal"
                            align="center"
                            verticalAlign="bottom"
                            wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Transactions List */}
            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-white">Recent Transactions</h3>
                  <p className="text-xs text-slate-400">Latest financial activities</p>
                </div>
                <Link
                  to="/transactions"
                  className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  <span>View All</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {data?.recentTransactions?.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-sm">
                  No transactions yet. Click "+ Add Transaction" to get started!
                </div>
              ) : (
                <div className="divide-y divide-slate-800/60">
                  {data?.recentTransactions?.map((t) => (
                    <div
                      key={t._id}
                      className="py-3.5 flex items-center justify-between hover:bg-slate-800/30 px-2 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            t.type === 'income'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {t.type === 'income' ? (
                            <ArrowUpRight className="w-4 h-4" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {t.category}
                          </p>
                          <p className="text-xs text-slate-400 truncate max-w-xs">
                            {t.note || 'No description'} •{' '}
                            {new Date(t.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`text-sm font-bold ${
                          t.type === 'income' ? 'text-emerald-400' : 'text-slate-100'
                        }`}
                      >
                        {t.type === 'income' ? '+' : '-'}
                        {renderCurrency(t.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Transaction Add Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaveSuccess={fetchDashboardData}
      />
    </div>
  );
};

export default Dashboard;
