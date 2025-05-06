using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.OpenApi.Models;
using ScheduleAPI.Data;
using ScheduleAPI.Interfaces;
using ScheduleAPI.Middleware; // Your custom middleware
using ScheduleAPI.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Schedule API", Version = "v1" });

    // Add JWT Authentication
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// --- Start: Standard Authentication Configuration ---

// Retrieve JWT settings from configuration
var jwtSettings = builder.Configuration.GetSection("Jwt").Get<JwtSettings>(); // **Changed to match "Jwt" section**

// Add Authentication
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        // Use the Secret from your "Jwt" section
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Secret)),
        ValidateIssuer = true,
        ValidIssuer = jwtSettings.Issuer, // Use the Issuer from your "Jwt" section
        ValidateAudience = true,
        ValidAudience = jwtSettings.Audience, // Use the Audience from your "Jwt" section
        ValidateLifetime = true, // Validate token expiry
        ClockSkew = TimeSpan.Zero // Amount of leeway accepted in the expiration time
    };

    // Optional: Configure events to hook into the authentication process
    // options.Events = new JwtBearerEvents
    // {
    //     OnTokenValidated = context =>
    //     {
    //         // You can add custom logic here after a token is validated
    //         return Task.CompletedTask;
    //     },
    //     OnAuthenticationFailed = context =>
    //     {
    //         // Handle authentication failures
    //         return Task.CompletedTask;
    //     }
    // };
});

// --- End: Standard Authentication Configuration ---


builder.Services.AddSingleton<InMemory>();
builder.Services.AddScoped<IScheduleService, ScheduleService>();
builder.Services.AddScoped<ScheduleGenerationService>();
builder.Services.AddScoped<AuthService>(); // Your AuthService might still be used for token generation
builder.Services.AddScoped<IRepository, InMemory>();
builder.Services.AddScoped<ITaskService, TaskService>();

// Note: Configuration for JWT is now read above using GetSection("Jwt")
// builder.Configuration.AddJsonFile("appsettings.json", optional: false); // This line is not needed here as it's done by default by CreateBuilder

var app = builder.Build();


// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage(); // Keep this for detailed errors
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors();

// IMPORTANT: Authentication middleware must be BEFORE Authorization middleware
app.UseAuthentication(); // **Crucial for the standard [Authorize] attribute**

// Re-evaluate if you still need your custom middleware.
// If its only purpose was token validation, it's now redundant.
// If it does something else (e.g., specific claim processing or logging *before* standard auth),
// consider its placement carefully. Placing it after UseAuthentication might make more sense
// if it needs the authenticated user principal.
app.UseJwtMiddleware(); // Your custom middleware

app.UseAuthorization(); // **Requires Authentication middleware to be placed before it**

app.MapControllers();

app.Run();

// You'll need a class to hold your JWT settings from appsettings.json
public class JwtSettings
{
    public string Secret { get; set; }
    public string Issuer { get; set; }
    public string Audience { get; set; }
}