using Microsoft.IdentityModel.Tokens;
using ScheduleAPI.Data;
using ScheduleAPI.Interfaces;
using ScheduleAPI.Model;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace ScheduleAPI.Services
{
    public class AuthService
    {
        private readonly IRepository _repository;
        private readonly string _jwtSecret;
        private readonly string _jwtIssuer;
        private readonly string _jwtAudience;

        public AuthService(IRepository repository, IConfiguration configuration)
        {
            _repository = repository;
            // Fallback values are okay here, but ensure they match appsettings if possible
            _jwtSecret = configuration["Jwt:Secret"] ?? "thisthinghastobe32longsoheresthe";
            _jwtIssuer = configuration["Jwt:Issuer"] ?? "ScheduleAPI";
            _jwtAudience = configuration["Jwt:Audience"] ?? "ScheduleClient";
        }

        public async Task<User?> RegisterUserAsync(RegisterUserDTO registerDto)
        {
            // Check if username already exists
            var existingUser = _repository.GetUserByUsername(registerDto.Username);
            if (existingUser != null)
            {
                return null;
            }

            // Hash the password
            string passwordHash = HashPassword(registerDto.Password);

            // Create new user
            var user = new User
            {
                Username = registerDto.Username,
                Email = registerDto.Email,
                passwordHash = passwordHash
            };

            _repository.AddUser(user);
            return await System.Threading.Tasks.Task.FromResult(user);
        }

        public async Task<AuthResponseDTO?> LoginAsync(LoginUserDTO loginDto)
        {
            var user = _repository.GetUserByUsername(loginDto.Username);

            if (user == null || !VerifyPassword(loginDto.Password, user.passwordHash))
            {
                return null;
            }

            // Generate JWT token
            var token = GenerateJwtToken(user);

            return await System.Threading.Tasks.Task.FromResult(new AuthResponseDTO
            {
                Token = token,
                Username = user.Username,
                ExpiresAt = DateTime.UtcNow.AddDays(7)
            });
        }

        private string GenerateJwtToken(User user)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(_jwtSecret);
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, user.Id),
                    new Claim(ClaimTypes.Name, user.Username)
                }),
                Expires = DateTime.UtcNow.AddDays(7),
                Issuer = _jwtIssuer,
                Audience = _jwtAudience,
                SigningCredentials = new SigningCredentials(
                    new SymmetricSecurityKey(key),
                    SecurityAlgorithms.HmacSha256Signature
                )
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        /// <summary>
        /// Generates a SHA256 hash of a given string for secure storage or transmission. The output is a lowercase
        /// hexadecimal representation.
        /// </summary>
        /// <param name="password">The input string that needs to be securely hashed.</param>
        /// <returns>A hexadecimal string representing the hashed value of the input.</returns>
        private string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            return BitConverter.ToString(hashedBytes).Replace("-", "").ToLower();
        }

        private bool VerifyPassword(string password, string hash)
        {
            return HashPassword(password) == hash;
        }
    }
}