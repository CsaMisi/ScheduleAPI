using ScheduleAPI.Common;
using ScheduleAPI.Data;
using ScheduleAPI.Interfaces;
using ScheduleAPI.Model;
using System.Reflection;

namespace ScheduleAPI.Data
{
    public class InMemory : IRepository
    {
        // Default constants for scheduling
        private const int DEFAULT_DAY_START_HOUR = 8;  // 8:00 AM
        private const int DEFAULT_DAY_END_HOUR = 22;   // 10:00 PM
        private const int DEFAULT_MIN_REST_HOURS = 1;  // Minimum rest between activities

        public List<Schedule> Schedules { get; } = new List<Schedule>();
        public List<Model.Task> Tasks { get; } = new List<Model.Task>();
        public List<User> Users { get; } = new List<User>();

        #region Schedule Operations
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

        public Schedule GenerateSchedule(GenerateScheduleDTO generateDto, string userId)
        {
            // Use provided values or defaults
            int dayStartHour = generateDto.DayStartHour ?? DEFAULT_DAY_START_HOUR;
            int dayEndHour = generateDto.DayEndHour ?? DEFAULT_DAY_END_HOUR;
            int minRestHours = generateDto.MinRestHours ?? DEFAULT_MIN_REST_HOURS;

            // Validate input parameters
            ValidateScheduleParameters(dayStartHour, dayEndHour, minRestHours);

            // 1. Create a new schedule
            var schedule = new Schedule
            {
                Name = generateDto.Name,
                Description = generateDto.Description,
                TotalDays = generateDto.TotalDays,
                UserId = userId,
                schedule = new List<Model.Task>()
            };

            // Add the schedule to the repository
            AddSchedule(schedule);

            // 2. Create tasks from the DTOs
            var tasks = new List<Model.Task>();
            
            foreach (var taskDto in generateDto.Tasks)
            {
                Model.Task task;
                if (!string.IsNullOrEmpty(taskDto.Id) 
                    && Guid.TryParse(taskDto.Id, out var id)
                    && GetTaskById(id) != null)
                    task = GetTaskById(id);
                else
                {
                    task = new Model.Task
                    {
                        Name = taskDto.Name,
                        Description = taskDto.Description,
                        DurationHours = taskDto.DurationHours,
                        Type = taskDto.Type,
                        Status = taskDto.Status ?? Enums.TaskProgress.NotStarted
                    };

                    // Add the task to the repository
                    AddTask(task);
                }
                    
                tasks.Add(task);
            }

            // 3. Sort tasks by duration (longest first)
            var sortedTasks = tasks
                .OrderByDescending(t => t.DurationHours)
                .ThenBy(t => (int)t.Type)
                .ToList();

            // 4. Distribute tasks across days while balancing workload
            var tasksByDay = DistributeTasksAcrossDays(sortedTasks, generateDto.TotalDays);

            // 5. Schedule specific time slots for each day
            var scheduledTasks = AssignTimeSlots(
                tasksByDay,
                dayStartHour,
                dayEndHour,
                minRestHours
            );

            // 6. Add tasks to the schedule
            foreach (var task in scheduledTasks)
            {
                schedule.schedule.Add(task);
            }

            // 7. Update the schedule
            UpdateSchedule(schedule);

            return schedule;
        }
        #endregion

        #region Task Operations
        public List<Model.Task> GetAllTasks()
        {
            return Tasks;
        }

        public List<Model.Task> GetTasksByUserId(string userId)
        {
            // Get all schedules for the user
            var schedules = GetSchedulesByUserId(userId);

            // Get unique task IDs from all user schedules
            var userTaskIds = schedules.SelectMany(s => s.schedule).Select(t => t.Id).Distinct().ToList();

            // Return tasks that belong to the user
            return Tasks.Where(t => userTaskIds.Contains(t.Id)).ToList();
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
                schedule.schedule.Add(task);
                return true;
            }
            return false;
        }

        public bool AddTaskToSchedule(Guid scheduleId, Model.Task task)
        {
            var schedule = GetScheduleById(scheduleId);

            if (schedule != null)
            {
                schedule.schedule.Add(task);
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
                return schedule.schedule.Remove(task);
            }
            return false;
        }
        #endregion

