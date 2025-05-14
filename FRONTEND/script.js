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
        
        // Create button container
        const btnContainer = document.createElement('div');
        btnContainer.className = 'task-buttons';
        
        // Create edit button
        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-sm btn-secondary me-2';
        editBtn.textContent = 'Szerkesztés';
        editBtn.addEventListener('click', () => showTaskUpdateModal(task));
        
        // Create delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-sm btn-danger';
        deleteBtn.textContent = 'Törlés';
        deleteBtn.addEventListener('click', () => deleteTask(task.Id));
        
        // Append buttons
        btnContainer.appendChild(editBtn);
        btnContainer.appendChild(deleteBtn);
        
        // Append elements
        li.appendChild(taskInfo);
        li.appendChild(btnContainer);
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
    
    // Update the static list below the button
    const schedulesList = document.getElementById('schedulesList');
    if (schedulesList) {
        schedulesList.innerHTML = '';
        schedules.forEach(schedule => {
            // Get task count using the same logic as displaySchedule
            let taskCount = 0;
            if (schedule.schedule && schedule.schedule.$values) {
                taskCount = schedule.schedule.$values.length;
            } else if (schedule.schedule && Array.isArray(schedule.schedule)) {
                taskCount = schedule.schedule.length;
            } else if (schedule.tasks && schedule.tasks.$values) {
                taskCount = schedule.tasks.$values.length;
            } else if (schedule.Tasks && schedule.Tasks.$values) {
                taskCount = schedule.Tasks.$values.length;
            } else if (schedule.Schedule && schedule.Schedule.$values) {
                taskCount = schedule.Schedule.$values.length;
            }
            
            const listItem = document.createElement('li');
            listItem.className = 'list-group-item d-flex justify-content-between align-items-center';
            listItem.innerHTML = `
                <div>
                    <strong>${schedule.Name}</strong>
                    <span class="badge bg-primary rounded-pill ms-2">${schedule.TotalDays} nap</span>
                    <span class="badge bg-info rounded-pill ms-2">${taskCount} tevékenység</span>
                </div>
                <div>
                    <button class="btn btn-sm btn-outline-primary view-schedule-btn" data-schedule-id="${schedule.ID}">
                        Megtekintés
                    </button>
                    <button class="btn btn-sm btn-outline-secondary edit-schedule-btn ms-2" data-schedule-id="${schedule.ID}">
                        Szerkesztés
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-schedule-btn ms-2" data-schedule-id="${schedule.ID}">
                        Törlés
                    </button>
                </div>
            `;
            schedulesList.appendChild(listItem);
        });
        
        // Add event listeners to view buttons
        schedulesList.querySelectorAll('.view-schedule-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const scheduleId = btn.dataset.scheduleId;
                const schedule = await loadScheduleById(scheduleId);
                if (schedule) {
                    currentScheduleId = scheduleId;
                    displaySchedule(schedule, 8, 22);
                    document.getElementById('scheduleSection').classList.remove('d-none');
                    addScheduleManagementButtons(scheduleId);
                }
            });
        });
        
        // Add event listeners to edit buttons
        schedulesList.querySelectorAll('.edit-schedule-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const scheduleId = btn.dataset.scheduleId;
                showScheduleEditModal(scheduleId);
            });
        });
        
        // Add event listeners to delete buttons
        schedulesList.querySelectorAll('.delete-schedule-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const scheduleId = btn.dataset.scheduleId;
                if (confirm('Biztosan törölni szeretné ezt az ütemezést?')) {
                    await deleteSchedule(scheduleId);
                    // Refresh the schedules list
                    const schedules = await loadSchedules();
                    showSchedulesList(schedules);
                    
                    // If the current displayed schedule was deleted, hide it
                    if (currentScheduleId === scheduleId) {
                        scheduleTable.innerHTML = '';
                        document.getElementById('scheduleSection').classList.add('d-none');
                        currentScheduleId = null;
                    }
                }
            });
        });
    }
    
    // Create modal with schedules list (update similar to above with edit buttons)
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
                        ${schedules.map(schedule => {
                            // Get task count consistently 
                            let taskCount = 0;
                            if (schedule.schedule && schedule.schedule.$values) {
                                taskCount = schedule.schedule.$values.length;
                            } else if (schedule.schedule && Array.isArray(schedule.schedule)) {
                                taskCount = schedule.schedule.length;
                            } else if (schedule.tasks && schedule.tasks.$values) {
                                taskCount = schedule.tasks.$values.length;
                            } else if (schedule.Tasks && schedule.Tasks.$values) {
                                taskCount = schedule.Tasks.$values.length;
                            } else if (schedule.Schedule && schedule.Schedule.$values) {
                                taskCount = schedule.Schedule.$values.length;
                            }
                            
                            return `
                                <div class="list-group-item d-flex justify-content-between align-items-center">
                                    <div>
                                        <strong>${schedule.Name}</strong>
                                        <span class="badge bg-primary rounded-pill ms-2">${schedule.TotalDays} nap</span>
                                        <span class="badge bg-info rounded-pill ms-2">${taskCount} tevékenység</span>
                                        ${schedule.Description ? `<small class="text-muted d-block">${schedule.Description}</small>` : ''}
                                    </div>
                                    <div>
                                        <button type="button" class="btn btn-sm btn-outline-primary modal-view-btn" data-schedule-id="${schedule.ID}">
                                            Megtekintés
                                        </button>
                                        <button type="button" class="btn btn-sm btn-outline-secondary modal-edit-btn ms-2" data-schedule-id="${schedule.ID}">
                                            Szerkesztés
                                        </button>
                                        <button type="button" class="btn btn-sm btn-outline-danger modal-delete-btn ms-2" data-schedule-id="${schedule.ID}">
                                            Törlés
                                        </button>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Bezárás</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    
    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();
    
    // Add event listeners to modal view buttons
    modal.querySelectorAll('.modal-view-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const scheduleId = btn.dataset.scheduleId;
            const schedule = await loadScheduleById(scheduleId);
            
            if (schedule) {
                bootstrapModal.hide();
                currentScheduleId = scheduleId;
                displaySchedule(schedule, 8, 22);
                document.getElementById('scheduleSection').classList.remove('d-none');
                addScheduleManagementButtons(scheduleId);
            } else {
                alert('Nem sikerült betölteni az ütemezést.');
            }
        });
    });
    
    // Add event listeners to modal edit buttons
    modal.querySelectorAll('.modal-edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const scheduleId = btn.dataset.scheduleId;
            bootstrapModal.hide();
            showScheduleEditModal(scheduleId);
        });
    });
    
    // Add event listeners to modal delete buttons
    modal.querySelectorAll('.modal-delete-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const scheduleId = btn.dataset.scheduleId;
            if (confirm('Biztosan törölni szeretné ezt az ütemezést?')) {
                await deleteSchedule(scheduleId);
                
                // Refresh the modal content
                bootstrapModal.hide();
                const schedules = await loadSchedules();
                showSchedulesList(schedules);
                
                // If the current displayed schedule was deleted, hide it
                if (currentScheduleId === scheduleId) {
                    scheduleTable.innerHTML = '';
                    document.getElementById('scheduleSection').classList.add('d-none');
                    currentScheduleId = null;
                }
            }
        });
    });
    
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
    if (schedule.tasks && schedule.tasks.$values) {
        tasks = schedule.tasks.$values;
    } else if (schedule.Tasks && schedule.Tasks.$values) {
        tasks = schedule.Tasks.$values;
    } else if (schedule.schedule && schedule.schedule.$values) {
        tasks = schedule.schedule.$values;
    } else if (schedule.Schedule && schedule.Schedule.$values) {
        tasks = schedule.Schedule.$values;
    } else if (Array.isArray(schedule.tasks)) {
        tasks = schedule.tasks;
    } else if (Array.isArray(schedule.Tasks)) {
        tasks = schedule.Tasks;
    } else if (Array.isArray(schedule.schedule)) {
        tasks = schedule.schedule;
    } else if (Array.isArray(schedule.Schedule)) {
        tasks = schedule.Schedule;
    }
    
    console.log('Tasks for display:', tasks);
    
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
            // Handle case insensitivity - get the correct property names
            const scheduledDay = task.ScheduledDay || task.scheduledDay;
            const scheduledStartTime = task.ScheduledStartTime || task.scheduledStartTime;
            const scheduledEndTime = task.ScheduledEndTime || task.scheduledEndTime;
            const durationHours = task.DurationHours || task.durationHours;
            const name = task.Name || task.name;
            const description = task.Description || task.description;
            const status = task.Status !== undefined ? task.Status : (task.status !== undefined ? task.status : null);
            const type = task.Type !== undefined ? task.Type : (task.type !== undefined ? task.type : 0);
            
            console.log('Task to place:', {
                name, 
                day: scheduledDay, 
                start: scheduledStartTime, 
                duration: durationHours
            });
            
            if (scheduledDay && scheduledStartTime) {
                // Parse scheduled times
                let startTime, startHour;
                try {
                    startTime = new Date(scheduledStartTime);
                    startHour = startTime.getHours();
                } catch (e) {
                    console.error('Error parsing task time:', e);
                    return; // Skip this task if time can't be parsed
                }
                
                const duration = durationHours || 1;  // Default to 1 if not specified
                const day = scheduledDay;
                
                // Find cell for the task's start time
                const dayCell = table.querySelector(`td[data-day="${day}"][data-hour="${startHour}"]`);
                
                if (dayCell) {
                    console.log(`Placing task ${name} in day ${day}, hour ${startHour}`);
                    
                    // Set task styling
                    dayCell.className = `task-cell task-type-${type}`;
                    dayCell.rowSpan = duration; // Merge cells vertically based on duration
                    
                    // Add task content
                    dayCell.innerHTML = `
                        <div class="task-name">${name}</div>
                        <div class="task-duration">${duration} óra</div>
                        ${description ? `<div class="task-description">${description}</div>` : ''}
                        ${status !== null ? `<div class="task-status badge bg-info">${taskStatuses[status]}</div>` : ''}
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
                } else {
                    console.warn(`Could not find cell for day ${day}, hour ${startHour}`);
                }
            } else {
                console.warn('Task missing scheduled day or start time:', task);
            }
        });
    }
}
    
    /**
     * Show a modal to update task status
     */
   function showTaskUpdateModal(task) {
    console.log('Task for edit:', task);
    
    // Normalize task properties to handle both camelCase and PascalCase
    const taskId = task.Id || task.id;
    const taskName = task.Name || task.name;
    const taskDescription = task.Description || task.description || '';
    const taskDuration = task.DurationHours || task.durationHours;
    const taskType = task.Type !== undefined ? task.Type : (task.type !== undefined ? task.type : 0);
    const taskStatus = task.Status !== undefined ? task.Status : (task.status !== undefined ? task.status : 0);
    const scheduledStartTime = task.ScheduledStartTime || task.scheduledStartTime;
    const scheduledEndTime = task.ScheduledEndTime || task.scheduledEndTime;
    const scheduledDay = task.ScheduledDay || task.scheduledDay;
    
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
                    <h5 class="modal-title" id="taskUpdateModalLabel">Tevékenység szerkesztése</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="taskUpdateForm">
                        <div class="mb-3">
                            <label for="editTaskName" class="form-label">Tevékenység neve</label>
                            <input type="text" class="form-control" id="editTaskName" value="${taskName}" required>
                        </div>
                        
                        <div class="mb-3">
                            <label for="editTaskStatus" class="form-label">Állapot</label>
                            <select class="form-select" id="editTaskStatus">
                                ${taskStatuses.map((status, index) => 
                                    `<option value="${index}" ${taskStatus === index ? 'selected' : ''}>${status}</option>`
                                ).join('')}
                            </select>
                        </div>
                        
                        <div class="mb-3">
                            <label for="editTaskDescription" class="form-label">Leírás</label>
                            <input type="text" class="form-control" id="editTaskDescription" value="${taskDescription}">
                        </div>
                        
                        <div class="mb-3">
                            <label for="editTaskDuration" class="form-label">Időigény (óra)</label>
                            <input type="number" class="form-control" id="editTaskDuration" min="1" value="${taskDuration}" required>
                        </div>
                        
                        <div class="mb-3">
                            <label for="editTaskType" class="form-label">Típus</label>
                            <select class="form-select" id="editTaskType" required>
                                ${taskTypes.map((type, index) => 
                                    `<option value="${index}" ${taskType === index ? 'selected' : ''}>${type}</option>`
                                ).join('')}
                            </select>
                        </div>
                        
                        ${scheduledDay ? `
                        <div class="mb-3">
                            <label class="form-label">Ütemezett nap</label>
                            <input type="number" class="form-control" id="editScheduledDay" value="${scheduledDay}" readonly>
                            <small class="form-text text-muted">Az ütemezett nap az ütemezés újragenerálásával módosítható</small>
                        </div>
                        ` : ''}
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
        // Get values from form
        const newName = document.getElementById('editTaskName').value;
        const newDescription = document.getElementById('editTaskDescription').value;
        const newDuration = parseInt(document.getElementById('editTaskDuration').value);
        const newType = parseInt(document.getElementById('editTaskType').value);
        const newStatus = parseInt(document.getElementById('editTaskStatus').value);
        
        // Validate input
        if (!newName || newDuration < 1) {
            alert('Kérem töltse ki a kötelező mezőket!');
            return;
        }
        
        // Create a properly formatted update object
        const updatedTask = {
            Id: taskId,
            Name: newName,
            Description: newDescription,
            DurationHours: newDuration,
            Type: newType,
            Status: newStatus
        };
        
        // Add optional properties if they exist
        if (scheduledStartTime) updatedTask.ScheduledStartTime = scheduledStartTime;
        if (scheduledEndTime) updatedTask.ScheduledEndTime = scheduledEndTime;
        if (scheduledDay) updatedTask.ScheduledDay = scheduledDay;
        
        console.log('Sending update:', updatedTask);
        
        try {
            // Update task via API
            const response = await fetch(`${API_URL}/Task/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedTask)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error Response:', errorText);
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
    function showScheduleEditModal(scheduleId) {
    // First, load the schedule data
    loadScheduleById(scheduleId).then(schedule => {
        if (!schedule) {
            alert('Nem sikerült betölteni az ütemezést.');
            return;
        }
        
        // Normalize schedule properties
        const name = schedule.Name || schedule.name;
        const description = schedule.Description || schedule.description || '';
        const totalDays = schedule.TotalDays || schedule.totalDays;
        
        // Create modal for schedule edit
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'scheduleEditModal';
        modal.tabIndex = '-1';
        modal.setAttribute('aria-labelledby', 'scheduleEditModalLabel');
        modal.setAttribute('aria-hidden', 'true');
        
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="scheduleEditModalLabel">Ütemezés szerkesztése</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="scheduleEditForm">
                            <div class="mb-3">
                                <label for="editScheduleName" class="form-label">Ütemezés neve</label>
                                <input type="text" class="form-control" id="editScheduleName" value="${name}" required>
                            </div>
                            
                            <div class="mb-3">
                                <label for="editScheduleDescription" class="form-label">Leírás</label>
                                <input type="text" class="form-control" id="editScheduleDescription" value="${description}">
                            </div>
                            
                            <div class="mb-3">
                                <label for="editScheduleTotalDays" class="form-label">Napok száma</label>
                                <input type="number" class="form-control" id="editScheduleTotalDays" min="1" max="365" value="${totalDays}" required>
                                <small class="form-text text-muted">A napok számának módosítása nem változtatja meg a meglévő ütemezett tevékenységeket.</small>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Mégsem</button>
                        <button type="button" class="btn btn-primary" id="updateScheduleBtn">Mentés</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to body
        document.body.appendChild(modal);
        
        // Initialize the modal
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
        
        // Handle schedule update
        document.getElementById('updateScheduleBtn').addEventListener('click', async () => {
            // Get values from form
            const newName = document.getElementById('editScheduleName').value;
            const newDescription = document.getElementById('editScheduleDescription').value;
            const newTotalDays = parseInt(document.getElementById('editScheduleTotalDays').value);
            
            // Validate input
            if (!newName || newTotalDays < 1) {
                alert('Kérem töltse ki a kötelező mezőket!');
                return;
            }
            
            // Get tasks from the current schedule
            let taskDTOs = [];
            
            // Extract tasks from the schedule
            let tasks = [];
            if (schedule.tasks && schedule.tasks.$values) {
                tasks = schedule.tasks.$values;
            } else if (schedule.Tasks && schedule.Tasks.$values) {
                tasks = schedule.Tasks.$values;
            } else if (schedule.schedule && schedule.schedule.$values) {
                tasks = schedule.schedule.$values;
            } else if (schedule.Schedule && schedule.Schedule.$values) {
                tasks = schedule.Schedule.$values;
            } else if (Array.isArray(schedule.tasks)) {
                tasks = schedule.tasks;
            } else if (Array.isArray(schedule.Tasks)) {
                tasks = schedule.Tasks;
            } else if (Array.isArray(schedule.schedule)) {
                tasks = schedule.schedule;
            } else if (Array.isArray(schedule.Schedule)) {
                tasks = schedule.Schedule;
            }
            
            // Convert tasks to DTOs
            taskDTOs = tasks.map(task => {
                const taskId = task.Id || task.id;
                const taskName = task.Name || task.name;
                const taskDescription = task.Description || task.description;
                const taskDuration = task.DurationHours || task.durationHours;
                const taskType = task.Type !== undefined ? task.Type : (task.type !== undefined ? task.type : 0);
                const taskStatus = task.Status !== undefined ? task.Status : (task.status !== undefined ? task.status : 0);
                const scheduledStartTime = task.ScheduledStartTime || task.scheduledStartTime;
                const scheduledEndTime = task.ScheduledEndTime || task.scheduledEndTime;
                const scheduledDay = task.ScheduledDay || task.scheduledDay;
                
                return {
                    Id: taskId,
                    Name: taskName,
                    Description: taskDescription,
                    DurationHours: taskDuration,
                    Type: taskType,
                    Status: taskStatus,
                    ScheduledStartTime: scheduledStartTime,
                    ScheduledEndTime: scheduledEndTime,
                    ScheduledDay: scheduledDay
                };
            });
            
            // Create a properly formatted update object
            const updatedSchedule = {
                Id: scheduleId,
                Name: newName,
                Description: newDescription,
                TotalDays: newTotalDays,
                Tasks: taskDTOs
            };
            
            console.log('Sending update:', updatedSchedule);
            
            try {
                // Update schedule via API
                const response = await fetch(`${API_URL}/Schedules/${scheduleId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updatedSchedule)
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('API Error Response:', errorText);
                    throw new Error(`Failed to update schedule: ${response.status} ${response.statusText}`);
                }
                
                // Close modal
                bootstrapModal.hide();
                
                // Reload and display the updated schedule
                const refreshedSchedule = await loadScheduleById(scheduleId);
                if (refreshedSchedule) {
                    displaySchedule(refreshedSchedule, 8, 22);
                }
                
                // Refresh the schedules list if displayed
                const schedules = await loadSchedules();
                showSchedulesList(schedules);
                
            } catch (error) {
                console.error('Error updating schedule:', error);
                alert(`Hiba történt az ütemezés frissítése során: ${error.message}`);
            }
        });
        
        // Remove modal from DOM after it's hidden
        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
        });
    });
}
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
    
    // Add "Edit This Schedule" button
    const editScheduleBtn = document.createElement('button');
    editScheduleBtn.className = 'btn btn-secondary';
    editScheduleBtn.textContent = 'Ütemezés szerkesztése';
    editScheduleBtn.addEventListener('click', () => {
        showScheduleEditModal(scheduleId);
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
    buttonContainer.appendChild(editScheduleBtn);
    buttonContainer.appendChild(deleteScheduleBtn);
    
    scheduleTable.after(buttonContainer);
}
});