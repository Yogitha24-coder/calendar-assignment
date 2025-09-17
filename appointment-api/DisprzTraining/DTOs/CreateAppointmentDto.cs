namespace DisprzTraining.DTOs
{
    public class CreateAppointmentDto
    {
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime Date { get; set; }
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }

        // ✅ Newly added fields
        public string? Color { get; set; }
        public string? Attendees { get; set; }
    }
}
