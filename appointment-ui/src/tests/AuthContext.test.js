import React, { useContext } from 'react';
import { render, screen, act } from '@testing-library/react';
import { AuthContext, AuthProvider } from '../AuthContext';

// Create a test component that uses the AuthContext
const TestComponent = () => {
  const { user, isAuthenticated, login, logout } = useContext(AuthContext);
  
  return (
    <div>
      <div data-testid="auth-status">{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>
      {user && <div data-testid="user-email">{user.email}</div>}
      <button onClick={() => login({ id: 1, email: 'test@example.com' })}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Mock localStorage
    jest.spyOn(Storage.prototype, 'setItem');
    jest.spyOn(Storage.prototype, 'getItem');
    jest.spyOn(Storage.prototype, 'removeItem');
  });

  test('provides authentication state and functions', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Initially not authenticated
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
    
    // Login
    act(() => {
      screen.getByText('Login').click();
    });
    
    // Now authenticated
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
    expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
    
    // Verify localStorage was updated
    expect(localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify({ id: 1, email: 'test@example.com' }));
    
    // Logout
    act(() => {
      screen.getByText('Logout').click();
    });
    
    // Back to not authenticated
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
    
    // Verify localStorage was cleared
    expect(localStorage.removeItem).toHaveBeenCalledWith('user');
  });

  test('loads user from localStorage on initialization', () => {
    // Set user in localStorage
    localStorage.setItem('user', JSON.stringify({ id: 1, email: 'test@example.com' }));
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Should be authenticated from localStorage
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
    expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
  });
});
