import React, { createContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DayView from './views/DayView';
import WeekView from './views/WeekView';
import MonthView from './views/MonthView';
// Fix the import path - import from root src directory, not views
import Login from './Login'; // Changed from './views/Login'
import Register from './Register'; // Added import for Register component
import { AuthProvider } from './AuthContext';
import './Appointments.css';

// Create the theme context
export const ThemeContext = createContext();

function App() {
  // Get saved theme from localStorage or default to 'light'
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  // Function to toggle theme
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // Apply theme to document when it changes
  useEffect(() => {
    console.log("Theme changed to:", theme);
    
    // Apply theme class to body
    if (theme === 'dark') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    
    // Create or update direct styles
    let styleEl = document.getElementById('theme-direct-styles');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'theme-direct-styles';
      document.head.appendChild(styleEl);
    }
    
    if (theme === 'dark') {
      styleEl.textContent = `
        body, .gc-container, .gc-main, .gc-main-header, .gc-canvas {
          background-color: #202124 !important;
          color: #e8eaed !important;
        }
        .gc-left {
          background-color: #2d2e30 !important;
        }
        .gc-time-cell, .text-muted, .gc-upcoming-time {
          color: #9aa0a6 !important;
        }
        .form-control, input, textarea, select {
          background-color: #3c4043 !important;
          color: #e8eaed !important;
          border-color: #5f6368 !important;
        }
        .gc-slot-line, .gc-time-cell {
          border-color: #5f6368 !important;
        }
        .modal-content, .modal-header, .modal-body, .modal-footer {
          background-color: #2d2e30 !important;
          color: #e8eaed !important;
          border-color: #5f6368 !important;
        }
        .btn-secondary {
          background-color: #3c4043 !important;
          color: #e8eaed !important;
          border-color: #5f6368 !important;
        }
        .view-link {
          color: #e8eaed !important;
        }
        .view-link.active {
          background-color: #3c4043 !important;
          color: #8ab4f8 !important;
        }
        .nav-button, .logout-button {
          color: #e8eaed !important;
        }
        .color-option {
          color: #e8eaed !important;
        }
        .color-option:hover {
          background-color: #3c4043 !important;
        }
        .color-option.selected {
          background-color: #3c4043 !important;
          border-color: #8ab4f8 !important;
        }
      `;
    } else {
      styleEl.textContent = '';
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} /> {/* Added Register route */}
            <Route path="/day" element={<DayView />} />
            <Route path="/week" element={<WeekView />} />
            <Route path="/month" element={<MonthView />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeContext.Provider>
  );
}

export default App;
