using System.ComponentModel.DataAnnotations;

namespace ScheduleAPI.Data
{
    public class ScheduleDTO
    {
        public string? Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int TotalDays { get; set; }
        public List<TaskDTO>? Tasks { get; set; }
    }

    // For generating a new schedule with the algorithm
    public class GenerateScheduleDTO
    {
        
        [Required]
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;

        [Required]
        [Range(1, 365, ErrorMessage = "Total days must be between 1 and 365")]
        public int TotalDays { get; set; }

        [Required]
        public List<TaskDTO> Tasks { get; set; } = new List<TaskDTO>();

        [Range(0, 23, ErrorMessage = "Day start hour must be between 0 and 23")]
        public int? DayStartHour { get; set; }

        [Range(0, 23, ErrorMessage = "Day end hour must be between 0 and 23")]
        public int? DayEndHour { get; set; }

        [Range(0, 24, ErrorMessage = "Minimum rest hours must be between 0 and 24")]
        public int? MinRestHours { get; set; }
    }
}
