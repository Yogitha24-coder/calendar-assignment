import React, { useEffect, useState, useRef, useContext } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { fetchAppointments, createAppointment, updateAppointment, deleteAppointment, checkApiStatus } from "../api";
import SearchBar from "../components/SearchBar";
import ColorLegend from "../components/ColorLegend";
import DatePicker from "../components/DatePicker";
import { AuthContext } from "../AuthContext";
import { ThemeContext } from "../App";
import { format, addDays, subDays } from "date-fns";

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

  return (
    <div className="gc-container">
      <aside className="gc-left">
        <div className="gc-left-header">
          {/* Mini calendar in the sidebar */}
          <div className="mini-calendar-container">
            <DatePicker 
              selectedDate={date} 
              onChange={(newDate) => setDate(newDate)} 
            />
          </div>
          <button className="btn btn-primary" onClick={openNew}>+ New</button>
          <SearchBar value={search} onChange={setSearch} />
          <ColorLegend items={colorCategories} />
          <div className="upcoming">
            <h6>Upcoming</h6>
            {filtered.length === 0 && <div className="text-muted">No appointments</div>}
            {filtered.map(a => (
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
            <button className="nav-button" onClick={handlePrevDay}>←</button>
            <strong className="date-display">{new Date(date).toDateString()}</strong>
            <button className="nav-button" onClick={handleNextDay}>→</button>
            {loading && <small className="loading-indicator">Loading...</small>}
          </div>
          <div className="view-navigation">
            <Link to="/day" className="view-link active">Day</Link>
            <Link to="/week" className="view-link">Week</Link>
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

        <div className="gc-grid d-flex">
          <div className="gc-time-col">
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
                  backgroundColor: 'red',
                  position: 'absolute',
                  zIndex: 5
                }}
              />
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
                    borderColor: hasConflict ? '#dc3545' : 'transparent'
                  }}
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
                    <div>
                      <button onClick={() => openEdit(a)}>✏️</button>
                      <button onClick={() => handleDelete(a.id)}>🗑️</button>
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
          <div className="modal-dialog modal-dialog-centered">
            <form className="modal-content" onSubmit={handleSubmit}>
              <div className="modal-header">
                <h5 className="modal-title">{form.id ? "Edit Appointment" : "New Appointment"}</h5>
                <button type="button" className="btn-close" onClick={() => setShowForm(false)} />
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="title">Title</label>
                  <input 
                    id="title"
                    className="form-control" 
                    placeholder="Title" 
                    value={form.title} 
                    onChange={(e) => updateFormField('title', e.target.value)} 
                    required 
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea 
                    id="description"
                    className="form-control" 
                    placeholder="Description" 
                    value={form.description} 
                    onChange={(e) => updateFormField('description', e.target.value)} 
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="date">Date</label>
                  <input 
                    type="date" 
                    id="date"
                    className="form-control" 
                    value={form.date} 
                    onChange={(e) => updateFormField('date', e.target.value)} 
                    required 
                  />
                </div>
                
                <div className="form-group">
                  <label>Time</label>
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
                    <div className="conflict-warning">
                      <i className="conflict-icon">⚠️</i> 
                      <span>
                        This time conflicts with {formConflicts.length} existing appointment(s).
                        Scheduling anyway will delete these appointments:
                        <ul className="conflict-list">
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
                
                <div className="form-group">
                  <label htmlFor="attendees">Attendees</label>
                  <input 
                    id="attendees"
                    className="form-control" 
                    placeholder="Attendees (comma separated)" 
                    value={form.attendees} 
                    onChange={(e) => updateFormField('attendees', e.target.value)} 
                  />
                </div>
                
                <div className="form-group">
                  <label>Category</label>
                  <div className="color-options">
                    {colorCategories.map((category) => (
                      <div 
                        key={category.key} 
                        className={`color-option ${form.color === category.color ? 'selected' : ''}`}
                        onClick={() => updateFormField('color', category.color)}
                      >
                        <div className="color-dot" style={{ backgroundColor: category.color }}></div>
                        <span>{category.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                {form.id && (
                  <button 
                    type="button" 
                    className="btn btn-danger" 
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
    </div>
  );
}
