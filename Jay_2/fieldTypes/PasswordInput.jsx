import React, { useState } from 'react';
import TextInput from './TextInput';

/**
 * PasswordInput - Password input field with show/hide and optional confirmation
 */
export default function PasswordInput({
  showToggle = true,
  showPasswordToggle,
  confirmPassword = false,
  onCompanionChange,
  value = '',
  onChange,
  onBlur,
  label,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [confirm, setConfirm] = useState('');
  const toggleVisible = showPasswordToggle !== false && showToggle !== false;
  const mismatch = confirmPassword && String(value ?? '') !== confirm;

  const updateConfirm = (nextConfirm) => {
    setConfirm(nextConfirm);
    onCompanionChange?.(nextConfirm);
  };

  return (
    <div>
      <div className="relative">
        <TextInput
          {...props}
          label={label}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder={props.placeholder || 'Enter your password'}
        />

        {toggleVisible && (
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute right-3 top-9 flex items-center"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
              </svg>
            ) : (
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        )}
      </div>

      {confirmPassword && (
        <div className="mt-3">
          <TextInput
            label={label ? `Confirm ${label}` : 'Confirm password'}
            name={props.name ? `${props.name}__confirm` : 'confirm-password'}
            value={confirm}
            onChange={updateConfirm}
            onBlur={onBlur}
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Re-enter your password"
            error={mismatch}
          />
          {mismatch && (
            <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
          )}
        </div>
      )}
    </div>
  );
}
