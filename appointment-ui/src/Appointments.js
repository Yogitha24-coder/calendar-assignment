import React, { useEffect, useState, useRef } from "react";
import {
  fetchAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
} from "./api";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Appointments.css";

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [alert, setAlert] = useState(null);

  const [form, setForm] = useState({
    id: null,
    title: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    startTime: "",
    endTime: "",
  });

  // Helpers
  const slotStartHour = 0; // start at midnight
  const slotEndHour = 23; // end at 11 PM
  const slotMinutes = 30;
  const slotHeight = 60; // 1 hour = 120px (Google-like spacing)

const toMinutes = (time) => {
  if (!time) return null;
  const parts = time.split(":");
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  return h * 60 + m;
};


  const [nowPosition, setNowPosition] = useState(null);
  const canvasRef = useRef(null);

  // Keep updating "now line"
  useEffect(() => {
    function updateNow() {
      const now = new Date();
      const minutes = now.getHours() * 60 + now.getMinutes();
      setNowPosition(
        ((minutes - slotStartHour * 60) / slotMinutes) * slotHeight
      );
    }
    updateNow();
    const timer = setInterval(updateNow, 60000);
    return () => clearInterval(timer);
  }, []);

  // Auto scroll to current time
  useEffect(() => {
    if (canvasRef.current && nowPosition != null) {
      canvasRef.current.scrollTop = nowPosition - 200;
    }
  }, [nowPosition, date]);

  useEffect(() => {
    loadAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  async function loadAppointments() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAppointments(date);
      const normalized = data.map((a) => ({
        ...a,
        title: a.title || "",
        startTime: a.startTime ? a.startTime.slice(0, 5) : "",
        endTime: a.endTime ? a.endTime.slice(0, 5) : "",
        date: a.date ? a.date.slice(0, 10) : date,
      }));
      setAppointments(normalized);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  function openNew() {
    setModalError(null);
    setForm({
      id: null,
      title: "",
      description: "",
      date: date,
      startTime: "09:00",
      endTime: "09:30",
    });
    setShowForm(true);
  }

  function openEdit(a) {
    setModalError(null);
    setForm({
      id: a.id,
      title: a.title || "",
      description: a.description || "",
      date: a.date ? a.date.slice(0, 10) : date,
      startTime: a.startTime ? a.startTime.slice(0, 5) : "",
      endTime: a.endTime ? a.endTime.slice(0, 5) : "",
    });
    setShowForm(true);
  }

  function changeDay(offset) {
    const d = new Date(date);
    d.setDate(d.getDate() + offset);
    setDate(d.toISOString().slice(0, 10));
  }

function hasConflict(payload) {
  const newStart = toMinutes(payload.startTime);
  const newEnd = toMinutes(payload.endTime);
  if (newStart == null || newEnd == null) return false;

  return appointments.some((a) => {
    if (form.id && a.id === form.id) return false;

    const s = toMinutes(a.startTime);
    const e = toMinutes(a.endTime);
    if (s == null || e == null) return false;

    // ✅ Allow back-to-back (end == start)
    return newStart < e && newEnd > s;
  });
}


  function getUniqueAppointments(list) {
    const seen = new Set();
    return list.filter((a) => {
      const key = `${a.date}-${a.startTime}-${a.title}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function normalizePayloadValues(payload) {
    const norm = { ...payload };
    if (norm.date && norm.date.length === 10) {
      norm.date = `${norm.date}T00:00:00`;
    }
    const fixTime = (t) =>
      t && t.length === 5 ? `${t}:00` : t || "00:00:00";
    norm.startTime = fixTime(norm.startTime);
    norm.endTime = fixTime(norm.endTime);
    return norm;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setModalError(null);

    if (!form.title?.trim()) {
      setModalError("Title is required.");
      return;
    }
    if (!form.date || !form.startTime || !form.endTime) {
      setModalError("Please pick date, start time and end time.");
      return;
    }
    const start = toMinutes(form.startTime);
    const end = toMinutes(form.endTime);
    if (end <= start) {
      setModalError("End time must be later than start time.");
      return;
    }

    const candidate = { ...form };

    if (hasConflict(candidate)) {
      setModalError("This time conflicts with another appointment.");
      return;
    }

    try {
      const payload = normalizePayloadValues(candidate);

      const finalPayload = {
        title: form.title,
        description: form.description,
        date: payload.date,
        startTime: payload.startTime,
        endTime: payload.endTime,
      };

      if (form.id) {
        await updateAppointment(form.id, { id: form.id, ...finalPayload });
        setAlert({ type: "success", text: "Appointment updated." });
      } else {
        await createAppointment(finalPayload);
        setAlert({ type: "success", text: "Appointment created." });
      }

      setShowForm(false);
      loadAppointments();
      setTimeout(() => setAlert(null), 2500);
    } catch (err) {
      const msg = err?.message || "Failed to save appointment";
      setModalError(msg);
    }
  }

async function handleDelete(id) {
  if (!window.confirm("Delete this appointment?")) return;
  try {
    await deleteAppointment(id);

    // Immediately remove from UI
    setAppointments((prev) => prev.filter((a) => a.id !== id));

    setAlert({ type: "success", text: "Appointment deleted." });
    setTimeout(() => setAlert(null), 2000);
  } catch (err) {
    setError(err?.message || "Delete failed");
  }
}


  const slots = [];
  for (let h = slotStartHour; h <= slotEndHour; h++) {
    const hh = h.toString().padStart(2, "0");
    slots.push(`${hh}:00`);
    slots.push(`${hh}:30`);
  }

  return (
    <div className="calendar-container">
      {/* Left panel */}
      <aside className="calendar-left">
        <button className="calendar-create-btn" onClick={openNew}>
          + Create
        </button>

        <input
          type="date"
          className="form-control mini-calendar"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <h6>Upcoming</h6>
        {appointments.length === 0 && (
          <div className="text-muted small">No appointments</div>
        )}
        {getUniqueAppointments(appointments).map((a) => (
          <div key={a.id} className="gc-upcoming-item">
            <div className="gc-upcoming-time">{a.startTime}</div>
            <div className="gc-upcoming-title">
              <strong>{a.title}</strong>
              <div className="small text-muted">{a.description}</div>
            </div>
          </div>
        ))}
      </aside>

      {/* Main day view */}
      <main className="calendar-main">
        <div className="calendar-header">
  <button
    className="btn btn-outline-secondary"
    onClick={() => changeDay(-1)}
  >
    ←
  </button>
  <h2 className="calendar-date">{new Date(date).toDateString()}</h2>
  <button
    className="btn btn-outline-secondary"
    onClick={() => changeDay(1)}
  >
    →
  </button>
  {loading && <small className="text-muted ms-3">Loading...</small>}
</div>


        <div className="calendar-grid" ref={canvasRef}>
          {/* Time column */}
          <div className="time-column">
            {slots.map((s, i) => (
              <div key={i} className="time-slot">
                {s.endsWith(":00") ? s : ""}
              </div>
            ))}
          </div>

          {/* Events column */}
          <div className="events-column">
            {slots.map((_, i) => (
              <div key={i} className="time-slot" />
            ))}

            {/* Now-time line */}
            {nowPosition != null && (
              <div className="now-line" style={{ top: nowPosition }}>
                <div className="now-dot" />
              </div>
            )}

            {/* Appointments */}
            {appointments.map((a) => {
              const start = toMinutes(a.startTime);
              const end = toMinutes(a.endTime);
              if (start == null || end == null) return null;
              const topPx =
                ((start - slotStartHour * 60) / slotMinutes) * slotHeight;
              const heightPx = ((end - start) / slotMinutes) * slotHeight;

              return (
                <div
                  key={a.id}
                  className="event-block"
                  style={{
                    top: Math.max(0, topPx),
                    height: Math.max(30, heightPx - 2),
                  }}
                  onClick={() => openEdit(a)}
                >
                  <div className="event-title">{a.title}</div>
                  <div className="event-time">
                    {a.startTime} – {a.endTime}
                  </div>
                  {a.description && (
                    <div className="small">{a.description}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* modal form */}
      {showForm && (
        <div className="modal d-block" tabIndex="-1">
          <div className="modal-dialog modal-dialog-scrollable">
            <form className="modal-content" onSubmit={handleSubmit}>
              <div className="modal-header">
                <h5 className="modal-title">
                  {form.id ? "Edit Appointment" : "New Appointment"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowForm(false)}
                />
              </div>
              <div className="modal-body">
                {modalError && (
                  <div className="alert alert-danger">{modalError}</div>
                )}
                <input
                  type="text"
                  className="form-control mb-2"
                  placeholder="Title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
                <textarea
                  className="form-control mb-2"
                  placeholder="Description"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
                <input
                  type="date"
                  className="form-control mb-2"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
                <div className="d-flex gap-2 mb-2">
                  <input
                    type="time"
                    className="form-control"
                    value={form.startTime}
                    onChange={(e) =>
                      setForm({ ...form, startTime: e.target.value })
                    }
                    required
                  />
                  <input
                    type="time"
                    className="form-control"
                    value={form.endTime}
                    onChange={(e) =>
                      setForm({ ...form, endTime: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              {/* ✅ Fixed Delete Button */}
              <div className="modal-footer d-flex justify-content-between">
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
                  <button type="submit" className="btn btn-primary">
                    Save
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {alert && (
        <div
          className={`toast-alert ${
            alert.type === "success" ? "toast-success" : "toast-danger"
          }`}
        >
          {alert.text}
        </div>
      )}

      {error && <div className="mt-2 text-danger">Error: {error}</div>}
    </div>
  );
}
