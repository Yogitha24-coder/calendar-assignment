import React from 'react';
import '../Appointments.css';

const ColorLegend = ({ items }) => {
  // Add a default value for items to prevent the error
  const legendItems = items || [];
  
  return (
    <div className="color-legend">
      {legendItems.map((item, index) => (
        <div key={index} className="legend-item">
          <div 
            className="color-box" 
            style={{ backgroundColor: item.color }}
          ></div>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
};

export default ColorLegend;
