/**
 * Handles API errors in a consistent way
 * @param {Error} error - The error object
 * @param {Function} showToast - Optional function to display a toast notification
 * @returns {Object} Standardized error object with message and code
 */
export function handleApiError(error, showToast = null) {
  console.error('API Error:', error);
  
  let errorMessage = 'An unexpected error occurred';
  let errorCode = 'UNKNOWN_ERROR';
  
  // Handle network errors
  if (!navigator.onLine) {
    errorMessage = 'You are offline. Please check your internet connection.';
    errorCode = 'NETWORK_OFFLINE';
  }
  // Handle timeout errors
  else if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
    errorMessage = 'Request timed out. Please try again.';
    errorCode = 'REQUEST_TIMEOUT';
  }
  // Handle API response errors
  else if (error.response) {
    const status = error.response.status;
    
    switch (status) {
      case 400:
        errorMessage = error.response.data?.message || 'Invalid request';
        errorCode = 'BAD_REQUEST';
        break;
      case 401:
        errorMessage = 'Authentication required. Please log in again.';
        errorCode = 'UNAUTHORIZED';
        break;
      case 403:
        errorMessage = 'You do not have permission to perform this action.';
        errorCode = 'FORBIDDEN';
        break;
      case 404:
        errorMessage = 'The requested resource was not found.';
        errorCode = 'NOT_FOUND';
        break;
      case 409:
        errorMessage = error.response.data?.message || 'Conflict with current state.';
        errorCode = 'CONFLICT';
        break;
      case 429:
        errorMessage = 'Too many requests. Please try again later.';
        errorCode = 'RATE_LIMITED';
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        errorMessage = 'Server error. Please try again later.';
        errorCode = 'SERVER_ERROR';
        break;
      default:
        errorMessage = error.response.data?.message || 'An error occurred';
        errorCode = `HTTP_${status}`;
    }
  }
  // Handle specific error types
  else if (error.message) {
    errorMessage = error.message;
    
    if (error.message.includes('Failed to fetch')) {
      errorMessage = 'Unable to connect to the server. Please check your connection.';
      errorCode = 'CONNECTION_ERROR';
    }
  }
  
  // Show toast notification if the function is provided
  if (showToast && typeof showToast === 'function') {
    showToast(errorMessage, 'error');
  }
  
  return {
    message: errorMessage,
    code: errorCode,
    originalError: error
  };
}

/**
 * Formats validation errors from the API
 * @param {Object} validationErrors - Object containing validation errors
 * @returns {string} Formatted error message
 */
export function formatValidationErrors(validationErrors) {
  if (!validationErrors || typeof validationErrors !== 'object') {
    return 'Invalid data provided';
  }
  
  const errorMessages = [];
  
  Object.entries(validationErrors).forEach(([field, errors]) => {
    if (Array.isArray(errors)) {
      errorMessages.push(`${field}: ${errors.join(', ')}`);
    } else if (typeof errors === 'string') {
      errorMessages.push(`${field}: ${errors}`);
    }
  });
  
  return errorMessages.length > 0 
    ? errorMessages.join('\n') 
    : 'Invalid data provided';
}
