import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../views/Login';
import { loginUser } from '../api';

// Mock the API calls
jest.mock('../api', () => ({
  loginUser: jest.fn()
}));

// Mock navigate function
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('Login Component', () => {
  beforeEach(() => {
    // Reset mocks
    loginUser.mockReset();
    mockNavigate.mockReset();
  });

  test('renders login form', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });

  test('shows error message on login failure', async () => {
    loginUser.mockRejectedValue(new Error('Invalid credentials'));
    
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
    
    // Verify navigation did not occur
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('navigates to calendar on successful login', async () => {
    loginUser.mockResolvedValue({ token: 'fake-token', user: { id: 1, email: 'test@example.com' } });
    
    render(
      <BrowserRouter>
        <Login setUser={jest.fn()} />
      </BrowserRouter>
    );
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));
    
    // Verify API was called with correct data
    expect(loginUser).toHaveBeenCalledWith('test@example.com', 'password123');
    
    // Verify navigation occurred
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/day');
    });
  });

  test('navigates to register page when clicking register link', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
    
    // Click the register link
    fireEvent.click(screen.getByText('Register here'));
    
    // Verify navigation occurred
    expect(mockNavigate).toHaveBeenCalledWith('/register');
  });
});
