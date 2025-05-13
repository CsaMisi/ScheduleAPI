document.addEventListener('DOMContentLoaded', function() {
    // API endpoint
    const API_URL = 'http://localhost:5173/api';
    
    // Task types mapping
    const taskTypes = [
        'Physical',
        'Mental',
        'FreeTime',
        'Work',
        'Study',
        'Other'
    ];

    // Task status mapping
    const taskStatuses = [
        'NotStarted',
        'InProgress',
        'Completed',
        'OnHold',
        'Cancelled'
    ];
    
    // Store current schedule ID
    let currentScheduleId = null;
    
    // DOM elements
    const taskForm = document.getElementById('taskForm');
    const taskList = document.getElementById('taskList');
    const scheduleForm = document.getElementById('scheduleForm');
    const scheduleTable = document.getElementById('scheduleTable');
    const loadingSpinner = document.getElementById('loadingSpinner');
    
    // Add event listeners
    taskForm.addEventListener('submit', addTask);
    scheduleForm.addEventListener('submit', generateSchedule);
    
    // Add event listener for refresh tasks button if it exists
    const refreshTasksButton = document.getElementById('refreshTasksButton');
    if (refreshTasksButton) {
        refreshTasksButton.addEventListener('click', loadTasks);
    }
    
    // Add event listener for view schedules button if it exists
    const viewSchedulesButton = document.getElementById('viewSchedulesButton');
    if (viewSchedulesButton) {
        viewSchedulesButton.addEventListener('click', async () => {
            const schedules = await loadSchedules();
            showSchedulesList(schedules);
        });
    }
    
    // Initialize by loading tasks from API
    loadTasks();
    
    /**
     * Load all tasks from the API
     */
    async function loadTasks() {
        try {
            const response = await fetch(`${API_URL}/Task`);
            if (!response.ok) {
                throw new Error(`Failed to load tasks: ${response.status} ${response.statusText}`);
            }
            
            const tasksData = await response.json();
            console.log('Tasks data:', tasksData);
            
            // Handle $values property correctly
            const tasks = tasksData.$values || [];
            console.log(tasks)
            updateTaskList(tasks);
        } catch (error) {
            console.error('Error loading tasks:', error);
            // Show a more user-friendly message
            taskList.innerHTML = '<li class="list-group-item text-danger">Nem sikerült betölteni a tevékenységeket. Ellenőrizze, hogy a backend fut-e.</li>';
        }
    }
    
    /**
     * Add a new task to the API
     */
    async function addTask(e) {
        e.preventDefault();
        
        // Get form values
        const name = document.getElementById('taskName').value;
        const description = document.getElementById('taskDescription').value;
        const durationHours = parseInt(document.getElementById('taskDuration').value);
        const type = parseInt(document.getElementById('taskType').value);
        
        // Create task object
        const task = {
            name,
            description,
            durationHours,
            type,
            status: 0 // NotStarted by default
        };
        
        try {
            // Add task via API
            const response = await fetch(`${API_URL}/Task`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(task)
            });
            
            if (!response.ok) {
                throw new Error(`Failed to add task: ${response.status} ${response.statusText}`);
            }
            
            // Reload tasks after adding
            loadTasks();
            
            // Reset form
            taskForm.reset();
            
        } catch (error) {
            console.error('Error adding task:', error);
            alert(`Hiba történt a tevékenység hozzáadása során: ${error.message}`);
        }
    }
    
    /**
     * Delete a task from the API
     */
    async function deleteTask(taskId) {
        try {
            const response = await fetch(`${API_URL}/Task/${taskId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error(`Failed to delete task: ${response.status} ${response.statusText}`);
            }
            
            // Reload tasks after deletion
            loadTasks();
            
        } catch (error) {
            console.error('Error deleting task:', error);
            alert(`Hiba történt a tevékenység törlése során: ${error.message}`);
        }
    }
    
    /**
     * Update the task list display
     */
    function updateTaskList(tasks) {
        taskList.innerHTML = '';
        
        if (!tasks || tasks.length === 0) {
            taskList.innerHTML = '<li class="list-group-item">Nincsenek hozzáadott tevékenységek</li>';
            return;
        }
        
        
        for (let index = 0; index < tasks.length; index++) {
            let task = tasks[index];
            console.log(task)
            const li = document.createElement('li');
            li.className = 'list-group-item task-item';
            
            // Create task info div
            const taskInfo = document.createElement('div');
            taskInfo.innerHTML = `
                <strong>${task.Name}</strong> (${task.DurationHours} óra)
                <span class="badge bg-secondary">${taskTypes[task.Type]}</span>
                ${task.status !== null ? `<span class="badge bg-info">${taskStatuses[task.Status]}</span>` : ''}
                ${task.description ? `<small class="text-muted d-block">${task.Description}</small>` : ''}
            `;
            
            // Create delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-sm btn-danger';
            deleteBtn.textContent = 'Törlés';
            deleteBtn.addEventListener('click', () => deleteTask(task.Id));
            
            // Append elements
            li.appendChild(taskInfo);
            li.appendChild(deleteBtn);
            taskList.appendChild(li);
        };
    }
    
    /**
     * Generate schedule based on tasks and settings
     */
    async function generateSchedule(e) {
        e.preventDefault();
        
        // Get form values
        const name = document.getElementById('scheduleName').value;
        const totalDays = parseInt(document.getElementById('totalDays').value);
        const dayStartHour = parseInt(document.getElementById('dayStartHour').value);
        const dayEndHour = parseInt(document.getElementById('dayEndHour').value);
        const minRestHours = parseInt(document.getElementById('minRestHours').value);
        
        // Show loading spinner
        loadingSpinner.classList.remove('d-none');
        
        try {
            // Get tasks from API first
            const tasksResponse = await fetch(`${API_URL}/Task`);
            if (!tasksResponse.ok) {
                throw new Error(`Failed to load tasks: ${tasksResponse.status} ${tasksResponse.statusText}`);
            }
            
            const tasksData = await tasksResponse.json();
            const tasks = tasksData.$values || [];
            
            // Check if we have tasks
            if (!tasks || tasks.length === 0) {
                alert('Kérem adjon hozzá legalább egy tevékenységet!');
                loadingSpinner.classList.add('d-none');
                return;
            }
            
            // Create schedule data
            const scheduleData = {
                name,
                description: 'Generated schedule',
                totalDays,
                dayStartHour,
                dayEndHour,
                minRestHours,
                tasks: tasks.map(task => ({
                    id: task.Id,
                    name: task.Name,
                    description: task.Description,
                    durationHours: task.DurationHours,
                    type: task.Type,
                    status: task.Status
                }))
            };
            
            // Use the API to generate schedule
            console.log('Sending request to API:', scheduleData);
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
            
            const schedule = await response.json();
            console.log('Received schedule from API:', schedule);
            
            // Store current schedule ID
            currentScheduleId = schedule.ID;
            
            // Display the schedule
            displaySchedule(schedule, dayStartHour, dayEndHour);
            
            // Update UI to show we have a schedule now
            document.getElementById('scheduleSection').classList.remove('d-none');
            
            // Add schedule management buttons
            addScheduleManagementButtons(schedule.ID);
            
        } catch (error) {
            console.error('Error generating schedule:', error);
            alert(`Hiba történt az ütemezés generálása során: ${error.message}. Ellenőrizze, hogy a backend fut-e a http://localhost:5173 címen.`);
        } finally {
            // Hide loading spinner
            loadingSpinner.classList.add('d-none');
        }
    }
    
    /**
     * Load existing schedules
     */
    async function loadSchedules() {
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
    async function loadScheduleById(scheduleId) {
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
     * Add task to an existing schedule
     */
    async function addTaskToSchedule(taskId, scheduleId) {
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
            const updatedSchedule = await response.json();
            return updatedSchedule;
        } catch (error) {
            console.error('Error adding task to schedule:', error);
            return null;
        }
    }
    
    /**
     * Add schedule management buttons to the UI
     */
    function addScheduleManagementButtons(scheduleId) {
        // Remove existing buttons if any
        const existingButtons = document.querySelector('.schedule-buttons');
        if (existingButtons) {
            existingButtons.remove();
        }
        
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'mt-3 d-flex justify-content-between schedule-buttons';
        
        // Add "View Existing Schedules" button
        const viewSchedulesBtn = document.createElement('button');
        viewSchedulesBtn.className = 'btn btn-primary';
        viewSchedulesBtn.textContent = 'Meglévő ütemezések megtekintése';
        viewSchedulesBtn.addEventListener('click', async () => {
            const schedules = await loadSchedules();
            showSchedulesList(schedules);
        });
        
        // Add "Delete This Schedule" button
        const deleteScheduleBtn = document.createElement('button');
        deleteScheduleBtn.className = 'btn btn-danger';
        deleteScheduleBtn.textContent = 'Ütemezés törlése';
        deleteScheduleBtn.addEventListener('click', async () => {
            if (confirm('Biztosan törölni szeretné ezt az ütemezést?')) {
                await deleteSchedule(scheduleId);
                scheduleTable.innerHTML = '';
                document.getElementById('scheduleSection').classList.add('d-none');
                buttonContainer.remove();
            }
        });
        
        buttonContainer.appendChild(viewSchedulesBtn);
        buttonContainer.appendChild(deleteScheduleBtn);
        
        scheduleTable.after(buttonContainer);
    }
    
    /**
     * Delete a schedule from the API
     */
    async function deleteSchedule(scheduleId) {
        try {
            const response = await fetch(`${API_URL}/Schedules/${scheduleId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error(`Failed to delete schedule: ${response.status} ${response.statusText}`);
            }
            
            currentScheduleId = null;
            return true;
        } catch (error) {
            console.error('Error deleting schedule:', error);
            alert(`Hiba történt az ütemezés törlése során: ${error.message}`);
            return false;
        }
    }
    
    /**
     * Show a list of existing schedules
     */
    function showSchedulesList(schedules) {
        if (!schedules || schedules.length === 0) {
            alert('Nincsenek mentett ütemezések.');
            return;
        }
        
        // Create modal with schedules list
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'schedulesModal';
        modal.tabIndex = '-1';
        modal.setAttribute('aria-labelledby', 'schedulesModalLabel');
        modal.setAttribute('aria-hidden', 'true');
        
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="schedulesModalLabel">Mentett ütemezések</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="list-group">
                            ${schedules.map(schedule => `
                                <button type="button" 
                                    class="list-group-item list-group-item-action d-flex justify-content-between align-items-center schedule-item" 
                                    data-schedule-id="${schedule.ID}">
                                    <div>
                                        <strong>${schedule.Name}</strong>
                                        <span class="badge bg-primary rounded-pill ms-2">${schedule.TotalDays} nap</span>
                                        ${schedule.Description ? `<small class="text-muted d-block">${schedule.Description}</small>` : ''}
                                    </div>
                                    <div>
                                        <span class="badge bg-info rounded-pill">${schedule.Schedule ? schedule.Schedule.length : 0} tevékenység</span>
                                    </div>
                                </button>
                            `).join('')}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Bezárás</button>
                    </div>
                </div>
            </div>
        `;
        
        displaySchedule(schedules);

        // Add modal to body
        document.body.appendChild(modal);
        
        // Initialize the modal
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
        
        // Add event listeners to schedule items
        modal.querySelectorAll('.schedule-item').forEach(item => {
            item.addEventListener('click', async () => {
                const scheduleId = item.dataset.scheduleId;
                const schedule = await loadScheduleById(scheduleId);
                
                if (schedule) {
                    bootstrapModal.hide();
                    
                    // Get settings from the schedule or use defaults
                    const dayStartHour = 8; // Default value if not in the schedule
                    const dayEndHour = 22; // Default value if not in the schedule
                    
                    // Update current schedule ID
                    currentScheduleId = scheduleId;
                    
                    // Display the schedule
                    displaySchedule(schedule, dayStartHour, dayEndHour);
                    
                    // Show schedule section
                    document.getElementById('scheduleSection').classList.remove('d-none');
                    
                    // Add management buttons
                    addScheduleManagementButtons(scheduleId);
                } else {
                    alert('Nem sikerült betölteni az ütemezést.');
                }
            });
        });
        
        // Remove modal from DOM after it's hidden
        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
        });

        
    }
    
    /**
     * Display the schedule in a table
     */
    function displaySchedule(schedule, dayStartHour, dayEndHour) {
        console.log('Displaying schedule:', schedule);
        
        // Extract tasks from the schedule
        let tasks = [];
        if (schedule.Tasks && schedule.Tasks.$values) {
            tasks = schedule.Tasks.$values;
        } else if (schedule.Schedule && schedule.Schedule.$values) {
            tasks = schedule.Schedule.$values;
        } else if (Array.isArray(schedule.Tasks)) {
            tasks = schedule.Tasks;
        } else if (Array.isArray(schedule.Schedule)) {
            tasks = schedule.Schedule;
        }
        
        const totalDays = schedule.TotalDays;
        
        // Create table
        const table = document.createElement('table');
        table.className = 'schedule-table table table-bordered';
        
        // Create header row
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        // Add time column header
        const timeHeader = document.createElement('th');
        timeHeader.textContent = 'Idő';
        timeHeader.className = 'time-column';
        headerRow.appendChild(timeHeader);
        
        // Add day columns headers
        for (let day = 1; day <= totalDays; day++) {
            const dayHeader = document.createElement('th');
            dayHeader.textContent = `Nap ${day}`;
            headerRow.appendChild(dayHeader);
        }
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Create table body
        const tbody = document.createElement('tbody');
        
        // Create hour rows
        for (let hour = dayStartHour; hour < dayEndHour; hour++) {
            const hourRow = document.createElement('tr');
            hourRow.className = 'hour-row';
            
            // Add time cell
            const timeCell = document.createElement('td');
            timeCell.className = 'time-column';
            timeCell.textContent = `${hour}:00 - ${hour+1}:00`;
            hourRow.appendChild(timeCell);
            
            // Add empty cells for each day
            for (let day = 1; day <= totalDays; day++) {
                const dayCell = document.createElement('td');
                dayCell.className = 'empty-cell';
                dayCell.dataset.day = day;
                dayCell.dataset.hour = hour;
                hourRow.appendChild(dayCell);
            }
            
            tbody.appendChild(hourRow);
        }
        
        table.appendChild(tbody);
        
        // Clear previous schedule
        scheduleTable.innerHTML = '';
        scheduleTable.appendChild(table);
        
        // Fill in tasks
        if (tasks && tasks.length > 0) {
            tasks.forEach(task => {
                if (task.scheduledDay && task.scheduledStartTime && task.scheduledEndTime) {
                    // Parse scheduled times
                    const startTime = new Date(task.scheduledStartTime);
                    const endTime = new Date(task.scheduledEndTime);
                    const startHour = startTime.getHours();
                    const duration = task.durationHours;
                    const day = task.scheduledDay;
                    
                    // Find cell for the task's start time
                    const dayCell = table.querySelector(`td[data-day="${day}"][data-hour="${startHour}"]`);
                    
                    if (dayCell) {
                        // Set task styling
                        dayCell.className = `task-cell task-type-${task.type}`;
                        dayCell.rowSpan = duration; // Merge cells vertically based on duration
                        
                        // Add task content
                        dayCell.innerHTML = `
                            <div class="task-name">${task.name}</div>
                            <div class="task-duration">${duration} óra</div>
                            ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                            ${task.status !== null ? `<div class="task-status badge bg-info">${taskStatuses[task.status]}</div>` : ''}
                        `;
                        
                        // Add click handler for task status updates
                        dayCell.addEventListener('click', () => showTaskUpdateModal(task));
                        
                        // Remove cells that are now covered by the rowspan
                        for (let h = 1; h < duration; h++) {
                            const cellToRemove = table.querySelector(`td[data-day="${day}"][data-hour="${startHour + h}"]`);
                            if (cellToRemove) {
                                cellToRemove.remove();
                            }
                        }
                    }
                }
            });
        }
    }
    
    /**
     * Show a modal to update task status
     */
    function showTaskUpdateModal(task) {
        // Create modal for task update
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'taskUpdateModal';
        modal.tabIndex = '-1';
        modal.setAttribute('aria-labelledby', 'taskUpdateModalLabel');
        modal.setAttribute('aria-hidden', 'true');
        
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="taskUpdateModalLabel">Tevékenység állapot frissítése</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="taskUpdateForm">
                            <div class="mb-3">
                                <label class="form-label">Tevékenység: <strong>${task.name}</strong></label>
                            </div>
                            <div class="mb-3">
                                <label for="taskStatus" class="form-label">Állapot</label>
                                <select class="form-select" id="taskStatus">
                                    ${taskStatuses.map((status, index) => 
                                        `<option value="${index}" ${task.status === index ? 'selected' : ''}>${status}</option>`
                                    ).join('')}
                                </select>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Mégsem</button>
                        <button type="button" class="btn btn-primary" id="updateTaskBtn">Mentés</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to body
        document.body.appendChild(modal);
        
        // Initialize the modal
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
        
        // Handle task update
        document.getElementById('updateTaskBtn').addEventListener('click', async () => {
            const newStatus = parseInt(document.getElementById('taskStatus').value);
            
            // Update task object
            const updatedTask = {
                ...task,
                status: newStatus
            };
            
            try {
                // Update task via API
                const response = await fetch(`${API_URL}/Task/${task.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updatedTask)
                });
                
                if (!response.ok) {
                    throw new Error(`Failed to update task: ${response.status} ${response.statusText}`);
                }
                
                // Close modal
                bootstrapModal.hide();
                
                // If we have a current schedule, reload it
                if (currentScheduleId) {
                    const updatedSchedule = await loadScheduleById(currentScheduleId);
                    if (updatedSchedule) {
                        displaySchedule(updatedSchedule, 8, 22); // Using default values
                    }
                }
                
                // Reload task list
                loadTasks();
                
            } catch (error) {
                console.error('Error updating task:', error);
                alert(`Hiba történt a tevékenység frissítése során: ${error.message}`);
            }
        });
        
        // Remove modal from DOM after it's hidden
        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
        });
    }
});