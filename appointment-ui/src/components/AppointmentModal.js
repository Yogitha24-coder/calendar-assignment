import React, { useState, useEffect } from "react";

export default function AppointmentModal({ onClose, onSave, initialData }) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [date, setDate] = useState(initialData?.date || "");
  const [startTime, setStartTime] = useState(initialData?.startTime || "");
  const [endTime, setEndTime] = useState(initialData?.endTime || "");
  const [color, setColor] = useState(initialData?.color || "blue");
  const [attendees, setAttendees] = useState(initialData?.attendees || "");

  const handleSave = () => {
    onSave({
      title,
      description,
      date,
      startTime,
      endTime,
      color,
      attendees,
    });
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>{initialData ? "Edit Appointment" : "New Appointment"}</h2>

        <label>Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} />

        <label>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <label>Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <label>Start Time</label>
        <input
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
        />

        <label>End Time</label>
        <input
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
        />

        <label>Color</label>
        <select value={color} onChange={(e) => setColor(e.target.value)}>
          <option value="blue">Meeting</option>
          <option value="red">Doctor</option>
          <option value="green">Personal</option>
        </select>

        <label>Attendees</label>
        <input
          type="text"
          placeholder="Enter emails, separated by commas"
          value={attendees}
          onChange={(e) => setAttendees(e.target.value)}
        />

        <div className="modal-actions">
          <button onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
