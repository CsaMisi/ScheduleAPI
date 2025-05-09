using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.TagHelpers.Cache;
using ScheduleAPI.Data;
using ScheduleAPI.Services;

namespace ScheduleAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    //[Authorize]
    public class AuthController : ControllerBase
    {
        private readonly AuthService _authService;
        public AuthController(AuthService authService)
        {
            _authService = authService;
        }

        [AllowAnonymous]
        [HttpPost("register")]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> Register([FromBody] RegisterUserDTO registerDTO)
        {
            if(!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = await _authService.RegisterUserAsync(registerDTO);

            if(user == null) 
                return BadRequest("Username already exists");

            return Ok("Registration Successful");
        }

        [AllowAnonymous]
        [HttpPost("login")]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> Login([FromBody] LoginUserDTO loginDTO)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            var authResponse = await _authService.LoginAsync(loginDTO);
            if (authResponse == null)
                return Unauthorized("Invalid username or password");
            return Ok(authResponse);
        }
    }
}
