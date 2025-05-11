using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using ScheduleAPI.Data;
using ScheduleAPI.Interfaces;
using ScheduleAPI.Services;
using System.Security.Cryptography;

namespace ScheduleAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [AllowAnonymous] // This ensures the endpoints are accessible without authentication
    public class SchedulesController : ControllerBase
    {
        private readonly ScheduleService _scheduleService;
        private readonly ScheduleGenerationService _generationService;

        public SchedulesController
            (ScheduleService scheduleService,
            ScheduleGenerationService generationService)
        {
            _scheduleService = scheduleService;
            _generationService = generationService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllSchedules()
        {
            var userId = "01"; // Fixed user ID for testing without authentication
            var schedules = await _scheduleService.GetAllSchedulesAsync(userId);
            return Ok(schedules);
        }

        [HttpGet("{id}")]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetScheduleById(Guid id)
        {
            var userId = "01"; // Fixed user ID for testing without authentication
            var schedule = await _scheduleService.GetScheduleByIdAsync(id, userId);
            if (schedule == null)
                return NotFound("Schedule not found or you do not have access to it.");
            return Ok(schedule);
        }

        [HttpPost("generate")]
        public async Task<IActionResult> GenerateSchedule([FromBody] GenerateScheduleDTO generateDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            var userId = "01"; // Fixed user ID for testing without authentication
            var schedule = await _generationService.GenerateScheduleAsync(generateDto, userId);

            if (schedule == null)
                return BadRequest("Failed to generate schedule.");

            return CreatedAtAction(nameof(GetScheduleById), new { id = schedule.ID }, schedule);
        }

        [HttpPost("{id}/add-to-schedule")]
        public async Task<IActionResult> AddTaskToSchedule([FromBody] TaskDTO taskDto, Guid id)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            var userId = "01"; // Fixed user ID for testing without authentication
            var schedule = await _scheduleService.AddTaskToScheduleAsync(id, taskDto);
            if(schedule == false)
                return NotFound("Schedule not found or you do not have access to it.");
            return NoContent();

        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateSchedule(Guid id, [FromBody] ScheduleDTO scheduleDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            var userId = "01"; // Fixed user ID for testing without authentication
            var schedule = await _scheduleService.UpdateScheduleAsync(id, scheduleDto, userId);
            if (schedule == null)
                return NotFound("Schedule not found or you do not have access to it.");
            return Ok(schedule);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSchedule(Guid id)
        {
            var userId = "01"; // Fixed user ID for testing without authentication
            var schedule = await _scheduleService.DeleteScheduleAsync(id, userId);
            if (!schedule)
                return NotFound("Schedule not found or you do not have access to it.");
            return NoContent();
        }
    }
}