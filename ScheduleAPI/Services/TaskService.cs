using ScheduleAPI.Data;
using ScheduleAPI.Interfaces;
using ScheduleAPI.Model;

namespace ScheduleAPI.Services
{
    public class TaskService : ITaskService
    {
        private readonly IRepository _repository;

        public TaskService(IRepository repository)
        {
            _repository = repository;
        }

        public async Task<List<Model.Task>> GetAllTasksAsync(string? userId)
        {
            if (string.IsNullOrEmpty(userId))
            {
                return await System.Threading.Tasks.Task.FromResult(_repository.GetAllTasks());
            }

            // Get all schedules for the user
            var schedules = _repository.GetSchedulesByUserId(userId);

            // Get unique task IDs from all user schedules
            var userTaskIds = schedules.SelectMany(s => s._schedule).Select(t => t.Id).Distinct().ToList();

            // Return tasks that belong to the user
            return await System.Threading.Tasks.Task.FromResult(_repository.GetAllTasks().Where(t => userTaskIds.Contains(t.Id)).ToList());
        }

        public async Task<List<Model.Task>> GetAllTasksByScheduleAsync(string? userId, Guid scheduleId)
        {
            // Get the schedule
            var schedule = _repository.GetScheduleById(scheduleId);

            // If schedule not found or user doesn't have access
            if (schedule == null || (!string.IsNullOrEmpty(userId) && schedule.UserId != userId))
            {
                return new List<Model.Task>();
            }

            return await System.Threading.Tasks.Task.FromResult(schedule._schedule.ToList());
        }

        public async Task<Model.Task?> GetTaskByIdAsync(Guid taskId, string userId)
        {
            var tasks = await GetAllTasksAsync(userId);
            return tasks.FirstOrDefault(t => t.Id == taskId);
        }

        public async Task<Model.Task> CreateTaskAsync(TaskDTO taskDto, string userId)
        {
            var task = new Model.Task
            {
                Id = !string.IsNullOrEmpty(taskDto.Id) && Guid.TryParse(taskDto.Id, out var id) ? id : Guid.NewGuid(),
                Name = taskDto.Name,
                Description = taskDto.Description,
                DurationHours = taskDto.DurationHours,
                Type = taskDto.Type,
                Status = taskDto.Status,
                ScheduledStartTime = !string.IsNullOrEmpty(taskDto.ScheduledStartTime) ?
                    DateTime.Parse(taskDto.ScheduledStartTime) : null,
                ScheduledEndTime = !string.IsNullOrEmpty(taskDto.ScheduledEndTime) ?
                    DateTime.Parse(taskDto.ScheduledEndTime) : null,
                ScheduledDay = taskDto.ScheduledDay
            };

            _repository.AddTask(task);
            return await System.Threading.Tasks.Task.FromResult(task);
        }

        public async Task<bool> AddTaskToScheduleAsync(TaskDTO taskDto, string userId, Guid? scheduleId = null)
        {
            // Create the task first
            var task = await CreateTaskAsync(taskDto, userId);

            // Find the target schedule
            Schedule? schedule;

            if (scheduleId.HasValue)
            {
                schedule = _repository.GetScheduleById(scheduleId.Value);

                // Verify the schedule exists and belongs to the user
                if (schedule == null || (!string.IsNullOrEmpty(userId) && schedule.UserId != userId))
                {
                    return false;
                }
            }
            else
            {
                // Get the first schedule belonging to the user, or create one if none exists
                schedule = _repository.GetSchedulesByUserId(userId).FirstOrDefault();

                if (schedule == null)
                {
                    // Create a default schedule for the user
                    schedule = new Schedule
                    {
                        Name = "Default Schedule",
                        Description = "Default schedule created automatically",
                        UserId = userId,
                        _schedule = new List<Model.Task>()
                    };

                    _repository.AddSchedule(schedule);
                }
            }

            // Add the task to the schedule
            schedule._schedule.Add(task);
            return true;
        }

        public async Task<bool> DeleteTaskAsync(Guid taskId, string userId)
        {
            // Verify the task exists and belongs to the user
            var task = await GetTaskByIdAsync(taskId, userId);
            if (task == null)
            {
                return false;
            }

            // Remove the task from all schedules it might be in
            var userSchedules = _repository.GetSchedulesByUserId(userId);
            foreach (var schedule in userSchedules)
            {
                schedule._schedule.RemoveAll(t => t.Id == taskId);
            }

            // Delete the task from the repository
            return await System.Threading.Tasks.Task.FromResult(_repository.DeleteTask(taskId));
        }

        public async Task<bool> UpdateTaskAsync(Guid taskId, string userId, TaskDTO taskDto)
        {
            // Verify the task exists and belongs to the user
            var existingTask = await GetTaskByIdAsync(taskId, userId);
            if (existingTask == null)
            {
                return false;
            }

            // Update task properties
            var updatedTask = new Model.Task
            {
                Id = taskId,
                Name = taskDto.Name,
                Description = taskDto.Description,
                DurationHours = taskDto.DurationHours,
                Type = taskDto.Type,
                Status = taskDto.Status,
                ScheduledStartTime = !string.IsNullOrEmpty(taskDto.ScheduledStartTime) ?
                    DateTime.Parse(taskDto.ScheduledStartTime) : null,
                ScheduledEndTime = !string.IsNullOrEmpty(taskDto.ScheduledEndTime) ?
                    DateTime.Parse(taskDto.ScheduledEndTime) : null,
                ScheduledDay = taskDto.ScheduledDay
            };

            // Update the task in the repository
            var updated = _repository.UpdateTask(updatedTask);

            if (updated)
            {
                // Update references in all schedules
                var userSchedules = _repository.GetSchedulesByUserId(userId);
                foreach (var schedule in userSchedules)
                {
                    var index = schedule._schedule.FindIndex(t => t.Id == taskId);
                    if (index >= 0)
                    {
                        schedule._schedule[index] = updatedTask;
                    }
                }
            }

            return await System.Threading.Tasks.Task.FromResult(updated);
        }
    }
}
