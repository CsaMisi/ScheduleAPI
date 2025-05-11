using System.Text.Json.Serialization;

namespace ScheduleAPI.Model
{
    public class Schedule
    {
        public Guid ID { get; set; } = Guid.NewGuid();
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int TotalDays { get; set; }
        public int TotalHours { get; set; }

        [JsonPropertyName("tasks")]
        public List<Task> schedule { get; set; } = new List<Task>();

        public string? UserId { get; set; } = "01";
    }
}