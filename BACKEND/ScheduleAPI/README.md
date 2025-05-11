# Schedule API

A .NET 8.0 Web API for managing schedules and tasks with JWT authentication.

## Overview

This API provides functionality for creating and managing schedules and tasks, with support for generating optimized schedules based on user constraints. It includes user authentication and authorization using JWT tokens.

## Features

- JWT-based authentication and authorization
- Schedule management (CRUD operations)
- Task management (CRUD operations)
- Automated schedule generation with customizable constraints
- In-memory data storage (can be extended to use other storage solutions)
- Swagger/OpenAPI documentation

## Architecture

The application follows a service-oriented architecture with clear separation of concerns:

### Services

#### AuthService
- Handles user registration and authentication
- Generates JWT tokens for authentication
- Implements password hashing using SHA256
- Dependencies: `InMemory` database, JWT configuration

#### ScheduleService
- Manages schedule operations (CRUD)
- Handles relationships between schedules and tasks
- Supports user-specific schedule management
- Dependencies: `IRepository`, `ITaskService`

#### TaskService
- Manages task operations (CRUD)
- Handles task assignments to schedules
- Supports filtering tasks by user
- Dependencies: `IRepository`

#### ScheduleGenerationService
- Generates optimized schedules based on input parameters
- Implements intelligent task distribution algorithms
- Supports customizable constraints (day start/end times, rest periods)
- Dependencies: `ITaskService`, `IScheduleService`

### Data Models

#### Schedule
- Contains schedule metadata and task collections
- Properties: ID, Name, Description, TotalDays, Tasks, UserId

#### Task
- Represents individual activities
- Properties: Id, Name, Description, DurationHours, Type, Status, Scheduling information

#### User
- Stores user information
- Properties: Id, Username, Email, PasswordHash

### Enums

#### TaskType
- Physical
- Mental
- FreeTime
- Work
- Study
- Other

#### TaskProgress
- NotStarted
- InProgress
- Completed
- OnHold
- Cancelled

## API Endpoints

### Authentication
- POST `/api/Auth/register` - Register a new user
- POST `/api/Auth/login` - Login and receive JWT token

### Schedules
- GET `/api/Schedules` - Get all schedules (user-specific)
- GET `/api/Schedules/{id}` - Get schedule by ID
- POST `/api/Schedules/generate` - Generate an optimized schedule
- PUT `/api/Schedules/{id}` - Update a schedule
- DELETE `/api/Schedules/{id}` - Delete a schedule

### Tasks
- GET `/api/Task` - Get all tasks (user-specific)
- GET `/api/Task/{id}` - Get task by ID
- POST `/api/Task` - Create a new task
- PUT `/api/Task/{id}` - Update a task
- DELETE `/api/Task/{id}` - Delete a task

## Configuration

### JWT Settings
```json
{
  "Jwt": {
    "Secret": "your-secret-key",
    "Issuer": "ScheduleAPI",
    "Audience": "ScheduleClient"
  }
}
```

## Dependencies

- Microsoft.AspNetCore.Authentication.JwtBearer (8.0.15)
- Swashbuckle.AspNetCore (6.6.2)
- System.IdentityModel.Tokens.Jwt (8.9.0)

## Getting Started

1. Clone the repository
2. Configure the JWT settings in appsettings.json
3. Run the application using `dotnet run`
4. Access the Swagger documentation at `/swagger`

## Security

- JWT authentication for API endpoints
- Password hashing using SHA256
- User-specific data isolation
- Authorization middleware for protected endpoints

## Notes

- Currently uses in-memory storage (InMemory class)
- Can be extended to use permanent storage solutions
- Includes comprehensive interface definitions for future implementations