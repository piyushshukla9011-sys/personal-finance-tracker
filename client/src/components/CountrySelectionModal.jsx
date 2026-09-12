import React, { useState } from 'react';
import { Globe, Check, Loader2, X, DollarSign } from 'lucide-react';
import { COUNTRIES } from '../utils/currencies';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const CountrySelectionModal = ({ isOpen, onClose, isForceOnboarding = false }) => {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();

  const [selectedCountry, setSelectedCountry] = useState(
    user?.country || 'India'
  );
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const currentCountryData =
    COUNTRIES.find((c) => c.country === selectedCountry) || COUNTRIES[0];

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateProfile({
        country: currentCountryData.country,
        currency: currentCountryData.code,
      });
      showToast(
        `Country updated to ${currentCountryData.flag} ${currentCountryData.country} (${currentCountryData.symbol} ${currentCountryData.code})!`
      );
      if (onClose) onClose();
    } catch (error) {
      showToast('Failed to update country & currency settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Select Your Country</h3>
              <p className="text-xs text-slate-400">
                Choose your home country to set your default budget currency
              </p>
            </div>
          </div>

          {!isForceOnboarding && onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Modal Body: Scrollable Country Grid */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {COUNTRIES.map((item) => {
              const isSelected = selectedCountry === item.country;
              return (
                <button
                  key={item.country}
                  type="button"
                  onClick={() => setSelectedCountry(item.country)}
                  className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500 shadow-md shadow-indigo-600/10'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{item.flag}</span>
                    <div>
                      <h4 className="text-xs font-bold text-white leading-tight">
                        {item.country}
                      </h4>
                      <p className="text-[11px] font-semibold text-indigo-400">
                        {item.code} ({item.symbol})
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-white shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="text-xs text-slate-300 font-medium flex items-center gap-2">
            <span>Selected:</span>
            <span className="text-white font-bold">
              {currentCountryData.flag} {currentCountryData.country} (
              {currentCountryData.symbol} {currentCountryData.code})
            </span>
          </div>

          <button
            onClick={handleSave}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span>Confirm & Apply Currency</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CountrySelectionModal;
