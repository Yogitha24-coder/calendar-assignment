import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeContext } from '../App';
import { AuthContext } from '../AuthContext';
import WeekView from '../views/WeekView';
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

describe('WeekView Component', () => {
  const mockAppointments = [
    { id: 1, title: 'Meeting', description: 'Team meeting', startTime: '09:00', endTime: '10:00', color: '#4285f4' },
    { id: 2, title: 'Lunch', description: 'Lunch break', startTime: '12:00', endTime: '13:00', color: '#0f9d58' }
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

  test('renders week view with correct date range', async () => {
    // Set a specific date for testing
    const testDate = new Date(2023, 4, 15); // May 15, 2023
    jest.useFakeTimers().setSystemTime(testDate);
    
    renderWithContext(<WeekView />);
    
    // Check if the week range is displayed
    await waitFor(() => {
      // Assuming the format is "May 14 - 20, 2023" or similar
      expect(screen.getByText(/May \d+ - \d+, 2023/)).toBeInTheDocument();
    });
    
    // Restore real timers
    jest.useRealTimers();
  });

  test('navigates to previous week when prev button is clicked', async () => {
    renderWithContext(<WeekView />);
    
    // Get the current week display
    const currentWeekDisplay = screen.getByText(/[A-Za-z]+ \d+ - \d+, \d{4}/);
    const initialWeek = currentWeekDisplay.textContent;
    
    // Click the previous week button
    const prevButton = screen.getByText('←');
    fireEvent.click(prevButton);
    
    // Wait for the week to change
    await waitFor(() => {
      expect(currentWeekDisplay.textContent).not.toBe(initialWeek);
    });
    
    // Verify API was called again
    expect(fetchAppointments).toHaveBeenCalled();
  });

  test('navigates to next week when next button is clicked', async () => {
    renderWithContext(<WeekView />);
    
    // Get the current week display
    const currentWeekDisplay = screen.getByText(/[A-Za-z]+ \d+ - \d+, \d{4}/);
    const initialWeek = currentWeekDisplay.textContent;
    
    // Click the next week button
    const nextButton = screen.getByText('→');
    fireEvent.click(nextButton);
    
    // Wait for the week to change
    await waitFor(() => {
      expect(currentWeekDisplay.textContent).not.toBe(initialWeek);
    });
    
    // Verify API was called again
    expect(fetchAppointments).toHaveBeenCalled();
  });

  test('displays appointments in the week view', async () => {
    // Set a specific date for testing
    const testDate = new Date(2023, 4, 15); // May 15, 2023
    jest.useFakeTimers().setSystemTime(testDate);
    
    renderWithContext(<WeekView />);
    
    // Wait for appointments to load
    await waitFor(() => {
      expect(fetchAppointments).toHaveBeenCalled();
    });
    
    // Check if appointments are displayed
    await waitFor(() => {
      expect(screen.getAllByText(/Meeting/).length).toBeGreaterThan(0);
    });
    
    expect(screen.getAllByText(/Lunch/).length).toBeGreaterThan(0);
    
    // Restore real timers
    jest.useRealTimers();
  });

  test('navigates to day view when clicking on a day header', async () => {
    renderWithContext(<WeekView />);
    
    // Wait for the component to load
    await waitFor(() => {
      expect(fetchAppointments).toHaveBeenCalled();
    });
    
    // Find and click on a day header
    const dayHeaders = screen.getAllByClassName('week-day');
    fireEvent.click(dayHeaders[1]); // Monday
    
    // Verify navigation occurred
    expect(mockNavigate).toHaveBeenCalled();
    expect(mockNavigate.mock.calls[0][0]).toMatch(/^\/day\?date=\d{4}-\d{2}-\d{2}$/);
  });
});
