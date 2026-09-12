import React, { useState } from 'react';
import { Menu, Plus, Globe, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getCountryData, getCurrencyData } from '../../utils/currencies';
import CountrySelectionModal from '../CountrySelectionModal';

const Header = ({ title, onMenuToggle, onOpenAddTransaction }) => {
  const { user } = useAuth();
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);

  const countryData = getCountryData(user?.country);
  const currencyData = getCurrencyData(user?.currency || countryData.code);

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 flex items-center justify-between">
        {/* Left: Mobile Menu toggle & Page Title */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Country & Currency Switcher Pill */}
          <button
            onClick={() => setIsCountryModalOpen(true)}
            title="Change Country & Currency"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-white transition-colors"
          >
            <span className="text-base">{countryData.flag}</span>
            <span className="hidden sm:inline text-slate-300">{countryData.country}</span>
            <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
              {currencyData.symbol} {currencyData.code}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {onOpenAddTransaction && (
            <button
              onClick={onOpenAddTransaction}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-600/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Transaction</span>
              <span className="sm:hidden">Add</span>
            </button>
          )}

          {/* User Pill */}
          <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-800">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-indigo-400">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <span className="text-xs font-medium text-slate-300">{user?.name}</span>
          </div>
        </div>
      </header>

      {/* Country & Currency Selection Modal */}
      <CountrySelectionModal
        isOpen={isCountryModalOpen}
        onClose={() => setIsCountryModalOpen(false)}
      />
    </>
  );
};

export default Header;
