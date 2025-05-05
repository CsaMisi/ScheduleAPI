using ScheduleAPI.Common;

namespace ScheduleAPI.Model
{
    public class Schedule
    {
        public Guid ID { get; set; } = Guid.NewGuid();
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int TotalDays { get; set; }
        public int TotalHours { get; set; }
        public List<ITask> _schedule = new List<ITask>();
        public string? UserID { get; set; } //For authenticatuion via JWT
    }
}
