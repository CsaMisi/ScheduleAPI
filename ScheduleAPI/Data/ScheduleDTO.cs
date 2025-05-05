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
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int TotalDays { get; set; }
        public List<TaskDTO> Tasks { get; set; } = new List<TaskDTO>();
    }
}
