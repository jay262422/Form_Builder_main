import React, { useState, useEffect } from 'react';

/**
 * CurrencyInput - Currency input component
 * Supports currency formatting, validation, and currency selection
 */
export default function CurrencyInput({
  field,
  value = '',
  onChange,
  formData = {},
  disabled = false,
  error = null
}) {
  // Debug logging
  console.log('CurrencyInput props:', { field, value, onChange, disabled, error });
  
  // Add fallback for when field is undefined
  if (!field) {
    console.error('CurrencyInput: field prop is undefined or null');
    return (
      <div className="currency-input">
        <div className="text-red-500 text-sm">Error: Field configuration is missing</div>
      </div>
    );
  }

  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(field.currency || 'USD');
  const [displayValue, setDisplayValue] = useState('');

  const minAmount = field.minAmount || 0;
  const maxAmount = field.maxAmount || 999999;
  const decimalPlaces = field.decimalPlaces || 2;

  useEffect(() => {
    if (value !== amount) {
      setAmount(value || '');
      formatDisplayValue(value || '', currency);
    }
  }, [value, currency]);

  const formatDisplayValue = (value, curr) => {
    if (!value) {
      setDisplayValue('');
      return;
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      setDisplayValue('');
      return;
    }

    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr,
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces
    });

    setDisplayValue(formatter.format(numValue));
  };

  const handleAmountChange = (e) => {
    const inputValue = e.target.value;
    
    // Remove currency symbols and formatting
    const cleanValue = inputValue.replace(/[^\d.-]/g, '');
    
    // Validate numeric input
    if (cleanValue === '' || cleanValue === '-') {
      setAmount('');
      setDisplayValue('');
      onChange('');
      return;
    }

    const numValue = parseFloat(cleanValue);
    if (isNaN(numValue)) {
      return;
    }

    // Apply min/max validation
    if (numValue < minAmount) {
      return;
    }
    if (numValue > maxAmount) {
      return;
    }

    setAmount(numValue.toString());
    formatDisplayValue(numValue.toString(), currency);
    onChange(numValue.toString());
  };

  const handleCurrencyChange = (newCurrency) => {
    setCurrency(newCurrency);
    formatDisplayValue(amount, newCurrency);
  };

  const currencies = [
    { value: 'USD', label: 'US Dollar ($)', symbol: '$' },
    { value: 'EUR', label: 'Euro (€)', symbol: '€' },
    { value: 'GBP', label: 'British Pound (£)', symbol: '£' },
    { value: 'JPY', label: 'Japanese Yen (¥)', symbol: '¥' },
    { value: 'CAD', label: 'Canadian Dollar (C$)', symbol: 'C$' },
    { value: 'AUD', label: 'Australian Dollar (A$)', symbol: 'A$' },
    { value: 'CHF', label: 'Swiss Franc (CHF)', symbol: 'CHF' },
    { value: 'CNY', label: 'Chinese Yuan (¥)', symbol: '¥' },
    { value: 'INR', label: 'Indian Rupee (₹)', symbol: '₹' },
    { value: 'BRL', label: 'Brazilian Real (R$)', symbol: 'R$' },
    { value: 'MXN', label: 'Mexican Peso (MXN)', symbol: 'MXN' },
    { value: 'KRW', label: 'South Korean Won (₩)', symbol: '₩' },
    { value: 'SGD', label: 'Singapore Dollar (S$)', symbol: 'S$' },
    { value: 'HKD', label: 'Hong Kong Dollar (HK$)', symbol: 'HK$' },
    { value: 'NZD', label: 'New Zealand Dollar (NZ$)', symbol: 'NZ$' },
    { value: 'SEK', label: 'Swedish Krona (SEK)', symbol: 'SEK' },
    { value: 'NOK', label: 'Norwegian Krone (NOK)', symbol: 'NOK' },
    { value: 'DKK', label: 'Danish Krone (DKK)', symbol: 'DKK' },
    { value: 'PLN', label: 'Polish Złoty (PLN)', symbol: 'PLN' },
    { value: 'CZK', label: 'Czech Koruna (CZK)', symbol: 'CZK' }
  ];

  const getCurrentCurrency = () => {
    return currencies.find(c => c.value === currency) || currencies[0];
  };

  return (
    <div className="currency-input">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
        <span className="ml-2 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
          Currency
        </span>
      </label>
      
      <div className="space-y-3">
        {/* Currency Selection */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Currency
          </label>
          <select
            value={currency}
            onChange={(e) => handleCurrencyChange(e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {currencies.map((curr) => (
              <option key={curr.value} value={curr.value}>
                {curr.label}
              </option>
            ))}
          </select>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Amount
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              {getCurrentCurrency().symbol}
            </span>
            <input
              type="text"
              value={displayValue}
              onChange={handleAmountChange}
              placeholder={`0.${'0'.repeat(decimalPlaces)}`}
              disabled={disabled}
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Validation Info */}
        <div className="text-xs text-gray-500">
          <div>Range: {getCurrentCurrency().symbol}{minAmount.toLocaleString()} - {getCurrentCurrency().symbol}{maxAmount.toLocaleString()}</div>
          <div>Decimal places: {decimalPlaces}</div>
        </div>

        {/* Preview */}
        {amount && (
          <div className="p-3 bg-gray-50 rounded-md">
            <div className="text-xs font-medium text-gray-600 mb-1">Formatted Value:</div>
            <div className="text-sm text-gray-800 font-mono">
              {displayValue}
            </div>
          </div>
        )}
      </div>
      
      {error && (
        <div className="mt-1 text-sm text-red-600">
          {error}
        </div>
      )}
      
      {field.helpText && (
        <div className="mt-1 text-sm text-gray-500">
          {field.helpText}
        </div>
      )}
    </div>
  );
}
