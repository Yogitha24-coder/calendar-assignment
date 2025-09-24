using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using DisprzTraining.Data;
using DisprzTraining.Models;

namespace DisprzTraining.Services
{
    public class AppointmentService
    {
        private readonly AppointmentsContext _dbContext;
        
        public AppointmentService(AppointmentsContext dbContext)
        {
            _dbContext = dbContext;
        }
        
        public async Task<Appointment> CreateAppointmentAsync(Appointment appointment)
        {
            // Check for conflicts
            bool hasConflict = await _dbContext.Appointments
                .AnyAsync(a => a.UserId == appointment.UserId &&
                              a.Date.Date == appointment.Date.Date &&
                              ((appointment.StartTime >= a.StartTime && appointment.StartTime < a.EndTime) ||
                               (appointment.EndTime > a.StartTime && appointment.EndTime <= a.EndTime) ||
                               (appointment.StartTime <= a.StartTime && appointment.EndTime >= a.EndTime)));
                               
            if (hasConflict)
            {
                throw new InvalidOperationException("Cannot create appointment due to a scheduling conflict.");
            }
            
            _dbContext.Appointments.Add(appointment);
            await _dbContext.SaveChangesAsync();
            
            return appointment;
        }
        
        public async Task<List<Appointment>> GetAppointmentsByDateAsync(DateTime date)
        {
            return await _dbContext.Appointments
                .Where(a => a.Date.Date == date.Date)
                .ToListAsync();
        }
        
        public async Task<List<Appointment>> GetAppointmentsByUserAndDateAsync(int userId, DateTime date)
        {
            return await _dbContext.Appointments
                .Where(a => a.UserId == userId && a.Date.Date == date.Date)
                .ToListAsync();
        }
        
        public async Task<Appointment> UpdateAppointmentAsync(Appointment appointment)
        {
            var existingAppointment = await _dbContext.Appointments
                .FirstOrDefaultAsync(a => a.Id == appointment.Id && a.UserId == appointment.UserId);
            
            if (existingAppointment == null)
            {
                throw new KeyNotFoundException($"Appointment with ID {appointment.Id} not found for this user.");
            }
            
            // Check for conflicts with other appointments (excluding this one)
            bool hasConflict = await _dbContext.Appointments
                .Where(a => a.Id != appointment.Id && a.UserId == appointment.UserId && a.Date.Date == appointment.Date.Date)
                .AnyAsync(a => ((appointment.StartTime >= a.StartTime && appointment.StartTime < a.EndTime) ||
                               (appointment.EndTime > a.StartTime && appointment.EndTime <= a.EndTime) ||
                               (appointment.StartTime <= a.StartTime && appointment.EndTime >= a.EndTime)));
                               
            if (hasConflict)
            {
                throw new InvalidOperationException("Cannot update appointment due to a scheduling conflict.");
            }
            
            // Update properties
            existingAppointment.Title = appointment.Title;
            existingAppointment.Description = appointment.Description;
            existingAppointment.Date = appointment.Date;
            existingAppointment.StartTime = appointment.StartTime;
            existingAppointment.EndTime = appointment.EndTime;
            existingAppointment.Color = appointment.Color;
            existingAppointment.Attendees = appointment.Attendees;
            
            await _dbContext.SaveChangesAsync();
            
            return existingAppointment;
        }
        
        public async Task<bool> DeleteAppointmentAsync(int appointmentId)
        {
            var appointment = await _dbContext.Appointments.FindAsync(appointmentId);
            
            if (appointment == null)
            {
                return false;
            }
            
            _dbContext.Appointments.Remove(appointment);
            await _dbContext.SaveChangesAsync();
            
            return true;
        }
    }
}
