import React, { useState, useEffect } from 'react';
import SearchBar from "./SearchBar";
import ColorLegend from "./ColorLegend";
import DatePicker from "./DatePicker";

const Sidebar = ({ 
  colorCategories, 
  selectedDate, 
  onDateChange, 
  onNewAppointment, 
  searchValue, 
  onSearchChange, 
  upcomingAppointments 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Close sidebar when screen size becomes large
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Prevent scrolling when sidebar is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  return (
    <>
      {/* Hamburger menu button - only visible on mobile */}
      <button 
        className="hamburger-menu-btn"
        onClick={() => setIsOpen(true)}
        aria-label="Open menu"
      >
        <i className="fas fa-bars"></i>
      </button>
      
      {/* Sidebar */}
      <aside className={`gc-left ${isOpen ? 'active' : ''}`}>
        <div className="gc-left-header">
          {/* Close button - only visible when sidebar is open on mobile */}
          <button 
            className="sidebar-close-btn"
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
          >
            <i className="fas fa-times"></i>
          </button>
          
          {/* Mini calendar in the sidebar */}
          <div className="mini-calendar-container">
            <DatePicker 
              selectedDate={selectedDate} 
              onChange={onDateChange} 
            />
          </div>
          <button className="btn btn-primary" onClick={onNewAppointment}>+ New</button>
          <SearchBar value={searchValue} onChange={onSearchChange} />
          <ColorLegend items={colorCategories} />
          <div className="upcoming">
            <h6>Upcoming</h6>
            {upcomingAppointments.length === 0 && <div className="text-muted">No appointments</div>}
            {upcomingAppointments.map(a => (
              <div key={a.id} className="gc-upcoming-item">
                <div className="gc-upcoming-time">{a.startTime}</div>
                <div className="gc-upcoming-title">
                  <strong>{a.title}</strong>
                  <div className="small text-muted">{a.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>
      
      {/* Overlay - only visible when sidebar is open on mobile */}
      <div 
        className={`sidebar-overlay ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(false)}
      ></div>
    </>
  );
};

export default Sidebar;
