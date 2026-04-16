import React, { useState, useRef, useEffect } from 'react';

/**
 * SignatureInput - Digital signature pad component
 * Allows users to draw their signature using mouse or touch
 */
export default function SignatureInput({
  field,
  value = '',
  onChange,
  disabled = false,
  error = null
}) {
  // Debug logging
  console.log('SignatureInput props:', { field, value, onChange, disabled, error });

  // Add fallback for when field is undefined
  if (!field) {
    console.error('SignatureInput: field prop is undefined or null');
    return (
      <div className="signature-input">
        <div className="text-red-500 text-sm">Error: Field configuration is missing</div>
      </div>
    );
  }

  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [context, setContext] = useState(null);

  const width = field.width || 400;
  const height = field.height || 200;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    setContext(ctx);

    // Load existing signature if available
    if (value) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        setHasSignature(true);
      };
      img.src = value;
    }
  }, [value]);

  const startDrawing = (e) => {
    if (disabled) return;
    
    setIsDrawing(true);
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    context.beginPath();
    context.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing || disabled) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    context.lineTo(x, y);
    context.stroke();
  };

  const stopDrawing = () => {
    if (disabled) return;
    
    setIsDrawing(false);
    setHasSignature(true);
    
    // Convert canvas to data URL and call onChange
    const dataURL = canvasRef.current.toDataURL();
    onChange(dataURL);
  };

  const clearSignature = () => {
    if (disabled) return;
    
    context.clearRect(0, 0, width, height);
    setHasSignature(false);
    onChange('');
  };

  return (
    <div className="signature-input">
      {field.label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="cursor-crosshair bg-white"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={(e) => {
            e.preventDefault();
            const touch = e.touches[0];
            startDrawing(touch);
          }}
          onTouchMove={(e) => {
            e.preventDefault();
            const touch = e.touches[0];
            draw(touch);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            stopDrawing();
          }}
        />
      </div>
      
      <div className="flex gap-2 mt-2">
        <button
          type="button"
          onClick={clearSignature}
          disabled={disabled || !hasSignature}
          className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Clear
        </button>
        
        {!hasSignature && (
          <span className="text-sm text-gray-500 flex items-center">
            Draw your signature above
          </span>
        )}
      </div>
      
      {error && (
        <div className="text-red-500 text-sm mt-1">{error}</div>
      )}
    </div>
  );
}
