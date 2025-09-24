import React, { useEffect, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchAppointments } from "../api";
import { addDays, startOfWeek, format, addWeeks, subWeeks, isAfter } from "date-fns";
import { AuthContext } from "../AuthContext";
import { ThemeContext } from "../App";
import SearchBar from "../components/SearchBar";
import ColorLegend from "../components/ColorLegend";
import DatePicker from "../components/DatePicker";
import PrintButton from "../components/PrintButton";

// Define color categories (same as in DayView)
const colorCategories = [
  {key:'work', label:'Work', color:'#4285f4'},
  {key:'personal', label:'Personal', color:'#0f9d58'},
  {key:'family', label:'Family', color:'#f4b400'},
  {key:'health', label:'Health', color:'#db4437'}
];

// Change these constants to show full 24 hours
const slotStartHour = 0; // Start from midnight (00:00)
const slotEndHour = 23; // End at 23:30

function toMinutes(time) {
  if (!time) return null;
  const [h,m] = time.split(":");
  return parseInt(h,10)*60 + parseInt(m,10);
}

export default function WeekView() {
  const [startDate, setStartDate] = useState(startOfWeek(new Date(), {weekStartsOn:1}));
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const { logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  
  // State for mobile menu
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(()=>{ loadRange(startDate); }, [startDate]);
  
  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    function handleClickOutside(event) {
      const sidebar = document.querySelector('.gc-left');
      const hamburgerBtn = document.querySelector('.hamburger-menu');
      
      if (sidebar && hamburgerBtn && 
          isSidebarOpen && 
          !sidebar.contains(event.target) && 
          !hamburgerBtn.contains(event.target)) {
        setIsSidebarOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSidebarOpen]);

  async function loadRange(start) {
    setLoading(true);
    try {
      // fetch each day's appointments (simple approach)
      const days = Array.from({length:7}, (_,i)=> {
        const d = addDays(start, i);
        return d.toISOString().slice(0,10);
      });
      const all = await Promise.all(days.map(d => fetchAppointments(d).catch(()=>[])));
      const flattened = all.flatMap((arr,idx)=> arr.map(a => ({...a, date: days[idx]})));
      setAppointments(flattened);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  }

  const handleLogout = () => {
    if (logout) {
      logout();
      navigate("/");
    }
  };

  const openNew = () => {
    // Navigate to day view with current date to create a new appointment
    navigate(`/day?date=${new Date().toISOString().slice(0, 10)}`);
    // Close sidebar on mobile when opening form
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  // Function to format time in 12-hour format with AM/PM
  const formatTimeDisplay = (hour) => {
    if (hour === 0) {
      return '12 AM';
    } else if (hour === 12) {
      return '12 PM';
    } else if (hour > 12) {
      return `${hour - 12} PM`;
    } else {
      return `${hour} AM`;
    }
  };

  // Function to detect overlapping appointments for visual indication
  function detectOverlappingAppointments(appointments) {
    const overlaps = new Set();
    
    for (let i = 0; i < appointments.length; i++) {
      const a = appointments[i];
      const aStart = toMinutes(a.startTime);
      const aEnd = toMinutes(a.endTime);
      
      if (aStart == null || aEnd == null) continue;
      
      for (let j = i + 1; j < appointments.length; j++) {
        const b = appointments[j];
        if (a.date !== b.date) continue; // Only check same day
        
        const bStart = toMinutes(b.startTime);
        const bEnd = toMinutes(b.endTime);
        
        if (bStart == null || bEnd == null) continue;
        
        // Check for overlap
        if (aStart < bEnd && aEnd > bStart) {
          overlaps.add(a.id);
          overlaps.add(b.id);
        }
      }
    }
    
    return overlaps;
  }

  const handlePrevWeek = () => {
    setStartDate(subWeeks(startDate, 1));
  };

  const handleNextWeek = () => {
    setStartDate(addWeeks(startDate, 1));
  };

  // Filter appointments by search term
  const filtered = appointments.filter(a => a.title.toLowerCase().includes(search.toLowerCase()));
  
  // Get only upcoming appointments for the sidebar
  const now = new Date();
  const upcomingAppointments = filtered.filter(a => {
    const appointmentDate = new Date(`${a.date}T${a.startTime}`);
    return isAfter(appointmentDate, now);
  }).sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.startTime}`);
    const dateB = new Date(`${b.date}T${b.startTime}`);
    return dateA - dateB;
  });
  
  const overlappingAppointments = detectOverlappingAppointments(filtered);
  
  // Theme-based styles for navigation buttons
  const getNavButtonStyles = () => {
    return {
      padding: '8px 16px',
      fontSize: '16px',
      backgroundColor: theme === 'dark' ? '#333' : '#f8f9fa',
      color: theme === 'dark' ? '#fff' : '#212529',
      border: theme === 'dark' ? '1px solid #555' : '1px solid #dee2e6',
      borderRadius: '4px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: theme === 'dark' ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.1)',
      transition: 'all 0.2s ease',
      minWidth: '40px',
      minHeight: '40px'
    };
  };

  // Theme-based styles for date display
  const getDateDisplayStyles = () => {
    return {
      fontSize: '18px',
      padding: '0 15px',
      minWidth: '200px',
      textAlign: 'center',
      color: theme === 'dark' ? '#fff' : '#212529'
    };
  };
  
  // Hamburger menu styles
  const hamburgerStyles = {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-around',
    width: '30px',
    height: '25px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '0',
    zIndex: '10',
    marginRight: '15px'
  };

  const hamburgerLineStyles = {
    width: '30px',
    height: '3px',
    backgroundColor: theme === 'dark' ? '#fff' : '#333',
    borderRadius: '10px',
    transition: 'all 0.3s linear'
  };

  return (
    <div className="gc-container">
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setIsSidebarOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 98
          }}
        />
      )}

      {/* Left sidebar with responsive classes */}
      <aside 
        className={`gc-left ${isSidebarOpen ? 'open' : ''}`}
        style={{
          position: 'fixed',
          top: 0,
          left: isSidebarOpen ? '0' : '-280px',
          bottom: 0,
          width: '280px',
          zIndex: 99,
          transition: 'left 0.3s ease',
          backgroundColor: theme === 'dark' ? '#222' : '#fff',
          boxShadow: '0 0 10px rgba(0,0,0,0.1)',
          overflowY: 'auto'
        }}
      >
        <div className="gc-left-header">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="m-0">Calendar</h5>
            {/* Close button for mobile */}
            <button 
              className="close-sidebar d-md-none" 
              onClick={() => setIsSidebarOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer'
              }}
            >
              &times;
            </button>
          </div>
          
          {/* Mini calendar in the sidebar */}
          <div className="mini-calendar-container">
            <DatePicker 
              selectedDate={startDate.toISOString().slice(0, 10)} 
              onChange={(newDate) => {
                const d = new Date(newDate);
                setStartDate(startOfWeek(d, {weekStartsOn:1}));
                // Close sidebar on mobile after date selection
                if (window.innerWidth < 768) {
                  setIsSidebarOpen(false);
                }
              }} 
            />
          </div>
          <button className="btn btn-primary w-100 my-3" onClick={openNew}>+ New Appointment</button>
          <SearchBar value={search} onChange={setSearch} />
          <ColorLegend items={colorCategories} />
          <div className="upcoming mt-4">
            <h6>Upcoming Appointments</h6>
            {upcomingAppointments.length === 0 && <div className="text-muted">No upcoming appointments</div>}
            {upcomingAppointments.slice(0, 5).map(a => (
              <div 
                key={a.id} 
                className="gc-upcoming-item" 
                style={{
                  padding: '10px',
                  borderLeft: `4px solid ${a.color || '#4285f4'}`,
                  marginBottom: '8px',
                  backgroundColor: theme === 'dark' ? '#333' : '#f8f9fa',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
                onClick={() => navigate(`/day?date=${a.date}`)}
              >
                <div className="gc-upcoming-time">
                  {format(new Date(a.date), "MMM d")} • {a.startTime} - {a.endTime}
                </div>
                <div className="gc-upcoming-title">
                  <strong>{a.title}</strong>
                  <div className="small text-muted">{a.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <main 
        className="gc-main"
        style={{
          marginLeft: '0',
          width: '100%',
          transition: 'margin-left 0.3s ease'
        }}
      >
        <div className="gc-main-header">
          {/* Mobile header with hamburger menu */}
          <div className="d-flex align-items-center justify-content-between w-100">
            <div className="d-flex align-items-center">
              {/* Hamburger menu button */}
              <button 
                className="hamburger-menu d-md-none" 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                style={hamburgerStyles}
                aria-label="Toggle menu"
              >
                <div style={hamburgerLineStyles}></div>
                <div style={hamburgerLineStyles}></div>
                <div style={hamburgerLineStyles}></div>
              </button>
              
              {/* UPDATED DATE NAVIGATION SECTION WITH DARK MODE SUPPORT */}
              <div className="date-navigation" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
                <button 
                  className="nav-button" 
                  onClick={handlePrevWeek}
                  style={getNavButtonStyles()}
                  aria-label="Previous Week"
                >
                  <span style={{ fontSize: '20px' }}>←</span>
                </button>
                <strong 
                  className="date-display"
                  style={getDateDisplayStyles()}
                >
                  Week of {format(startDate, "MMM d, yyyy")}
                </strong>
                <button 
                  className="nav-button" 
                  onClick={handleNextWeek}
                  style={getNavButtonStyles()}
                  aria-label="Next Week"
                >
                  <span style={{ fontSize: '20px' }}>→</span>
                </button>
                {loading && (
                  <small 
                    className="loading-indicator d-none d-sm-block"
                    style={{
                      marginLeft: '10px',
                      color: theme === 'dark' ? '#adb5bd' : '#6c757d'
                    }}
                  >
                    Loading...
                  </small>
                )}
              </div>
            </div>
            
            {/* Mobile-friendly view navigation */}
            <div className="view-navigation d-flex align-items-center">
              <div className="view-links d-none d-sm-flex">
                <Link to="/day" className="view-link">Day</Link>
                <Link to="/week" className="view-link active">Week</Link>
                <Link to="/month" className="view-link">Month</Link>
              </div>

               {/* Add PrintButton here, right before the theme toggle button */}
  <PrintButton theme={theme} />
              
              {/* Dropdown for mobile view navigation */}
              <div className="dropdown d-sm-none">
                <button 
                  className="btn dropdown-toggle" 
                  type="button" 
                  id="viewDropdown" 
                  data-bs-toggle="dropdown" 
                  aria-expanded="false"
                  style={{
                    backgroundColor: theme === 'dark' ? '#333' : '#f8f9fa',
                    color: theme === 'dark' ? '#fff' : '#212529',
                    border: theme === 'dark' ? '1px solid #555' : '1px solid #dee2e6',
                  }}
                >
                  Week
                </button>
                <ul 
                  className="dropdown-menu dropdown-menu-end" 
                  aria-labelledby="viewDropdown"
                  style={{
                    backgroundColor: theme === 'dark' ? '#333' : '#fff',
                    border: theme === 'dark' ? '1px solid #555' : '1px solid #dee2e6',
                  }}
                >
                  <li><Link to="/day" className="dropdown-item">Day</Link></li>
                  <li><Link to="/week" className="dropdown-item active">Week</Link></li>
                  <li><Link to="/month" className="dropdown-item">Month</Link></li>
                </ul>
              </div>
              
              <button 
                className="theme-toggle ms-2" 
                onClick={toggleTheme} 
                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '1.2rem',
                  cursor: 'pointer'
                }}
              >
                {theme === 'light' ? '🌙' : '☀️'}
              </button>
              
              <button 
                className="logout-button ms-2" 
                onClick={handleLogout}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  color: theme === 'dark' ? '#fff' : '#212529'
                }}
              >
                <span className="d-none d-sm-inline">Logout</span>
                <span className="d-sm-none">🚪</span>
              </button>
            </div>
          </div>
          
          {/* Mobile quick action button */}
          <div className="d-md-none position-fixed" style={{
            right: '20px',
            bottom: '20px',
            zIndex: 90
          }}>
            <button 
              className="btn btn-primary rounded-circle" 
              style={{
                width: '60px',
                height: '60px',
                fontSize: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
              }}
              onClick={openNew}
            >
              +
            </button>
          </div>
        </div>

<div 
  className="week-grid-container"
  data-print-date={`Week of ${format(startDate, "MMMM d, yyyy")}`}
>
          <div className="week-grid">
            {/* Add time column */}
            <div className="week-time-column">
              <div className="week-header-placeholder"></div>
              {Array.from({length: 24}, (_, i) => (
                <div key={i} className="week-time-slot">
                  {formatTimeDisplay(i)}
                </div>
              ))}
            </div>
            
            <div className="week-columns-container">
              <div className="week-columns-header">
                {Array.from({length:7}).map((_,i) => {
                  const d = addDays(startDate, i);
                  return (
                    <div 
                      key={i} 
                      className="week-day"
                    >
                      {format(d, "EEE d")}
                    </div>
                  );
                })}
              </div>
              
              <div className="week-columns-content">
                {Array.from({length:7}).map((_,i) => {
                  const d = addDays(startDate, i);
                  const dKey = d.toISOString().slice(0,10);
                  const dayAppointments = filtered.filter(a => a.date && a.date.startsWith(dKey));
                  
                  // Function to get current time indicator position for this day
                  const getCurrentTimeIndicator = () => {
                    const now = new Date();
                    const today = new Date(dKey);
                    
                    // Only show for current date
                    if (today.toDateString() !== now.toDateString()) {
                      return null;
                    }
                    
                    const hours = now.getHours();
                    const minutes = now.getMinutes();
                    const totalMinutes = hours * 60 + minutes;
                    
                    // Calculate position as percentage
                    return (totalMinutes / (24 * 60)) * 100;
                  };
                  
                  const currentTimePosition = getCurrentTimeIndicator();
                  
                  return (
                    <div key={i} className="week-column">
                      <div className="week-day-content">
                        {/* Render all hour slots with proper styling */}
                        {Array.from({length: 24}, (_, hour) => (
                          <div 
                            key={hour} 
                            className="week-hour-slot"
                          ></div>
                        ))}
                        
                        {/* Current time indicator */}
                        {currentTimePosition !== null && (
                          <div 
                            className="current-time-indicator" 
                            style={{ top: `${currentTimePosition}%` }}
                          />
                        )}
                        
                        {dayAppointments.map(a => {
                          const start = toMinutes(a.startTime);
                          const end = toMinutes(a.endTime);
                          if (start == null || end == null) return null;
                          
                          const startPercent = (start / (24 * 60)) * 100;
                          const heightPercent = ((end - start) / (24 * 60)) * 100;
                          const hasConflict = overlappingAppointments.has(a.id);
                          
                          return (
                            <div 
                              key={a.id} 
                              className={`week-event ${hasConflict ? 'has-conflict' : ''}`}
                              style={{
                                background: a.color || "#4285f4",
                                top: `${startPercent}%`,
                                height: `${heightPercent}%`,
                              }}
                              onClick={() => navigate(`/day?date=${dKey}`)}
                            >
                              <div className="week-event-title">
                                {a.title}
                              </div>
                              <div className="week-event-time">
                                {a.startTime} - {a.endTime}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Add CSS for responsive layout */}
      <style>
        {`
          .week-grid-container {
            height: calc(100vh - 60px);
            overflow: auto;
            position: relative;
          }
          
          .week-grid {
            display: flex;
            background-color: ${theme === 'dark' ? '#222' : '#fff'};
            min-height: 100%;
          }
          
          .week-time-column {
            width: 60px;
            flex-shrink: 0;
            position: sticky;
            left: 0;
            z-index: 20;
            background-color: ${theme === 'dark' ? '#222' : '#fff'};
            border-right: 1px solid ${theme === 'dark' ? '#444' : '#ddd'};
          }
          
          .week-header-placeholder {
            height: 41px; /* Match the height of week-day headers */
            border-bottom: 1px solid ${theme === 'dark' ? '#444' : '#ddd'};
            background-color: ${theme === 'dark' ? '#222' : '#fff'};
          }
          
          .week-time-slot {
            height: 60px;
            text-align: right;
            padding-right: 8px;
            font-size: 12px;
            color: ${theme === 'dark' ? '#aaa' : '#666'};
            border-bottom: 1px solid ${theme === 'dark' ? '#444' : '#eee'};
            display: flex;
            align-items: center;
            justify-content: flex-end;
            box-sizing: border-box;
          }
          
          .week-columns-container {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-width: 840px; /* 7 days * 120px min-width */
          }
          
          .week-columns-header {
            display: flex;
            position: sticky;
            top: 0;
            z-index: 10;
          }
          
          .week-day {
            flex: 1;
            text-align: center;
            padding: 10px 5px;
            font-weight: 500;
            background-color: ${theme === 'dark' ? '#333' : '#f8f9fa'};
            color: ${theme === 'dark' ? '#fff' : '#333'};
            border-bottom: 1px solid ${theme === 'dark' ? '#444' : '#ddd'};
            border-right: 1px solid ${theme === 'dark' ? '#444' : '#ddd'};
            height: 41px;
            box-sizing: border-box;
          }
          
          .week-columns-content {
            display: flex;
            flex: 1;
          }
          
          .week-column {
            flex: 1;
            position: relative;
            border-right: 1px solid ${theme === 'dark' ? '#444' : '#ddd'};
            background-color: ${theme === 'dark' ? '#222' : '#fff'};
          }
          
          .week-day-content {
            position: relative;
            height: 1440px; /* 24 hours * 60px per hour */
          }
          
          .week-hour-slot {
            height: 60px;
            border-bottom: 1px solid ${theme === 'dark' ? '#444' : '#eee'};
            box-sizing: border-box;
          }
          
          .current-time-indicator {
            position: absolute;
            left: 0;
            right: 0;
            height: 2px;
            background-color: ${theme === 'dark' ? '#f28b82' : '#db4437'};
            z-index: 5;
          }
          
          .week-event {
            position: absolute;
            left: 4px;
            right: 4px;
            z-index: 5;
            border-radius: 4px;
            padding: 4px;
            overflow: hidden;
            cursor: pointer;
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
            color: white;
            border: 1px solid transparent;
          }
          
          .week-event.has-conflict {
            border-color: ${theme === 'dark' ? '#f28b82' : '#dc3545'};
            border-width: 2px;
            border-style: dashed;
          }
          
          .week-event-title {
            font-weight: 500;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          
          .week-event-time {
            font-size: 10px;
            opacity: 0.9;
          }
          
          @media (max-width: 767.98px) {
            .week-columns-container {
              min-width: 700px; /* 7 days * 100px min-width */
            }
            
            .week-day {
              font-size: 12px;
              padding: 8px 2px;
            }
            
            .week-time-slot {
              font-size: 10px;
              padding-right: 2px;
            }
            
            .week-event-title {
              font-size: 10px;
            }
            
            .week-event-time {
              font-size: 8px;
            }
          }
          
          @media (min-width: 768px) {
            .gc-container {
              display: flex;
              height: 100vh;
            }
            
            .gc-left {
              position: relative !important;
              left: 0 !important;
              width: 280px;
              padding: 20px;
              height: 100vh;
              overflow-y: auto;
            }
            
            .gc-main {
              flex: 1;
              margin-left: 280px;
              width: calc(100% - 280px);
              height: 100vh;
              overflow: hidden;
            }
            
            .hamburger-menu {
              display: none !important;
            }
          }
        `}
      </style>
    </div>
  );
}
