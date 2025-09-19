import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AppointmentForm from '../components/AppointmentForm';

describe('AppointmentForm Component', () => {
  const mockAppointment = {
    id: 1,
    title: 'Meeting',
    description: 'Team meeting',
    startTime: '09:00',
    endTime: '10:00',
    color: '#4285f4'
  };

  const colorCategories = [
    {key:'work', label:'Work', color:'#4285f4'},
    {key:'personal', label:'Personal', color:'#0f9d58'},
    {key:'family', label:'Family', color:'#f4b400'},
    {key:'health', label:'Health', color:'#db4437'}
  ];

  test('renders form for new appointment', () => {
    const onSave = jest.fn();
    const onCancel = jest.fn();
    const onDelete = jest.fn();
    
    render(
      <AppointmentForm 
        appointment={null}
        onSave={onSave}
        onCancel={onCancel}
        onDelete={onDelete}
        colorCategories={colorCategories}
        isNew={true}
      />
    );
    
    // Check if the form title is correct
    expect(screen.getByText('New Appointment')).toBeInTheDocument();
    
    // Check if form fields are empty
    expect(screen.getByLabelText('Title').value).toBe('');
    expect(screen.getByLabelText('Description').value).toBe('');
    
    // Check if delete button is not shown for new appointments
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });

  test('renders form for editing appointment', () => {
    const onSave = jest.fn();
    const onCancel = jest.fn();
    const onDelete = jest.fn();
    
    render(
      <AppointmentForm 
        appointment={mockAppointment}
        onSave={onSave}
        onCancel={onCancel}
        onDelete={onDelete}
        colorCategories={colorCategories}
        isNew={false}
      />
    );
    
    // Check if the form title is correct
    expect(screen.getByText('Edit Appointment')).toBeInTheDocument();
    
    // Check if form fields are filled with appointment data
    expect(screen.getByLabelText('Title').value).toBe('Meeting');
    expect(screen.getByLabelText('Description').value).toBe('Team meeting');
    expect(screen.getByLabelText('Start Time').value).toBe('09:00');
    expect(screen.getByLabelText('End Time').value).toBe('10:00');
    
    // Check if delete button is shown for existing appointments
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  test('calls onSave when form is submitted', () => {
    const onSave = jest.fn();
    const onCancel = jest.fn();
    const onDelete = jest.fn();
    
    render(
      <AppointmentForm 
        appointment={null}
        onSave={onSave}
        onCancel={onCancel}
        onDelete={onDelete}
        colorCategories={colorCategories}
        isNew={true}
      />
    );
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'New Meeting' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Discuss project' } });
    fireEvent.change(screen.getByLabelText('Start Time'), { target: { value: '14:00' } });
    fireEvent.change(screen.getByLabelText('End Time'), { target: { value: '15:00' } });
    
    // Select a color
    const colorOptions = screen.getAllByRole('button', { name: /Work|Personal|Family|Health/ });
    fireEvent.click(colorOptions[0]); // Select Work color
    
    // Submit the form
    fireEvent.click(screen.getByText('Save'));
    
    // Verify onSave was called with the correct data
    expect(onSave).toHaveBeenCalledWith({
      title: 'New Meeting',
      description: 'Discuss project',
      startTime: '14:00',
      endTime: '15:00',
      color: '#4285f4'
    });
  });

  test('calls onCancel when cancel button is clicked', () => {
    const onSave = jest.fn();
    const onCancel = jest.fn();
    const onDelete = jest.fn();
    
    render(
      <AppointmentForm 
        appointment={null}
        onSave={onSave}
        onCancel={onCancel}
        onDelete={onDelete}
        colorCategories={colorCategories}
        isNew={true}
      />
    );
    
    // Click the cancel button
    fireEvent.click(screen.getByText('Cancel'));
    
    // Verify onCancel was called
    expect(onCancel).toHaveBeenCalled();
  });

  test('calls onDelete when delete button is clicked', () => {
    const onSave = jest.fn();
    const onCancel = jest.fn();
    const onDelete = jest.fn();
    
    render(
      <AppointmentForm 
        appointment={mockAppointment}
        onSave={onSave}
        onCancel={onCancel}
        onDelete={onDelete}
        colorCategories={colorCategories}
        isNew={false}
      />
    );
    
    // Click the delete button
    fireEvent.click(screen.getByText('Delete'));
    
    // Verify onDelete was called
    expect(onDelete).toHaveBeenCalled();
  });

  test('shows conflict warning when conflicts are detected', () => {
    const onSave = jest.fn();
    const onCancel = jest.fn();
    const onDelete = jest.fn();
    
    const conflicts = [
      { id: 2, title: 'Lunch', startTime: '12:00', endTime: '13:00' }
    ];
    
    render(
      <AppointmentForm 
        appointment={mockAppointment}
        onSave={onSave}
        onCancel={onCancel}
        onDelete={onDelete}
        colorCategories={colorCategories}
        isNew={false}
        conflicts={conflicts}
      />
    );
    
    // Check if conflict warning is displayed
    expect(screen.getByText(/Time conflict detected/)).toBeInTheDocument();
    expect(screen.getByText('Lunch')).toBeInTheDocument();
  });
});
