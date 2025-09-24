const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { ApiError, validateRequest } = require('../middleware/errorHandler');
const Appointment = require('../models/Appointment');
const {
  createAppointmentSchema,
  updateAppointmentSchema,
  getAppointmentsQuerySchema,
  batchAppointmentsQuerySchema
} = require('../validation/appointmentValidation');

/**
 * Get appointments for a specific date
 * GET /api/appointments?date=YYYY-MM-DD
 */
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    // Validate query parameters
    const { error } = getAppointmentsQuerySchema.validate(req.query);
    if (error) {
      throw new ApiError(400, error.details[0].message);
    }

    const { date } = req.query;
    
    // Parse the date string to a Date object for MongoDB query
    const queryDate = new Date(date);
    // Set time to 00:00:00 for the start of the day
    queryDate.setUTCHours(0, 0, 0, 0);
    
    // Create end date (next day at 00:00:00)
    const endDate = new Date(queryDate);
    endDate.setDate(endDate.getDate() + 1);
    
    // Find appointments for the specified date and user
    const appointments = await Appointment.find({
      userId: req.user.id,
      date: {
        $gte: queryDate,
        $lt: endDate
      }
    }).sort({ startTime: 1 });
    
    res.json(appointments);
  } catch (error) {
    next(error);
  }
});

/**
 * Batch fetch appointments for multiple dates
 * GET /api/appointments/batch?dates=2023-01-01,2023-01-02,...
 */
router.get('/batch', authenticateToken, async (req, res, next) => {
  try {
    // Validate query parameters
    const { error } = batchAppointmentsQuerySchema.validate(req.query);
    if (error) {
      throw new ApiError(400, error.details[0].message);
    }
    
    const { dates } = req.query;
    
    // Split the comma-separated dates
    const dateArray = dates.split(',');
    
    // Create a map to store appointments by date
    const appointmentsByDate = {};
    
    // Initialize each date with an empty array
    dateArray.forEach(date => {
      appointmentsByDate[date] = [];
    });
    
    // Convert date strings to Date objects for MongoDB query
    const dateObjects = dateArray.map(dateStr => {
      const date = new Date(dateStr);
      date.setUTCHours(0, 0, 0, 0);
      return date;
    });
    
    // Create end dates (next day at 00:00:00)
    const endDateObjects = dateObjects.map(date => {
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      return endDate;
    });
    
    // Create date ranges for query
    const dateRanges = dateObjects.map((startDate, index) => ({
      $and: [
        { date: { $gte: startDate } },
        { date: { $lt: endDateObjects[index] } }
      ]
    }));
    
    // Query the database for all appointments in the date ranges
    const appointments = await Appointment.find({
      userId: req.user.id,
      $or: dateRanges
    }).sort({ date: 1, startTime: 1 });
    
    // Group appointments by date
    appointments.forEach(appointment => {
      const dateStr = appointment.date.toISOString().split('T')[0];
      if (appointmentsByDate[dateStr]) {
        appointmentsByDate[dateStr].push(appointment);
      }
    });
    
    res.json(appointmentsByDate);
  } catch (error) {
    next(error);
  }
});

/**
 * Create a new appointment
 * POST /api/appointments
 */
