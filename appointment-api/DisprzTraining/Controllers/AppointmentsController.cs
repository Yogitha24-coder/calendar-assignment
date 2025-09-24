using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DisprzTraining.Data;
using DisprzTraining.Models;
using DisprzTraining.DTOs;
using DisprzTraining.Services;
using System.Security.Claims;

namespace DisprzTraining.Controllers
{
    [ApiController]
    [Route("appointments")]
    [Authorize]
    public class AppointmentsController : ControllerBase
    {
        private readonly AppointmentsContext _context;
        private readonly AppointmentService _appointmentService;

        public AppointmentsController(AppointmentsContext context, AppointmentService appointmentService)
        {
            _context = context;
            _appointmentService = appointmentService;
        }

        // Helper to read userId claim
        private int GetUserId()
        {
            var claim = User.FindFirst("userId") ?? User.FindFirst(ClaimTypes.NameIdentifier);
            if (claim == null) throw new UnauthorizedAccessException("User id not found in token");
            return int.Parse(claim.Value);
        }

        // GET /appointments?date=YYYY-MM-DD
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Appointment>>> GetAppointments([FromQuery] DateTime? date)
        {
            try
            {
                var userId = GetUserId();
                
                if (date.HasValue)
                {
                    // Use the service to get appointments by date and user
                    var appointments = await _appointmentService.GetAppointmentsByUserAndDateAsync(userId, date.Value);
                    return Ok(appointments);
                }
                else
                {
                    // Fall back to the existing implementation for now
                    var query = _context.Appointments.Where(a => a.UserId == userId);
                    var list = await query.ToListAsync();
                    return Ok(list);
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error retrieving appointments: {ex.Message}" });
            }
        }

        // GET /appointments/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<Appointment>> GetAppointment(int id)
        {
            var userId = GetUserId();
            var appointment = await _context.Appointments.FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);
            if (appointment == null) return NotFound(new { message = $"Appointment {id} not found for this user" });
            return Ok(appointment);
        }

        // POST /appointments
        [HttpPost]
        public async Task<IActionResult> CreateAppointment([FromBody] CreateAppointmentDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            // Validate times
            if (dto.EndTime <= dto.StartTime)
                return BadRequest(new { message = "EndTime must be later than StartTime" });

            var userId = GetUserId();

            try
            {
                var appointment = new Appointment
                {
                    Title = dto.Title,
                    Description = dto.Description,
                    Date = dto.Date.Date,
                    StartTime = dto.StartTime,
                    EndTime = dto.EndTime,
                    UserId = userId,
                    Attendees = dto.Attendees,
                    Color = dto.Color
                };

                // Use the service to create the appointment
                var createdAppointment = await _appointmentService.CreateAppointmentAsync(appointment);
                return CreatedAtAction(nameof(GetAppointment), new { id = createdAppointment.Id }, createdAppointment);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error creating appointment: {ex.Message}" });
            }
        }

        // PUT /appointments/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAppointment(int id, [FromBody] CreateAppointmentDto dto)
        {
            var userId = GetUserId();

            if (dto.EndTime <= dto.StartTime)
                return BadRequest(new { message = "EndTime must be later than StartTime" });

            try
            {
                var appointment = new Appointment
                {
                    Id = id,
                    Title = dto.Title,
                    Description = dto.Description,
                    Date = dto.Date.Date,
                    StartTime = dto.StartTime,
                    EndTime = dto.EndTime,
                    UserId = userId,
                    Attendees = dto.Attendees,
                    Color = dto.Color
                };

                // Use the service to update the appointment
                await _appointmentService.UpdateAppointmentAsync(appointment);
                return NoContent();
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { message = $"Appointment {id} not found for this user" });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error updating appointment: {ex.Message}" });
            }
        }

        // DELETE /appointments/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAppointment(int id)
        {
            try
            {
                var result = await _appointmentService.DeleteAppointmentAsync(id);
                if (result)
                {
                    return Ok(new { message = $"Appointment {id} deleted" });
                }
                else
                {
                    return NotFound(new { message = $"Appointment {id} not found for this user" });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error deleting appointment: {ex.Message}" });
            }
        }
    }
}
