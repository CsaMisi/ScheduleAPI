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

            return await System.Threading.Tasks.Task.FromResult(_repository.GetAllTasks());
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

            return await System.Threading.Tasks.Task.FromResult(schedule.schedule.ToList());
        }

        public async Task<Model.Task?> GetTaskByIdAsync(Guid taskId, string userId)
        {
            var task = _repository.GetTaskById(taskId);

            // Check if the task exists and belongs to the user
            if (task != null)
            {
                var userTasks = await GetAllTasksAsync(userId);
                if (userTasks.Any(t => t.Id == taskId))
                {
                    return task;
                }
            }

            return null;
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
                        schedule = new List<Model.Task>()
                    };

                    _repository.AddSchedule(schedule);
                }
            }

            // Add the task to the schedule
            return _repository.AddTaskToSchedule(schedule.ID, task);
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
                schedule.schedule.RemoveAll(t => t.Id == taskId);
                _repository.UpdateSchedule(schedule);
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
            existingTask.Name = taskDto.Name;
            existingTask.Description = taskDto.Description;
            existingTask.DurationHours = taskDto.DurationHours;
            existingTask.Type = taskDto.Type;
            existingTask.Status = taskDto.Status;
            existingTask.ScheduledStartTime = !string.IsNullOrEmpty(taskDto.ScheduledStartTime) ?
                DateTime.Parse(taskDto.ScheduledStartTime) : null;
            existingTask.ScheduledEndTime = !string.IsNullOrEmpty(taskDto.ScheduledEndTime) ?
                DateTime.Parse(taskDto.ScheduledEndTime) : null;
            existingTask.ScheduledDay = taskDto.ScheduledDay;

            // Update the task in the repository
            var updated = _repository.UpdateTask(existingTask);

            if (updated)
            {
                // Update references in all schedules
                var userSchedules = _repository.GetSchedulesByUserId(userId);
                foreach (var schedule in userSchedules)
                {
                    var index = schedule.schedule.FindIndex(t => t.Id == taskId);
                    if (index >= 0)
                    {
                        schedule.schedule[index] = existingTask;
                        _repository.UpdateSchedule(schedule);
                    }
                }
            }

            return await System.Threading.Tasks.Task.FromResult(updated);
        }
    }
}