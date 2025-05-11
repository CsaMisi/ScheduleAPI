using ScheduleAPI.Data;
using ScheduleAPI.Interfaces;
using ScheduleAPI.Model;
using System.Reflection;

namespace ScheduleAPI.Services
{
    public class ScheduleService : IScheduleService
    {
        private readonly IRepository _repository;
        private readonly ITaskService _taskService;

        public ScheduleService(IRepository repository, ITaskService taskService)
        {
            _repository = repository;
            _taskService = taskService;
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
                    await _taskService.AddTaskToScheduleAsync(taskDto, userId ?? string.Empty, schedule.ID);
                }
            }

            return schedule;
        }

        public async Task<Schedule?> UpdateScheduleAsync(Guid scheduleId, ScheduleDTO scheduleDto, string? userId = null)
        {
            var schedule = await GetScheduleByIdAsync(scheduleId, userId);

            if (schedule == null)
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
                // Clear existing tasks from the schedule
                var existingTasks = new List<Model.Task>(schedule.);
                schedule.schedule.Clear();

                // Process each task in the DTO
                foreach (var taskDto in scheduleDto.Tasks)
                {
                    // If task has ID, try to update it
                    if (!string.IsNullOrEmpty(taskDto.Id) && Guid.TryParse(taskDto.Id, out var taskId))
                    {
                        var updated = await _taskService.UpdateTaskAsync(taskId, userId ?? string.Empty, taskDto);
                        if (updated)
                        {
                            var task = await _taskService.GetTaskByIdAsync(taskId, userId ?? string.Empty);
                            if (task != null)
                            {
                                schedule.schedule.Add(task);
                            }
                        }
                        else
                        {
                            // If update fails, create a new task
                            var task = await _taskService.CreateTaskAsync(taskDto, userId ?? string.Empty);
                            schedule.schedule.Add(task);
                        }
                    }
                    else
                    {
                        // Create new task
                        var task = await _taskService.CreateTaskAsync(taskDto, userId ?? string.Empty);
                        schedule.schedule.Add(task);
                    }
                }

                // Clean up any tasks that are no longer in the schedule
                foreach (var removedTask in existingTasks.Where(
                    t => !schedule.schedule.Any(st => st.Id == t.Id)))
                {
                    await _taskService.DeleteTaskAsync(removedTask.Id, userId ?? string.Empty);
                }
            }

            _repository.UpdateSchedule(schedule);
            return schedule;
        }

        public async Task<bool> AddTaskToScheduleAsync(Guid scheduleID, TaskDTO task, string? userId = null)
        {
            var schedule = await GetScheduleByIdAsync(scheduleID, userId);
            if (schedule == null)
            {
                return false;
            }
            var newTask = await _taskService.CreateTaskAsync(task, userId ?? string.Empty);
            schedule.schedule.Add(newTask);
            return await System.Threading.Tasks.Task.FromResult(_repository.UpdateSchedule(schedule));
        }

        public async Task<bool> DeleteScheduleAsync(Guid scheduleId, string? userId = null)
        {
            var schedule = await GetScheduleByIdAsync(scheduleId, userId);

            if (schedule == null)
            {
                return false;
            }

            // Delete all tasks in the schedule
            foreach (var task in schedule.schedule.ToList())
            {
                await _taskService.DeleteTaskAsync(task.Id, userId ?? string.Empty);
            }

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
    }
}
