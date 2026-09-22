import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Select - Dropdown select field
 * Supports single and multiple selection with search
 */
export default function Select({
  label,
  name,
  value = '',
  onChange,
  onBlur,
  options = [],
  placeholder = 'Select an option...',
  required = false,
  disabled = false,
  error = false,
  className = '',
  searchable = false,
  multiple = false,
  formTheme = 'modern',
  theme,
  // Extract these props to prevent them from being passed to DOM
  validation,
  styling,
  helpText,
  defaultValue,
  // Additional custom props that should not be passed to DOM
  showWhen,
  calculateFrom,
  condition,
  dependsOn,
  dynamicMapping,
  optionType,
  inputType,
  getOptions,
  ...props
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [menuStyle, setMenuStyle] = useState(null);
  const dropdownRef = useRef(null);
  const menuRef = useRef(null);
  const inputId = `select-${name}`;

  const updateMenuPosition = () => {
    const rect = dropdownRef.current?.getBoundingClientRect();
    if (!rect) return;

    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < 260 && rect.top > spaceBelow;
    setMenuStyle({
      position: 'fixed',
      left: rect.left,
      width: rect.width,
      maxHeight: 240,
      zIndex: 80,
      ...(openUpward
        ? { bottom: window.innerHeight - rect.top + 4 }
        : { top: rect.bottom + 4 })
    });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const insideField = dropdownRef.current?.contains(event.target);
      const insideMenu = menuRef.current?.contains(event.target);
      if (!insideField && !insideMenu) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;

    updateMenuPosition();
    const handleMove = () => updateMenuPosition();
    window.addEventListener('resize', handleMove);
    window.addEventListener('scroll', handleMove, true);
    return () => {
      window.removeEventListener('resize', handleMove);
      window.removeEventListener('scroll', handleMove, true);
    };
  }, [isOpen]);

  // Filter options based on search term
  const filteredOptions = options.filter(option => 
    searchable ? 
      option.label?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      option.value?.toLowerCase().includes(searchTerm.toLowerCase())
    : true
  );

  const handleSelect = (option) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      const newValues = currentValues.includes(option.value)
        ? currentValues.filter(v => v !== option.value)
        : [...currentValues, option.value];
      onChange(newValues);
    } else {
      onChange(option.value);
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  const getDisplayValue = () => {
    if (multiple) {
      if (!Array.isArray(value) || value.length === 0) return placeholder;
      const selectedLabels = value.map(v => 
        options.find(opt => opt.value === v)?.label || v
      );
      return selectedLabels.join(', ');
    }
    
    const selectedOption = options.find(opt => opt.value === value);
    return selectedOption?.label || placeholder;
  };

  const removeValue = (valueToRemove) => {
    if (multiple && Array.isArray(value)) {
      onChange(value.filter(v => v !== valueToRemove));
    }
  };

  const themeConfig = theme || {
    colors: {
      text: 'text-gray-900',
      field: 'bg-white border border-gray-300 focus:border-blue-500'
    }
  };

  return (
    <div className={`select-field ${className}`} ref={dropdownRef}>
      {label && (
        <label 
          htmlFor={inputId}
          className={`block text-sm font-medium ${themeConfig.colors.text} mb-1`}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <div
          className={`
            w-full px-3 py-2 rounded-md shadow-sm cursor-pointer
            focus:outline-none focus:ring-2
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${themeConfig.colors.field}
            ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}
            ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}
          `}
          onClick={() => {
            if (disabled) return;
            if (!isOpen) updateMenuPosition();
            setIsOpen(!isOpen);
          }}
        >
          <div className="flex items-center justify-between">
            <span className={value ? 'text-gray-900' : 'text-gray-500'}>
              {getDisplayValue()}
            </span>
            <svg
              className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {isOpen && menuStyle && typeof document !== 'undefined' && createPortal(
          <div
            ref={menuRef}
            style={menuStyle}
            className="overflow-auto rounded-md border border-gray-300 bg-white shadow-lg"
          >
            {searchable && (
              <div className="p-2 border-b">
                <input
                  type="text"
                  placeholder="Search options..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  autoFocus
                />
              </div>
            )}
            
            <div className="py-1">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500">No options found</div>
              ) : (
                filteredOptions.map((option, index) => (
                  <div
                    key={option.value || index}
                    className={`
                      px-3 py-2 cursor-pointer hover:bg-gray-100
                      ${multiple && Array.isArray(value) && value.includes(option.value) ? 'bg-blue-50' : ''}
                      ${!multiple && value === option.value ? 'bg-blue-50' : ''}
                    `}
                    onClick={() => handleSelect(option)}
                  >
                    {multiple && (
                      <input
                        type="checkbox"
                        checked={Array.isArray(value) && value.includes(option.value)}
                        readOnly
                        className="mr-2"
                      />
                    )}
                    {option.label || option.value}
                  </div>
                ))
              )}
            </div>
          </div>,
          document.body
        )}
      </div>

      {/* Selected values for multiple select */}
      {multiple && Array.isArray(value) && value.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {value.map((val, index) => {
            const option = options.find(opt => opt.value === val);
            return (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
              >
                {option?.label || val}
                <button
                  type="button"
                  onClick={() => removeValue(val)}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
} 