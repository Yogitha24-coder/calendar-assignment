using System;
using System.ComponentModel.DataAnnotations;

namespace DisprzTraining.DTOs
{
    public class CreateAppointmentDto
    {
        [Required]
        public string Title { get; set; } = string.Empty;
        
        public string? Description { get; set; }
        
        [Required]
        public DateTime Date { get; set; }
        
        [Required]
        public TimeSpan StartTime { get; set; }
        
        [Required]
        public TimeSpan EndTime { get; set; }
        
        public string? Color { get; set; }
        
        public string? Attendees { get; set; }
    }
}
