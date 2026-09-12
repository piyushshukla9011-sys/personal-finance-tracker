import React, { useState, useEffect } from 'react';
import { X, Loader2, DollarSign, Calendar, FileText, Tag, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { getCurrencyData } from '../utils/currencies';

const TransactionModal = ({ isOpen, onClose, onSaveSuccess, transactionToEdit = null }) => {
  const { user } = useAuth();
  const currencyObj = getCurrencyData(user?.currency);

  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      if (transactionToEdit) {
        setType(transactionToEdit.type || 'expense');
        setAmount(transactionToEdit.amount || '');
        setCategory(transactionToEdit.category || '');
        setNote(transactionToEdit.note || '');
        setDate(
          transactionToEdit.date
            ? new Date(transactionToEdit.date).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0]
        );
      } else {
        setType('expense');
        setAmount('');
        setCategory('');
        setNote('');
        setDate(new Date().toISOString().split('T')[0]);
      }
    }
  }, [isOpen, transactionToEdit]);

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
      if (!transactionToEdit && res.data.length > 0) {
        // Auto pick first matching category
        const filtered = res.data.filter((c) => c.type === 'expense' || c.type === 'both');
        if (filtered.length > 0) setCategory(filtered[0].name);
        else setCategory(res.data[0].name);
      }
    } catch (error) {
      console.error('Failed to fetch categories', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!amount || Number(amount) <= 0) {
      showToast('Please enter a valid amount greater than 0', 'error');
      return;
    }

    if (!category) {
      showToast('Please select a category', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        type,
        amount: Number(amount),
        category,
        note,
        date,
      };

      if (transactionToEdit) {
        await api.put(`/transactions/${transactionToEdit._id}`, payload);
        showToast('Transaction updated successfully!');
      } else {
        await api.post('/transactions', payload);
        showToast('Transaction added successfully!');
      }

      onSaveSuccess();
      onClose();
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to save transaction';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCategories = categories.filter(
    (c) => c.type === type || c.type === 'both' || !c.type
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <h3 className="text-lg font-bold text-white">
            {transactionToEdit ? 'Edit Transaction' : 'New Transaction'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Income / Expense Type Toggle */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Transaction Type
            </label>
            <div className="grid grid-cols-2 gap-3 p-1 bg-slate-950 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setType('expense');
                  const firstExp = categories.find((c) => c.type === 'expense');
                  if (firstExp) setCategory(firstExp.name);
                }}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  type === 'expense'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ArrowDownRight className="w-4 h-4" />
                <span>Expense</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('income');
                  const firstInc = categories.find((c) => c.type === 'income');
                  if (firstInc) setCategory(firstInc.name);
                }}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  type === 'income'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Income</span>
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Amount ({currencyObj.symbol} {currencyObj.code})
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3.5 text-slate-400 font-bold text-sm">
                {currencyObj.symbol}
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 pl-10 text-white text-base font-semibold placeholder-slate-600"
                required
              />
            </div>
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Category
            </label>
            <div className="relative">
              <Tag className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 pl-10 text-white text-sm placeholder-slate-600 appearance-none"
                required
              >
                {filteredCategories.length === 0 ? (
                  <option value="">No categories found</option>
                ) : (
                  filteredCategories.map((cat) => (
                    <option key={cat._id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 pl-10 text-white text-sm"
                required
              />
            </div>
          </div>

          {/* Note Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Note / Description (Optional)
            </label>
            <div className="relative">
              <FileText className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Weekly grocery haul"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 pl-10 text-white text-sm placeholder-slate-600"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span>{transactionToEdit ? 'Save Changes' : 'Add Transaction'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionModal;
