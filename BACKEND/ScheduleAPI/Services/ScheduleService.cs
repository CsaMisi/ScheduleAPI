using ScheduleAPI.Data;
using ScheduleAPI.Interfaces;
using ScheduleAPI.Model;

namespace ScheduleAPI.Services
{
    public class ScheduleService : IScheduleService
    {
        private readonly IRepository _repository;

        public ScheduleService(IRepository repository)
        {
            _repository = repository;
        }

        public async Task<List<Schedule>> GetAllSchedulesAsync(string? userId = null)
        {
            if (string.IsNullOrEmpty(userId))
            {
                return await System.Threading.Tasks.Task.FromResult(_repository.GetAllSchedules());
            }

            return await System.Threading.Tasks.Task.FromResult(_repository.GetSchedulesByUserId(userId));
        }

        public async Task<ScheduleDTO?> GetScheduleByIdAsync(Guid scheduleId, string? userId = null)
        {
            var schedule = _repository.GetScheduleById(scheduleId);

            // If no schedule found or user doesn't have access
            if (schedule == null || (!string.IsNullOrEmpty(userId) && schedule.UserId != userId))
            {
                return null;
            }

            return await System.Threading.Tasks.Task.FromResult(MapToDTO(schedule));
        }

        public async Task<Schedule> CreateScheduleAsync(ScheduleDTO scheduleDto, string? userId = null)
        {
            var schedule = new Schedule
            {
                Name = scheduleDto.Name,
                Description = scheduleDto.Description,
                TotalDays = scheduleDto.TotalDays,
                UserId = userId,
                schedule = new List<Model.Task>()
            };

            _repository.AddSchedule(schedule);

            // Add tasks to the schedule if provided
            if (scheduleDto.Tasks != null && scheduleDto.Tasks.Any())
            {
                foreach (var taskDto in scheduleDto.Tasks)
                {
                    var task = await CreateTaskFromDTOAsync(taskDto);
                    _repository.AddTaskToSchedule(schedule.ID, task);
                }
            }

            return schedule;
        }

        public async Task<Schedule?> UpdateScheduleAsync(Guid scheduleId, ScheduleDTO scheduleDto, string? userId = null)
        {
            // Get the actual Schedule entity
            var schedule = _repository.GetScheduleById(scheduleId);

            if (schedule == null || (!string.IsNullOrEmpty(userId) && schedule.UserId != userId))
            {
                return null;
            }

            // Update basic properties
            schedule.Name = scheduleDto.Name;
            schedule.Description = scheduleDto.Description;
            schedule.TotalDays = scheduleDto.TotalDays;

            // Update tasks if provided
            if (scheduleDto.Tasks != null)
            {
                // Store existing tasks to later check which ones are removed
                var existingTasks = new List<Model.Task>(schedule.schedule);
                schedule.schedule.Clear();

                // Process each task in the DTO
                foreach (var taskDto in scheduleDto.Tasks)
                {
                    if (!string.IsNullOrEmpty(taskDto.Id) && Guid.TryParse(taskDto.Id, out var taskId))
                    {
                        // Existing task - update it
                        var existingTask = _repository.GetTaskById(taskId);
                        if (existingTask != null)
                        {
                            UpdateTaskFromDTO(existingTask, taskDto);
                            _repository.UpdateTask(existingTask);
                            schedule.schedule.Add(existingTask);
                        }
                        else
                        {
                            // Task not found, create a new one
                            var newTask = await CreateTaskFromDTOAsync(taskDto);
                            schedule.schedule.Add(newTask);
                        }
                    }
                    else
                    {
                        // Create new task
                        var newTask = await CreateTaskFromDTOAsync(taskDto);
                        schedule.schedule.Add(newTask);
                    }
                }

                // Clean up any tasks that are no longer in the schedule
                foreach (var removedTask in existingTasks.Where(
                    t => !schedule.schedule.Any(st => st.Id == t.Id)))
                {
                    _repository.DeleteTask(removedTask.Id);
                }
            }

            _repository.UpdateSchedule(schedule);
            return schedule;
        }

        public async Task<bool> AddTaskToScheduleAsync(Guid scheduleID, TaskDTO taskDto, string? userId = null)
        {
            // Get the actual Schedule entity
            var schedule = _repository.GetScheduleById(scheduleID);

            if (schedule == null || (!string.IsNullOrEmpty(userId) && schedule.UserId != userId))
            {
                return false;
            }

            // Create and add the task
            var newTask = await CreateTaskFromDTOAsync(taskDto);
            return _repository.AddTaskToSchedule(scheduleID, newTask);
        }

        public async Task<bool> DeleteScheduleAsync(Guid scheduleId, string? userId = null)
        {
            var schedule = _repository.GetScheduleById(scheduleId);

            if (schedule == null || (!string.IsNullOrEmpty(userId) && schedule.UserId != userId))
            {
                return false;
            }

            // Delete the schedule from the repository
            return await System.Threading.Tasks.Task.FromResult(_repository.DeleteSchedule(scheduleId));
        }

        private ScheduleDTO MapToDTO(Schedule schedule)
        {
            return new ScheduleDTO
            {
                Id = schedule.ID.ToString(),
                Name = schedule.Name,
                Description = schedule.Description,
                TotalDays = schedule.TotalDays,
                Tasks = schedule.schedule.Select(t => new TaskDTO
                {
                    Id = t.Id.ToString(),
                    Name = t.Name,
                    Description = t.Description,
                    DurationHours = t.DurationHours,
                    Type = t.Type,
                    Status = t.Status,
                    ScheduledDay = t.ScheduledDay,
                    ScheduledStartTime = t.ScheduledStartTime?.ToString("o"),
                    ScheduledEndTime = t.ScheduledEndTime?.ToString("o")
                }).ToList()
            };
        }

        private async Task<Model.Task> CreateTaskFromDTOAsync(TaskDTO taskDto)
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

        private void UpdateTaskFromDTO(Model.Task task, TaskDTO taskDto)
        {
            task.Name = taskDto.Name;
            task.Description = taskDto.Description;
            task.DurationHours = taskDto.DurationHours;
            task.Type = taskDto.Type;
            task.Status = taskDto.Status;
            task.ScheduledStartTime = !string.IsNullOrEmpty(taskDto.ScheduledStartTime) ?
                DateTime.Parse(taskDto.ScheduledStartTime) : null;
            task.ScheduledEndTime = !string.IsNullOrEmpty(taskDto.ScheduledEndTime) ?
                DateTime.Parse(taskDto.ScheduledEndTime) : null;
            task.ScheduledDay = taskDto.ScheduledDay;
        }
    }
}