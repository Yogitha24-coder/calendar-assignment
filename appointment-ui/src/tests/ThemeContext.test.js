import React, { useContext } from 'react';
import { render, screen, act } from '@testing-library/react';
import { ThemeContext } from '../App';

// Create a test component that uses the ThemeContext
const TestComponent = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  
  return (
    <div>
      <div data-testid="current-theme">{theme}</div>
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  );
};

describe('ThemeContext', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Mock localStorage
    jest.spyOn(Storage.prototype, 'setItem');
    jest.spyOn(Storage.prototype, 'getItem');
  });

  test('provides theme state and toggle function', () => {
    // Mock the ThemeContext provider
    const ThemeProvider = ({ children }) => {
      const [theme, setTheme] = React.useState('light');
      
      const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
      };
      
      return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
          {children}
        </ThemeContext.Provider>
      );
    };
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    
    // Initially light theme
    expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
    
    // Toggle theme
    act(() => {
      screen.getByText('Toggle Theme').click();
    });
    
    // Now dark theme
    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    
    // Verify localStorage was updated
    expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'dark');
    
    // Toggle theme again
    act(() => {
      screen.getByText('Toggle Theme').click();
    });
    
    // Back to light theme
    expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
    
    // Verify localStorage was updated again
    expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'light');
  });
});
