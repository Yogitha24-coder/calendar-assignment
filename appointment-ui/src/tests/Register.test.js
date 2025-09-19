import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Register from '../components/Register';

describe('Register Component', () => {
  test('renders register form', () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );
    
    expect(screen.getByText(/Create an Account/i)).toBeInTheDocument();
  });
});