        #region User Operations
        public User? GetUserById(string userId)
        {
            return Users.FirstOrDefault(u => u.Id == userId);
        }

        public User? GetUserByUsername(string username)
        {
            return Users.FirstOrDefault(u => u.Username == username);
        }

        public List<User> GetAllUsers()
        {
            return Users;
        }

        public void AddUser(User user)
        {
            Users.Add(user);
        }
        #endregion

        #region Private Helper Methods
        /// <summary>
        /// Validate that schedule parameters make sense
        /// </summary>
        private void ValidateScheduleParameters(int dayStartHour, int dayEndHour, int minRestHours)
        {
            if (dayStartHour < 0 || dayStartHour > 23)
                throw new ArgumentException("Day start hour must be between 0 and 23", nameof(dayStartHour));

            if (dayEndHour < 0 || dayEndHour > 23)
                throw new ArgumentException("Day end hour must be between 0 and 23", nameof(dayEndHour));

            if (dayStartHour > dayEndHour)
                throw new ArgumentException("Day start hour must be before day end hour");

            if (minRestHours < 0 || minRestHours > (dayEndHour - dayStartHour))
                throw new ArgumentException("Minimum rest hours must be non-negative and less than the day length");
        }

        /// <summary>
        /// Distribute tasks across days to balance workload
        /// </summary>
        private List<Model.Task>[] DistributeTasksAcrossDays(List<Model.Task> sortedTasks, int totalDays)
        {
            var dailyWorkload = new int[totalDays];
            var dailyTasks = new List<Model.Task>[totalDays];

            for (int i = 0; i < totalDays; i++)
            {
                dailyTasks[i] = new List<Model.Task>();
            }

            // Distribute tasks to days based on workload balancing
            foreach (var task in sortedTasks)
            {
                // Find day with minimum current workload
                int minWorkloadDay = FindDayWithMinimumWorkload(dailyWorkload);

                // Assign to day with minimum workload
                dailyWorkload[minWorkloadDay] += task.DurationHours;
                task.ScheduledDay = minWorkloadDay + 1; // 1-based days for user-friendliness
                dailyTasks[minWorkloadDay].Add(task);
            }

            return dailyTasks;
        }

        /// <summary>
        /// Find the day with the minimum current workload
        /// </summary>
        private int FindDayWithMinimumWorkload(int[] dailyWorkload)
        {
            int minWorkloadDay = 0;
            for (int i = 1; i < dailyWorkload.Length; i++)
            {
                if (dailyWorkload[i] < dailyWorkload[minWorkloadDay])
                {
                    minWorkloadDay = i;
                }
            }
            return minWorkloadDay;
        }

        /// <summary>
        /// Assign specific time slots to tasks for each day
        /// </summary>
        private List<Model.Task> AssignTimeSlots(
            List<Model.Task>[] tasksByDay,
            int dayStartHour,
            int dayEndHour,
            int minRestHours)
        {
            var allAssignedTasks = new List<Model.Task>();

            for (int day = 0; day < tasksByDay.Length; day++)
            {
                int currentHour = dayStartHour;

                // Sort tasks by type to group similar activities
                var dayTasks = tasksByDay[day].OrderBy(t => (int)t.Type).ToList();

                foreach (var task in dayTasks)
                {
                    // Check if we can fit this task today
                    if (currentHour + task.DurationHours > dayEndHour)
                    {
                        // We can't fit this task today - reset to morning
                        currentHour = dayStartHour;
                    }

                    // Schedule the task
                    var startTime = DateTime.Today.AddDays(day).AddHours(currentHour);
                    var endTime = startTime.AddHours(task.DurationHours);

                    task.ScheduledStartTime = startTime;
                    task.ScheduledEndTime = endTime;

                    // Add task to the list of all assigned tasks
                    allAssignedTasks.Add(task);

                    // Move time forward with rest period
                    currentHour += task.DurationHours + minRestHours;
                }
            }

            return allAssignedTasks;
        }
        #endregion
    }
}