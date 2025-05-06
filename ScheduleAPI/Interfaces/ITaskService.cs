using ScheduleAPI.Data;
using ScheduleAPI.Model;

namespace ScheduleAPI.Interfaces
{
    /// <summary>
    /// Interface for managing tasks
    /// </summary>
    public interface ITaskService
    {
        /// <summary>
        /// Get all tasks, optionally filtered by user ID
        /// </summary>
        /// <param name="userId">Optional user ID filter</param>
        /// <returns>List of tasks</returns>
        Task<List<Model.Task>> GetAllTasksAsync(string? userId);

        /// <summary>
        /// Get all tasks for a specific schedule
        /// </summary>
        /// <param name="userId">User ID</param>
        /// <param name="scheduleId">Schedule ID</param>
        /// <returns>List of tasks in the schedule</returns>
        Task<List<Model.Task>> GetAllTasksByScheduleAsync(string? userId, Guid scheduleId);

        /// <summary>
        /// Get a task by ID
        /// </summary>
        /// <param name="taskId">Task ID</param>
        /// <param name="userId">User ID for authorization</param>
        /// <returns>Task if found, null otherwise</returns>
        Task<Model.Task?> GetTaskByIdAsync(Guid taskId, string userId);

        /// <summary>
        /// Create a new task
        /// </summary>
        /// <param name="taskDto">Task data</param>
        /// <param name="userId">User ID</param>
        /// <returns>Created task</returns>
        Task<Model.Task> CreateTaskAsync(TaskDTO taskDto, string userId);

        /// <summary>
        /// Add a task to a schedule
        /// </summary>
        /// <param name="taskDto">Task data</param>
        /// <param name="userId">User ID</param>
        /// <param name="scheduleId">Optional schedule ID (default schedule used if not specified)</param>
        /// <returns>True if successful, false otherwise</returns>
        Task<bool> AddTaskToScheduleAsync(TaskDTO taskDto, string userId, Guid? scheduleId = null);

        /// <summary>
        /// Delete a task
        /// </summary>
        /// <param name="taskId">Task ID</param>
        /// <param name="userId">User ID for authorization</param>
        /// <returns>True if deleted, false otherwise</returns>
        Task<bool> DeleteTaskAsync(Guid taskId, string userId);

        /// <summary>
        /// Update an existing task
        /// </summary>
        /// <param name="taskId">Task ID</param>
        /// <param name="userId">User ID for authorization</param>
        /// <param name="taskDto">Updated task data</param>
        /// <returns>True if updated, false otherwise</returns>
        Task<bool> UpdateTaskAsync(Guid taskId, string userId, TaskDTO taskDto);
    }
}