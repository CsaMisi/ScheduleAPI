using ScheduleAPI.Data;
using ScheduleAPI.Interfaces;
using ScheduleAPI.Model;

namespace ScheduleAPI.Services
{
    public class ScheduleGenerationService : IScheduleGenerationService
    {
        private readonly ITaskService _taskService;
        private readonly IScheduleService _scheduleService;

        // Default constants for scheduling
        private const int DEFAULT_DAY_START_HOUR = 8;  // 8:00 AM
        private const int DEFAULT_DAY_END_HOUR = 22;   // 10:00 PM
        private const int DEFAULT_MIN_REST_HOURS = 1;  // Minimum rest between activities

        /// <summary>
        /// Initializes a new instance of the ScheduleGenerationService
        /// </summary>
        /// <param name="taskService">Task service</param>
        /// <param name="scheduleService">Schedule service</param>
        public ScheduleGenerationService(ITaskService taskService, IScheduleService scheduleService)
        {
            _taskService = taskService;
            _scheduleService = scheduleService;
        }

        /// <summary>
        /// Generate a balanced schedule based on provided tasks and constraints
        /// </summary>
        /// <param name="generateDto">Schedule generation parameters</param>
        /// <param name="userId">Optional user ID</param>
        /// <returns>A generated schedule with optimally distributed tasks</returns>
        public async Task<Schedule> GenerateScheduleAsync(GenerateScheduleDTO generateDto, string? userId = null)
        {
            // Use provided values or defaults
            int dayStartHour = generateDto.DayStartHour ?? DEFAULT_DAY_START_HOUR;
            int dayEndHour = generateDto.DayEndHour ?? DEFAULT_DAY_END_HOUR;
            int minRestHours = generateDto.MinRestHours ?? DEFAULT_MIN_REST_HOURS;

            // Validate input parameters
            ValidateScheduleParameters(dayStartHour, dayEndHour, minRestHours);

            // 1. Create a new schedule
            var scheduleDto = new ScheduleDTO
            {
                Name = generateDto.Name,
                Description = generateDto.Description,
                TotalDays = generateDto.TotalDays,
                Tasks = new List<TaskDTO>() // Empty initially, will be populated later
            };

            var schedule = await _scheduleService.CreateScheduleAsync(scheduleDto, userId);

            // 2. Sort tasks by duration (longest first)
            var sortedTasks = generateDto.Tasks
                .OrderByDescending(t => t.DurationHours)
                .ThenBy(t => (int)t.Type) // Assuming Type is an enum
                .ToList();

            // 3. Distribute tasks across days while balancing workload
            var tasksByDay = DistributeTasksAcrossDays(sortedTasks, generateDto.TotalDays);

            // 4. Schedule specific time slots for each day
            var assignedTasks = await AssignTimeSlots(
                tasksByDay,
                schedule.ID,
                userId,
                dayStartHour,
                dayEndHour,
                minRestHours
            );

            // 5. Update the schedule with all tasks
            var updatedScheduleDto = new ScheduleDTO
            {
                Name = schedule.Name,
                Description = schedule.Description,
                TotalDays = schedule.TotalDays,
                Tasks = assignedTasks
            };

            await _scheduleService.UpdateScheduleAsync(schedule.ID, updatedScheduleDto, userId);

            // Return the updated schedule
            return await _scheduleService.GetScheduleByIdAsync(schedule.ID, userId) ?? schedule;
        }

        /// <summary>
        /// Validate that schedule parameters make sense
        /// </summary>
        private void ValidateScheduleParameters(int dayStartHour, int dayEndHour, int minRestHours)
        {
            if (dayStartHour < 0 || dayStartHour > 23)
                throw new ArgumentException("Day start hour must be between 0 and 23", nameof(dayStartHour));

            if (dayEndHour < 0 || dayEndHour > 23)
                throw new ArgumentException("Day end hour must be between 0 and 23", nameof(dayEndHour));

            if (dayStartHour >= dayEndHour)
                throw new ArgumentException("Day start hour must be before day end hour");

            if (minRestHours < 0 || minRestHours > (dayEndHour - dayStartHour))
                throw new ArgumentException("Minimum rest hours must be non-negative and less than the day length");
        }

        /// <summary>
        /// Distribute tasks across days to balance workload
        /// </summary>
        private List<TaskDTO>[] DistributeTasksAcrossDays(List<TaskDTO> sortedTasks, int totalDays)
        {
            var dailyWorkload = new int[totalDays];
            var dailyTasks = new List<TaskDTO>[totalDays];

            for (int i = 0; i < totalDays; i++)
            {
                dailyTasks[i] = new List<TaskDTO>();
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
        private async Task<List<TaskDTO>> AssignTimeSlots(
            List<TaskDTO>[] tasksByDay,
            Guid scheduleId,
            string? userId,
            int dayStartHour,
            int dayEndHour,
            int minRestHours)
        {
            var allAssignedTasks = new List<TaskDTO>();

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

                    task.ScheduledStartTime = startTime.ToString("o");
                    task.ScheduledEndTime = endTime.ToString("o");

                    // Simulate an asynchronous operation (e.g., saving to a database)
                    await System.Threading.Tasks.Task.Delay(1);

                    // Add task to the list of all assigned tasks
                    allAssignedTasks.Add(task);

                    // Move time forward with rest period
                    currentHour += task.DurationHours + minRestHours;
                }
            }

            return allAssignedTasks;
        }
    }
}
