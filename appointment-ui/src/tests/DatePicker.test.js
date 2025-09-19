import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DatePicker from '../components/DatePicker';

describe('DatePicker Component', () => {
  test('renders with current month by default', () => {
    const onChange = jest.fn();
    render(<DatePicker selectedDate="2023-05-15" onChange={onChange} />);
    
    // Check if the current month and year are displayed
    expect(screen.getByText('May 2023')).toBeInTheDocument();
  });

  test('navigates to previous month when prev button is clicked', () => {
    const onChange = jest.fn();
    render(<DatePicker selectedDate="2023-05-15" onChange={onChange} />);
    
    // Click the previous month button
    fireEvent.click(screen.getByText('<'));
    
    // Check if the month changed
    expect(screen.getByText('April 2023')).toBeInTheDocument();
  });

  test('navigates to next month when next button is clicked', () => {
    const onChange = jest.fn();
    render(<DatePicker selectedDate="2023-05-15" onChange={onChange} />);
    
    // Click the next month button
    fireEvent.click(screen.getByText('>'));
    
    // Check if the month changed
    expect(screen.getByText('June 2023')).toBeInTheDocument();
  });

  test('calls onChange when a date is selected', () => {
    const onChange = jest.fn();
    render(<DatePicker selectedDate="2023-05-15" onChange={onChange} />);
    
    // Find and click on a date
    const dateElements = screen.getAllByRole('button', { name: /\d+/ });
    const dateToClick = dateElements.find(el => el.textContent === '20');
    fireEvent.click(dateToClick);
    
    // Verify onChange was called with the correct date
    expect(onChange).toHaveBeenCalledWith('2023-05-20');
  });

  test('highlights the selected date', () => {
    const onChange = jest.fn();
    render(<DatePicker selectedDate="2023-05-15" onChange={onChange} />);
    
    // Find the selected date element
    const selectedDateElement = screen.getByRole('button', { name: '15' });
    
    // Check if it has the selected class
    expect(selectedDateElement).toHaveClass('datepicker-day-selected');
  });
});
