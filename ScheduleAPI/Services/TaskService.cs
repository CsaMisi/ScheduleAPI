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

        //TODO Create, Update, Delete, Get methods for Task, List All, List one by ID, 

        //List all
        public async Task<List<Model.Task>> GetAllTasksAsync(string? UserID)
        {
            if(UserID == null)
            {
                return await System.Threading.Tasks.Task.FromResult(_repository.Tasks);
            }

            var schedules = _repository.Schedules.Where(x => x.UserID == UserID).ToList();
            List<Guid> userTaskID = schedules.SelectMany(x => x._schedule).Select(x => x.Id).ToList();

            return await System.Threading.Tasks.Task.FromResult(_repository.Tasks.Where(x => userTaskID.Contains((x.Id))).ToList());
        }


        //Get task by ID
        public async Task<Model.Task?> GetTaskByIdAsync(Guid id, string UserID)
        {
            var tasks = await GetAllTasksAsync(UserID);
            if(tasks == null)
            {
                return null;
            }
            return await System.Threading.Tasks.Task.FromResult(tasks.FirstOrDefault(x => x.Id == id));
        }

        //Add task to schedule
       
        public async Task<TaskDTO> AddTaskAsync(TaskDTO newTaks, string userid)
        {
#pragma warning disable CS8629 // Nullable value type may be null, handled at Task.cs
            var task = new Model.Task
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

            };
#pragma warning restore CS8629 // Nullable value type may be null.

            // Add the task to the repository
            _repository.Tasks.Add(task);
            // Add the task to the user's schedule
            var schedule = _repository.Schedules.FirstOrDefault(x => x.UserID == userid);
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
                    UserID = userid, 
                    _schedule = new List<Model.Task> { task }
                };
                _repository.Schedules.Add(newSchedule);
            }
            return await System.Threading.Tasks.Task.FromResult(newTaks);
        }

    }
}
