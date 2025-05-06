namespace ScheduleAPI.Model
{
    public class User
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public required string Username { get; set; }
        public required string Email { get; set; }
        public string passwordHash { get; set; } = string.Empty;
        public List<Schedule> _schedules { get; set; } = new List<Schedule>();
    }
}
