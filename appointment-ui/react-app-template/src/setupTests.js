// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import React from 'react';

// Mock window.alert
window.alert = jest.fn();
window.confirm = jest.fn(() => true);

// Suppress console errors during tests
const originalConsoleError = console.error;
console.error = (...args) => {
  if (
    /Warning.*not wrapped in act/.test(args[0]) ||
    /Warning.*Cannot update a component/.test(args[0]) ||
    /Warning.*React.createFactory/.test(args[0]) ||
    /Error: Not implemented: window.alert/.test(args[0])
  ) {
    return;
  }
  originalConsoleError(...args);
};

// Suppress console warnings during tests
const originalConsoleWarn = console.warn;
console.warn = (...args) => {
  if (
    /API is not reachable/.test(args[0])
  ) {
    return;
  }
  originalConsoleWarn(...args);
};
