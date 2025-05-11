using ScheduleAPI.Model;

namespace ScheduleAPI.Interfaces
{
    /// <summary>
    /// Interface for data access operations
    /// </summary>
    public interface IRepository
    {
        /// <summary>
        /// Get all schedules
        /// </summary>
        /// <returns>List of schedules</returns>
        List<Schedule> GetAllSchedules();

        /// <summary>
        /// Get schedules filtered by user ID
        /// </summary>
        /// <param name="userId">User ID</param>
        /// <returns>List of schedules</returns>
        List<Schedule> GetSchedulesByUserId(string userId);

        /// <summary>
        /// Get a schedule by ID
        /// </summary>
        /// <param name="scheduleId">Schedule ID</param>
        /// <returns>Schedule if found, null otherwise</returns>
        Schedule? GetScheduleById(Guid scheduleId);

        /// <summary>
        /// Add a new schedule
        /// </summary>
        /// <param name="schedule">Schedule to add</param>
        void AddSchedule(Schedule schedule);

        /// <summary>
        /// Update an existing schedule
        /// </summary>
        /// <param name="schedule">Schedule to update</param>
        /// <returns>True if updated, false otherwise</returns>
        bool UpdateSchedule(Schedule schedule);

        /// <summary>
        /// Delete a schedule
        /// </summary>
        /// <param name="scheduleId">Schedule ID</param>
        /// <returns>True if deleted, false otherwise</returns>
        bool DeleteSchedule(Guid scheduleId);

        /// <summary>
        /// Get all tasks
        /// </summary>
        /// <returns>List of tasks</returns>
        List<Model.Task> GetAllTasks();

        /// <summary>
        /// Get a task by ID
        /// </summary>
        /// <param name="taskId">Task ID</param>
        /// <returns>Task if found, null otherwise</returns>
        Model.Task? GetTaskById(Guid taskId);

        /// <summary>
        /// Add a new task
        /// </summary>
        /// <param name="task">Task to add</param>
        void AddTask(Model.Task task);

        /// <summary>
        /// Update an existing task
        /// </summary>
        /// <param name="task">Task to update</param>
        /// <returns>True if updated, false otherwise</returns>
        bool UpdateTask(Model.Task task);

        /// <summary>
        /// Delete a task
        /// </summary>
        /// <param name="taskId">Task ID</param>
        /// <returns>True if deleted, false otherwise</returns>
        bool DeleteTask(Guid taskId);

        /// <summary>
        /// Add a task to a schedule
        /// </summary>
        /// <param name="scheduleId">Schedule ID</param>
        /// <param name="taskId">Task ID</param>
        /// <returns>True if added, false otherwise</returns>
        bool AddTaskToSchedule(Guid scheduleId, Guid taskId);

        /// <summary>
        /// Remove a task from a schedule
        /// </summary>
        /// <param name="scheduleId">Schedule ID</param>
        /// <param name="taskId">Task ID</param>
        /// <returns>True if removed, false otherwise</returns>
        bool RemoveTaskFromSchedule(Guid scheduleId, Guid taskId);
    }
}