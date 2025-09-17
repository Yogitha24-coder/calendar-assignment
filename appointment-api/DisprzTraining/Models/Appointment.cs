// Models/Appointment.cs
public class Appointment
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime Date { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }

    public string? Color { get; set; }
public string? Attendees { get; set; }


    public int UserId { get; set; }
    public DisprzTraining.Models.User? User { get; set; } = null;
}
