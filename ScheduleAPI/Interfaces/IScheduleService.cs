using ScheduleAPI.Data;
using ScheduleAPI.Model;

namespace ScheduleAPI.Interfaces
{
    /// <summary>
    /// Interface for managing schedules
    /// </summary>
    public interface IScheduleService
    {
        /// <summary>
        /// Get all schedules, optionally filtered by user ID
        /// </summary>
        /// <param name="userId">Optional user ID filter</param>
        /// <returns>List of schedules</returns>
        Task<List<Schedule>> GetAllSchedulesAsync(string? userId = null);

        /// <summary>
        /// Get a schedule by ID
        /// </summary>
        /// <param name="scheduleId">Schedule ID</param>
        /// <param name="userId">Optional user ID for authorization</param>
        /// <returns>Schedule if found, null otherwise</returns>
        Task<Schedule?> GetScheduleByIdAsync(Guid scheduleId, string? userId = null);

        /// <summary>
        /// Create a new schedule
        /// </summary>
        /// <param name="scheduleDto">Schedule data</param>
        /// <param name="userId">User ID</param>
        /// <returns>Created schedule</returns>
        Task<Schedule> CreateScheduleAsync(ScheduleDTO scheduleDto, string? userId = null);

        /// <summary>
        /// Update an existing schedule
        /// </summary>
        /// <param name="scheduleId">Schedule ID</param>
        /// <param name="scheduleDto">Updated schedule data</param>
        /// <param name="userId">Optional user ID for authorization</param>
        /// <returns>Updated schedule if found, null otherwise</returns>
        Task<Schedule?> UpdateScheduleAsync(Guid scheduleId, ScheduleDTO scheduleDto, string? userId = null);

        /// <summary>
        /// Delete a schedule by ID
        /// </summary>
        /// <param name="scheduleId">Schedule ID</param>
        /// <param name="userId">Optional user ID for authorization</param>
        /// <returns>True if deleted, false otherwise</returns>
        Task<bool> DeleteScheduleAsync(Guid scheduleId, string? userId = null);
    }
}