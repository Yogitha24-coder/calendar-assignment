const Joi = require('joi');

// Time format regex (HH:MM)
const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

// Date format regex (YYYY-MM-DD)
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

// Create appointment schema
const createAppointmentSchema = Joi.object({
  title: Joi.string().trim().required().max(100)
    .messages({
      'string.empty': 'Title is required',
      'string.max': 'Title cannot be longer than 100 characters',
      'any.required': 'Title is required'
    }),
  
  description: Joi.string().allow('').max(500)
    .messages({
      'string.max': 'Description cannot be longer than 500 characters'
    }),
  
  date: Joi.string().pattern(dateRegex).required()
    .messages({
      'string.pattern.base': 'Date must be in YYYY-MM-DD format',
      'any.required': 'Date is required'
    }),
  
  startTime: Joi.string().pattern(timeRegex).required()
    .messages({
      'string.pattern.base': 'Start time must be in HH:MM format',
      'any.required': 'Start time is required'
    }),
  
  endTime: Joi.string().pattern(timeRegex).required()
    .messages({
      'string.pattern.base': 'End time must be in HH:MM format',
      'any.required': 'End time is required'
    }),
  
  attendees: Joi.string().allow('').max(200)
    .messages({
      'string.max': 'Attendees field cannot be longer than 200 characters'
    }),
  
  color: Joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).allow('')
    .messages({
      'string.pattern.base': 'Color must be a valid hex color code (e.g., #FF5733)'
    })
}).custom((value, helpers) => {
  // Custom validation to ensure end time is after start time
  const { startTime, endTime } = value;
  
  if (startTime && endTime) {
    const start = startTime.split(':').map(Number);
    const end = endTime.split(':').map(Number);
    
    const startMinutes = start[0] * 60 + start[1];
    const endMinutes = end[0] * 60 + end[1];
    
    if (endMinutes <= startMinutes) {
      return helpers.error('custom.timeRange', { 
        message: 'End time must be after start time' 
      });
    }
  }
  
  return value;
});

// Update appointment schema (same as create but all fields optional)
const updateAppointmentSchema = Joi.object({
  title: Joi.string().trim().max(100)
    .messages({
      'string.max': 'Title cannot be longer than 100 characters'
    }),
  
  description: Joi.string().allow('').max(500)
    .messages({
      'string.max': 'Description cannot be longer than 500 characters'
    }),
  
  date: Joi.string().pattern(dateRegex)
    .messages({
      'string.pattern.base': 'Date must be in YYYY-MM-DD format'
    }),
  
  startTime: Joi.string().pattern(timeRegex)
    .messages({
      'string.pattern.base': 'Start time must be in HH:MM format'
    }),
  
  endTime: Joi.string().pattern(timeRegex)
    .messages({
      'string.pattern.base': 'End time must be in HH:MM format'
    }),
  
  attendees: Joi.string().allow('').max(200)
    .messages({
      'string.max': 'Attendees field cannot be longer than 200 characters'
    }),
  
  color: Joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).allow('')
    .messages({
      'string.pattern.base': 'Color must be a valid hex color code (e.g., #FF5733)'
    })
}).custom((value, helpers) => {
  // Custom validation to ensure end time is after start time if both are provided
  const { startTime, endTime } = value;
  
  if (startTime && endTime) {
    const start = startTime.split(':').map(Number);
    const end = endTime.split(':').map(Number);
    
    const startMinutes = start[0] * 60 + start[1];
    const endMinutes = end[0] * 60 + end[1];
    
    if (endMinutes <= startMinutes) {
      return helpers.error('custom.timeRange', { 
        message: 'End time must be after start time' 
      });
    }
  }
  
  return value;
});

// Query schema for fetching appointments
const getAppointmentsQuerySchema = Joi.object({
  date: Joi.string().pattern(dateRegex).required()
    .messages({
      'string.pattern.base': 'Date must be in YYYY-MM-DD format',
      'any.required': 'Date is required'
    })
});

// Batch query schema
const batchAppointmentsQuerySchema = Joi.object({
  dates: Joi.string().required()
    .messages({
      'any.required': 'Dates parameter is required'
    })
}).custom((value, helpers) => {
  const { dates } = value;
  
  if (!dates) return value;
  
  const dateArray = dates.split(',');
  
  // Validate each date in the array
  for (const date of dateArray) {
    if (!dateRegex.test(date)) {
      return helpers.error('custom.invalidDate', { 
        message: `Invalid date format: ${date}. Use YYYY-MM-DD format.` 
      });
    }
  }
  
  return value;
});

module.exports = {
  createAppointmentSchema,
  updateAppointmentSchema,
  getAppointmentsQuerySchema,
  batchAppointmentsQuerySchema
};
