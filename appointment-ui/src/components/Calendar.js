import React, { useState, useEffect } from 'react';
import { getCategoryColor } from './ColorLegend';
import '../Appointments.css';

const Calendar = ({ appointments, onAddAppointment, onEditAppointment }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('week'); // 'day', 'week', 'month'
  
  // Generate days for the current week
  const getDaysInWeek = () => {
    const days = [];
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  };
  
  // Generate time slots (1-hour intervals)
  const getTimeSlots = () => {
    const slots = [];
    for (let i = 0; i < 24; i++) {
      slots.push(i);
    }
    return slots;
  };
  
  const formatTime = (hour) => {
    return hour === 0 ? '12 AM' : 
           hour < 12 ? `${hour} AM` : 
           hour === 12 ? '12 PM' : 
           `${hour - 12} PM`;
  };
  
  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };
  
  const handlePrevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };
  
  const handleNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };
  
  const handleToday = () => {
    setCurrentDate(new Date());
  };
  
  const handleCellClick = (day, hour) => {
    const startTime = new Date(day);
    startTime.setHours(hour, 0, 0, 0);
    
    const endTime = new Date(startTime);
    endTime.setHours(hour + 1, 0, 0, 0);
    
    onAddAppointment({
      startTime,
      endTime,
      title: '',
      description: '',
      categoryId: 1
    });
  };
  
  // Filter appointments for the current view
  const getAppointmentsForDay = (day) => {
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.startTime);
      return appointmentDate.getDate() === day.getDate() &&
             appointmentDate.getMonth() === day.getMonth() &&
             appointmentDate.getFullYear() === day.getFullYear();
    });
  };
  
  // Position appointment in the grid
  const getAppointmentStyle = (appointment) => {
    const startTime = new Date(appointment.startTime);
    const endTime = new Date(appointment.endTime);
    
    const startHour = startTime.getHours();
    const startMinutes = startTime.getMinutes();
    const endHour = endTime.getHours();
    const endMinutes = endTime.getMinutes();
    
    const top = (startHour + startMinutes / 60) * 50; // 50px per hour
    const height = (endHour + endMinutes / 60 - startHour - startMinutes / 60) * 50;
    
    return {
      top: `${top}px`,
      height: `${height}px`,
      backgroundColor: getCategoryColor(appointment.categoryId)
    };
  };
  
  const formatAppointmentTime = (appointment) => {
    const start = new Date(appointment.startTime);
    const end = new Date(appointment.endTime);
    
    const startHour = start.getHours();
    const startMinutes = start.getMinutes();
    const endHour = end.getHours();
    const endMinutes = end.getMinutes();
    
    const formatTimeComponent = (hour, minutes) => {
      const period = hour < 12 ? 'am' : 'pm';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      const displayMinutes = minutes === 0 ? '' : `:${minutes.toString().padStart(2, '0')}`;
      return `${displayHour}${displayMinutes}${period}`;
    };
    
    return `${formatTimeComponent(startHour, startMinutes)} - ${formatTimeComponent(endHour, endMinutes)}`;
  };
  
  const days = getDaysInWeek();
  const timeSlots = getTimeSlots();
  
  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h2 className="calendar-title">
          {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h2>
        <div className="calendar-nav">
          <button onClick={handlePrevWeek}>Previous</button>
          <button className="today-button" onClick={handleToday}>Today</button>
          <button onClick={handleNextWeek}>Next</button>
        </div>
      </div>
      
      <div className="calendar-grid">
        {/* Empty corner cell */}
        <div className="day-header"></div>
        
        {/* Day headers */}
        {days.map((day, index) => (
          <div key={index} className={`day-header ${isToday(day) ? 'today' : ''}`}>
            <div className="day-name">
              {day.toLocaleDateString('en-US', { weekday: 'short' })}
            </div>
            <div className="day-date">
              {day.getDate()}
            </div>
          </div>
        ))}
        
        {/* Time slots and calendar cells */}
        {timeSlots.map((hour) => (
          <React.Fragment key={hour}>
            <div className="time-slot">
              {formatTime(hour)}
            </div>
            
            {days.map((day, dayIndex) => (
              <div 
                key={dayIndex} 
                className="calendar-cell"
                onClick={() => handleCellClick(day, hour)}
              >
                {getAppointmentsForDay(day).map((appointment, appIndex) => {
                  const appointmentStartHour = new Date(appointment.startTime).getHours();
                  // Only render if appointment starts in this hour
                  if (appointmentStartHour === hour) {
                    return (
                      <div
                        key={appIndex}
                        className="appointment"
                        style={getAppointmentStyle(appointment)}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditAppointment(appointment);
                        }}
                      >
                        <div className="appointment-title">{appointment.title}</div>
                        <div className="appointment-time">
                          {formatAppointmentTime(appointment)}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default Calendar;
