import React from 'react';

const PrintButton = ({ theme = 'light' }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <button 
      className="print-button" 
      onClick={handlePrint}
      aria-label="Print schedule"
      title="Print schedule"
      style={{
        background: 'transparent',
        border: 'none',
        fontSize: '1.2rem',
        cursor: 'pointer',
        color: theme === 'dark' ? '#fff' : '#212529',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px',
        marginLeft: '8px'
      }}
    >
      <span role="img" aria-label="Print">🖨️</span>
    </button>
  );
};

export default PrintButton;
