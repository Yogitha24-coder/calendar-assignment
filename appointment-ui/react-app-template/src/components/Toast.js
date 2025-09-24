import React, { useState, useEffect } from 'react';

const Toast = ({ message, type = 'error', duration = 5000, onClose }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      if (onClose) setTimeout(onClose, 300); // Allow animation to complete
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getBackgroundColor = () => {
    switch (type) {
      case 'success': return '#28a745';
      case 'warning': return '#ffc107';
      case 'info': return '#17a2b8';
      case 'error':
      default: return '#dc3545';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success': return '✓';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      case 'error':
      default: return '✕';
    }
  };

  return (
    <div 
      className={`toast-notification ${visible ? 'show' : 'hide'}`}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        maxWidth: '350px',
        backgroundColor: getBackgroundColor(),
        color: 'white',
        padding: '12px 16px',
        borderRadius: '4px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        alignItems: 'flex-start',
        zIndex: 9999,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.3s, transform 0.3s'
      }}
    >
      <div 
        className="toast-icon"
        style={{
          marginRight: '12px',
          fontSize: '18px',
          fontWeight: 'bold'
        }}
      >
        {getIcon()}
      </div>
      <div className="toast-content" style={{ flex: 1 }}>
        <div 
          className="toast-message"
          style={{
            wordBreak: 'break-word'
          }}
        >
          {message}
        </div>
      </div>
      <button 
        className="toast-close"
        onClick={() => {
          setVisible(false);
          if (onClose) setTimeout(onClose, 300);
        }}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'white',
          fontSize: '18px',
          cursor: 'pointer',
          marginLeft: '12px',
          opacity: 0.7
        }}
      >
        &times;
      </button>
    </div>
  );
};

export default Toast;
