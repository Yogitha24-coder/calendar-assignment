import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeContext } from '../App';
import { AuthContext } from '../AuthContext';
import MonthView from '../views/MonthView';
import { fetchAppointments } from '../api';

// Mock the API calls
jest.mock('../api', () => ({
  fetchAppointments: jest.fn()
}));

// Mock navigate function
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('MonthView Component', () => {
  const mockAppointments = [
    { id: 1, title: 'Meeting', description: 'Team meeting', startTime: '09:00', endTime: '10:00', color: '#4285f4', date: '2023-05-15' },
    { id: 2, title: 'Lunch', description: 'Lunch break', startTime: '12:00', endTime: '13:00', color: '#0f9d58', date: '2023-05-15' }
  ];

  beforeEach(() => {
    // Reset mocks
    fetchAppointments.mockReset();
    mockNavigate.mockReset();
    
    // Mock API response
    fetchAppointments.mockResolvedValue(mockAppointments);
  });

  const renderWithContext = (ui) => {
    return render(
      <BrowserRouter>
        <AuthContext.Provider value={{ logout: jest.fn() }}>
          <ThemeContext.Provider value={{ theme: 'light', toggleTheme: jest.fn() }}>
            {ui}
          </ThemeContext.Provider>
        </AuthContext.Provider>
      </BrowserRouter>
    );
  };

  test('renders month view with correct title', async () => {
    renderWithContext(<MonthView />);
    
    // Check if the current month and year are displayed
    const currentDate = new Date();
    const monthYear = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(currentDate);
    
    await waitFor(() => {
      expect(screen.getByText(monthYear)).toBeInTheDocument();
    });
  });

  test('navigates to previous month when prev button is clicked', async () => {
    renderWithContext(<MonthView />);
    
    // Get the current month display
    const currentMonthDisplay = screen.getByText(/[A-Za-z]+ \d{4}/);
    const initialMonth = currentMonthDisplay.textContent;
    
    // Click the previous month button
    const prevButton = screen.getByText('←');
    fireEvent.click(prevButton);
    
    // Wait for the month to change
    await waitFor(() => {
      expect(currentMonthDisplay.textContent).not.toBe(initialMonth);
    });
    
    // Verify API was called again
    expect(fetchAppointments).toHaveBeenCalled();
  });

  test('navigates to next month when next button is clicked', async () => {
    renderWithContext(<MonthView />);
    
    // Get the current month display
    const currentMonthDisplay = screen.getByText(/[A-Za-z]+ \d{4}/);
    const initialMonth = currentMonthDisplay.textContent;
    
    // Click the next month button
    const nextButton = screen.getByText('→');
    fireEvent.click(nextButton);
    
    // Wait for the month to change
    await waitFor(() => {
      expect(currentMonthDisplay.textContent).not.toBe(initialMonth);
    });
    
    // Verify API was called again
    expect(fetchAppointments).toHaveBeenCalled();
  });

  test('navigates to day view when a day cell is clicked', async () => {
    renderWithContext(<MonthView />);
    
    // Wait for the component to load
    await waitFor(() => {
      expect(fetchAppointments).toHaveBeenCalled();
    });
    
    // Click on a day cell (first visible day)
    const dayCells = screen.getAllByClassName('month-cell');
    fireEvent.click(dayCells[0]);
    
    // Verify navigation occurred
    expect(mockNavigate).toHaveBeenCalled();
    expect(mockNavigate.mock.calls[0][0]).toMatch(/^\/day\?date=\d{4}-\d{2}-\d{2}$/);
  });

  test('displays appointments in the month view', async () => {
    // Set a specific date for testing
    const testDate = new Date(2023, 4, 15); // May 15, 2023
    jest.useFakeTimers().setSystemTime(testDate);
    
    renderWithContext(<MonthView />);
    
    // Wait for appointments to load
    await waitFor(() => {
      expect(fetchAppointments).toHaveBeenCalled();
    });
    
    // Check if appointments are displayed
    await waitFor(() => {
      expect(screen.getByText(/Meeting/)).toBeInTheDocument();
    });
    expect(screen.getByText(/Lunch/)).toBeInTheDocument();
    
    // Restore real timers
    jest.useRealTimers();
  });

  test('filters appointments when search is used', async () => {
    renderWithContext(<MonthView />);
    
    // Wait for appointments to load
    await waitFor(() => {
      expect(fetchAppointments).toHaveBeenCalled();
    });
    
    // Find the search input
    const searchInput = screen.getByPlaceholderText('Search...');
    
    // Type in the search box
    fireEvent.change(searchInput, { target: { value: 'Meeting' } });
    
    // Check if only the matching appointment is shown in the upcoming list
    await waitFor(() => {
      expect(screen.getByText(/Meeting/)).toBeInTheDocument();
    });
    expect(screen.queryByText(/Lunch/)).not.toBeInTheDocument();
  });

  test('toggles theme when theme button is clicked', async () => {
    const mockToggleTheme = jest.fn();
    
    render(
      <BrowserRouter>
        <AuthContext.Provider value={{ logout: jest.fn() }}>
          <ThemeContext.Provider value={{ theme: 'light', toggleTheme: mockToggleTheme }}>
            <MonthView />
          </ThemeContext.Provider>
        </AuthContext.Provider>
      </BrowserRouter>
    );
    
    // Find the theme toggle button
    const themeButton = screen.getByText('🌙');
    
    // Click the theme toggle button
    fireEvent.click(themeButton);
    
    // Verify the toggle function was called
    expect(mockToggleTheme).toHaveBeenCalled();
  });

  test('logs out when logout button is clicked', async () => {
    const mockLogout = jest.fn();
    
    render(
      <BrowserRouter>
        <AuthContext.Provider value={{ logout: mockLogout }}>
          <ThemeContext.Provider value={{ theme: 'light', toggleTheme: jest.fn() }}>
            <MonthView />
          </ThemeContext.Provider>
        </AuthContext.Provider>
      </BrowserRouter>
    );
    
    // Find the logout button
    const logoutButton = screen.getByText('Logout');
    
    // Click the logout button
    fireEvent.click(logoutButton);
    
    // Verify logout was called
    expect(mockLogout).toHaveBeenCalled();
    
    // Verify navigation to home page
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
