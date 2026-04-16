import React, { useEffect } from 'react';

const AutoSuccessMessage = ({ settings, onResubmit, submittedData }) => {
  const postSubmission = settings?.postSubmission || {};
  
  // Handle auto-redirect
  useEffect(() => {
    if (postSubmission.autoRedirect?.enabled && settings.redirectUrl) {
      const timer = setTimeout(() => {
        window.location.href = settings.redirectUrl;
      }, postSubmission.autoRedirect.delay || 3000);
      
      return () => clearTimeout(timer);
    }
  }, [postSubmission.autoRedirect, settings.redirectUrl]);

  return (
    <div className="text-center py-12">
      {/* Success Icon */}
      <div className="text-green-600 text-6xl mb-4">
        {postSubmission.successIcon || "✅"}
      </div>
      
      {/* Success Title */}
      <h3 className="text-2xl font-bold text-gray-900 mb-4">
        Thank You!
      </h3>
      
      {/* Success Message */}
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        {settings.successMessage || "Form submitted successfully!"}
      </p>
      
      {/* Submitted Data Display (if enabled) */}
      {postSubmission.showSubmittedData && submittedData && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-3">Submitted Information:</h4>
          <div className="bg-gray-50 p-4 rounded-lg text-left max-w-md mx-auto">
            <pre className="text-sm text-gray-800 overflow-x-auto">
              {JSON.stringify(submittedData, null, 2)}
            </pre>
          </div>
        </div>
      )}
      
      {/* Resubmit Button */}
      {postSubmission.allowResubmit && onResubmit && (
        <button 
          onClick={onResubmit}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          {postSubmission.resubmitText || "Submit Another Request"}
        </button>
      )}
      
      {/* Auto-redirect notice */}
      {postSubmission.autoRedirect?.enabled && settings.redirectUrl && (
        <p className="text-sm text-gray-500 mt-4">
          Redirecting in {postSubmission.autoRedirect.delay / 1000} seconds...
        </p>
      )}
    </div>
  );
};

export default AutoSuccessMessage;
