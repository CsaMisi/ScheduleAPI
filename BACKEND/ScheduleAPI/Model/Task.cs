using ScheduleAPI.Common;
using static ScheduleAPI.Common.Enums;

namespace ScheduleAPI.Model
{
    public class Task
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int DurationHours { get; set; }
        public TaskType Type { get; set; }

        // Fix the recursive property definition
        private Enums.TaskProgress? _status = Enums.TaskProgress.NotStarted;
        public Enums.TaskProgress? Status
        {
            get => _status;
            set => _status = value ?? Enums.TaskProgress.NotStarted;
        }

        public DateTime? ScheduledStartTime { get; set; }
        public DateTime? ScheduledEndTime { get; set; }
        public int? ScheduledDay { get; set; }
    }
}