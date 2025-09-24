import React from 'react';

// Mock components
export const BrowserRouter = ({ children }) => <div>{children}</div>;
export const Routes = ({ children }) => <div>{children}</div>;
export const Route = ({ children }) => <div>{children}</div>;
export const Navigate = () => <div>Navigate</div>;
export const Link = ({ children, to }) => <a href={to}>{children}</a>;

// Mock hooks
export const useNavigate = () => jest.fn();
export const useLocation = () => ({
  pathname: '/',
  search: '',
  hash: '',
  state: null,
  key: 'default'
});
