import React, { useState, useRef } from 'react';

/**
 * FileUpload - File upload field with drag-and-drop support
 */
export default function FileUpload({
  label,
  name,
  value = null,
  onChange,
  onBlur,
  accept,
  multiple = false,
  required = false,
  disabled = false,
  error = false,
  className = '',
  description,
  maxSize = 10 * 1024 * 1024, // 10MB default
  formTheme,
  theme,
  // Extract these props to prevent them from being passed to DOM
  validation,
  styling,
  helpText,
  defaultValue,
  ...props
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileError, setFileError] = useState(null);
  const fileInputRef = useRef(null);
  const inputId = `file-${name}`;

  const validateFile = (file) => {
    // Check file size
    if (file.size > maxSize) {
      return `File size exceeds ${formatFileSize(maxSize)} limit`;
    }

    // Check file type if accept is specified
    if (accept && accept !== '*/*') {
      const acceptedTypes = accept.split(',').map(type => type.trim());
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
      const fileType = file.type;
      
      const isAccepted = acceptedTypes.some(type => {
        if (type.startsWith('.')) {
          return fileExtension === type.toLowerCase();
        } else if (type.includes('*')) {
          const pattern = type.replace('*', '.*');
          return new RegExp(pattern).test(fileType);
        } else {
          return fileType === type;
        }
      });

      if (!isAccepted) {
        return `File type not allowed. Accepted types: ${accept}`;
      }
    }

    return null;
  };

  const handleFileSelect = (files) => {
    setFileError(null);
    const fileArray = Array.from(files);
    const errors = [];

    // Validate each file
    for (const file of fileArray) {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      }
    }

    if (errors.length > 0) {
      setFileError(errors.join(', '));
      return;
    }

    if (multiple) {
      onChange(fileArray);
    } else {
      onChange(fileArray[0] || null);
    }
  };

  const handleInputChange = (e) => {
    const files = e.target.files;
    handleFileSelect(files);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const removeFile = (index) => {
    setFileError(null);
    if (multiple && Array.isArray(value)) {
      const newFiles = value.filter((_, i) => i !== index);
      onChange(newFiles);
    } else {
      onChange(null);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getAcceptedTypes = () => {
    if (!accept) return 'All files';
    return accept.split(',').map(type => type.trim()).join(', ');
  };

  const displayError = error || fileError;

  return (
    <div className={`file-upload-field ${className}`}>
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-colors duration-200
          ${isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${displayError ? 'border-red-300' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          id={inputId}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          onBlur={onBlur}
          required={required}
          disabled={disabled}
          className="hidden"
          {...props}
        />
        
        <div className="space-y-2">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          
          <div className="text-gray-600">
            <span className="font-medium">Click to upload</span> or drag and drop
          </div>
          
          <div className="text-xs text-gray-500">
            {getAcceptedTypes()}
            {maxSize && ` (Max size: ${formatFileSize(maxSize)})`}
          </div>
        </div>
      </div>

      {description && (
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      )}

      {displayError && (
        <p className="text-sm text-red-600 mt-1">{displayError}</p>
      )}

      {/* Display selected files */}
      {value && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Selected Files:</h4>
          {multiple && Array.isArray(value) ? (
            value.map((file, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{file.name}</span>
                  <span className="text-xs text-gray-400">({formatFileSize(file.size)})</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            ))
          ) : (
            <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">{value.name}</span>
                <span className="text-xs text-gray-400">({formatFileSize(value.size)})</span>
              </div>
              <button
                type="button"
                onClick={() => removeFile(0)}
                className="text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 