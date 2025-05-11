import { config } from './config.js';
import { utils } from './common.js';

// API Service
export const api = {
    async request(endpoint, method = 'GET', data = null) {
        utils.showLoading();

        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        // Always include the static token
        if (config.token) {
            headers['Authorization'] = `Bearer ${config.token}`;
        }

        const requestConfig = {
            method,
            headers,
            //credentials: 'include' // Use 'include' if your API requires cookies/credentials
        };

        if (data) {
            requestConfig.body = JSON.stringify(data);
        }

        // Log request details for debugging
        console.log(`API Request: ${method} ${config.apiBaseUrl}${endpoint}`, { 
            headers: requestConfig.headers,
            data: data ? data : 'No data'
        });

        try {
            const response = await fetch(`${config.apiBaseUrl}${endpoint}`, requestConfig);
            const contentType = response.headers.get('content-type');

            // Log response status and headers for debugging
            console.log(`API Response: ${response.status} ${response.statusText}`, {
                url: response.url,
                headers: Object.fromEntries([...response.headers.entries()])
            });

            if (!response.ok) {
                let errorMessage;
                if (response.status === 405) {
                    // Special handling for Method Not Allowed
                    errorMessage = `Method ${method} not allowed for endpoint ${endpoint}. Check API documentation for correct methods.`;
                    // Try to get allowed methods from header
                    const allowedMethods = response.headers.get('Allow');
                    if (allowedMethods) {
                        errorMessage += ` Allowed methods: ${allowedMethods}`;
                    }
                    
                    // If this is a POST that's not allowed, we could try to fall back to PUT
                    if (method === 'POST' && endpoint === 'Schedules') {
                        console.warn('Attempting fallback from POST to PUT for schedule creation...');
                        // Check if we should try a fallback approach here
                    }
                } else if (contentType && contentType.includes('application/json')) {
                    const errorData = await response.json();
                    console.error('API error response data:', errorData);
                    errorMessage = errorData.message || errorData.title || `Server error: ${response.status}`;
                } else {
                    // Attempt to read response text for non-JSON errors
                    const errorText = await response.text();
                    console.error('API error response text:', errorText);
                    errorMessage = errorText || `Server error: ${response.status}`;
                }
                throw new Error(errorMessage);
            }

            if (response.status === 204) {
                return null;
            }

            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }

            return null; // Handle cases where the response has no content type but is OK

        } catch (error) {
            console.error('API request failed:', error);
            utils.showToast(`API request failed: ${error.message}`, 'danger');
            throw error;
        } finally {
            utils.hideLoading();
        }
    },

    // Authentication endpoints (Placeholder - not used with static token)
    async register(userData) {
        // This would typically call POST /api/Auth/register
        console.log('Register called (placeholder)');
        utils.showToast('Registration is not enabled in this demo', 'info');
        return Promise.resolve(null); // Resolve immediately as a placeholder
    },

    async login(credentials) {
        // This would typically call POST /api/Auth/login
        console.log('Login called (placeholder)');
        utils.showToast('Login is not enabled in this demo', 'info');
        return Promise.resolve({ token: config.token }); // Return static token immediately
    },

    // Schedule endpoints
    async getSchedules() {
        return this.request('Schedules');
    },

    async getScheduleById(id) {
        return this.request(`Schedules/${id}`);
    },

    async createSchedule(scheduleData) {
        try {
            console.log('API createSchedule called with data:', scheduleData);
            // Use the generate endpoint instead, as that's the only POST endpoint for schedules
            return this.request('Schedules/generate', 'POST', scheduleData);
        } catch (error) {
            console.error('Error creating schedule:', error);
            throw error;
        }
    },

    async updateSchedule(id, scheduleData) {
        return this.request(`Schedules/${id}`, 'PUT', scheduleData);
    },

    async addTaskToSchedule(id, task){
        return this.request(`Schedules/${id}/add-to-schedule`, 'POST', task);
    },

    async deleteSchedule(id) {
        return this.request(`Schedules/${id}`, 'DELETE');
    },

    async generateSchedule(generationData) {
        // Both createSchedule and generateSchedule use the same endpoint
        return this.createSchedule(generationData);
    },

    // Task endpoints
    async getTasks() {
        // Note: API readme suggests GET /api/Task, but tasks are likely retrieved via schedule details
        // This function might not be needed if tasks are always loaded with their parent schedule.
        console.warn("api.getTasks called - this endpoint might not be necessary if tasks are loaded with schedules.");
        return this.request('Task');
    },

    async getTaskById(id) {
        // Note: API readme suggests GET /api/Task/{id}, but tasks are likely retrieved via schedule details
        // This function might not be needed if tasks are always loaded with their parent schedule.
        console.warn("api.getTaskById called - this endpoint might not be necessary if tasks are loaded with schedules.");
        return this.request(`Task/${id}`);
    },

    async createTask(taskData) {
    const scheduleId = taskData.scheduleId;
    
    if (!scheduleId) {
        console.error('Cannot create task: No scheduleId provided');
        throw new Error('Schedule ID is required to create a task');
    }
    
    // Use the dedicated endpoint for adding tasks to a schedule
    return this.request(`Schedules/${scheduleId}/add-to-schedule`, 'POST', taskData);
    },

    async updateTask(id, taskData) {
        // API readme suggests PUT /api/Task/{id}
        return this.request(`Task/${id}`, 'PUT', taskData);
    },

    async deleteTask(id) {
        // API readme suggests DELETE /api/Task/{id}
        return this.request(`Task/${id}`, 'DELETE');
    }
};