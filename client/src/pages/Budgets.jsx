import React, { useState, useEffect } from 'react';
import {
  PiggyBank,
  Plus,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Edit2,
  Loader2,
  Calendar,
  DollarSign,
  X,
} from 'lucide-react';
import api from '../api/axios';
import Header from '../components/Layout/Header';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, getCurrencyData } from '../utils/currencies';

const Budgets = ({ onMenuToggle }) => {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Month & Year filter
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [category, setCategory] = useState('');
  const [monthlyLimit, setMonthlyLimit] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchBudgets();
  }, [month, year]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data.filter((c) => c.type === 'expense' || c.type === 'both'));
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/budgets?month=${month}&year=${year}`);
      setBudgets(res.data.budgets || []);
    } catch (error) {
      showToast('Failed to load budget data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSetBudgetModal = (existingCategory = null, existingLimit = '') => {
    if (existingCategory) {
      setCategory(existingCategory);
      setMonthlyLimit(existingLimit);
    } else {
      setCategory(categories[0]?.name || '');
      setMonthlyLimit('');
    }
    setIsModalOpen(true);
  };

  const handleSubmitBudget = async (e) => {
    e.preventDefault();

    if (!category || !monthlyLimit || Number(monthlyLimit) <= 0) {
      showToast('Please select a category and enter a limit > $0', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/budgets', {
        category,
        monthlyLimit: Number(monthlyLimit),
        month,
        year,
      });

      showToast(`Budget for ${category} set to $${monthlyLimit}`);
      setIsModalOpen(false);
      fetchBudgets();
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to set budget';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const renderCurrency = (val) => {
    return formatCurrency(val, user?.currency);
  };
  const currencyObj = getCurrencyData(user?.currency);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-950 pb-12">
      <Header
        title="Monthly Category Budgets"
        onMenuToggle={onMenuToggle}
        onOpenAddTransaction={null}
      />

      <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* Top Controls Bar */}
        <div className="glass-card p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
              <PiggyBank className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {monthNames[month - 1]} {year} Spending Limits
              </h3>
              <p className="text-xs text-slate-400">
                Track category limits with real-time alert thresholds
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Month & Year Selectors */}
            <div className="flex items-center gap-2">
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs font-medium text-white"
              >
                {monthNames.map((m, idx) => (
                  <option key={m} value={idx + 1}>
                    {m}
                  </option>
                ))}
              </select>

              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs font-medium text-white"
              >
                {[2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => handleOpenSetBudgetModal()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Set Budget</span>
            </button>
          </div>
        </div>

        {/* Budgets Grid */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="mt-2 text-xs text-slate-400">Loading budgets...</p>
          </div>
        ) : budgets.length === 0 ? (
          <div className="glass-card py-16 px-4 rounded-2xl text-center">
            <PiggyBank className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h4 className="text-base font-bold text-white">No Budgets Set For This Month</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Set monthly spending targets for your expense categories to prevent overspending.
            </p>
            <button
              onClick={() => handleOpenSetBudgetModal()}
              className="mt-4 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Budget</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {budgets.map((b) => {
              const isExceeded = b.percentage >= 100;
              const isWarning = b.percentage >= 80 && !isExceeded;

              return (
                <div
                  key={b._id}
                  className={`glass-card p-6 rounded-2xl glass-card-hover border relative flex flex-col justify-between ${
                    isExceeded
                      ? 'border-rose-500/40 bg-rose-950/10'
                      : isWarning
                      ? 'border-amber-500/40 bg-amber-950/10'
                      : 'border-slate-800'
                  }`}
                >
                  <div>
                    {/* Header: Category & Status Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-base text-white">{b.category}</h4>
                      {isExceeded ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold uppercase tracking-wider">
                          <AlertOctagon className="w-3 h-3" />
                          Exceeded ({b.percentage}%)
                        </span>
                      ) : isWarning ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider">
                          <AlertTriangle className="w-3 h-3" />
                          Warning ({b.percentage}%)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider">
                          <CheckCircle2 className="w-3 h-3" />
                          Normal ({b.percentage}%)
                        </span>
                      )}
                    </div>

                    {/* Spent vs Monthly Limit Numbers */}
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="text-2xl font-extrabold text-white">
                        {renderCurrency(b.spent)}
                      </span>
                      <span className="text-xs text-slate-400">
                        limit {renderCurrency(b.monthlyLimit)}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isExceeded
                            ? 'bg-gradient-to-r from-rose-600 to-red-500'
                            : isWarning
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                            : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                        }`}
                        style={{ width: `${Math.min(b.percentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Card Bottom Info & Edit Button */}
                  <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">
                      {isExceeded
                        ? `Over budget by ${renderCurrency(b.spent - b.monthlyLimit)}`
                        : `${renderCurrency(b.remaining)} remaining`}
                    </span>
                    <button
                      onClick={() => handleOpenSetBudgetModal(b.category, b.monthlyLimit)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors flex items-center gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Limit</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Set / Edit Budget Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">
                Set Category Budget ({monthNames[month - 1]} {year})
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitBudget} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-white text-sm"
                  required
                >
                  {categories.map((c) => (
                    <option key={c._id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Monthly Budget Limit ({currencyObj.symbol} {currencyObj.code})
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-slate-400 font-bold text-sm">
                    {currencyObj.symbol}
                  </span>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={monthlyLimit}
                    onChange={(e) => setMonthlyLimit(e.target.value)}
                    placeholder="e.g. 500"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 pl-10 text-white font-semibold text-base"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-800 text-slate-400 hover:text-white text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Save Budget</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Budgets;
