using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using ScheduleAPI.Data;
using ScheduleAPI.Services;
using System.Security.Cryptography;

namespace ScheduleAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [AllowAnonymous] // This ensures the endpoints are accessible without authentication
    public class TaskController : ControllerBase
    {
        private readonly TaskService _taskService;

        public TaskController(TaskService taskService)
        {
            _taskService = taskService;
        }

        // GET: api/task
        [HttpGet]
        public async Task<IActionResult> GetAllTasks()
        {
            var userId = "01"; // Fixed user ID for testing without authentication
            var tasks = await _taskService.GetAllTasksAsync(userId);
            return Ok(tasks);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetTask(Guid id)
        {
            var userId = "01"; // Fixed user ID for testing without authentication
            var task = await _taskService.GetTaskByIdAsync(id, userId);
            if (task == null)
                return NotFound("Task not found or you do not have access to it.");
            return Ok(task);
        }

        [HttpPost]
        public async Task<IActionResult> CreateTask([FromBody] TaskDTO taskDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            var userId = "01"; // Fixed user ID for testing without authentication
            var task = await _taskService.CreateTaskAsync(taskDto, userId);
            return CreatedAtAction(nameof(GetTask), new { id = task.Id }, task);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTask(Guid id, [FromBody] TaskDTO taskDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            var userId = "01"; // Fixed user ID for testing without authentication
            var task = await _taskService.UpdateTaskAsync(id, userId, taskDto);
            if (task == null)
                return NotFound("Task not found or you do not have access to it.");
            return Ok(task);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTask(Guid id)
        {
            var userId = "01"; // Fixed user ID for testing without authentication
            var result = await _taskService.DeleteTaskAsync(id, userId);
            if (!result)
                return NotFound("Task not found or you do not have access to it.");
            return NoContent();
        }
    }
}