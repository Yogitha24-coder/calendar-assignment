import React from 'react';
import { render, screen } from '@testing-library/react';
import ColorLegend from '../components/ColorLegend';

describe('ColorLegend Component', () => {
  const colorItems = [
    {key:'work', label:'Work', color:'#4285f4'},
    {key:'personal', label:'Personal', color:'#0f9d58'},
    {key:'family', label:'Family', color:'#f4b400'},
    {key:'health', label:'Health', color:'#db4437'}
  ];

  test('renders all color items', () => {
    render(<ColorLegend items={colorItems} />);
    
    // Check if all labels are displayed
    expect(screen.getByText('Work')).toBeInTheDocument();
    expect(screen.getByText('Personal')).toBeInTheDocument();
    expect(screen.getByText('Family')).toBeInTheDocument();
    expect(screen.getByText('Health')).toBeInTheDocument();
  });

  test('renders color boxes with correct colors', () => {
    render(<ColorLegend items={colorItems} />);
    
    // Get all color boxes
    const colorBoxes = screen.getAllByTestId('color-box');
    
    // Check if there are the correct number of color boxes
    expect(colorBoxes.length).toBe(4);
    
    // Check if the first color box has the correct background color
    expect(colorBoxes[0]).toHaveStyle(`background-color: ${colorItems[0].color}`);
  });

  test('renders empty when no items provided', () => {
    render(<ColorLegend items={[]} />);
    
    // Check if the component renders without items
    const legend = screen.getByTestId('color-legend');
    expect(legend).toBeInTheDocument();
    expect(legend.childNodes.length).toBe(0);
  });
});
