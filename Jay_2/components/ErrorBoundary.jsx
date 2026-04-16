import React from 'react';
import errorHandler from '../services/errorHandler';

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 * and displays a fallback UI instead of crashing the app
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to error handler service
    const userMessage = errorHandler.handleError(error, 'ErrorBoundary');
    
    this.setState({
      error,
      errorInfo,
      userMessage
    });

    // Log error details for debugging
    console.error('Error Boundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      userMessage: null 
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { userMessage } = this.state;
      
      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <div className="error-boundary-icon">
              <svg className="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            
            <h2 className="error-boundary-title">
              {userMessage?.title || 'Something went wrong'}
            </h2>
            
            <p className="error-boundary-message">
              {userMessage?.message || 'An unexpected error occurred. Please try again.'}
            </p>
            
            <div className="error-boundary-actions">
              <button
                onClick={this.handleRetry}
                className="error-boundary-button primary"
              >
                Try Again
              </button>
              
              <button
                onClick={this.handleReload}
                className="error-boundary-button secondary"
              >
                Reload Page
              </button>
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="error-boundary-details">
                <summary className="error-boundary-summary">
                  Error Details (Development)
                </summary>
                <div className="error-boundary-error-info">
                  <h4>Error:</h4>
                  <pre className="error-boundary-error-stack">
                    {this.state.error.toString()}
                  </pre>
                  
                  {this.state.errorInfo && (
                    <>
                      <h4>Component Stack:</h4>
                      <pre className="error-boundary-error-stack">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Add CSS styles for the error boundary
const styles = `
  .error-boundary {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    padding: 2rem;
    background-color: #f9fafb;
  }

  .error-boundary-content {
    text-align: center;
    max-width: 500px;
    padding: 2rem;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }

  .error-boundary-icon {
    margin-bottom: 1rem;
  }

  .error-boundary-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 0.5rem;
  }

  .error-boundary-message {
    color: #6b7280;
    margin-bottom: 1.5rem;
    line-height: 1.5;
  }

  .error-boundary-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: center;
    margin-bottom: 1.5rem;
  }

  .error-boundary-button {
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    font-weight: 500;
    transition: all 0.2s;
    cursor: pointer;
    border: none;
  }

  .error-boundary-button.primary {
    background-color: #3b82f6;
    color: white;
  }

  .error-boundary-button.primary:hover {
    background-color: #2563eb;
  }

  .error-boundary-button.secondary {
    background-color: #f3f4f6;
    color: #374151;
    border: 1px solid #d1d5db;
  }

  .error-boundary-button.secondary:hover {
    background-color: #e5e7eb;
  }

  .error-boundary-details {
    margin-top: 1rem;
    text-align: left;
  }

  .error-boundary-summary {
    cursor: pointer;
    color: #6b7280;
    font-size: 0.875rem;
    padding: 0.5rem;
    background-color: #f9fafb;
    border-radius: 0.375rem;
    border: 1px solid #e5e7eb;
  }

  .error-boundary-summary:hover {
    background-color: #f3f4f6;
  }

  .error-boundary-error-info {
    margin-top: 0.5rem;
    padding: 1rem;
    background-color: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 0.375rem;
  }

  .error-boundary-error-info h4 {
    color: #dc2626;
    font-size: 0.875rem;
    font-weight: 600;
    margin-bottom: 0.25rem;
  }

  .error-boundary-error-stack {
    background-color: #1f2937;
    color: #f9fafb;
    padding: 0.75rem;
    border-radius: 0.375rem;
    font-size: 0.75rem;
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-word;
  }
`;

// Inject styles if in browser environment
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default ErrorBoundary; 