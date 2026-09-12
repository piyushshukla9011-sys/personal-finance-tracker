export const COUNTRIES = [
  { country: 'India', code: 'INR', symbol: '₹', flag: '🇮🇳', name: 'Indian Rupee' },
  { country: 'United States', code: 'USD', symbol: '$', flag: '🇺🇸', name: 'US Dollar' },
  { country: 'United Kingdom', code: 'GBP', symbol: '£', flag: '🇬🇧', name: 'British Pound' },
  { country: 'European Union (Eurozone)', code: 'EUR', symbol: '€', flag: '🇪🇺', name: 'Euro' },
  { country: 'Canada', code: 'CAD', symbol: '$', flag: '🇨🇦', name: 'Canadian Dollar' },
  { country: 'Australia', code: 'AUD', symbol: '$', flag: '🇦🇺', name: 'Australian Dollar' },
  { country: 'United Arab Emirates', code: 'AED', symbol: 'د.إ', flag: '🇦🇪', name: 'UAE Dirham' },
  { country: 'Japan', code: 'JPY', symbol: '¥', flag: '🇯🇵', name: 'Japanese Yen' },
  { country: 'Singapore', code: 'SGD', symbol: '$', flag: '🇸🇬', name: 'Singapore Dollar' },
  { country: 'Switzerland', code: 'CHF', symbol: 'CHF', flag: '🇨🇭', name: 'Swiss Franc' },
  { country: 'China', code: 'CNY', symbol: '¥', flag: '🇨🇳', name: 'Chinese Yuan' },
  { country: 'Brazil', code: 'BRL', symbol: 'R$', flag: '🇧🇷', name: 'Brazilian Real' },
  { country: 'South Africa', code: 'ZAR', symbol: 'R', flag: '🇿🇦', name: 'South African Rand' },
  { country: 'Saudi Arabia', code: 'SAR', symbol: '﷼', flag: '🇸🇦', name: 'Saudi Riyal' },
  { country: 'Mexico', code: 'MXN', symbol: '$', flag: '🇲🇽', name: 'Mexican Peso' },
  { country: 'South Korea', code: 'KRW', symbol: '₩', flag: '🇰🇷', name: 'South Korean Won' },
  { country: 'Russia', code: 'RUB', symbol: '₽', flag: '🇷🇺', name: 'Russian Ruble' },
  { country: 'New Zealand', code: 'NZD', symbol: '$', flag: '🇳🇿', name: 'New Zealand Dollar' },
  { country: 'Malaysia', code: 'MYR', symbol: 'RM', flag: '🇲🇾', name: 'Malaysian Ringgit' },
  { country: 'Nigeria', code: 'NGN', symbol: '₦', flag: '🇳🇬', name: 'Nigerian Naira' },
];

export const getCountryData = (countryName) => {
  return COUNTRIES.find(
    (c) => c.country.toLowerCase() === (countryName || '').toLowerCase()
  ) || COUNTRIES[0]; // Defaults to India
};

export const getCurrencyData = (currencyCode) => {
  return COUNTRIES.find(
    (c) => c.code.toLowerCase() === (currencyCode || '').toLowerCase()
  ) || COUNTRIES[0];
};

export const formatCurrency = (val, currencyCode = 'INR') => {
  const number = Number(val) || 0;
  const currencyObj = getCurrencyData(currencyCode);

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyObj.code,
      maximumFractionDigits: 2,
    }).format(number);
  } catch (error) {
    return `${currencyObj.symbol}${number.toFixed(2)}`;
  }
};
