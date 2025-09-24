import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../AuthContext';
import { ThemeContext } from '../App';
import { ToastProvider } from '../contexts/ToastContext';
import DayView from '../views/DayView';
import { createAppointment } from '../api';

// Mock the API module
jest.mock('../api', () => ({
  fetchAppointments: jest.fn(() => Promise.resolve([])),
  createAppointment: jest.fn(() => Promise.resolve({ 
    id: '123', 
    title: 'Test Appointment',
    description: 'This is a test appointment',
    date: '2023-12-31',
    startTime: '10:00',
    endTime: '11:00',
    color: '#4285f4'
  })),
  checkApiStatus: jest.fn(() => Promise.resolve(true)),
  getToken: jest.fn(() => 'fake-token')
}));

describe('Appointment Creation', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => 'fake-token'),
        setItem: jest.fn(),
        removeItem: jest.fn()
      },
      writable: true
    });
  });
  
  test('User can create a new appointment', async () => {
    // Setup test environment
    const mockTheme = { theme: 'light', toggleTheme: jest.fn() };
    const mockLogout = jest.fn();
    
    render(
      <BrowserRouter>
        <AuthProvider value={{ isAuthenticated: true, logout: mockLogout }}>
          <ThemeContext.Provider value={mockTheme}>
            <ToastProvider>
              <DayView />
            </ToastProvider>
          </ThemeContext.Provider>
        </AuthProvider>
      </BrowserRouter>
    );
    
    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText(/Calendar/i)).toBeInTheDocument();
    });
    
    // Click the "New Appointment" button
    const newButton = screen.getByText(/\+ New/i);
    userEvent.click(newButton);
    
    // Fill out the appointment form
    await waitFor(() => {
      expect(screen.getByText(/New Appointment/i)).toBeInTheDocument();
    });
    
    // Fill title
    userEvent.type(screen.getByLabelText(/Title/i), 'Test Appointment');
    
    // Fill description
    userEvent.type(screen.getByLabelText(/Description/i), 'This is a test appointment');
    
    // Set date (assuming today's date is already selected)
    
    // Set start time
    const startTimeInput = screen.getAllByLabelText(/time/i)[0];
    fireEvent.change(startTimeInput, { target: { value: '10:00' } });
    
    // Set end time
    const endTimeInput = screen.getAllByLabelText(/time/i)[1];
    fireEvent.change(endTimeInput, { target: { value: '11:00' } });
    
    // Select Work category
    const workCategory = screen.getByText(/Work/i);
    userEvent.click(workCategory);
    
    // Submit the form
    const saveButton = screen.getByText(/Save/i);
    userEvent.click(saveButton);
    
    // Verify the API was called with the correct data
    await waitFor(() => {
      expect(createAppointment).toHaveBeenCalledWith({
        title: 'Test Appointment',
        description: 'This is a test appointment',
        date: expect.any(String), // The current date
        startTime: '10:00',
        endTime: '11:00',
        attendees: '',
        color: '#4285f4'
      });
    });
    
    // Verify the form was closed
    await waitFor(() => {
      expect(screen.queryByText(/New Appointment/i)).not.toBeInTheDocument();
    });
  });
  
  test('Appointment creation validates required fields', async () => {
    // Setup test environment
    const mockTheme = { theme: 'light', toggleTheme: jest.fn() };
    
    render(
      <BrowserRouter>
        <AuthProvider value={{ isAuthenticated: true }}>
          <ThemeContext.Provider value={mockTheme}>
            <ToastProvider>
              <DayView />
            </ToastProvider>
          </ThemeContext.Provider>
        </AuthProvider>
      </BrowserRouter>
    );
    
    // Click the "New Appointment" button
    const newButton = screen.getByText(/\+ New/i);
    userEvent.click(newButton);
    
    // Submit the form without filling required fields
    const saveButton = screen.getByText(/Save/i);
    userEvent.click(saveButton);
    
    // Verify validation is working (browser's built-in validation will prevent submission)
    await waitFor(() => {
      // The form should still be open
      expect(screen.getByText(/New Appointment/i)).toBeInTheDocument();
    });
    
    // Verify the API was not called
    expect(createAppointment).not.toHaveBeenCalled();
  });
  
  test('Appointment creation handles API errors', async () => {
    // Mock API to throw an error
    createAppointment.mockRejectedValueOnce(new Error('API Error'));
    
    // Setup test environment
    const mockTheme = { theme: 'light', toggleTheme: jest.fn() };
    
    render(
      <BrowserRouter>
        <AuthProvider value={{ isAuthenticated: true }}>
          <ThemeContext.Provider value={mockTheme}>
            <ToastProvider>
              <DayView />
            </ToastProvider>
          </ThemeContext.Provider>
        </AuthProvider>
      </BrowserRouter>
    );
    
    // Click the "New Appointment" button
    const newButton = screen.getByText(/\+ New/i);
    userEvent.click(newButton);
    
    // Fill out the form
    userEvent.type(screen.getByLabelText(/Title/i), 'Test Appointment');
    
    // Set times
    const startTimeInput = screen.getAllByLabelText(/time/i)[0];
    fireEvent.change(startTimeInput, { target: { value: '10:00' } });
    
    const endTimeInput = screen.getAllByLabelText(/time/i)[1];
    fireEvent.change(endTimeInput, { target: { value: '11:00' } });
    
    // Submit the form
    const saveButton = screen.getByText(/Save/i);
    userEvent.click(saveButton);
    
    // Verify error handling
    await waitFor(() => {
      // The form should still be open
      expect(screen.getByText(/New Appointment/i)).toBeInTheDocument();
      
      // Alert should be shown (in the actual app, this would be a toast notification)
      // This depends on how your app handles errors
    });
  });
});
