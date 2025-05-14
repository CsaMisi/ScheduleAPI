// API endpoint
const API_URL = 'http://localhost:5173/api';

/**
 * Load all tasks from the API
 */
export async function loadTasks() {
    try {
        const response = await fetch(`${API_URL}/Task`);
        if (!response.ok) {
            throw new Error(`Failed to load tasks: ${response.status} ${response.statusText}`);
        }
        
        const tasksData = await response.json();
        console.log('Tasks data:', tasksData);
        
        // Handle $values property correctly
        return tasksData.$values || [];
    } catch (error) {
        console.error('Error loading tasks:', error);
        throw error; // Re-throw to handle in the UI
    }
}

/**
 * Add a new task to the API
 */
export async function createTask(taskData) {
    try {
        // Add task via API
        const response = await fetch(`${API_URL}/Task`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(taskData)
        });
        
        if (!response.ok) {
            throw new Error(`Failed to add task: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error adding task:', error);
        throw error;
    }
}

/**
 * Delete a task from the API
 */
export async function deleteTask(taskId) {
    try {
        const response = await fetch(`${API_URL}/Task/${taskId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error(`Failed to delete task: ${response.status} ${response.statusText}`);
        }
        
        return true;
    } catch (error) {
        console.error('Error deleting task:', error);
        throw error;
    }
}

/**
 * Update a task in the API
 */
export async function updateTask(taskId, taskData) {
    try {
        const response = await fetch(`${API_URL}/Task/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(taskData)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            throw new Error(`Failed to update task: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error updating task:', error);
        throw error;
    }
}

/**
 * Generate a schedule with the API
 */
export async function generateSchedule(scheduleData) {
    try {
        const response = await fetch(`${API_URL}/Schedules/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(scheduleData)
        });
        
        if (!response.ok) {
            console.error('API Response not OK:', response.status, response.statusText);
            throw new Error(`Failed to generate schedule: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error generating schedule:', error);
        throw error;
    }
}

/**
 * Load existing schedules
 */
export async function loadSchedules() {
    try {
        const response = await fetch(`${API_URL}/Schedules`);
        if (!response.ok) {
            throw new Error(`Failed to load schedules: ${response.status} ${response.statusText}`);
        }
        
        const schedulesData = await response.json();
        console.log('Schedules data:', schedulesData);
        return schedulesData.$values || [];
    } catch (error) {
        console.error('Error loading schedules:', error);
        return [];
    }
}

/**
 * Load a specific schedule by ID
 */
export async function loadScheduleById(scheduleId) {
    try {
        const response = await fetch(`${API_URL}/Schedules/${scheduleId}`);
        if (!response.ok) {
            throw new Error(`Failed to load schedule: ${response.status} ${response.statusText}`);
        }
        
        const scheduleData = await response.json();
        console.log(`Schedule ${scheduleData.Id} data:`, scheduleData);
        return scheduleData;
    } catch (error) {
        console.error(`Error loading schedule ${scheduleId}:`, error);
        return null;
    }
}

/**
 * Delete a schedule from the API
 */
export async function deleteSchedule(scheduleId) {
    try {
        const response = await fetch(`${API_URL}/Schedules/${scheduleId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error(`Failed to delete schedule: ${response.status} ${response.statusText}`);
        }
        
        return true;
    } catch (error) {
        console.error('Error deleting schedule:', error);
        throw error;
    }
}

/**
 * Update a schedule in the API
 */
export async function updateSchedule(scheduleId, scheduleData) {
    try {
        const response = await fetch(`${API_URL}/Schedules/${scheduleId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(scheduleData)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            throw new Error(`Failed to update schedule: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error updating schedule:', error);
        throw error;
    }
}

/**
 * Add task to an existing schedule
 */
export async function addTaskToSchedule(taskId, scheduleId) {
    try {
        // First get the task details
        const taskResponse = await fetch(`${API_URL}/Task/${taskId}`);
        if (!taskResponse.ok) {
            throw new Error(`Failed to load task: ${taskResponse.status} ${taskResponse.statusText}`);
        }
        
        const task = await taskResponse.json();
        
        // Add task to schedule
        const response = await fetch(`${API_URL}/Schedules/${scheduleId}/add-to-schedule`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(task)
        });
        
        if (!response.ok) {
            throw new Error(`Failed to add task to schedule: ${response.status} ${response.statusText}`);
        }
        
        // Return the updated schedule
        return await response.json();
    } catch (error) {
        console.error('Error adding task to schedule:', error);
        return null;
    }
}