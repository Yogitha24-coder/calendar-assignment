import React, { useEffect, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchAppointments } from "../api";
import { addDays, startOfWeek, format, addWeeks, subWeeks } from "date-fns";
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

  useEffect(()=>{ loadRange(startDate); }, [startDate]);

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

  const filtered = appointments.filter(a => a.title.toLowerCase().includes(search.toLowerCase()));
  const overlappingAppointments = detectOverlappingAppointments(filtered);

  return (
    <div className="gc-container">
      <aside className="gc-left">
        <div className="gc-left-header">
          {/* Mini calendar in the sidebar */}
          <div className="mini-calendar-container">
            <DatePicker 
              selectedDate={startDate.toISOString().slice(0, 10)} 
              onChange={(newDate) => {
                const d = new Date(newDate);
                setStartDate(startOfWeek(d, {weekStartsOn:1}));
              }} 
            />
          </div>
          <button className="btn btn-primary" onClick={openNew}>+ New</button>
          <SearchBar value={search} onChange={setSearch} />
          <ColorLegend items={colorCategories} />
          <div className="upcoming">
            <h6>Upcoming</h6>
            {filtered.length === 0 && <div className="text-muted">No appointments</div>}
            {filtered.slice(0, 5).map(a => (
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

      <main className="gc-main">
        <div className="gc-main-header">
          <div className="date-navigation">
            <button className="nav-button" onClick={handlePrevWeek}>←</button>
            <strong className="date-display">Week of {format(startDate, "MMM d, yyyy")}</strong>
            <button className="nav-button" onClick={handleNextWeek}>→</button>
            {loading && <small className="loading-indicator">Loading...</small>}
          </div>
          <div className="view-navigation">
            <Link to="/day" className="view-link">Day</Link>
            <Link to="/week" className="view-link active">Week</Link>
            <Link to="/month" className="view-link">Month</Link>
            <button 
              className="theme-toggle" 
              onClick={toggleTheme} 
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            <button className="logout-button" onClick={handleLogout}>Logout</button>
          </div>
        </div>

        <div className="week-grid">
          {/* Add time column */}
          <div className="week-time-column">
            {Array.from({length: 24}, (_, i) => (
              <div key={i} className="week-time-slot">
                {formatTimeDisplay(i)}
              </div>
            ))}
          </div>
          
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
                <div className="week-day">{format(d, "EEE d")}</div>
                <div className="week-day-content">
                  {Array.from({length: 24}, (_, hour) => (
                    <div key={hour} className="week-hour-slot"></div>
                  ))}
                  
                  {/* Current time indicator */}
                  {currentTimePosition !== null && (
                    <div 
                      className="current-time-indicator" 
                      style={{ 
                        top: `${currentTimePosition}%`,
                        left: 0,
                        right: 0
                      }}
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
                          background: a.color || "#1666c1",
                          position: 'absolute',
                          top: `${startPercent}%`,
                          height: `${heightPercent}%`,
                          left: '4px',
                          right: '4px',
                          zIndex: 5,
                          borderColor: hasConflict ? '#dc3545' : 'transparent'
                        }}
                        onClick={() => navigate(`/day?date=${dKey}`)}
                      >
                        <div className="week-event-title">{a.title}</div>
                        <div className="week-event-time">{a.startTime} - {a.endTime}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
