using ScheduleAPI.Data;
using ScheduleAPI.Model;

namespace ScheduleAPI.Interfaces
{
    /// <summary>
    /// Interface for data access and business operations
    /// </summary>
    public interface IRepository
    {
        #region Schedule Operations
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
        /// Generate a schedule based on provided parameters and tasks
        /// </summary>
        /// <param name="generateDto">Generation parameters</param>
        /// <param name="userId">User ID</param>
        /// <returns>Generated schedule</returns>
        Schedule GenerateSchedule(GenerateScheduleDTO generateDto, string userId);
        #endregion

        #region Task Operations
        /// <summary>
        /// Get all tasks
        /// </summary>
        /// <returns>List of tasks</returns>
        List<Model.Task> GetAllTasks();

        /// <summary>
        /// Get tasks filtered by user ID
        /// </summary>
        /// <param name="userId">User ID</param>
        /// <returns>List of tasks for the user</returns>
        List<Model.Task> GetTasksByUserId(string userId);

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
        /// Add a task directly to a schedule
        /// </summary>
        /// <param name="scheduleId">Schedule ID</param>
        /// <param name="task">Task to add</param>
        /// <returns>True if added, false otherwise</returns>
        bool AddTaskToSchedule(Guid scheduleId, Model.Task task);

        /// <summary>
        /// Remove a task from a schedule
        /// </summary>
        /// <param name="scheduleId">Schedule ID</param>
        /// <param name="taskId">Task ID</param>
        /// <returns>True if removed, false otherwise</returns>
        bool RemoveTaskFromSchedule(Guid scheduleId, Guid taskId);
        #endregion

        #region User Operations
        /// <summary>
        /// Get a user by ID
        /// </summary>
        /// <param name="userId">User ID</param>
        /// <returns>User if found, null otherwise</returns>
        User? GetUserById(string userId);

        /// <summary>
        /// Get a user by username
        /// </summary>
        /// <param name="username">Username</param>
        /// <returns>User if found, null otherwise</returns>
        User? GetUserByUsername(string username);

        /// <summary>
        /// Get all users
        /// </summary>
        /// <returns>List of all users</returns>
        List<User> GetAllUsers();

        /// <summary>
        /// Add a user
        /// </summary>
        /// <param name="user">User to add</param>
        void AddUser(User user);
        #endregion
    }
}