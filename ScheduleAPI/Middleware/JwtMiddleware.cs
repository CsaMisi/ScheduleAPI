using ScheduleAPI.Services;

namespace ScheduleAPI.Middleware
{
    public static class JwtMiddlewareExtensions
    {
        public static IApplicationBuilder UseJwtMiddleware(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<JwtMiddleware>();
        }
    }


    public class JwtMiddleware
    {
        private readonly RequestDelegate _next;

        public JwtMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task Invoke(HttpContext context, AuthService authService)
        {
            var token = context.Request.Headers["Authorization"].FirstOrDefault()?.Split(" ").Last();

            if (!string.IsNullOrEmpty(token))
            {
                var userId = authService.ValidateToken(token);
                if (!string.IsNullOrEmpty(userId))
                {
                    // Attach user ID to context for use in controllers
                    context.Items["UserId"] = userId;
                }
            }

            await _next(context);
        }
    }
}
