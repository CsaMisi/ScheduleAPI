using static ScheduleAPI.Common.Enums;

namespace ScheduleAPI.Common
{
    public interface ITask
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public int DurationHours { get; set; }
        public TaskType Type { get; set; }
        public TaskProgress Status { get; set; }
    }
}