router.post('/', authenticateToken, validateRequest(createAppointmentSchema), async (req, res, next) => {
  try {
    const { title, description, date, startTime, endTime, attendees, color } = req.body;
    
    // Create a Date object from the date string
    const appointmentDate = new Date(date);
    appointmentDate.setUTCHours(0, 0, 0, 0);
    
    // Check for time conflicts
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    const startTimeMinutes = startHour * 60 + startMinute;
    const endTimeMinutes = endHour * 60 + endMinute;
    
    // Validate that end time is after start time
    if (endTimeMinutes <= startTimeMinutes) {
      throw new ApiError(400, 'End time must be after start time');
    }
    
    // Check for conflicts with existing appointments
    const nextDay = new Date(appointmentDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    const existingAppointments = await Appointment.find({
      userId: req.user.id,
      date: {
        $gte: appointmentDate,
        $lt: nextDay
      }
    });
    
    const conflicts = existingAppointments.filter(appointment => {
      const appStartTime = appointment.startTime.split(':').map(Number);
      const appEndTime = appointment.endTime.split(':').map(Number);
      
      const appStartMinutes = appStartTime[0] * 60 + appStartTime[1];
      const appEndMinutes = appEndTime[0] * 60 + appEndTime[1];
      
      // Check for overlap
      return startTimeMinutes < appEndMinutes && endTimeMinutes > appStartMinutes;
    });
    
    // If conflicts exist, return them to the client
    if (conflicts.length > 0) {
      return res.status(409).json({
        status: 'conflict',
        message: 'This appointment conflicts with existing appointments',
        conflicts
      });
    }
    
    // Create the new appointment
    const newAppointment = new Appointment({
      userId: req.user.id,
      title,
      description,
      date: appointmentDate,
      startTime,
      endTime,
      attendees,
      color
    });
    
    const savedAppointment = await newAppointment.save();
    res.status(201).json(savedAppointment);
  } catch (error) {
    next(error);
  }
});

/**
 * Update an existing appointment
 * PUT /api/appointments/:id
 */
router.put('/:id', authenticateToken, validateRequest(updateAppointmentSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, date, startTime, endTime, attendees, color } = req.body;
    
    // Find the appointment to update
    const appointment = await Appointment.findById(id);
    
    // Check if appointment exists
    if (!appointment) {
      throw new ApiError(404, 'Appointment not found');
    }
    
    // Check if the appointment belongs to the user
    if (appointment.userId.toString() !== req.user.id) {
      throw new ApiError(403, 'You do not have permission to update this appointment');
    }
    
    // If date is being updated, create a Date object
    let appointmentDate = appointment.date;
    if (date) {
      appointmentDate = new Date(date);
      appointmentDate.setUTCHours(0, 0, 0, 0);
    }
    
    // If times are being updated, check for conflicts
    if (startTime || endTime) {
      const newStartTime = startTime || appointment.startTime;
      const newEndTime = endTime || appointment.endTime;
      
      const [startHour, startMinute] = newStartTime.split(':').map(Number);
      const [endHour, endMinute] = newEndTime.split(':').map(Number);
      
      const startTimeMinutes = startHour * 60 + startMinute;
      const endTimeMinutes = endHour * 60 + endMinute;
      
      // Validate that end time is after start time
      if (endTimeMinutes <= startTimeMinutes) {
        throw new ApiError(400, 'End time must be after start time');
      }
      
      // Check for conflicts with existing appointments
      const nextDay = new Date(appointmentDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      const existingAppointments = await Appointment.find({
        userId: req.user.id,
        _id: { $ne: id }, // Exclude the current appointment
        date: {
          $gte: appointmentDate,
          $lt: nextDay
        }
      });
      
      const conflicts = existingAppointments.filter(app => {
        const appStartTime = app.startTime.split(':').map(Number);
        const appEndTime = app.endTime.split(':').map(Number);
        
        const appStartMinutes = appStartTime[0] * 60 + appStartTime[1];
        const appEndMinutes = appEndTime[0] * 60 + appEndTime[1];
        
        // Check for overlap
        return startTimeMinutes < appEndMinutes && endTimeMinutes > appStartMinutes;
      });
      
      // If conflicts exist, return them to the client
      if (conflicts.length > 0) {
        return res.status(409).json({
          status: 'conflict',
          message: 'This appointment conflicts with existing appointments',
          conflicts
        });
      }
    }
    
    // Update the appointment
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      id,
      {
        title: title || appointment.title,
        description: description !== undefined ? description : appointment.description,
        date: appointmentDate,
        startTime: startTime || appointment.startTime,
        endTime: endTime || appointment.endTime,
        attendees: attendees !== undefined ? attendees : appointment.attendees,
        color: color !== undefined ? color : appointment.color
      },
      { new: true }
    );
    
    res.json(updatedAppointment);
  } catch (error) {
    next(error);
  }
});

/**
 * Delete an appointment
 * DELETE /api/appointments/:id
 */
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Find the appointment to delete
    const appointment = await Appointment.findById(id);
    
    // Check if appointment exists
    if (!appointment) {
      throw new ApiError(404, 'Appointment not found');
    }
    
    // Check if the appointment belongs to the user
    if (appointment.userId.toString() !== req.user.id) {
      throw new ApiError(403, 'You do not have permission to delete this appointment');
    }
    
    // Delete the appointment
    await Appointment.findByIdAndDelete(id);
    
    res.status(200).json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
