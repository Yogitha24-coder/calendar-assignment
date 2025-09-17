using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DisprzTraining.Data;
using DisprzTraining.Models;
using DisprzTraining.DTOs;
using System.Security.Claims;

namespace DisprzTraining.Controllers
{
    [ApiController]
    [Route("appointments")]
    [Authorize]
    public class AppointmentsController : ControllerBase
    {
        private readonly AppointmentsContext _context;

        public AppointmentsController(AppointmentsContext context)
        {
            _context = context;
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
            var userId = GetUserId();
            var query = _context.Appointments.Where(a => a.UserId == userId);

            if (date.HasValue)
            {
                // date-only comparison
                query = query.Where(a => a.Date.Date == date.Value.Date);
            }

            var list = await query.ToListAsync();
            return Ok(list);
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

            // server-side conflict detection: overlapping times (allow end == other.start)
            var conflict = await _context.Appointments
                .AnyAsync(a => a.UserId == userId
                               && a.Date.Date == dto.Date.Date
                               && dto.StartTime < a.EndTime
                               && dto.EndTime > a.StartTime);

            if (conflict)
            {
                return BadRequest(new { message = "This time conflicts with another appointment." });
            }

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

            _context.Appointments.Add(appointment);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetAppointment), new { id = appointment.Id }, appointment);
        }

        // PUT /appointments/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAppointment(int id, [FromBody] CreateAppointmentDto dto)
        {
            var userId = GetUserId();

            if (dto.EndTime <= dto.StartTime)
                return BadRequest(new { message = "EndTime must be later than StartTime" });

            var appointment = await _context.Appointments.FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);
            if (appointment == null) return NotFound(new { message = $"Appointment {id} not found for this user" });

            // conflict check excluding current appointment
            var conflict = await _context.Appointments
                .AnyAsync(a => a.UserId == userId
                               && a.Id != id
                               && a.Date.Date == dto.Date.Date
                               && dto.StartTime < a.EndTime
                               && dto.EndTime > a.StartTime);

            if (conflict)
                return BadRequest(new { message = "This time conflicts with another appointment." });

            appointment.Title = dto.Title;
            appointment.Description = dto.Description;
            appointment.Date = dto.Date.Date;
            appointment.StartTime = dto.StartTime;
            appointment.EndTime = dto.EndTime;
            appointment.Attendees = dto.Attendees;
            appointment.Color = dto.Color;

            _context.Entry(appointment).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE /appointments/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAppointment(int id)
        {
            var userId = GetUserId();

            var appointment = await _context.Appointments.FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);
            if (appointment == null) return NotFound(new { message = $"Appointment {id} not found for this user" });

            _context.Appointments.Remove(appointment);
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Appointment {id} deleted" });
        }


    }
}
