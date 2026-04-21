import formSubmissionService from '../services/formSubmissionService';
import { isStepByStepForm } from './formHelpers';

/**
 * Auto-generates submission handler based on form settings
 * @param {Object} formData - The form data object
 * @param {Function} setSubmitting - Function to set submitting state
 * @param {Function} setSubmitted - Function to set submitted state
 * @param {Function} setError - Function to set error state
 * @param {Function} setSubmittedData - Function to set submitted data
 * @returns {Function} - The submission handler function
 */
export const generateSubmissionHandler = (
  formData,
  setSubmitting,
  setSubmitted,
  setError,
  setSubmittedData
) => {
  return async (data) => {
    try {
      setSubmitting(true);
      setError(null);

      const formSchema = {
        id: formData.id,
        name: formData.name,
        formType: isStepByStepForm(formData) ? 'wizard' : 'multi-section',
        sections: formData.schema?.sections || formData.sections || []
      };

      // Check if custom API endpoint is configured
      const customEndpoint = formData.settings?.buttons?.submit?.customApiEndpoint;
      const customMethod = formData.settings?.buttons?.submit?.customApiMethod || 'POST';
      const canUseCustomEndpoint = Boolean(customEndpoint) && !formData.status?.isPublished;
      
      console.log('Form settings:', formData.settings);
      console.log('Custom endpoint:', customEndpoint);
      console.log('Custom method:', customMethod);
      
      let result;
      if (canUseCustomEndpoint) {
        // Use custom API endpoint
        console.log(`Submitting to custom endpoint: ${customEndpoint}`);
        result = await submitToCustomEndpoint(data, customEndpoint, customMethod);
      } else {
        // Use default form submission service
        console.log('Using default form submission service');
        console.log('Form schema:', formSchema);
        console.log('Form data:', data);
        console.log('Options:', {
          formName: formData.name,
          formType: formData.type || 'builder',
          source: 'form-page'
        });
        
        result = await formSubmissionService.submitForm(data, formSchema, {
          formName: formData.name,
          formType: isStepByStepForm(formData) ? 'wizard' : (formData.type || 'builder'),
          source: 'form-page'
        });
        
        console.log('Form submission result:', result);
      }

      if (customEndpoint && !canUseCustomEndpoint) {
        console.warn('Custom API endpoint ignored for published form to preserve platform submission rules.');
      }

      if (!result?.success) {
        const errorMessage = result?.details || result?.error || formData.settings?.errorMessage || 'Failed to submit the form. Please try again.';
        setError(errorMessage);
        return result;
      }

      // Store submitted data if needed
      if (formData.settings?.postSubmission?.showSubmittedData) {
        setSubmittedData(data);
      }

      // Handle success based on settings
      if (formData.settings?.postSubmission?.showSuccessPage !== false) {
        setSubmitted(true);
      }

      // Handle notifications if enabled
      if (formData.settings?.postSubmission?.notifications?.email?.enabled) {
        await handleEmailNotification(formData.settings.postSubmission.notifications.email, data);
      }

      console.log('Form submitted successfully:', result);
      return result;

    } catch (error) {
      console.error('Form submission error:', error);
      // Ensure we always have a proper error message
      const errorMessage = error?.message || 
                          (typeof error === 'string' ? error : 'Unknown error occurred') ||
                          formData.settings?.errorMessage || 
                          'Failed to submit the form. Please try again.';
      setError(errorMessage);
      throw error;
    } finally {
      setSubmitting(false);
    }
  };
};

/**
 * Handle email notifications
 * @param {Object} emailConfig - Email notification configuration
 * @param {Object} formData - Submitted form data
 */
const handleEmailNotification = async (emailConfig, formData) => {
  try {
    // This would integrate with your email service
    // For now, just log the notification
    console.log('Email notification would be sent to:', emailConfig.recipients);
    console.log('Form data:', formData);
    
    // You can integrate with your email service here
    // await emailService.sendNotification(emailConfig, formData);
  } catch (error) {
    console.error('Failed to send email notification:', error);
  }
};

/**
 * Handle auto-redirect based on settings
 * @param {Object} settings - Form settings
 */
export const handleAutoRedirect = (settings) => {
  if (settings?.postSubmission?.autoRedirect?.enabled && settings.redirectUrl) {
    setTimeout(() => {
      window.location.href = settings.redirectUrl;
    }, settings.postSubmission.autoRedirect.delay || 3000);
  }
};

/**
 * Check if form should show success page
 * @param {Object} settings - Form settings
 * @returns {boolean} - Whether to show success page
 */
export const shouldShowSuccessPage = (settings) => {
  return settings?.postSubmission?.showSuccessPage !== false;
};

/**
 * Check if form should allow resubmit
 * @param {Object} settings - Form settings
 * @returns {boolean} - Whether to allow resubmit
 */
export const shouldAllowResubmit = (settings) => {
  return settings?.postSubmission?.allowResubmit !== false;
};

/**
 * Submit form data to a custom API endpoint
 * @param {Object} data - Form data to submit
 * @param {string} endpoint - Custom API endpoint URL
 * @param {string} method - HTTP method (default: POST)
 * @returns {Promise<Object>} - Response from the custom endpoint
 */
const submitToCustomEndpoint = async (data, endpoint, method = 'POST') => {
  try {
    const response = await fetch(endpoint, {
      method: method.toUpperCase(),
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Custom API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Custom API submission error:', error);
    // Provide more specific error messages based on error type
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error(`Network error: Unable to reach custom endpoint ${endpoint}. Please check if the server is running.`);
    } else if (error.name === 'TypeError' && error.message.includes('JSON')) {
      throw new Error(`Invalid response from custom endpoint: The server returned invalid JSON.`);
    } else {
      throw new Error(`Custom endpoint error: ${error.message || 'Unknown error occurred'}`);
    }
  }
};
