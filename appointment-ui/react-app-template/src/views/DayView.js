import React, { useEffect, useState, useRef, useContext } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { fetchAppointments, createAppointment, updateAppointment, deleteAppointment, checkApiStatus } from "../api";
import SearchBar from "../components/SearchBar";
import ColorLegend from "../components/ColorLegend";
import DatePicker from "../components/DatePicker";
import { AuthContext } from "../AuthContext";
import { ThemeContext } from "../App";
import { format, addDays, subDays, isAfter } from "date-fns";
import PrintButton from "../components/PrintButton";

// Change these constants to show full 24 hours
const slotStartHour = 0; // Start from midnight (00:00)
const slotEndHour = 23; // End at 23:30
const slotMinutes = 30;
const slotHeight = 40; // Slightly reduced height to fit more hours on screen

// Define color categories
const colorCategories = [
  {key:'work', label:'Work', color:'#4285f4'},
  {key:'personal', label:'Personal', color:'#0f9d58'},
  {key:'family', label:'Family', color:'#f4b400'},
  {key:'health', label:'Health', color:'#db4437'}
];

function toMinutes(time) {
  if (!time) return null;
  const [h, m] = time.split(":");
  return parseInt(h, 10) * 60 + parseInt(m, 10);
}

export default function DayView() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialDate = queryParams.get('date') || new Date().toISOString().slice(0, 10);
  
  const [date, setDate] = useState(initialDate);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ id: null, title: "", description: "", date: date, startTime: "09:00", endTime: "09:30", attendees: "", color: "#4285f4" });
  const [formConflicts, setFormConflicts] = useState(false);
  const [search, setSearch] = useState("");
  const canvasRef = useRef(null);
  const { logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  
  // State for mobile menu
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Check API status on component mount
  useEffect(() => {
    async function checkApi() {
      const isApiReachable = await checkApiStatus();
      if (!isApiReachable) {
        console.warn("API is not reachable. Appointments may not load correctly.");
      }
    }
    checkApi();
  }, []);

  // Load appointments when date changes
  useEffect(() => { 
    loadAppointments(); 
  }, [date]);
  
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

  async function loadAppointments() {
    setLoading(true);
    try {
      console.log("Loading appointments for date:", date);
      const data = await fetchAppointments(date);
      console.log("Received appointments:", data);
      
      if (!data || !Array.isArray(data)) {
        console.error("Invalid data received:", data);
        setAppointments([]);
        return;
      }
      
      const normalized = data.map(a => ({
        ...a,
        id: a.id,
        startTime: a.startTime ? a.startTime.slice(0, 5) : "",
        endTime: a.endTime ? a.endTime.slice(0, 5) : "",
        date: a.date ? a.date.slice(0, 10) : date,
      }));
      
      console.log("Normalized appointments:", normalized);
      setAppointments(normalized);
    } catch (err) {
      console.error("Failed to fetch appointments:", err);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }

  function openNew() {
    setForm({ id: null, title: "", description: "", date, startTime: "09:00", endTime: "09:30", attendees: "", color: "#4285f4" });
    setFormConflicts(false);
    setShowForm(true);
    // Close sidebar on mobile when opening form
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }

  function openEdit(a) {
    setForm({ 
      id: a.id, 
      title: a.title, 
      description: a.description, 
      date: a.date, 
      startTime: a.startTime, 
      endTime: a.endTime, 
      attendees: a.attendees || "", 
      color: a.color || "#4285f4" 
    });
    setFormConflicts(false);
    setShowForm(true);
    // Close sidebar on mobile when opening form
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }

  function hasConflict(payload) {
    const newStart = toMinutes(payload.startTime);
    const newEnd = toMinutes(payload.endTime);
    
    if (newStart == null || newEnd == null) return false;
    
    // Check against all existing appointments
    const conflicts = appointments.filter(a => {
      // Skip comparing with the appointment being edited
      if (payload.id && a.id === payload.id) return false;
      
      const s = toMinutes(a.startTime);
      const e = toMinutes(a.endTime);
      
      if (s == null || e == null) return false;
      
      // Allow back-to-back appointments (end === start is ok)
      // Check for overlap: new start is before existing end AND new end is after existing start
      return newStart < e && newEnd > s;
    });
    
    return conflicts.length > 0 ? conflicts : false;
  }

  function updateFormField(field, value) {
    const updatedForm = { ...form, [field]: value };
    setForm(updatedForm);
    
    // Only check for conflicts if we have valid start and end times
    if ((field === 'startTime' || field === 'endTime' || field === 'date') && 
        updatedForm.startTime && updatedForm.endTime) {
      const conflicts = hasConflict(updatedForm);
      setFormConflicts(conflicts);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!form.title.trim()) {
      alert("Title is required");
      return;
    }
    
    const start = toMinutes(form.startTime);
    const end = toMinutes(form.endTime);
    
    if (end <= start) {
      alert("End time must be later than start time");
      return;
    }
    
    // Check for conflicts
    const conflicts = hasConflict(form);
    
    if (conflicts) {
      // Show conflict details in the alert
      const conflictDetails = conflicts.map(a => 
        `"${a.title}" (${a.startTime} - ${a.endTime})`
      ).join(", ");
      
      const confirmOverride = window.confirm(
        `This appointment conflicts with existing appointment(s): ${conflictDetails}.\n\nDo you want to schedule anyway? This will delete the conflicting appointment(s).`
      );
      
      if (!confirmOverride) {
        return;
      }
      
      // Delete all conflicting appointments
      try {
        for (const conflict of conflicts) {
          console.log(`Deleting conflicting appointment: ${conflict.id}`);
          await deleteAppointment(conflict.id);
        }
      } catch (err) {
        console.error("Error deleting conflicting appointments:", err);
        alert("Failed to delete conflicting appointments: " + (err.message || String(err)));
        return;
      }
    }
    
    try {
      if (form.id) {
        console.log("Updating appointment:", form.id, form);
        await updateAppointment(form.id, {
          title: form.title,
          description: form.description,
          date: form.date,
          startTime: form.startTime,
          endTime: form.endTime,
          attendees: form.attendees,
          color: form.color
        });
        setShowForm(false);
        await loadAppointments();
      } else {
        console.log("Creating new appointment:", form);
        await createAppointment({
          title: form.title,
          description: form.description,
          date: form.date,
          startTime: form.startTime,
          endTime: form.endTime,
          attendees: form.attendees,
          color: form.color
        });
        setShowForm(false);
        await loadAppointments();
      }
    } catch (err) {
      console.error("Error saving appointment:", err);
      alert(err.message || String(err));
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this appointment?")) return;
    try {
      console.log("Deleting appointment:", id);
      await deleteAppointment(id);
      await loadAppointments();
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Delete failed: " + err.message);
    }
  }

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

  // Generate time slots for the full 24 hours
  const slots = [];
  for (let h = slotStartHour; h <= slotEndHour; h++) {
    const hh = h.toString().padStart(2, "0");
    slots.push(`${hh}:00`);
    slots.push(`${hh}:30`);
  }

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

  // Define the handleLogout function
  const handleLogout = () => {
    if (logout) {
      logout();
      navigate("/");
    }
  };

  const handlePrevDay = () => {
    const d = new Date(date);
    setDate(subDays(d, 1).toISOString().slice(0, 10));
  };

  const handleNextDay = () => {
    const d = new Date(date);
    setDate(addDays(d, 1).toISOString().slice(0, 10));
  };

  // Function to format time in 12-hour format with AM/PM
  const formatTimeDisplay = (timeSlot) => {
    const [hours, minutes] = timeSlot.split(':');
    const hour = parseInt(hours, 10);
    
    if (hour === 0) {
      return `12:${minutes} AM`;
    } else if (hour === 12) {
      return `12:${minutes} PM`;
    } else if (hour > 12) {
      return `${hour - 12}:${minutes} PM`;
    } else {
      return `${hour}:${minutes} AM`;
    }
  };

  // Function to get current hour for highlighting
  const getCurrentTimeIndicatorPosition = () => {
    const now = new Date();
    const today = new Date(date);
    
    // Only show for current date
    if (today.toDateString() !== now.toDateString()) {
      return null;
    }
    
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const totalMinutes = hours * 60 + minutes;
    
    // Calculate position
    return ((totalMinutes - slotStartHour * 60) / slotMinutes) * slotHeight;
  };

  const currentTimePosition = getCurrentTimeIndicatorPosition();

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
          
          {/* Mini calendar in the sidebar - with compact styling */}
          <div className="mini-calendar-container" style={{ maxWidth: '100%', margin: '0 auto 15px' }}>
            <DatePicker 
              selectedDate={date} 
              onChange={(newDate) => {
                setDate(newDate);
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
                onClick={() => openEdit(a)}
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
                  onClick={handlePrevDay}
                  style={getNavButtonStyles()}
                  aria-label="Previous Day"
                >
                  <span style={{ fontSize: '20px' }}>←</span>
                </button>
                <strong 
                  className="date-display"
                  style={getDateDisplayStyles()}
                >
                  {format(new Date(date), "EEEE, MMMM d, yyyy")}
                </strong>
                <button 
                  className="nav-button" 
                  onClick={handleNextDay}
                  style={getNavButtonStyles()}
                  aria-label="Next Day"
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
                <Link to="/day" className="view-link active">Day</Link>
                <Link to="/week" className="view-link">Week</Link>
                <Link to="/month" className="view-link">Month</Link>
              </div>
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
                  Day
                </button>
                <ul 
                  className="dropdown-menu dropdown-menu-end" 
                  aria-labelledby="viewDropdown"
                  style={{
                    backgroundColor: theme === 'dark' ? '#333' : '#fff',
                    border: theme === 'dark' ? '1px solid #555' : '1px solid #dee2e6',
                  }}
                >
                  <li><Link to="/day" className="dropdown-item active">Day</Link></li>
                  <li><Link to="/week" className="dropdown-item">Week</Link></li>
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
  className="gc-grid d-flex" 
  data-print-date={format(new Date(date), "MMMM d, yyyy")}
>          <div className="gc-time-col">
            {slots.map((s,i) => (
              <div key={i} className="gc-time-cell" style={{height: `${slotHeight}px`}}>
                {formatTimeDisplay(s)}
              </div>
            ))}
          </div>

          <div className="gc-canvas position-relative flex-grow-1" ref={canvasRef}>
            {slots.map((_,i) => (
              <div key={i} className="gc-slot-line" style={{height: `${slotHeight}px`}} />
            ))}
            
            {/* Current time indicator */}
            {currentTimePosition !== null && (
              <div 
                className="current-time-indicator" 
                style={{ 
                  top: `${currentTimePosition}px`,
                  left: 0,
                  right: 0,
                  height: '2px',
                  backgroundColor: theme === 'dark' ? '#f28b82' : '#db4437',
                  position: 'absolute',
                  zIndex: 5
                }}
              >
                <div 
                  className="current-time-dot"
                  style={{
                    position: 'absolute',
                    left: '-5px',
                    top: '-4px',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: theme === 'dark' ? '#f28b82' : '#db4437'
                  }}
                />
              </div>
            )}
            
            {filtered.map(a => {
              const start = toMinutes(a.startTime);
              const end = toMinutes(a.endTime);
              if (start == null || end == null) return null;
              
              // Calculate position and size based on slot height
              // This ensures perfect alignment with time cells
              const startSlot = Math.floor((start - slotStartHour*60) / slotMinutes);
              const endSlot = Math.ceil((end - slotStartHour*60) / slotMinutes);
              const slotCount = endSlot - startSlot;
              
              const topPx = startSlot * slotHeight;
              const heightPx = slotCount * slotHeight;
              const hasConflict = overlappingAppointments.has(a.id);
              
              // Adjust height to fit within slots (account for borders)
              const actualHeight = heightPx - 2;
              
              // Determine if we should show full content or compact view
              const isCompact = slotCount === 1 || actualHeight < 35;
              
              return (
                <div
                  key={a.id}
                  className={`gc-appointment ${hasConflict ? 'has-conflict' : ''}`}
                  style={{ 
                    top: `${topPx + 1}px`, // Add 1px offset to align with grid lines
                    height: `${actualHeight}px`, 
                    background: a.color || "#4285f4",
                    borderColor: hasConflict ? (theme === 'dark' ? '#f28b82' : '#dc3545') : 'transparent'
                  }}
                  onClick={() => openEdit(a)}
                >
                  <div style={{
                    display: 'flex', 
                    justifyContent: 'space-between',
                    height: '100%',
                    overflow: 'hidden'
                  }}>
                    <div style={{overflow: 'hidden', flexGrow: 1}}>
                      <div className="gc-appointment-title">{a.title}</div>
                      {!isCompact && (
                        <>
                          <div className="small gc-appointment-time">{a.startTime} – {a.endTime}</div>
                          {a.attendees && <div className="small mt-1">Attendees: {a.attendees}</div>}
                        </>
                      )}
                    </div>
                    <div className="d-none d-md-block">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(a);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          padding: '2px',
                          fontSize: '14px'
                        }}
                      >✏️</button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(a.id);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          padding: '2px',
                          fontSize: '14px'
                        }}
                      >🗑️</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {showForm && (
        <div className="modal d-block">
          <div className="modal-dialog modal-dialog-centered modal-fullscreen-sm-down">
            <form className="modal-content" onSubmit={handleSubmit}>
              <div className="modal-header">
                <h5 className="modal-title">{form.id ? "Edit Appointment" : "New Appointment"}</h5>
                <button type="button" className="btn-close" onClick={() => setShowForm(false)} />
              </div>
              <div className="modal-body">
                <div className="form-group mb-3">
                  <label htmlFor="title" className="form-label">Title</label>
                  <input 
                    id="title"
                    className="form-control" 
                    placeholder="Title" 
                    value={form.title} 
                    onChange={(e) => updateFormField('title', e.target.value)}
                    required 
                  />
                </div>
                
                <div className="form-group mb-3">
                  <label htmlFor="description" className="form-label">Description</label>
                  <textarea 
                    id="description"
                    className="form-control" 
                    placeholder="Description" 
                    value={form.description} 
                    onChange={(e) => updateFormField('description', e.target.value)} 
                  />
                </div>
                
                <div className="form-group mb-3">
                  <label htmlFor="date" className="form-label">Date</label>
                  <input 
                    type="date" 
                    id="date"
                    className="form-control" 
                    value={form.date} 
                    onChange={(e) => updateFormField('date', e.target.value)} 
                    required 
                  />
                </div>
                
                <div className="form-group mb-3">
                  <label className="form-label">Time</label>
                  <div className="d-flex gap-2">
                    <input 
                      type="time" 
                      className={`form-control ${formConflicts ? 'conflict-input' : ''}`}
                      value={form.startTime} 
                      onChange={(e) => updateFormField('startTime', e.target.value)} 
                      required 
                    />
          
                    <span className="align-self-center">to</span>
                    <input 
                      type="time" 
                      className={`form-control ${formConflicts ? 'conflict-input' : ''}`}
                      value={form.endTime} 
                      onChange={(e) => updateFormField('endTime', e.target.value)} 
                      required 
                    />
                  </div>
                  
                  {/* Updated conflict warning message */}
                  {formConflicts && (
                    <div className="conflict-warning mt-2" style={{
                      backgroundColor: theme === 'dark' ? 'rgba(242, 139, 130, 0.1)' : 'rgba(220, 53, 69, 0.1)',
                      borderLeft: `4px solid ${theme === 'dark' ? '#f28b82' : '#dc3545'}`,
                      padding: '10px',
                      borderRadius: '4px'
                    }}>
                      <i className="conflict-icon">⚠️</i> 
                      <span>
                        This time conflicts with {formConflicts.length} existing appointment(s).
                        Scheduling anyway will delete these appointments:
                        <ul className="conflict-list mt-2 mb-0">
                          {formConflicts.map(conflict => (
                            <li key={conflict.id}>
                              "{conflict.title}" ({conflict.startTime} - {conflict.endTime})
                            </li>
                          ))}
                        </ul>
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="form-group mb-3">
                  <label htmlFor="attendees" className="form-label">Attendees</label>
                  <input 
                    id="attendees"
                    className="form-control" 
                    placeholder="Attendees (comma separated)" 
                    value={form.attendees} 
                    onChange={(e) => updateFormField('attendees', e.target.value)} 
                  />
                </div>
                
                <div className="form-group mb-3">
                  <label className="form-label">Category</label>
                  <div className="color-options" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                    gap: '10px'
                  }}>
                    {colorCategories.map((category) => (
                      <div 
                        key={category.key} 
                        className={`color-option ${form.color === category.color ? 'selected' : ''}`}
                        onClick={() => updateFormField('color', category.color)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '8px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          border: form.color === category.color 
                            ? `2px solid ${theme === 'dark' ? '#fff' : '#000'}` 
                            : '2px solid transparent',
                          backgroundColor: theme === 'dark' ? '#333' : '#f8f9fa'
                        }}
                      >
                        <div 
                          className="color-dot" 
                          style={{ 
                            backgroundColor: category.color,
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            marginRight: '8px'
                          }}
                        ></div>
                        <span>{category.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer flex-wrap">
                {form.id && (
                  <button 
                    type="button" 
                    className="btn btn-danger me-auto" 
                    onClick={async () => {
                      await handleDelete(form.id);
                      setShowForm(false);
                    }}
                  >
                    Delete
                  </button>
                )}
                <div className="d-flex gap-2">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                  >
                    {formConflicts ? 'Replace Conflicting Appointments' : 'Save'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add CSS for responsive layout */}
      <style>
        {`
          /* DatePicker compact styles for sidebar */
          .mini-calendar-container .datepicker {
            width: 100%;
            padding: 8px;
            font-size: 0.9rem;
          }
          
          .mini-calendar-container .datepicker-day {
            padding: 6px;
            font-size: 12px;
          }
          
          .mini-calendar-container .datepicker-day-name {
            font-size: 11px;
            padding: 3px;
          }
          
          @media (max-width: 767.98px) {
            .gc-container {
              display: block;
              height: 100vh;
              overflow: hidden;
            }
            
            .gc-main {
              width: 100%;
              height: 100vh;
              overflow: auto;
              margin-left: 0;
            }
            
            .gc-left {
              padding: 15px;
            }
            
            .gc-time-col {
              min-width: 70px;
            }
            
            .gc-time-cell {
              font-size: 12px;
              padding: 2px 5px;
            }
            
            .gc-appointment {
              font-size: 12px;
              padding: 2px 5px;
            }
            
            .date-navigation {
              flex-wrap: wrap;
            }
            
            .date-display {
              font-size: 16px !important;
              min-width: 150px !important;
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
              overflow: auto;
            }
            
            .hamburger-menu {
              display: none !important;
            }
          }
          
          /* Styles for the appointment elements */
          .gc-appointment {
            position: absolute;
            left: 0;
            right: 0;
            padding: 5px 8px;
            border-radius: 4px;
            color: white;
            overflow: hidden;
            cursor: pointer;
            transition: all 0.2s;
            border-left: 4px solid transparent;
          }
          
          .gc-appointment:hover {
            filter: brightness(1.1);
            z-index: 10;
          }
          
          .gc-appointment.has-conflict {
            border-left: 4px solid ${theme === 'dark' ? '#f28b82' : '#dc3545'};
          }
          
          .gc-appointment-title {
            font-weight: bold;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          
          .gc-appointment-time {
            opacity: 0.8;
          }
          
          /* Conflict input styling */
          .conflict-input {
            border-color: ${theme === 'dark' ? '#f28b82' : '#dc3545'};
            background-color: ${theme === 'dark' ? 'rgba(242, 139, 130, 0.1)' : 'rgba(220, 53, 69, 0.1)'};
          }
          
          /* Current time indicator */
          .current-time-indicator::before {
            content: '';
            position: absolute;
            left: -5px;
            top: -4px;
            width: 10px;
            height: 10px;
            background-color: ${theme === 'dark' ? '#f28b82' : '#db4437'};
            border-radius: 50%;
          }
          
          /* View links styling */
          .view-link {
            padding: 5px 10px;
            margin: 0 5px;
            text-decoration: none;
            color: inherit;
            border-radius: 4px;
          }
          
          .view-link.active {
            background-color: ${theme === 'dark' ? 'rgba(138, 180, 248, 0.1)' : 'rgba(13, 110, 253, 0.1)'};
            font-weight: bold;
          }
          
          /* Dropdown menu item styling for dark mode */
          .dropdown-menu-dark .dropdown-item {
            color: #fff;
          }
          
          .dropdown-menu-dark .dropdown-item:hover,
          .dropdown-menu-dark .dropdown-item:focus {
            background-color: rgba(255, 255, 255, 0.15);
          }
          
          .dropdown-menu-dark .dropdown-item.active {
            background-color: #0d6efd;
          }
          
          /* Animation for hamburger menu */
          .hamburger-menu:hover div {
            background-color: ${theme === 'dark' ? '#8ab4f8' : '#0d6efd'};
          }
          
          /* Sidebar transition */
          .gc-left.open {
            box-shadow: 2px 0 10px rgba(0,0,0,0.2);
          }
          
          /* Upcoming appointments styling */
          .gc-upcoming-time {
            color: ${theme === 'dark' ? '#adb5bd' : '#6c757d'};
            font-size: 12px;
            margin-bottom: 4px;
          }
          
          .gc-upcoming-title {
            flex: 1;
            font-size: 13px;
          }
          
          .gc-upcoming-title .small {
            font-size: 11px;
            margin-top: 2px;
          }
        `}
      </style>
    </div>
  );
}
