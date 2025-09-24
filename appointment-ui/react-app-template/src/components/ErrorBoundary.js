import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
    this.setState({ error, errorInfo });
    
    // You could also log to an error reporting service here
    // logErrorToService(error, errorInfo);
  }

  render() {
    const { theme } = this.props;
    
    if (this.state.hasError) {
      return (
        <div className="error-boundary" style={{
          padding: '20px',
          margin: '20px',
          borderRadius: '8px',
          backgroundColor: theme === 'dark' ? '#333' : '#f8f9fa',
          color: theme === 'dark' ? '#fff' : '#333',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <h2>Something went wrong</h2>
          <p>The application encountered an error. Please try refreshing the page.</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 16px',
              backgroundColor: theme === 'dark' ? '#555' : '#e9ecef',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Refresh Page
          </button>
          {process.env.NODE_ENV === 'development' && (
            <details style={{ marginTop: '20px', whiteSpace: 'pre-wrap' }}>
              <summary>Error Details</summary>
              <p>{this.state.error && this.state.error.toString()}</p>
              <p>{this.state.errorInfo && this.state.errorInfo.componentStack}</p>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
