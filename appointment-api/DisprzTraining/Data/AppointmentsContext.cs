using Microsoft.EntityFrameworkCore;
using DisprzTraining.Models;

namespace DisprzTraining.Data
{
    public class AppointmentsContext : DbContext
    {
        public AppointmentsContext(DbContextOptions<AppointmentsContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Appointment> Appointments { get; set; }
    }
}
