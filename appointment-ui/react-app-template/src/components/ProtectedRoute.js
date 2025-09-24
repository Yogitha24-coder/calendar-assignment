import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';

export default function ProtectedRoute({ children }) {
  const { token } = useContext(AuthContext);
  
  if (!token) {
    // Redirect to login page if not authenticated
    return <Navigate to="/" replace />;
  }
  
  return children;
}
