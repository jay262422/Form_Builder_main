import React, { useState } from 'react';
import formSubmissionService from '../services/formSubmissionService';

/**
 * FormSubmission - Component to handle form submission with validation
 */
export default function FormSubmission({
  formData,
  formSchema,
  onSubmit,
  onSuccess,
  onError,
  className = ''
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [submitResult, setSubmitResult] = useState(null);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    setValidationErrors([]);
    setSubmitResult(null);

    try {
      // Call parent onSubmit if provided
      if (onSubmit) {
        const parentResult = await onSubmit(formData, formSchema);
        if (!parentResult?.success) {
          throw new Error(parentResult?.error || 'Form submission failed');
        }
      }

      // Submit to submission service
      const result = await formSubmissionService.submitForm(formData, formSchema, {
        validateBeforeSubmit: true,
        includeMetadata: true
      });

      if (result.success) {
        setSubmitResult({
          type: 'success',
          message: result.message,
          submissionId: result.submissionId
        });
        onSuccess?.(result);
      } else {
        setValidationErrors(result.details || []);
        setSubmitResult({
          type: 'error',
          message: result.error
        });
        onError?.(result);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitResult({
        type: 'error',
        message: error.message || 'An unexpected error occurred'
      });
      onError?.({ error: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get error message for a specific field
  const getFieldError = (fieldName) => {
    return validationErrors.find(error => error.field === fieldName)?.message;
  };

  return (
    <div className={`form-submission ${className}`}>
      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <h4 className="text-sm font-medium text-red-800 mb-2">
            Please fix the following errors:
          </h4>
          <ul className="text-sm text-red-700 space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index}>
                <span className="font-medium">{error.field}:</span> {error.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Success Message */}
      {submitResult?.type === 'success' && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                Form submitted successfully!
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p>Submission ID: {submitResult.submissionId}</p>
                <p>{submitResult.message}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {submitResult?.type === 'error' && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Submission failed
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{submitResult.message}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex items-center justify-end space-x-3">
        <button
          type="button"
          onClick={() => {
            setValidationErrors([]);
            setSubmitResult(null);
          }}
          className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          Clear Messages
        </button>
        <button
          type="submit"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Submitting...
            </div>
          ) : (
            'Submit Form'
          )}
        </button>
      </div>
    </div>
  );
} 