/**
 * Error Handler Service
 * Centralized error handling for better user experience
 */

class ErrorHandler {
  constructor() {
    this.errorTypes = {
      NETWORK: 'network',
      VALIDATION: 'validation',
      PERMISSION: 'permission',
      NOT_FOUND: 'not_found',
      SERVER: 'server',
      UNKNOWN: 'unknown'
    };
  }

  /**
   * Handle and categorize errors
   */
  handleError(error, context = '') {
    const errorInfo = this.categorizeError(error);
    
    // Log error for debugging
    this.logError(error, context, errorInfo);
    
    // Return user-friendly message
    return this.getUserFriendlyMessage(errorInfo);
  }

  /**
   * Categorize error based on type and message
   */
  categorizeError(error) {
    if (!error) {
      return { type: this.errorTypes.UNKNOWN, message: 'An unknown error occurred' };
    }

    const message = error.message || error.toString();
    const status = error.status || error.statusCode;

    // Network errors
    if (message.includes('fetch') || message.includes('network') || message.includes('Failed to fetch')) {
      return { type: this.errorTypes.NETWORK, message: 'Network connection error' };
    }

    // HTTP status based errors
    if (status) {
      switch (status) {
        case 400:
          return { type: this.errorTypes.VALIDATION, message: 'Invalid request data' };
        case 401:
          return { type: this.errorTypes.PERMISSION, message: 'Authentication required' };
        case 403:
          return { type: this.errorTypes.PERMISSION, message: 'Access denied' };
        case 404:
          return { type: this.errorTypes.NOT_FOUND, message: 'Resource not found' };
        case 500:
          return { type: this.errorTypes.SERVER, message: 'Server error' };
        default:
          return { type: this.errorTypes.SERVER, message: 'Server error' };
      }
    }

    // Validation errors
    if (message.includes('validation') || message.includes('required') || message.includes('invalid')) {
      return { type: this.errorTypes.VALIDATION, message: 'Validation error' };
    }

    // Permission errors
    if (message.includes('permission') || message.includes('access') || message.includes('unauthorized')) {
      return { type: this.errorTypes.PERMISSION, message: 'Permission denied' };
    }

    return { type: this.errorTypes.UNKNOWN, message: message };
  }

  /**
   * Get user-friendly error message
   */
  getUserFriendlyMessage(errorInfo) {
    const messages = {
      [this.errorTypes.NETWORK]: {
        title: 'Connection Error',
        message: 'Unable to connect to the server. Please check your internet connection and try again.',
        action: 'Retry'
      },
      [this.errorTypes.VALIDATION]: {
        title: 'Validation Error',
        message: 'Please check your input and try again.',
        action: 'Fix Input'
      },
      [this.errorTypes.PERMISSION]: {
        title: 'Access Denied',
        message: 'You don\'t have permission to perform this action.',
        action: 'Contact Admin'
      },
      [this.errorTypes.NOT_FOUND]: {
        title: 'Not Found',
        message: 'The requested resource was not found.',
        action: 'Go Back'
      },
      [this.errorTypes.SERVER]: {
        title: 'Server Error',
        message: 'Something went wrong on our end. Please try again later.',
        action: 'Retry'
      },
      [this.errorTypes.UNKNOWN]: {
        title: 'Error',
        message: 'An unexpected error occurred. Please try again.',
        action: 'Retry'
      }
    };

    return messages[errorInfo.type] || messages[this.errorTypes.UNKNOWN];
  }

  /**
   * Log error for debugging
   */
  logError(error, context, errorInfo) {
    const logData = {
      timestamp: new Date().toISOString(),
      context,
      errorType: errorInfo.type,
      message: error.message || error.toString(),
      stack: error.stack,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown'
    };

    // In development, log to console
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Handler:', logData);
    }

    // In production, you could send to error tracking service
    // this.sendToErrorService(logData);
  }

  /**
   * Create error boundary component props
   */
  createErrorBoundaryProps() {
    return {
      fallback: (error, errorInfo) => this.renderErrorFallback(error, errorInfo),
      onError: (error, errorInfo) => this.handleError(error, 'ErrorBoundary')
    };
  }

  /**
   * Render error fallback component
   */
  renderErrorFallback(error, errorInfo) {
    const userMessage = this.getUserFriendlyMessage(this.categorizeError(error));
    
    return {
      title: userMessage.title,
      message: userMessage.message,
      action: userMessage.action,
      retry: () => window.location.reload()
    };
  }

  /**
   * Handle async operations with error handling
   */
  async withErrorHandling(operation, context = '') {
    try {
      return await operation();
    } catch (error) {
      const userMessage = this.handleError(error, context);
      throw {
        ...error,
        userMessage,
        handled: true
      };
    }
  }

  /**
   * Validate form data and return validation errors
   */
  validateFormData(formData, schema) {
    const errors = [];

    if (!formData) {
      errors.push({ field: 'root', message: 'Form data is required' });
      return errors;
    }

    if (!schema || !schema.sections) {
      errors.push({ field: 'schema', message: 'Invalid form schema' });
      return errors;
    }

    // Validate required fields
    schema.sections.forEach(section => {
      if (section.fields) {
        section.fields.forEach(field => {
          if (field.required) {
            const value = this.getFieldValue(formData, field.name);
            if (!value || (typeof value === 'string' && value.trim() === '')) {
              errors.push({
                field: field.name,
                message: `${field.label || field.name} is required`
              });
            }
          }
        });
      }
    });

    return errors;
  }

  /**
   * Get field value from nested form data
   */
  getFieldValue(formData, fieldName) {
    const keys = fieldName.split('.');
    let value = formData;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  /**
   * Show toast notification for errors
   */
  showErrorToast(error, duration = 5000) {
    if (typeof window === 'undefined') return;

    const userMessage = this.getUserFriendlyMessage(this.categorizeError(error));
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'error-toast';
    toast.innerHTML = `
      <div class="error-toast-content">
        <div class="error-toast-title">${userMessage.title}</div>
        <div class="error-toast-message">${userMessage.message}</div>
        <button class="error-toast-action">${userMessage.action}</button>
      </div>
    `;

    // Add styles
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ef4444;
      color: white;
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 9999;
      max-width: 400px;
      animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(toast);

    // Auto remove after duration
    setTimeout(() => {
      if (toast.parentNode) {
        toast.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
          if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
          }
        }, 300);
      }
    }, duration);

    // Add action button handler
    const actionBtn = toast.querySelector('.error-toast-action');
    if (actionBtn) {
      actionBtn.addEventListener('click', () => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      });
    }
  }
}

// Create singleton instance
const errorHandler = new ErrorHandler();

export default errorHandler;
