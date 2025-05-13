using ScheduleAPI.Data;
using ScheduleAPI.Interfaces;
using ScheduleAPI.Model;

namespace ScheduleAPI.Services
{
    public class ScheduleGenerationService : IScheduleGenerationService
    {
        private readonly IRepository _repository;

        /// <summary>
        /// Initializes a new instance of the ScheduleGenerationService
        /// </summary>
        /// <param name="repository">Repository for data operations</param>
        public ScheduleGenerationService(IRepository repository)
        {
            _repository = repository;
        }

        /// <summary>
        /// Generate a balanced schedule based on provided tasks and constraints
        /// </summary>
        /// <param name="generateDto">Schedule generation parameters</param>
        /// <param name="userId">Optional user ID</param>
        /// <returns>A generated schedule with optimally distributed tasks</returns>
        public async Task<Schedule> GenerateScheduleAsync(GenerateScheduleDTO generateDto, string? userId = null)
        {
            // Delegate schedule generation to the repository
            var schedule = _repository.GenerateSchedule(generateDto, userId ?? "01");

            // Return the schedule asynchronously (even though generation is synchronous)
            return await System.Threading.Tasks.Task.FromResult(schedule);
        }
    }
}