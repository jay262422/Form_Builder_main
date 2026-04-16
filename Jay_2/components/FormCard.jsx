import React from 'react';
import FormBuilder from '../FormBuilder';

/**
 * FormCard - Modern card-based form layout
 * Provides better visual hierarchy and spacing for forms
 */
export default function FormCard({
  schema,
  validationRules = {},
  initialData = {},
  onSubmit,
  onCancel,
  className = "",
  submitText = "Submit",
  cancelText = "Cancel",
  showCancel = true,
  loading = false,
  disabled = false,
  title,
  description,
  icon,
  variant = "default" // default, success, warning, error
}) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'success':
        return {
          header: 'bg-green-50 border-green-200',
          title: 'text-green-800',
          description: 'text-green-600',
          button: 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
        };
      case 'warning':
        return {
          header: 'bg-yellow-50 border-yellow-200',
          title: 'text-yellow-800',
          description: 'text-yellow-600',
          button: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
        };
      case 'error':
        return {
          header: 'bg-red-50 border-red-200',
          title: 'text-red-800',
          description: 'text-red-600',
          button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
        };
      default:
        return {
          header: 'bg-blue-50 border-blue-200',
          title: 'text-blue-800',
          description: 'text-blue-600',
          button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
        };
    }
  };

  const variantClasses = getVariantClasses();

  return (
    <div className={`form-card ${className}`}>
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          {/* Card Header */}
          {(title || description || icon) && (
            <div className={`px-6 py-4 border-b border-gray-200 ${variantClasses.header}`}>
              <div className="flex items-center space-x-3">
                {icon && (
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${variantClasses.button} text-white`}>
                      {icon}
                    </div>
                  </div>
                )}
                <div className="flex-1">
                  {title && (
                    <h2 className={`text-lg font-semibold ${variantClasses.title}`}>
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p className={`text-sm mt-1 ${variantClasses.description}`}>
                      {description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Card Body */}
          <div className="px-6 py-6">
            <FormBuilder
              schema={schema}
              validationRules={validationRules}
              initialData={initialData}
              onSubmit={onSubmit}
              onCancel={onCancel}
              loading={loading}
              disabled={disabled}
              submitText={submitText}
              cancelText={cancelText}
              showCancel={showCancel}
              className="card-form"
            />
          </div>
        </div>
      </div>
    </div>
  );
} 