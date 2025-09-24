import React, { useState } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay } from 'date-fns';

const DatePicker = ({ selectedDate, onChange }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const selected = new Date(selectedDate);

  const onDateClick = (day) => {
    onChange(format(day, 'yyyy-MM-dd'));
  };

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const renderHeader = () => {
    return (
      <div className="datepicker-header">
        <button onClick={prevMonth}>←</button>
        <span>{format(currentMonth, 'MMMM yyyy')}</span>
        <button onClick={nextMonth}>→</button>
      </div>
    );
  };

  const renderDays = () => {
    const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    return (
      <div className="datepicker-days">
        {days.map(day => (
          <div className="datepicker-day-name" key={day}>
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        days.push(
          <div
            className={`datepicker-day ${
              !isSameMonth(day, monthStart) ? 'datepicker-day-disabled' : ''
            } ${isSameDay(day, selected) ? 'datepicker-day-selected' : ''}`}
            key={day}
            onClick={() => onDateClick(cloneDay)}
          >
            {format(day, 'd')}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="datepicker-week" key={day}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="datepicker-body">{rows}</div>;
  };

  return (
    <div className="datepicker">
      {renderHeader()}
      {renderDays()}
      {renderCells()}
    </div>
  );
};

export default DatePicker;
