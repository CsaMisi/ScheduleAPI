using static ScheduleAPI.Common.Enums;

namespace ScheduleAPI.Data
{
    public class TaskDTO
    {
        public string? Id { get; set; } // Optional for creation, required for updates
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int DurationHours { get; set; }
        public TaskType Type { get; set; }
        public TaskStatus? Status { get; set; }
        public string? ScheduledStartTime { get; set; } // ISO format string
        public string? ScheduledEndTime { get; set; } // ISO format string
        public int? ScheduledDay { get; set; }
    }
}
