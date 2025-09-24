using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;
using DisprzTraining.Controllers;
using DisprzTraining.Data;
using DisprzTraining.DTOs;
using DisprzTraining.Models;
using DisprzTraining.Services;

namespace DisprzTraining.Tests
{
    public class AppointmentsControllerTests
    {
        private AppointmentsContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<AppointmentsContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            
            return new AppointmentsContext(options);
        }
        
        private ClaimsPrincipal GetTestUser(int userId)
        {
            var claims = new List<Claim>
            {
                new Claim("userId", userId.ToString())
            };
            
            var identity = new ClaimsIdentity(claims, "TestAuthType");
            return new ClaimsPrincipal(identity);
        }
        
        [Fact]
        public async Task GetAppointments_WithDate_ReturnsAppointmentsForThatDate()
        {
            // Arrange
            var dbContext = GetInMemoryDbContext();
            var appointmentService = new AppointmentService(dbContext);
            var controller = new AppointmentsController(dbContext, appointmentService);
            
            // Set up the user
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = GetTestUser(1) }
            };
            
            var testDate = new DateTime(2023, 10, 15);
            
            // Add test appointments
            await dbContext.Appointments.AddRangeAsync(
                new Appointment
                {
                    Title = "Meeting 1",
                    Date = testDate,
                    StartTime = new TimeSpan(9, 0, 0),
                    EndTime = new TimeSpan(10, 0, 0),
                    UserId = 1
                },
                new Appointment
                {
                    Title = "Meeting 2",
                    Date = testDate,
                    StartTime = new TimeSpan(14, 0, 0),
                    EndTime = new TimeSpan(15, 0, 0),
                    UserId = 1
                },
                new Appointment
                {
                    Title = "Other User's Meeting",
                    Date = testDate,
                    StartTime = new TimeSpan(11, 0, 0),
                    EndTime = new TimeSpan(12, 0, 0),
                    UserId = 2
                },
                new Appointment
                {
                    Title = "Different Day",
                    Date = testDate.AddDays(1),
                    StartTime = new TimeSpan(9, 0, 0),
                    EndTime = new TimeSpan(10, 0, 0),
                    UserId = 1
                }
            );
            
            await dbContext.SaveChangesAsync();
            
            // Act
            var result = await controller.GetAppointments(testDate);
            
            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var appointments = Assert.IsAssignableFrom<IEnumerable<Appointment>>(okResult.Value);
            Assert.Equal(2, appointments.Count());
            Assert.Contains(appointments, a => a.Title == "Meeting 1");
            Assert.Contains(appointments, a => a.Title == "Meeting 2");
            Assert.DoesNotContain(appointments, a => a.Title == "Other User's Meeting");
            Assert.DoesNotContain(appointments, a => a.Title == "Different Day");
        }
        
        [Fact]
        public async Task CreateAppointment_WithValidData_ReturnsCreatedResult()
        {
            // Arrange
            var dbContext = GetInMemoryDbContext();
            var appointmentService = new AppointmentService(dbContext);
            var controller = new AppointmentsController(dbContext, appointmentService);
            
            // Set up the user
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = GetTestUser(1) }
            };
            
            var dto = new CreateAppointmentDto
            {
                Title = "New Meeting",
                Description = "Discuss project",
                Date = new DateTime(2023, 10, 20),
                StartTime = new TimeSpan(10, 0, 0),
                EndTime = new TimeSpan(11, 0, 0),
                Color = "#FF5733",
                Attendees = "John, Jane"
            };
            
            // Act
            var result = await controller.CreateAppointment(dto);
            
            // Assert
            var createdResult = Assert.IsType<CreatedAtActionResult>(result);
            var appointment = Assert.IsType<Appointment>(createdResult.Value);
            Assert.Equal("New Meeting", appointment.Title);
            Assert.Equal("Discuss project", appointment.Description);
            Assert.Equal(new DateTime(2023, 10, 20), appointment.Date);
            Assert.Equal(new TimeSpan(10, 0, 0), appointment.StartTime);
            Assert.Equal(new TimeSpan(11, 0, 0), appointment.EndTime);
            Assert.Equal("#FF5733", appointment.Color);
            Assert.Equal("John, Jane", appointment.Attendees);
            Assert.Equal(1, appointment.UserId);
            
            // Verify it was saved to the database
            var savedAppointment = await dbContext.Appointments.FindAsync(appointment.Id);
            Assert.NotNull(savedAppointment);
            Assert.Equal("New Meeting", savedAppointment.Title);
        }
        
        [Fact]
        public async Task UpdateAppointment_WithValidData_ReturnsNoContent()
        {
            // Arrange
            var dbContext = GetInMemoryDbContext();
            var appointmentService = new AppointmentService(dbContext);
            var controller = new AppointmentsController(dbContext, appointmentService);
            
            // Set up the user
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = GetTestUser(1) }
            };
            
            // Create an appointment to update
            var appointment = new Appointment
            {
                Title = "Original Title",
                Description = "Original Description",
                Date = new DateTime(2023, 10, 20),
                StartTime = new TimeSpan(10, 0, 0),
                EndTime = new TimeSpan(11, 0, 0),
                UserId = 1
            };
            
            await dbContext.Appointments.AddAsync(appointment);
            await dbContext.SaveChangesAsync();
            
            var dto = new CreateAppointmentDto
            {
                Title = "Updated Title",
                Description = "Updated Description",
                Date = new DateTime(2023, 10, 21),
                StartTime = new TimeSpan(14, 0, 0),
                EndTime = new TimeSpan(15, 0, 0),
                Color = "#33FF57",
                Attendees = "Bob, Alice"
            };
            
            // Act
            var result = await controller.UpdateAppointment(appointment.Id, dto);
            
            // Assert
            Assert.IsType<NoContentResult>(result);
            
            // Verify the update was saved
            var updatedAppointment = await dbContext.Appointments.FindAsync(appointment.Id);
            Assert.NotNull(updatedAppointment);
            Assert.Equal("Updated Title", updatedAppointment.Title);
            Assert.Equal("Updated Description", updatedAppointment.Description);
            Assert.Equal(new DateTime(2023, 10, 21), updatedAppointment.Date);
            Assert.Equal(new TimeSpan(14, 0, 0), updatedAppointment.StartTime);
            Assert.Equal(new TimeSpan(15, 0, 0), updatedAppointment.EndTime);
            Assert.Equal("#33FF57", updatedAppointment.Color);
            Assert.Equal("Bob, Alice", updatedAppointment.Attendees);
        }
        
        [Fact]
        public async Task DeleteAppointment_WithValidId_ReturnsOkResult()
        {
            // Arrange
            var dbContext = GetInMemoryDbContext();
            var appointmentService = new AppointmentService(dbContext);
            var controller = new AppointmentsController(dbContext, appointmentService);
            
            // Set up the user
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = GetTestUser(1) }
            };
            
            // Create an appointment to delete
            var appointment = new Appointment
            {
                Title = "To Be Deleted",
                Date = new DateTime(2023, 10, 20),
                StartTime = new TimeSpan(10, 0, 0),
                EndTime = new TimeSpan(11, 0, 0),
                UserId = 1
            };
            
            await dbContext.Appointments.AddAsync(appointment);
            await dbContext.SaveChangesAsync();
            
            // Act
            var result = await controller.DeleteAppointment(appointment.Id);
            
            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            // Check that the message contains "deleted"
            Assert.Contains("deleted", okResult.Value.ToString().ToLower());
            
            // Verify it was deleted from the database
            var deletedAppointment = await dbContext.Appointments.FindAsync(appointment.Id);
            Assert.Null(deletedAppointment);
        }
        
        [Fact]
        public async Task CreateAppointment_WithConflict_ReturnsBadRequest()
        {
            // Arrange
            var dbContext = GetInMemoryDbContext();
            var appointmentService = new AppointmentService(dbContext);
            var controller = new AppointmentsController(dbContext, appointmentService);
            
            // Set up the user
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = GetTestUser(1) }
            };
            
            var testDate = new DateTime(2023, 10, 20);
            
            // Create existing appointment
            var existingAppointment = new Appointment
            {
                Title = "Existing Meeting",
                Date = testDate,
                StartTime = new TimeSpan(10, 0, 0),
                EndTime = new TimeSpan(11, 0, 0),
                UserId = 1
            };
            
            await dbContext.Appointments.AddAsync(existingAppointment);
            await dbContext.SaveChangesAsync();
            
            // Create conflicting appointment DTO
            var conflictingDto = new CreateAppointmentDto
            {
                Title = "Conflicting Meeting",
                Description = "This should fail",
                Date = testDate,
                StartTime = new TimeSpan(10, 30, 0),
                EndTime = new TimeSpan(11, 30, 0),
                Color = "#FF5733"
            };
            
            // Act
            var result = await controller.CreateAppointment(conflictingDto);
            
            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Contains("conflict", badRequestResult.Value.ToString().ToLower());
        }
    }
}
