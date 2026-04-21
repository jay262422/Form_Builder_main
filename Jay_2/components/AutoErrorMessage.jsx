import React from 'react';

const AutoErrorMessage = ({ settings, onRetry, error }) => {
  const postSubmission = settings?.postSubmission || {};
  
  return (
    <div className="text-center py-12">
      {/* Error Icon */}
      <div className="text-red-600 text-6xl mb-4">
        {postSubmission.errorIcon || "!"}
      </div>
      
      {/* Error Title */}
      <h3 className="text-2xl font-bold text-gray-900 mb-4">
        Submission Failed
      </h3>
      
      {/* Error Message */}
      <p className="text-red-600 mb-6 max-w-md mx-auto">
        {error || settings.errorMessage || "An error occurred while submitting the form."}
      </p>
      
      {/* Retry Button */}
      {onRetry && (
        <button 
          onClick={onRetry}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Try Again
        </button>
      )}
      
      {/* Alternative Contact Info */}
      <div className="mt-6 text-sm text-gray-600">
        <p>If the problem persists, please try again later or check your connection.</p>
      </div>
    </div>
  );
};

export default AutoErrorMessage;

