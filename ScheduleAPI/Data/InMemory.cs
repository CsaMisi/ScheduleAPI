using ScheduleAPI.Interfaces;
using ScheduleAPI.Model;
using System.Reflection;

namespace ScheduleAPI.Data
{
    public class InMemory : IRepository
    {
        public List<Schedule> Schedules { get; } = new List<Schedule>();
        public List<Model.Task> Tasks { get; } = new List<Model.Task>();

        public List<Schedule> GetAllSchedules()
        {
            return Schedules;
        }

        public List<Schedule> GetSchedulesByUserId(string userId)
        {
            return Schedules.Where(s => s.UserId == userId).ToList();
        }

        public Schedule? GetScheduleById(Guid scheduleId)
        {
            return Schedules.FirstOrDefault(s => s.ID == scheduleId);
        }

        public void AddSchedule(Schedule schedule)
        {
            Schedules.Add(schedule);
        }

        public bool UpdateSchedule(Schedule schedule)
        {
            var index = Schedules.FindIndex(s => s.ID == schedule.ID);
            if (index != -1)
            {
                Schedules[index] = schedule;
                return true;
            }
            return false;
        }

        public bool DeleteSchedule(Guid scheduleId)
        {
            var schedule = GetScheduleById(scheduleId);
            if (schedule != null)
            {
                Schedules.Remove(schedule);
                return true;
            }
            return false;
        }

        public List<Model.Task> GetAllTasks()
        {
            return Tasks;
        }

        public Model.Task? GetTaskById(Guid taskId)
        {
            return Tasks.FirstOrDefault(t => t.Id == taskId);
        }

        public void AddTask(Model.Task task)
        {
            Tasks.Add(task);
        }

        public bool UpdateTask(Model.Task task)
        {
            var index = Tasks.FindIndex(t => t.Id == task.Id);
            if (index != -1)
            {
                Tasks[index] = task;
                return true;
            }
            return false;
        }

        public bool DeleteTask(Guid taskId)
        {
            var task = GetTaskById(taskId);
            if (task != null)
            {
                Tasks.Remove(task);
                return true;
            }
            return false;
        }

        public bool AddTaskToSchedule(Guid scheduleId, Guid taskId)
        {
            var schedule = GetScheduleById(scheduleId);
            var task = GetTaskById(taskId);

            if (schedule != null && task != null)
            {
                schedule._schedule.Add(task);
                return true;
            }
            return false;
        }

        public bool RemoveTaskFromSchedule(Guid scheduleId, Guid taskId)
        {
            var schedule = GetScheduleById(scheduleId);
            var task = GetTaskById(taskId);

            if (schedule != null && task != null)
            {
                return schedule._schedule.Remove(task);
            }
            return false;
        }


    }
}
