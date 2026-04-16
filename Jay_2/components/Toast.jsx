import React, { useState, useEffect, useRef } from 'react';

export default function Toast({ message, type = 'info', duration = 3000, onClose }) {
  const [isVisible, setIsVisible] = useState(true);
  const closeTimerRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      closeTimerRef.current = setTimeout(() => onClose?.(), 300); // Wait for fade out animation
    }, duration);

    return () => {
      clearTimeout(timer);
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, [duration, onClose]);

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500 text-white';
      case 'error':
        return 'bg-red-500 text-white';
      case 'warning':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-blue-500 text-white';
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-fade-in">
      <div className={`px-4 py-3 rounded-lg shadow-lg ${getTypeStyles()}`}>
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">{message}</span>
          <button
            onClick={() => {
              setIsVisible(false);
              closeTimerRef.current = setTimeout(() => onClose?.(), 300);
            }}
            className="ml-2 text-white hover:text-gray-200"
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
} 