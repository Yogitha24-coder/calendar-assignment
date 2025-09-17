import React, { useState, useEffect } from 'react';
import '../Appointments.css';

const AppointmentForm = ({ appointment, categories, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    categoryId: 1
  });

  useEffect(() => {
    if (appointment) {
      const startTime = new Date(appointment.startTime);
      const endTime = new Date(appointment.endTime);
      
      setFormData({
        ...appointment,
        startTime: formatDateTimeForInput(startTime),
        endTime: formatDateTimeForInput(endTime)
      });
    }
  }, [appointment]);

  const formatDateTimeForInput = (date) => {
    return date.toISOString().slice(0, 16);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'categoryId' ? parseInt(value, 10) : value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const startTime = new Date(formData.startTime);
    const endTime = new Date(formData.endTime);
    
    onSave({
      ...formData,
      startTime,
      endTime
    });
  };

  return (
    <form className="appointment-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="title">Title</label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="3"
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="startTime">Start Time</label>
        <input
          type="datetime-local"
          id="startTime"
          name="startTime"
          value={formData.startTime}
          onChange={handleChange}
          required
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="endTime">End Time</label>
        <input
          type="datetime-local"
          id="endTime"
          name="endTime"
          value={formData.endTime}
          onChange={handleChange}
          required
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="categoryId">Category</label>
        <select
          id="categoryId"
          name="categoryId"
          value={formData.categoryId}
          onChange={handleChange}
        >
          {categories.map((category, index) => (
            <option key={index} value={index + 1}>
              {category}
            </option>
          ))}
        </select>
      </div>
      
      <div className="form-actions">
        <button type="button" className="cancel-button" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="save-button">
          Save
        </button>
      </div>
    </form>
  );
};

export default AppointmentForm;
