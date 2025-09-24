using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Xunit;
using DisprzTraining.Data;
using DisprzTraining.Models;
using DisprzTraining.Services;

namespace DisprzTraining.Tests
{
    public class AppointmentServiceTests
    {
        private AppointmentsContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<AppointmentsContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            
            return new AppointmentsContext(options);
        }
        
        [Fact]
        public async Task CreateAppointment_ShouldSaveAppointmentWithCorrectDetails()
        {
            // Arrange
            var dbContext = GetInMemoryDbContext();
            var appointmentService = new AppointmentService(dbContext);
            
            var testDate = new DateTime(2023, 10, 15);
            var appointment = new Appointment
            {
                Title = "Doctor Visit",
                Description = "Annual checkup",
                Date = testDate,
                StartTime = new TimeSpan(14, 0, 0),
                EndTime = new TimeSpan(15, 0, 0),
                UserId = 1
            };
            
            // Act
            var result = await appointmentService.CreateAppointmentAsync(appointment);
            
            // Assert
            Assert.NotNull(result);
            Assert.True(result.Id > 0);
            Assert.Equal("Doctor Visit", result.Title);
            Assert.Equal("Annual checkup", result.Description);
            Assert.Equal(testDate, result.Date);
            Assert.Equal(new TimeSpan(14, 0, 0), result.StartTime);
            Assert.Equal(new TimeSpan(15, 0, 0), result.EndTime);
            Assert.Equal(1, result.UserId);
            
            // Verify it was saved to the database
            var savedAppointment = await dbContext.Appointments.FindAsync(result.Id);
            Assert.NotNull(savedAppointment);
            Assert.Equal("Doctor Visit", savedAppointment.Title);
        }
        
        [Fact]
        public async Task GetAppointmentsByDate_ShouldReturnCorrectAppointments()
        {
            // Arrange
            var dbContext = GetInMemoryDbContext();
            var appointmentService = new AppointmentService(dbContext);
            
            var targetDate = new DateTime(2023, 10, 15);
            
            // Add appointments on target date
            await dbContext.Appointments.AddRangeAsync(
                new Appointment
                {
                    Title = "Morning Meeting",
                    Date = targetDate,
                    StartTime = new TimeSpan(9, 0, 0),
                    EndTime = new TimeSpan(10, 0, 0),
                    UserId = 1
                },
                new Appointment
                {
                    Title = "Lunch",
                    Date = targetDate,
                    StartTime = new TimeSpan(12, 0, 0),
                    EndTime = new TimeSpan(13, 0, 0),
                    UserId = 1
                }
            );
            
            // Add appointment on different date
            await dbContext.Appointments.AddAsync(
                new Appointment
                {
                    Title = "Different Day",
                    Date = new DateTime(2023, 10, 16),
                    StartTime = new TimeSpan(9, 0, 0),
                    EndTime = new TimeSpan(10, 0, 0),
                    UserId = 1
                }
            );
            
            await dbContext.SaveChangesAsync();
            
            // Act
            var appointments = await appointmentService.GetAppointmentsByDateAsync(targetDate);
            
            // Assert
            Assert.Equal(2, appointments.Count);
            Assert.Contains(appointments, a => a.Title == "Morning Meeting");
            Assert.Contains(appointments, a => a.Title == "Lunch");
            Assert.DoesNotContain(appointments, a => a.Title == "Different Day");
        }
        
        [Fact]
        public async Task CreateAppointment_WithOverlap_ShouldReturnError()
        {
            // Arrange
            var dbContext = GetInMemoryDbContext();
            var appointmentService = new AppointmentService(dbContext);
            
            var testDate = new DateTime(2023, 10, 15);
            
            // Existing appointment
            var existingAppointment = new Appointment
            {
                Title = "Existing Meeting",
                Date = testDate,
                StartTime = new TimeSpan(14, 0, 0),
                EndTime = new TimeSpan(15, 0, 0),
                UserId = 1
            };
            
            await dbContext.Appointments.AddAsync(existingAppointment);
            await dbContext.SaveChangesAsync();
            
            // Overlapping appointment
            var overlappingAppointment = new Appointment
            {
                Title = "Overlapping Meeting",
                Date = testDate,
                StartTime = new TimeSpan(14, 30, 0),
                EndTime = new TimeSpan(15, 30, 0),
                UserId = 1
            };
            
            // Act & Assert
            var exception = await Assert.ThrowsAsync<InvalidOperationException>(
                () => appointmentService.CreateAppointmentAsync(overlappingAppointment)
            );
            
            Assert.Contains("conflict", exception.Message.ToLower());
        }
        
        [Fact]
        public async Task UpdateAppointment_ShouldModifyAndPersistChanges()
        {
            // Arrange
            var dbContext = GetInMemoryDbContext();
            var appointmentService = new AppointmentService(dbContext);
            
            var initialDate = new DateTime(2023, 10, 15);
            
            // Create initial appointment
            var appointment = new Appointment
            {
                Title = "Initial Title",
                Description = "Initial Description",
                Date = initialDate,
                StartTime = new TimeSpan(14, 0, 0),
                EndTime = new TimeSpan(15, 0, 0),
                UserId = 1
            };
            
            await dbContext.Appointments.AddAsync(appointment);
            await dbContext.SaveChangesAsync();
            
            int appointmentId = appointment.Id;
            
            // Prepare update
            var updatedDate = new DateTime(2023, 10, 16);
            var updatedAppointment = new Appointment
            {
                Id = appointmentId,
                Title = "Updated Title",
                Description = "Updated Description",
                Date = updatedDate,
                StartTime = new TimeSpan(16, 0, 0),
                EndTime = new TimeSpan(17, 0, 0),
                UserId = 1
            };
            
            // Act
            var result = await appointmentService.UpdateAppointmentAsync(updatedAppointment);
            
            // Assert
            Assert.NotNull(result);
            Assert.Equal(appointmentId, result.Id);
            Assert.Equal("Updated Title", result.Title);
            Assert.Equal("Updated Description", result.Description);
            Assert.Equal(updatedDate, result.Date);
            Assert.Equal(new TimeSpan(16, 0, 0), result.StartTime);
            Assert.Equal(new TimeSpan(17, 0, 0), result.EndTime);
            
            // Verify changes were persisted
            var savedAppointment = await dbContext.Appointments.FindAsync(appointmentId);
            Assert.NotNull(savedAppointment);
            Assert.Equal("Updated Title", savedAppointment.Title);
            Assert.Equal(updatedDate, savedAppointment.Date);
            Assert.Equal(new TimeSpan(16, 0, 0), savedAppointment.StartTime);
        }
        
        [Fact]
        public async Task DeleteAppointment_ShouldRemoveAppointment()
        {
            // Arrange
            var dbContext = GetInMemoryDbContext();
            var appointmentService = new AppointmentService(dbContext);
            
            var testDate = new DateTime(2023, 10, 15);
            
            // Create appointment to delete
            var appointment = new Appointment
            {
                Title = "To Be Deleted",
                Date = testDate,
                StartTime = new TimeSpan(14, 0, 0),
                EndTime = new TimeSpan(15, 0, 0),
                UserId = 1
            };
            
            await dbContext.Appointments.AddAsync(appointment);
            await dbContext.SaveChangesAsync();
            
            int appointmentId = appointment.Id;
            
            // Act
            var result = await appointmentService.DeleteAppointmentAsync(appointmentId);
            
            // Assert
            Assert.True(result);
            
            // Verify appointment was removed
            var deletedAppointment = await dbContext.Appointments.FindAsync(appointmentId);
            Assert.Null(deletedAppointment);
        }
    }
}
