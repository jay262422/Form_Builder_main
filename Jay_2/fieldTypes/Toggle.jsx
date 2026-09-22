import React from 'react';

/**
 * Toggle - Boolean input field with modern switch design
 */
export default function Toggle({
  label,
  name,
  value = false,
  onChange,
  onBlur,
  required = false,
  disabled = false,
  error = false,
  className = '',
  description,
  // Extract these props to prevent them from being passed to DOM
  formTheme,
  theme,
  validation,
  styling,
  helpText,
  defaultValue,
  checked,
  size = 'medium',
  ...props
}) {
  const toggleId = `toggle-${name}`;
  const sizeClasses = {
    small: { track: 'h-5 w-9', knob: 'h-3 w-3', on: 'translate-x-5', off: 'translate-x-1' },
    medium: { track: 'h-6 w-11', knob: 'h-4 w-4', on: 'translate-x-6', off: 'translate-x-1' },
    large: { track: 'h-7 w-14', knob: 'h-5 w-5', on: 'translate-x-8', off: 'translate-x-1' }
  };
  const sizeClass = sizeClasses[size] || sizeClasses.medium;
  
  return (
    <div className={`toggle-field ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            id={toggleId}
            type="button"
            role="switch"
            aria-checked={value}
            onClick={() => !disabled && onChange(!value)}
            onBlur={onBlur}
            disabled={disabled}
            className={`
              relative inline-flex ${sizeClass.track} items-center rounded-full transition-colors
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              ${value ? 'bg-blue-600' : 'bg-gray-200'}
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              ${error ? 'focus:ring-red-500' : ''}
            `}
            {...props}
          >
            <span
              className={`
                inline-block ${sizeClass.knob} transform rounded-full bg-white transition-transform
                ${value ? sizeClass.on : sizeClass.off}
              `}
            />
          </button>
          
          <div className="ml-3">
            {label && (
              <label 
                htmlFor={toggleId}
                className="text-sm font-medium text-gray-700 cursor-pointer"
              >
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
              </label>
            )}
            {description && (
              <p className="text-sm text-gray-500">{description}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 