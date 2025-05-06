using ScheduleAPI.Data;
using ScheduleAPI.Model;

namespace ScheduleAPI.Services
{
    public class TaskService
    {
        private readonly InMemory _repository;

        public TaskService(InMemory repository)
        {
            _repository = repository;
        }
        /// <summary>
        /// All of the null handling, and not found and such, will be done at the controller level.
        /// This is because this is a service layer, and the controller layer should handle all of the null handling and not found and such.
        /// Returning null or empty lists is the responsibility of the service layer, while the controller layer should handle the response to the client.
        /// That is to say, returning any http responses in this layer is dumb
        /// </summary>

        //TODO Update, Delete

        //List all
        public async Task<List<Model.Task>> GetAllTasksAsync(string? UserID)
        {
            if (UserID == null)
            {
                return await System.Threading.Tasks.Task.FromResult(_repository.Tasks);
            }

            var schedules = _repository.Schedules.Where(x => x.UserId == UserID).ToList();
            List<Guid> userTaskID = schedules.SelectMany(x => x._schedule).Select(x => x.Id).ToList();

            return await System.Threading.Tasks.Task.FromResult(_repository.Tasks.Where(x => userTaskID.Contains((x.Id))).ToList());
        }

        //List the tasks of a schedule
        public async Task<List<Model.Task>> getAllTasksByScheduleAsync
            (string? UserID, Guid sched)
        {
            if (UserID == null)
            {
                return await System.Threading.Tasks.Task.FromResult(_repository.Tasks);
                //TODO: Handle this case properly
            }
            var schedule = await System.Threading.Tasks.Task.FromResult
                (_repository.Schedules.Where(x => x.UserId == UserID && x.ID == sched).ToList());

            if (schedule == null)
            {
                return await System.Threading.Tasks.Task.FromResult(_repository.Tasks);
            }

            return await System.Threading.Tasks.Task.FromResult
                (schedule.SelectMany(x => x._schedule).ToList());

        }
        //Get task by ID
        public async Task<Model.Task?> GetTaskByIdAsync(Guid id, string UserID)
        {
            var tasks = await GetAllTasksAsync(UserID);
            if (tasks == null)
            {
                return null;
            }
            return await System.Threading.Tasks.Task.FromResult(tasks.FirstOrDefault(x => x.Id == id));
        }

        //Add task to schedule
        public async Task<bool> AddTaskAsync(TaskDTO newTaks, string userid)
        {
#pragma warning disable CS8629 // Nullable value type may be null, handled at Task.cs
            /*var task = new Model.Task
            {
                Id = Guid.NewGuid(),
                Name = newTaks.Name,
                Description = newTaks.Description,
                DurationHours = newTaks.DurationHours,
                Type = newTaks.Type,
                Status = (Common.Enums.TaskProgress)newTaks.Status,
                ScheduledStartTime = newTaks.ScheduledStartTime != null ? DateTime.Parse(newTaks.ScheduledStartTime) : null,
                ScheduledEndTime = newTaks.ScheduledEndTime != null ? DateTime.Parse(newTaks.ScheduledEndTime) : null,
                ScheduledDay = newTaks.ScheduledDay
            };*/
#pragma warning restore CS8629 // Nullable value type may be null.

            var task = await CreateTaskAsync(newTaks);

            // Add the task to the repository
            _repository.Tasks.Add(task);

            // Add the task to the user's schedule
            var schedule = _repository.Schedules.FirstOrDefault(x => x.UserId == userid);
            if (schedule != null)
            {
                schedule._schedule.Add(task);
            }
            else
            {
                // If the user doesn't have a schedule, create one
                var newSchedule = new Schedule
                {
                    // TODO: Use ScheduleService to create a new schedule, and prompt for name
                    UserId = userid,
                    _schedule = new List<Model.Task> { task }
                };
                _repository.Schedules.Add(newSchedule);
            }

            return true;
        }
        //Dekete task from schedule and repository
        public async Task<bool> DeleteTaskAsync(Guid id, string UserID)
        {
            var task = await GetTaskByIdAsync(id, UserID);
            if (task == null)
            {
                return false;
            }
            _repository.Tasks.Remove(task);
            var schedule = _repository.Schedules.FirstOrDefault(x => x.UserId == UserID);
            if (schedule != null)
            {
                schedule._schedule.Remove(task);
            }
            return true;
        }
        //Update task in schedule and repository
        public async Task<bool> UpdateTaskAsync(Guid id, string UserID, TaskDTO updatedTask)
        {
            var task = await GetTaskByIdAsync(id, UserID);
            if (task == null)
            {
                return false;
            }

            var newTask = CreateTaskAsync(updatedTask);

            var index = _repository.Tasks.FindIndex(x => x.Id == task.Id);
            if (index != -1)
            {
                _repository.Tasks[index] = await newTask;
                return true;
            }
            return false;

        }


        private async Task<Model.Task> CreateTaskAsync(TaskDTO newTask)
        {
            var task = new Model.Task
            {
                Id = Guid.NewGuid(),
                Name = newTask.Name,
                Description = newTask.Description,
                DurationHours = newTask.DurationHours,
                Type = newTask.Type,
                Status = (Common.Enums.TaskProgress)newTask.Status,
                ScheduledStartTime = newTask.ScheduledStartTime != null ? DateTime.Parse(newTask.ScheduledStartTime) : null,
                ScheduledEndTime = newTask.ScheduledEndTime != null ? DateTime.Parse(newTask.ScheduledEndTime) : null,
                ScheduledDay = newTask.ScheduledDay
            };
            return await System.Threading.Tasks.Task.FromResult(task);
        }
    }
}
