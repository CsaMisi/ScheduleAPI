using ScheduleAPI.Data;
using ScheduleAPI.Model;

namespace ScheduleAPI.Interfaces
{
    public interface IScheduleGenerationService
    {
        Task<Schedule> GenerateScheduleAsync(GenerateScheduleDTO generateDto, string? userId = null);
    }
}
