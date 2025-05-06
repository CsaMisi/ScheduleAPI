using ScheduleAPI.Data;
using ScheduleAPI.Model;
using System.Reflection;

namespace ScheduleAPI.Services
{
    public class ScheduleService
    {
        
        private readonly InMemory _database;
        private readonly TaskService _taskService;

        public ScheduleService(InMemory database, TaskService taskService)
        {
            _database = database;
            _taskService = taskService;
        }

        public async Task<List<Schedule>> GetAllSchedulesAsync(string? userId = null)
        {
            if (string.IsNullOrEmpty(userId))
            {
                return await System.Threading.Tasks.Task.FromResult(_database.Schedules);
            }

            return await System.Threading.Tasks.Task.FromResult(_database.Schedules.Where(s => s.UserId == userId).ToList());
        }

        public async Task<Schedule?> GetScheduleByIdAsync(Guid scheduleId, string? userId = null)
        {
            var schedule = _database.Schedules.FirstOrDefault(s => s.ID == scheduleId);

            if (schedule == null || (!string.IsNullOrEmpty(userId) && schedule.UserId != userId))
            {
                return null;
            }

            return await System.Threading.Tasks.Task.FromResult(schedule);
        }

        public async Task<Schedule> CreateScheduleAsync(ScheduleDTO scheduleDto, string? userId = null)
        {
            var schedule = new Schedule
            {
                Name = scheduleDto.Name,
                Description = scheduleDto.Description,
                TotalDays = scheduleDto.TotalDays,
                UserId = userId
            };

            if (scheduleDto.Tasks != null)
            {
                foreach (var taskDto in scheduleDto.Tasks)
                {
                    var task = await _taskService.AddTaskAsync(taskDto, userId);
                    schedule._schedule.Add(task);
                }
            }

            _database.Schedules.Add(schedule);
            return schedule;
        }

        public async Task<Schedule?> UpdateScheduleAsync(Guid scheduleId, ScheduleDTO scheduleDto, string? userId = null)
        {
            var schedule = _database.Schedules.FirstOrDefault(s => s.ID == scheduleId);

            if (schedule == null || (!string.IsNullOrEmpty(userId) && schedule.UserId != userId))
            {
                return null;
            }

            schedule.Name = scheduleDto.Name;
            schedule.Description = scheduleDto.Description;
            schedule.TotalDays = scheduleDto.TotalDays;

            // If tasks are provided, update them
            if (scheduleDto.Tasks != null)
            {
                // Clear existing tasks and add new ones
                schedule._schedule.Clear();

                foreach (var taskDto in scheduleDto.Tasks)
                {
                    Model.Task task;

                    if (!string.IsNullOrEmpty(taskDto.Id) && Guid.TryParse(taskDto.Id, out var taskId))
                    {
                        // Update existing task
                        task = await _taskService.UpdateTaskAsync(taskId, userId ?? string.Empty, taskDto)
                               ? await _taskService.GetTaskByIdAsync(taskId, userId ?? string.Empty)
                               : await _taskService.AddTaskAsync(taskDto, userId);
                    }
                    else
                    {
                        // Add new task
                        task = await _taskService.AddTaskAsync(taskDto, userId);
                    }

                    schedule._schedule.Add(task);
                }
            }

            return schedule;
        }

        public async Task<bool> DeleteScheduleAsync(Guid scheduleId, string? userId = null)
        {
            var schedule = _database.Schedules.FirstOrDefault(s => s.ID == scheduleId);

            if (schedule == null || (!string.IsNullOrEmpty(userId) && schedule.UserId != userId))
            {
                return false;
            }

            _database.Schedules.Remove(schedule);
            return await System.Threading.Tasks.Task.FromResult(true);
        }
    }
}
