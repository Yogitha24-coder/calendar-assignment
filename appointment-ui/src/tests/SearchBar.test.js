import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SearchBar from '../components/SearchBar';

describe('SearchBar Component', () => {
  test('renders search input', () => {
    const onChange = jest.fn();
    render(<SearchBar value="" onChange={onChange} />);
    
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  test('displays the current value', () => {
    const onChange = jest.fn();
    render(<SearchBar value="Meeting" onChange={onChange} />);
    
    expect(screen.getByPlaceholderText('Search...').value).toBe('Meeting');
  });

  test('calls onChange when input value changes', () => {
    const onChange = jest.fn();
    render(<SearchBar value="" onChange={onChange} />);
    
    // Type in the search input
    fireEvent.change(screen.getByPlaceholderText('Search...'), { target: { value: 'Meeting' } });
    
    // Verify onChange was called with the new value
    expect(onChange).toHaveBeenCalledWith('Meeting');
  });
});
