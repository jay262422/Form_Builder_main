import React, { useState } from 'react';

/**
 * RatingInput - Star rating component
 * Supports customizable rating scale, labels, and hover effects
 */
export default function RatingInput({
  field,
  value = 0,
  onChange,
  disabled = false,
  error = null
}) {
  // Add fallback for when field is undefined
  if (!field) {
    console.error('RatingInput: field prop is undefined or null');
    return (
      <div className="rating-input">
        <div className="text-red-500 text-sm">Error: Field configuration is missing</div>
      </div>
    );
  }

  const [hoverRating, setHoverRating] = useState(0);
  const maxRating = field.maxRating || 5;
  const showLabels = field.showLabels !== false;
  const labels = field.labels || [];

  const handleClick = (rating) => {
    if (!disabled) {
      onChange(rating);
    }
  };

  const handleMouseEnter = (rating) => {
    if (!disabled) {
      setHoverRating(rating);
    }
  };

  const handleMouseLeave = () => {
    if (!disabled) {
      setHoverRating(0);
    }
  };

  const getLabel = (rating) => {
    if (labels[rating - 1]) {
      return labels[rating - 1];
    }
    
    // Default labels
    const defaultLabels = {
      1: 'Poor',
      2: 'Fair', 
      3: 'Good',
      4: 'Very Good',
      5: 'Excellent'
    };
    
    return defaultLabels[rating] || `Star ${rating}`;
  };

  const getIcon = (rating) => {
    const currentRating = hoverRating || value;
    return currentRating >= rating ? '★' : '☆';
  };

  return (
    <div className="rating-input">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="flex items-center space-x-1">
        {Array.from({ length: maxRating }, (_, index) => {
          const rating = index + 1;
          return (
            <button
              key={rating}
              type="button"
              onClick={() => handleClick(rating)}
              onMouseEnter={() => handleMouseEnter(rating)}
              onMouseLeave={handleMouseLeave}
              disabled={disabled}
              className={`
                text-2xl transition-colors duration-200
                ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-110'}
                ${getIcon(rating) === '★' ? 'text-yellow-400' : 'text-gray-300'}
              `}
              title={getLabel(rating)}
            >
              {getIcon(rating)}
            </button>
          );
        })}
      </div>
      
      {showLabels && value > 0 && (
        <div className="mt-2 text-sm text-gray-600">
          {getLabel(value)}
        </div>
      )}
      
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
