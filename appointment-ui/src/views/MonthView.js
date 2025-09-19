import React, { useEffect, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, format, isSameMonth, addMonths, subMonths } from "date-fns";
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

  // Add dependency on search to reload when search changes
  useEffect(() => {
    loadMonth(current);
  }, [current, search]); // Added search as dependency

  async function loadMonth(d) {
    setLoading(true);
    const start = startOfWeek(startOfMonth(d), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(d), { weekStartsOn: 0 });
    // fetch daily for the month range (simple approach)
    const days = [];
    for (let day = start; day <= end; day = addDays(day, 1)) days.push(day.toISOString().slice(0,10));
    try {
      const all = await Promise.all(days.map(di => fetchAppointments(di).catch(()=>[])));
      const flattened = all.flatMap((arr,idx) => arr.map(a => ({...a, date: days[idx]})));
      setAppointments(flattened);
    } catch (err) { 
      console.error(err); 
    } finally {
      setLoading(false);
    }
  }

  // Ensure these handlers are properly defined
  const handlePrevMonth = (e) => {
    e.preventDefault(); // Prevent default behavior
    e.stopPropagation(); // Stop event propagation
    setCurrent(prevDate => subMonths(prevDate, 1));
  };

  const handleNextMonth = (e) => {
    e.preventDefault(); // Prevent default behavior
    e.stopPropagation(); // Stop event propagation
    setCurrent(prevDate => addMonths(prevDate, 1));
  };

  const handleLogout = (e) => {
    e.preventDefault(); // Prevent default behavior
    if (logout) {
      logout();
      navigate("/");
    }
  };

  const handleDayClick = (date) => {
    navigate(`/day?date=${date.toISOString().slice(0, 10)}`);
  };

  const openNew = (e) => {
    e.preventDefault(); // Prevent default behavior
    // Navigate to day view with current date to create a new appointment
    navigate(`/day?date=${new Date().toISOString().slice(0, 10)}`);
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

  return (
    <div className="gc-container">
      <aside className="gc-left">
        <div className="gc-left-header">
          {/* Mini calendar in the sidebar */}
          <div className="mini-calendar-container">
            <DatePicker 
              selectedDate={current.toISOString().slice(0, 10)} 
              onChange={(newDate) => setCurrent(new Date(newDate))} 
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
            {/* Add type="button" to ensure they're treated as buttons */}
            <button type="button" className="nav-button" onClick={handlePrevMonth}>←</button>
            <strong className="date-display">{format(current, "MMMM yyyy")}</strong>
            <button type="button" className="nav-button" onClick={handleNextMonth}>→</button>
            {loading && <small className="loading-indicator">Loading...</small>}
          </div>
          <div className="view-navigation">
            <Link to="/day" className="view-link">Day</Link>
            <Link to="/week" className="view-link">Week</Link>
            <Link to="/month" className="view-link active">Month</Link>
            <button 
              type="button"
              className="theme-toggle" 
              onClick={toggleTheme} 
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            <button type="button" className="logout-button" onClick={handleLogout}>Logout</button>
          </div>
        </div>

        <div className="month-grid">
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => <div key={d} className="month-weekday">{d}</div>)}
          {dates.map((d,i) => {
            const key = d.toISOString().slice(0,10);
            const dayEvents = filtered.filter(a=>a.date && a.date.startsWith(key));
            const hasConflicts = daysWithConflicts.has(key);
            
            return (
              <div 
                key={i} 
                className={`month-cell ${!isSameMonth(d, current) ? "month-cell--muted":""} ${hasConflicts ? "month-cell--conflict" : ""}`}
                onClick={() => handleDayClick(d)}
              >
                <div className="month-day">{format(d, "d")}</div>
                <div className="month-events">
                  {dayEvents.slice(0,3).map(ev => (
                    <div 
                      key={ev.id} 
                      className="month-event" 
                      style={{background: ev.color || "#1666c1"}}
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
    </div>
  );
}
