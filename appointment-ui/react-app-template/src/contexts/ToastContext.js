import React, { createContext, useState, useContext } from 'react';

// Create the context
export const ToastContext = createContext();

// Custom hook to use the toast context
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Toast provider component
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  // Add a new toast
  const addToast = (message, type = 'info', duration = 5000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto-remove toast after duration
    if (duration !== 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    
    return id;
  };

  // Remove a toast by ID
  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Shorthand methods for different toast types
  const showSuccess = (message, duration) => addToast(message, 'success', duration);
  const showError = (message, duration) => addToast(message, 'error', duration);
  const showWarning = (message, duration) => addToast(message, 'warning', duration);
  const showInfo = (message, duration) => addToast(message, 'info', duration);

  return (
    <ToastContext.Provider value={{ 
      addToast, 
      removeToast, 
      showSuccess, 
      showError, 
      showWarning, 
      showInfo 
    }}>
      {children}
      <div className="toast-container" style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 1000
      }}>
        {toasts.map(toast => (
          <div 
            key={toast.id} 
            className={`toast toast-${toast.type}`}
            style={{
              padding: '12px 16px',
              marginBottom: '10px',
              borderRadius: '4px',
              backgroundColor: toast.type === 'error' ? '#f8d7da' : 
                              toast.type === 'success' ? '#d4edda' : 
                              toast.type === 'warning' ? '#fff3cd' : '#cce5ff',
              color: toast.type === 'error' ? '#721c24' : 
                     toast.type === 'success' ? '#155724' : 
                     toast.type === 'warning' ? '#856404' : '#004085',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              minWidth: '250px',
              maxWidth: '350px',
              animation: 'fadeIn 0.3s ease-in-out'
            }}
          >
            <span>{toast.message}</span>
            <button 
              onClick={() => removeToast(toast.id)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '16px',
                marginLeft: '10px'
              }}
            >
              &times;
            </button>
          </div>
        ))}
      </div>
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </ToastContext.Provider>
  );
};
