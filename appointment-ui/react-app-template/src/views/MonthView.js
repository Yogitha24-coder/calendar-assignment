import React, { useEffect, useState, useContext, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, format, isSameMonth, addMonths, subMonths, isAfter, isSameDay } from "date-fns";
import { fetchAppointments } from "../api";
import { AuthContext } from "../AuthContext";
import { ThemeContext } from "../App";
import SearchBar from "../components/SearchBar";
import ColorLegend from "../components/ColorLegend";
import DatePicker from "../components/DatePicker";

// Define color categories (same as in DayView)
const colorCategories = [
  {key:'work', label:'Work', color:'#4285f4'},
  {key:'personal', label:'Personal', color:'#0f9d58'},
  {key:'family', label:'Family', color:'#f4b400'},
  {key:'health', label:'Health', color:'#db4437'}
];

export default function MonthView() {
  const [current, setCurrent] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const { logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  
  // State for mobile menu
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Performance metrics
  const [metrics, setMetrics] = useState({ apiCalls: 0, loadTime: 0, cacheHits: 0 });
  
  // Cache for appointments to reduce API calls
  const appointmentsCache = useRef({});
  
  // Implement local batch fetch function
  const fetchBatchAppointments = async (dates) => {
    if (!dates || !dates.length) return {};
    
    try {
      // Make individual requests for each date
      const promises = dates.map(date => 
        fetchAppointments(date)
          .then(appointments => ({ date, appointments }))
          .catch(() => ({ date, appointments: [] }))
      );
      
      const results = await Promise.all(promises);
      
      // Convert array of results to object with dates as keys
      const batchResults = {};
      results.forEach(({ date, appointments }) => {
        batchResults[date] = appointments;
      });
      
      return batchResults;
    } catch (error) {
      console.error('Error in fetchBatchAppointments:', error);
      return {};
    }
  };

  // Function to fetch appointments for the month with caching
  const fetchMonthAppointments = useCallback(async (daysToFetch) => {
    let callsMade = 0;
    const allAppointments = [];
    let cacheHitCount = 0;
    
    try {
      // First, check which days we already have in cache
      const daysNotInCache = daysToFetch.filter(day => !appointmentsCache.current[day]);
      
      // If all days are in cache, just use the cache
      if (daysNotInCache.length === 0) {
        daysToFetch.forEach(day => {
          if (appointmentsCache.current[day]) {
            allAppointments.push(...appointmentsCache.current[day]);
            cacheHitCount++;
          }
        });
        return { appointments: allAppointments, callsMade: 0, cacheHitCount };
      }
      
      // Fetch appointments for days not in cache using batch API
      callsMade = 1; // One batch call instead of multiple individual calls
      const batchResults = await fetchBatchAppointments(daysNotInCache);
      
      // Process and cache the results
      Object.entries(batchResults).forEach(([day, dayAppointments]) => {
        const normalizedAppointments = dayAppointments.map(a => ({
          ...a,
          date: day,
          startTime: a.startTime ? a.startTime.slice(0, 5) : "",
          endTime: a.endTime ? a.endTime.slice(0, 5) : ""
        }));
        
        appointmentsCache.current[day] = normalizedAppointments;
        allAppointments.push(...normalizedAppointments);
      });
      
      // Add cached data for days we already have
      daysToFetch.forEach(day => {
        if (!daysNotInCache.includes(day) && appointmentsCache.current[day]) {
          allAppointments.push(...appointmentsCache.current[day]);
          cacheHitCount++;
        }
      });
      
      return { appointments: allAppointments, callsMade, cacheHitCount };
    } catch (error) {
      console.error('Error in fetchMonthAppointments:', error);
      return { appointments: [], callsMade: 0, cacheHitCount: 0 };
    }
  }, []);
  
  // Cache management - prune old dates to prevent cache from growing too large
  useEffect(() => {
    const pruneCache = () => {
      const today = new Date();
      const oneMonthAgo = new Date(today);
      oneMonthAgo.setMonth(today.getMonth() - 1);
      
      const keysToRemove = Object.keys(appointmentsCache.current).filter(dateStr => {
        const date = new Date(dateStr);
        return date < oneMonthAgo;
      });
      
      keysToRemove.forEach(key => {
        delete appointmentsCache.current[key];
      });
      
      console.log(`Pruned ${keysToRemove.length} old dates from cache`);
    };
    
    // Prune cache when component mounts and whenever the month changes
    pruneCache();
  }, [current]);

  // Add dependency on search to reload when search changes
  useEffect(() => {
    loadMonth(current);
  }, [current, search, fetchMonthAppointments]); // Added search and fetchMonthAppointments as dependencies
  
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

  async function loadMonth(d) {
    setLoading(true);
    const startTime = performance.now();
    
    const start = startOfWeek(startOfMonth(d), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(d), { weekStartsOn: 0 });
    
    // Get all days in the month view as YYYY-MM-DD strings
    const days = [];
    for (let day = start; day <= end; day = addDays(day, 1)) {
      days.push(day.toISOString().slice(0,10));
    }
    
    try {
      // Use the fetchMonthAppointments function with caching
      const { appointments: fetchedAppointments, callsMade, cacheHitCount } = await fetchMonthAppointments(days);
      
      // Filter appointments based on search term
      const filtered = fetchedAppointments.filter(a => 
        a.title.toLowerCase().includes(search.toLowerCase())
      );
      
      setAppointments(filtered);
      
      // Update performance metrics
      const endTime = performance.now();
      setMetrics({
        apiCalls: callsMade,
        loadTime: Math.round(endTime - startTime),
        cacheHits: cacheHitCount
      });
    } catch (err) { 
      console.error(err); 
    } finally {
      setLoading(false);
    }
  }

  // Ensure these handlers are properly defined
  const handlePrevMonth = () => {
    setCurrent(prevDate => subMonths(prevDate, 1));
  };

  const handleNextMonth = () => {
    setCurrent(prevDate => addMonths(prevDate, 1));
  };
 
  const handleLogout = () => {
    if (logout) {
      logout();
      navigate("/");
    }
  };

  const handleDayClick = (date) => {
    navigate(`/day?date=${date.toISOString().slice(0, 10)}`);
  };

  const openNew = () => {
    // Navigate to day view with current date to create a new appointment
    navigate(`/day?date=${new Date().toISOString().slice(0, 10)}`);
    // Close sidebar on mobile when opening form
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  // Function to detect days with conflicting appointments
  const detectDaysWithConflicts = () => {
    const daysWithConflicts = new Set();
    
    // Group appointments by day
    const appointmentsByDay = {};
    appointments.forEach(a => {
      if (!appointmentsByDay[a.date]) {
        appointmentsByDay[a.date] = [];
      }
      appointmentsByDay[a.date].push(a);
    });
    
    // Check each day for conflicts
    Object.entries(appointmentsByDay).forEach(([date, dayAppointments]) => {
      for (let i = 0; i < dayAppointments.length; i++) {
        const a = dayAppointments[i];
        const aStart = toMinutes(a.startTime);
        const aEnd = toMinutes(a.endTime);
        
        if (aStart == null || aEnd == null) continue;
        
        for (let j = i + 1; j < dayAppointments.length; j++) {
          const b = dayAppointments[j];
          const bStart = toMinutes(b.startTime);
          const bEnd = toMinutes(b.endTime);
          
          if (bStart == null || bEnd == null) continue;
          
          // Check for overlap
          if (aStart < bEnd && aEnd > bStart) {
            daysWithConflicts.add(date);
            break;
          }
        }
        
        if (daysWithConflicts.has(date)) break;
      }
    });
    
    return daysWithConflicts;
  };

  function toMinutes(time) {
    if (!time) return null;
    const [h, m] = time.split(":");
    return parseInt(h, 10) * 60 + parseInt(m, 10);
  }

  const start = startOfWeek(startOfMonth(current), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(current), { weekStartsOn: 0 });
  const dates = [];
  for (let d = start; d <= end; d = addDays(d, 1)) dates.push(d);
  
  const daysWithConflicts = detectDaysWithConflicts();
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
              selectedDate={current.toISOString().slice(0, 10)} 
              onChange={(newDate) => {
                setCurrent(new Date(newDate));
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
          
          {/* Performance metrics */}
          <div className="mt-4 small text-muted performance-metrics">
            <div>API calls: {metrics.apiCalls}</div>
            <div>Load time: {metrics.loadTime}ms</div>
            <div>Cache hits: {metrics.cacheHits}</div>
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
                  onClick={handlePrevMonth}
                  style={getNavButtonStyles()}
                  aria-label="Previous Month"
                >
                  <span style={{ fontSize: '20px' }}>←</span>
                </button>
                <strong 
                  className="date-display"
                  style={getDateDisplayStyles()}
                >
                  {format(current, "MMMM yyyy")}
                </strong>
                <button 
                  className="nav-button" 
                  onClick={handleNextMonth}
                  style={getNavButtonStyles()}
                  aria-label="Next Month"
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
                <Link to="/week" className="view-link">Week</Link>
                <Link to="/month" className="view-link active">Month</Link>
              </div>
              
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
                  Month
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
                  <li><Link to="/week" className="dropdown-item">Week</Link></li>
                  <li><Link to="/month" className="dropdown-item active">Month</Link></li>
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

        <div className="month-grid">
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => <div key={d} className="month-weekday">{d}</div>)}
          {dates.map((d,i) => {
            const key = d.toISOString().slice(0,10);
            const dayEvents = filtered.filter(a=>a.date && a.date.startsWith(key));
            const hasConflicts = daysWithConflicts.has(key);
            const isToday = isSameDay(d, new Date());
            
            return (
              <div 
                key={i} 
                className={`month-cell ${!isSameMonth(d, current) ? "month-cell--muted":""} 
                           ${hasConflicts ? "month-cell--conflict" : ""} 
                           ${isToday ? "month-cell--today" : ""}`}
                onClick={() => handleDayClick(d)}
              >
                <div className="month-day">{format(d, "d")}</div>
                <div className="month-events">
                  {dayEvents.slice(0,3).map(ev => (
                    <div 
                      key={ev.id} 
                      className="month-event" 
                      style={{background: ev.color || "#4285f4"}}
                    >
                      {ev.startTime} {ev.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className={`month-more ${hasConflicts ? "month-more--conflict" : ""}`}>
                      +{dayEvents.length - 3}
                      {hasConflicts && <span className="conflict-indicator" title="This day has scheduling conflicts">⚠️</span>}
                    </div>
                  )}
                  {dayEvents.length <= 3 && hasConflicts && (
                    <div className="conflict-indicator-small" title="This day has scheduling conflicts">⚠️</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Add CSS for responsive layout */}
      <style>
        {`
          .month-grid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            flex: 1;
            border-top: 1px solid ${theme === 'dark' ? '#444' : '#ddd'};
            border-left: 1px solid ${theme === 'dark' ? '#444' : '#ddd'};
            background-color: ${theme === 'dark' ? '#222' : '#fff'};
            overflow-y: auto;
            height: calc(100vh - 60px);
          }
          
          .month-weekday {
            padding: 10px;
            text-align: center;
            font-weight: 500;
            border-right: 1px solid ${theme === 'dark' ? '#444' : '#ddd'};
            border-bottom: 1px solid ${theme === 'dark' ? '#444' : '#ddd'};
            background-color: ${theme === 'dark' ? '#333' : '#f8f9fa'};
            color: ${theme === 'dark' ? '#fff' : '#333'};
            position: sticky;
            top: 0;
            z-index: 10;
          }
          
          .month-cell {
            border-right: 1px solid ${theme === 'dark' ? '#444' : '#ddd'};
            border-bottom: 1px solid ${theme === 'dark' ? '#444' : '#ddd'};
            min-height: 100px;
            padding: 8px;
            cursor: pointer;
            background-color: ${theme === 'dark' ? '#222' : '#fff'};
            color: ${theme === 'dark' ? '#fff' : '#333'};
          }
          
          .month-cell:hover {
            background-color: ${theme === 'dark' ? '#333' : '#f8f9fa'};
          }
          
          .month-cell--muted {
            background-color: ${theme === 'dark' ? '#1a1a1a' : '#f8f9fa'};
            color: ${theme === 'dark' ? '#777' : '#aaa'};
          }
          
          .month-cell--conflict {
            background-color: ${theme === 'dark' ? 'rgba(242, 139, 130, 0.1)' : 'rgba(220, 53, 69, 0.05)'};
          }
          
          .month-cell--today {
            box-shadow: inset 0 0 0 2px ${theme === 'dark' ? '#8ab4f8' : '#1a73e8'};
          }
          
          .month-cell--today .month-day {
            color: ${theme === 'dark' ? '#8ab4f8' : '#1a73e8'};
            font-weight: 700;
          }
          
          .month-day {
            font-weight: 500;
            margin-bottom: 8px;
          }
          
          .month-events {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          
          .month-event {
            padding: 4px 6px;
            border-radius: 4px;
            font-size: 12px;
            color: white;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          
          .month-more {
            font-size: 12px;
            color: ${theme === 'dark' ? '#8ab4f8' : '#1a73e8'};
            text-align: center;
            margin-top: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
          }
          
          .conflict-indicator, 
          .conflict-indicator-small {
            font-size: 12px;
            color: ${theme === 'dark' ? '#f28b82' : '#dc3545'};
          }
          
          .conflict-indicator-small {
            text-align: center;
            margin-top: 4px;
          }
          
          /* Performance metrics styling */
          .performance-metrics {
            font-family: monospace;
            line-height: 1.4;
          }
          
          @media (max-width: 767.98px) {
            .month-cell {
              min-height: 80px;
              padding: 4px;
            }
            
            .month-event {
              font-size: 10px;
              padding: 2px 4px;
            }
            
            .month-weekday {
              font-size: 12px;
              padding: 6px 2px;
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
