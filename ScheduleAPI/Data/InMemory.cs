using ScheduleAPI.Model;
using System.Reflection;

namespace ScheduleAPI.Data
{
    public class InMemory
    {
        public List<Model.Task> Tasks { get; } = new List<Model.Task>();
        public List<Schedule> Schedules { get; } = new List<Schedule>();
        public List<User> Users { get; } = new List<User>();
    }
}
