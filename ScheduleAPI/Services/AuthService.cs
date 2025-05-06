using Microsoft.IdentityModel.Tokens;
using ScheduleAPI.Data;
using ScheduleAPI.Model;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace ScheduleAPI.Services
{
    public class AuthService
    {
        private readonly InMemory _database;
        private readonly string _jwtSecret;
        private readonly string _jwtIssuer; 
        private readonly string _jwtAudience; 


        public AuthService(InMemory database, IConfiguration configuration)
        {
            _database = database;
            // Fallback values are okay here, but ensure they match appsettings if possible
            _jwtSecret = configuration["Jwt:Secret"] ?? "thisthinghastobe32longsoheresthe";
            _jwtIssuer = configuration["Jwt:Issuer"] ?? "ScheduleAPI";
            _jwtAudience = configuration["Jwt:Audience"] ?? "ScheduleClient"; 
        }

        public async Task<User?> RegisterUserAsync(RegisterUserDTO registerDto)
        {
            // Check if username already exists
            if (_database.Users.Any(u => u.Username == registerDto.Username))
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

            _database.Users.Add(user);
            return await System.Threading.Tasks.Task.FromResult(user);
        }

        public async Task<AuthResponseDTO?> LoginAsync(LoginUserDTO loginDto)
        {
            var user = _database.Users.FirstOrDefault(u => u.Username == loginDto.Username);

            if (user == null || !VerifyPassword(loginDto.Password, user.passwordHash))
            {
                return null;
            }

            // Generate JWT token
            var token = GenerateJwtToken(user);

            return await System.Threading.Tasks.Task.FromResult(new AuthResponseDTO
            {
                Token = token,
                Username = user.Username
            });
        }

        public string? ValidateToken(string token)
        {
            if (string.IsNullOrEmpty(token))
            {
                return null;
            }

            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(_jwtSecret);

            try
            {
                tokenHandler.ValidateToken(token, new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = false,
                    ValidateAudience = false,
                    ClockSkew = TimeSpan.Zero
                }, out SecurityToken validatedToken);

                var jwtToken = (JwtSecurityToken)validatedToken;
                var userId = jwtToken.Claims.First(x => x.Type == ClaimTypes.NameIdentifier).Value;

                return userId;
            }
            catch
            {
                return null;
            }
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
                    new Claim(ClaimTypes.Name, user.Username),
                    new Claim(JwtRegisteredClaimNames.Iss, _jwtIssuer),
                    new Claim(JwtRegisteredClaimNames.Aud, _jwtAudience)
                }),
                Expires = DateTime.UtcNow.AddDays(7),
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
        /// I copied this from AI0
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
