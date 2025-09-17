using System;
using System.ComponentModel.DataAnnotations;

namespace DisprzTraining.Models
{
    public class User
    {
        [Key]
        public int Id { get; set; }

        [Required, MaxLength(200)]
        public string Email { get; set; }

        [Required]
        public string PasswordHash { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}
