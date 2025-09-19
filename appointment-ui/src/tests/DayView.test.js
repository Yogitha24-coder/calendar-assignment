import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeContext } from '../App';
import { AuthContext } from '../AuthContext';
import DayView from '../views/DayView';
import { fetchAppointments, createAppointment, updateAppointment, deleteAppointment } from '../api';

// Mock the API calls
jest.mock('../api', () => ({
  fetchAppointments: jest.fn(),
  createAppointment: jest.fn(),
  updateAppointment: jest.fn(),
  deleteAppointment: jest.fn()
}));

// Mock navigate and location
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({
    search: '?date=2023-05-15'
  })
}));

describe('DayView Component', () => {
  const mockAppointments = [
    { id: 1, title: 'Meeting', description: 'Team meeting', startTime: '09:00', endTime: '10:00', color: '#4285f4' },
    { id: 2, title: 'Lunch', description: 'Lunch break', startTime: '12:00', endTime: '13:00', color: '#0f9d58' }
  ];

  beforeEach(() => {
    // Reset mocks
    fetchAppointments.mockReset();
    createAppointment.mockReset();
    updateAppointment.mockReset();
    deleteAppointment.mockReset();
    mockNavigate.mockReset();
    
    // Mock API responses
    fetchAppointments.mockResolvedValue(mockAppointments);
    createAppointment.mockResolvedValue({ id: 3, ...mockAppointments[0] });
    updateAppointment.mockResolvedValue({ ...mockAppointments[0], title: 'Updated Meeting' });
    deleteAppointment.mockResolvedValue({});
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

  test('renders day view with correct date', async () => {
    renderWithContext(<DayView />);
    
    // Check if the date is displayed correctly
    await waitFor(() => {
      expect(screen.getByText(/May 15, 2023/)).toBeInTheDocument();
    });
  });

  test('displays appointments for the selected day', async () => {
    renderWithContext(<DayView />);
    
    // Wait for appointments to load
    await waitFor(() => {
      expect(fetchAppointments).toHaveBeenCalledWith('2023-05-15');
    });
    
    // Check if appointments are displayed
    await waitFor(() => {
      expect(screen.getByText('Meeting')).toBeInTheDocument();
    });
    expect(screen.getByText('Lunch')).toBeInTheDocument();
  });

  test('opens appointment form when clicking on a time slot', async () => {
    renderWithContext(<DayView />);
    
    // Wait for the component to load
    await waitFor(() => {
      expect(fetchAppointments).toHaveBeenCalled();
    });
    
    // Find and click on a time slot
    const timeSlots = screen.getAllByClassName('gc-slot-line');
    fireEvent.click(timeSlots[8]); // 8:00 AM slot
    
    // Check if the form is displayed
    await waitFor(() => {
      expect(screen.getByText('New Appointment')).toBeInTheDocument();
    });
    expect(screen.getByLabelText('Title')).toBeInTheDocument();
  });

  test('creates a new appointment', async () => {
    renderWithContext(<DayView />);
    
    // Wait for the component to load
    await waitFor(() => {
      expect(fetchAppointments).toHaveBeenCalled();
    });
    
    // Find and click on a time slot
    const timeSlots = screen.getAllByClassName('gc-slot-line');
    fireEvent.click(timeSlots[8]); // 8:00 AM slot
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'New Meeting' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Discuss project' } });
    
    // Submit the form
    fireEvent.click(screen.getByText('Save'));
    
    // Verify the API was called with correct data
    await waitFor(() => {
      expect(createAppointment).toHaveBeenCalledWith(
        '2023-05-15',
        expect.objectContaining({
          title: 'New Meeting',
          description: 'Discuss project'
        })
      );
    });
    
    // Verify appointments are reloaded
    expect(fetchAppointments).toHaveBeenCalledTimes(2);
  });

  test('edits an existing appointment', async () => {
    renderWithContext(<DayView />);
    
    // Wait for appointments to load
    await waitFor(() => {
      expect(fetchAppointments).toHaveBeenCalled();
    });
    
    // Find and click on an existing appointment
    // Wait for the appointment to be visible
    await waitFor(() => {
      expect(screen.getByText('Meeting')).toBeInTheDocument();
    });
    
    // Click on the appointment
    const appointment = screen.getByText('Meeting');
    fireEvent.click(appointment);
    
    // Check if the form is displayed with appointment data
    await waitFor(() => {
      expect(screen.getByText('Edit Appointment')).toBeInTheDocument();
    });
    
    expect(screen.getByLabelText('Title')).toHaveValue('Meeting');
    
    // Edit the title
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Updated Meeting' } });
    
    // Submit the form
    fireEvent.click(screen.getByText('Save'));
    
    // Verify the API was called with correct data
    await waitFor(() => {
      expect(updateAppointment).toHaveBeenCalledWith(
        '2023-05-15',
        1,
        expect.objectContaining({
          title: 'Updated Meeting'
        })
      );
    });
    
    // Verify appointments are reloaded
    expect(fetchAppointments).toHaveBeenCalledTimes(2);
  });

  test('deletes an appointment', async () => {
    renderWithContext(<DayView />);
    
    // Wait for appointments to load
    await waitFor(() => {
      expect(fetchAppointments).toHaveBeenCalled();
    });
    
    // Find and click on an existing appointment
    // Wait for the appointment to be visible
    await waitFor(() => {
      expect(screen.getByText('Meeting')).toBeInTheDocument();
    });
    
    // Click on the appointment
    const appointment = screen.getByText('Meeting');
    fireEvent.click(appointment);
    
    // Click the delete button
    fireEvent.click(screen.getByText('Delete'));
    
    // Verify the API was called with correct ID
    await waitFor(() => {
      expect(deleteAppointment).toHaveBeenCalledWith('2023-05-15', 1);
    });
    
    // Verify appointments are reloaded
    expect(fetchAppointments).toHaveBeenCalledTimes(2);
  });

  test('navigates to previous day when prev button is clicked', async () => {
    renderWithContext(<DayView />);
    
    // Wait for the component to load
    await waitFor(() => {
      expect(fetchAppointments).toHaveBeenCalled();
    });
    
    // Click the previous day button
    const prevButton = screen.getByText('←');
    fireEvent.click(prevButton);
    
    // Verify navigation occurred
    expect(mockNavigate).toHaveBeenCalledWith('?date=2023-05-14');
  });

  test('navigates to next day when next button is clicked', async () => {
    renderWithContext(<DayView />);
    
    // Wait for the component to load
    await waitFor(() => {
      expect(fetchAppointments).toHaveBeenCalled();
    });
    
    // Click the next day button
    const nextButton = screen.getByText('→');
    fireEvent.click(nextButton);
    
    // Verify navigation occurred
    expect(mockNavigate).toHaveBeenCalledWith('?date=2023-05-16');
  });
});
