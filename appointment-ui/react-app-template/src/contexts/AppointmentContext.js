import React, { createContext, useState, useContext, useEffect } from 'react';
import { getAppointmentsByDate, createAppointment, updateAppointment, deleteAppointment } from '../services/appointmentService';
import { format } from 'date-fns';

const AppointmentContext = createContext();

export const useAppointments = () => useContext(AppointmentContext);

export const AppointmentProvider = ({ children }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const fetchAppointments = async (date) => {
    setLoading(true);
    setError(null);
    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      const data = await getAppointmentsByDate(formattedDate);
      setAppointments(data);
    } catch (err) {
      setError('Error loading appointments. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments(selectedDate);
  }, [selectedDate]);

  const addAppointment = async (appointmentData) => {
    setLoading(true);
    setError(null);
    try {
      await createAppointment(appointmentData);
      await fetchAppointments(selectedDate);
      return true;
    } catch (err) {
      setError(err.message || 'Error creating appointment. Please try again.');
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const editAppointment = async (id, appointmentData) => {
    setLoading(true);
    setError(null);
    try {
      await updateAppointment(id, appointmentData);
      await fetchAppointments(selectedDate);
      return true;
    } catch (err) {
      setError(err.message || 'Error updating appointment. Please try again.');
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const removeAppointment = async (id) => {
    setLoading(true);
    setError(null);
    try {
      await deleteAppointment(id);
      await fetchAppointments(selectedDate);
      return true;
    } catch (err) {
      setError(err.message || 'Error deleting appointment. Please try again.');
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const changeSelectedDate = (date) => {
    setSelectedDate(date);
  };

  const value = {
    appointments,
    loading,
    error,
    selectedDate,
    fetchAppointments,
    addAppointment,
    editAppointment,
    removeAppointment,
    changeSelectedDate
  };

  return (
    <AppointmentContext.Provider value={value}>
      {children}
    </AppointmentContext.Provider>
  );
};
