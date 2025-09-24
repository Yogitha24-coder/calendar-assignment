import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { format } from 'date-fns';
import AppointmentForm from '../AppointmentForm';
import { AppointmentProvider } from '../../contexts/AppointmentContext';
import * as appointmentService from '../../services/appointmentService';

jest.mock('../../services/appointmentService');

describe('AppointmentForm Component', () => {
  const today = new Date();
  const formattedDate = format(today, 'yyyy-MM-dd');
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful appointment creation
    appointmentService.createAppointment.mockResolvedValue({
      id: 123,
      title: 'New Appointment',
      date: formattedDate,
      startTime: '11:00:00',
      endTime: '12:00:00'
    });
  });

  test('renders the appointment form correctly', () => {
    render(
      <AppointmentProvider>
        <AppointmentForm selectedDate={today} onClose={() => {}} />
      </AppointmentProvider>
    );
    
    // Check form elements
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/start time/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/end time/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/color/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/attendees/i)).toBeInTheDocument();
    
    // Check buttons
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  test('submits the form with valid appointment data', async () => {
    const onCloseMock = jest.fn();
    const onAppointmentAddedMock = jest.fn();
    
    render(
      <AppointmentProvider>
        <AppointmentForm 
          selectedDate={today} 
          onClose={onCloseMock}
          onAppointmentAdded={onAppointmentAddedMock} 
        />
      </AppointmentProvider>
    );
    
    // Fill out the form
    await userEvent.type(screen.getByLabelText(/title/i), 'Team Standup');
    await userEvent.type(screen.getByLabelText(/description/i), 'Daily team standup meeting');
    await userEvent.type(screen.getByLabelText(/start time/i), '11:00');
    await userEvent.type(screen.getByLabelText(/end time/i), '12:00');
    await userEvent.type(screen.getByLabelText(/attendees/i), 'John, Jane, Bob');
    
    // Select a color
    await userEvent.click(screen.getByLabelText(/color/i));
    await userEvent.click(screen.getByText('#4285F4'));
    
    // Submit the form
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    
    // Verify API call
    await waitFor(() => {
      expect(appointmentService.createAppointment).toHaveBeenCalledWith({
        title: 'Team Standup',
        description: 'Daily team standup meeting',
        date: formattedDate,
        startTime: '11:00:00',
        endTime: '12:00:00',
        attendees: 'John, Jane, Bob',
        color: '#4285F4'
      });
    });
    
    // Verify callbacks
    expect(onAppointmentAddedMock).toHaveBeenCalled();
    expect(onCloseMock).toHaveBeenCalled();
  });

  test('displays validation errors for invalid inputs', async () => {
    render(
      <AppointmentProvider>
        <AppointmentForm selectedDate={today} onClose={() => {}} />
      </AppointmentProvider>
    );
    
    // Submit without filling required fields
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    
    // Check validation errors
    expect(screen.getByText('Title is required')).toBeInTheDocument();
    
    // Fill title but with invalid times
    await userEvent.type(screen.getByLabelText(/title/i), 'Invalid Meeting');
    await userEvent.type(screen.getByLabelText(/start time/i), '12:00');
    await userEvent.type(screen.getByLabelText(/end time/i), '11:00');
    
    // Submit again
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    
    // Check time validation error
    expect(screen.getByText('End time must be after start time')).toBeInTheDocument();
    
    // Verify API was not called
    expect(appointmentService.createAppointment).not.toHaveBeenCalled();
  });

  test('shows loading state during form submission', async () => {
    // Delay the API response
    appointmentService.createAppointment.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({}), 100))
    );
    
    render(
      <AppointmentProvider>
        <AppointmentForm selectedDate={today} onClose={() => {}} />
      </AppointmentProvider>
    );
    
    // Fill out the form
    await userEvent.type(screen.getByLabelText(/title/i), 'Delayed Meeting');
    await userEvent.type(screen.getByLabelText(/start time/i), '11:00');
    await userEvent.type(screen.getByLabelText(/end time/i), '12:00');
    
    // Submit the form
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    
    // Check for loading indicator
    expect(screen.getByText('Saving...')).toBeInTheDocument();
    
    // Wait for submission to complete
    await waitFor(() => {
      expect(screen.queryByText('Saving...')).not.toBeInTheDocument();
    });
  });

  test('handles API errors during form submission', async () => {
    // Mock API error
    appointmentService.createAppointment.mockRejectedValue(
      new Error('Failed to create appointment')
    );
    
    render(
      <AppointmentProvider>
        <AppointmentForm selectedDate={today} onClose={() => {}} />
      </AppointmentProvider>
    );
    
    // Fill out the form
    await userEvent.type(screen.getByLabelText(/title/i), 'Error Meeting');
    await userEvent.type(screen.getByLabelText(/start time/i), '11:00');
    await userEvent.type(screen.getByLabelText(/end time/i), '12:00');
    
    // Submit the form
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText('Error creating appointment. Please try again.')).toBeInTheDocument();
    });
  });
});
