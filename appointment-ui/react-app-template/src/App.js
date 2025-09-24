import React, { useState, createContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './contexts/ToastContext';
import { AuthProvider } from './AuthContext';
// Import Login and Register from the correct path
import Login from './Login';  // Make sure this path is correct
import Register from './Register';  // Make sure this path is correct
import DayView from './views/DayView';
import WeekView from './views/WeekView';
import MonthView from './views/MonthView';
import ProtectedRoute from './components/ProtectedRoute';
import './Appointments.css';

// Create a context for theme
export const ThemeContext = createContext();

function App() {
  // Get initial theme from localStorage or default to 'light'
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'light';
  });

  // Function to toggle theme
  const toggleTheme = () => {
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', newTheme);
      return newTheme;
    });
  };

  // Apply theme to body element
  useEffect(() => {
    document.body.className = theme === 'dark' ? 'dark-mode' : '';
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <Router>
      <ErrorBoundary theme={theme}>
        <AuthProvider>
          <ThemeContext.Provider value={{ theme, toggleTheme }}>
            <ToastProvider>
              <div className="App">
                <Routes>
                  <Route path="/" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route 
                    path="/day" 
                    element={
                      <ProtectedRoute>
                        <DayView />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/week" 
                    element={
                      <ProtectedRoute>
                        <WeekView />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/month" 
                    element={
                      <ProtectedRoute>
                        <MonthView />
                      </ProtectedRoute>
                    } 
                  />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </div>
            </ToastProvider>
          </ThemeContext.Provider>
        </AuthProvider>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
