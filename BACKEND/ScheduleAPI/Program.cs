using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using ScheduleAPI.Data;
using ScheduleAPI.Interfaces;
using ScheduleAPI.Services;
using System.Reflection;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    options.JsonSerializerOptions.PropertyNamingPolicy = null;
    options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.Preserve;
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Schedule API", Version = "v1" });
});

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Register services (with proper DI order)
// First register the repository (data access layer)
builder.Services.AddSingleton<IRepository, InMemory>();

// Then register the services that depend on the repository
builder.Services.AddScoped<IScheduleService, ScheduleService>();
builder.Services.AddScoped<ScheduleService>();
builder.Services.AddScoped<ITaskService, TaskService>();
builder.Services.AddScoped<TaskService>();
builder.Services.AddScoped<IScheduleGenerationService, ScheduleGenerationService>();
builder.Services.AddScoped<ScheduleGenerationService>();
builder.Services.AddScoped<AuthService>();

// Pre-populate the repository with a default user
var serviceProvider = builder.Services.BuildServiceProvider();
var repository = serviceProvider.GetRequiredService<IRepository>();

// Add default user if it doesn't exist already
if (repository.GetUserByUsername("admin") == null)
{
    repository.AddUser(new ScheduleAPI.Model.User
    {
        Id = "01", // Fixed user ID for testing
        Username = "admin",
        Email = "admin@example.com",
        passwordHash = "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918" // admin
    });
}

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.UseHttpsRedirection();

// Authentication and Authorization middleware are commented out
// app.UseAuthentication();
// app.UseAuthorization();

app.MapControllers();

app.Run();