import * as api from './api.js';
import { taskTypes, taskStatuses, showTaskUpdateModal } from './taskManager.js';
import { createModal } from './utils.js';

/**
 * Display the schedule in a table
 */
export function displaySchedule(schedule, dayStartHour, dayEndHour, scheduleTable, currentScheduleId) {
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
                    dayCell.addEventListener('click', () => showTaskUpdateModal(task, currentScheduleId));
                    
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
 * Add schedule management buttons to the UI
 */
export function addScheduleManagementButtons(scheduleId, scheduleTable, scheduleSection) {
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
        const schedules = await api.loadSchedules();
        showSchedulesList(schedules, scheduleTable, scheduleSection);
    });
    
    // Add "Edit This Schedule" button
    const editScheduleBtn = document.createElement('button');
    editScheduleBtn.className = 'btn btn-secondary';
    editScheduleBtn.textContent = 'Ütemezés szerkesztése';
    editScheduleBtn.addEventListener('click', () => {
        showScheduleEditModal(scheduleId, scheduleTable);
    });
    
    // Add "Delete This Schedule" button
    const deleteScheduleBtn = document.createElement('button');
    deleteScheduleBtn.className = 'btn btn-danger';
    deleteScheduleBtn.textContent = 'Ütemezés törlése';
    deleteScheduleBtn.addEventListener('click', async () => {
        if (confirm('Biztosan törölni szeretné ezt az ütemezést?')) {
            await api.deleteSchedule(scheduleId);
            scheduleTable.innerHTML = '';
            scheduleSection.classList.add('d-none');
            buttonContainer.remove();
            document.dispatchEvent(new CustomEvent('schedule-deleted'));
        }
    });
    
    buttonContainer.appendChild(viewSchedulesBtn);
    buttonContainer.appendChild(editScheduleBtn);
    buttonContainer.appendChild(deleteScheduleBtn);
    
    scheduleTable.after(buttonContainer);
}

/**
 * Show a list of existing schedules
 */
export function showSchedulesList(schedules, scheduleTable, scheduleSection) {
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
        
        // Add event listeners to view, edit, and delete buttons
        addScheduleListEventListeners(schedulesList, scheduleTable, scheduleSection);
    }
    
    // Create modal with schedules list
    const modalContent = `
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
    `;
    
    // Create and show the modal
    const { modal, bootstrapModal } = createModal({
        id: 'schedulesModal',
        title: 'Mentett ütemezések',
        content: modalContent,
        showFooter: true,
        saveButtonText: null // Don't show save button
    });
    
    // Add event listeners to modal buttons
    addModalEventListeners(modal, bootstrapModal, scheduleTable, scheduleSection);
}

/**
 * Add event listeners to schedule list buttons
 */
function addScheduleListEventListeners(schedulesList, scheduleTable, scheduleSection) {
    // Add event listeners to view buttons
    schedulesList.querySelectorAll('.view-schedule-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const scheduleId = btn.dataset.scheduleId;
            const schedule = await api.loadScheduleById(scheduleId);
            if (schedule) {
                document.dispatchEvent(new CustomEvent('schedule-selected', { 
                    detail: { scheduleId, schedule } 
                }));
                displaySchedule(schedule, 8, 22, scheduleTable, scheduleId);
                scheduleSection.classList.remove('d-none');
                addScheduleManagementButtons(scheduleId, scheduleTable, scheduleSection);
            }
        });
    });
    
    // Add event listeners to edit buttons
    schedulesList.querySelectorAll('.edit-schedule-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const scheduleId = btn.dataset.scheduleId;
            showScheduleEditModal(scheduleId, scheduleTable);
        });
    });
    
    // Add event listeners to delete buttons
    schedulesList.querySelectorAll('.delete-schedule-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const scheduleId = btn.dataset.scheduleId;
            if (confirm('Biztosan törölni szeretné ezt az ütemezést?')) {
                await api.deleteSchedule(scheduleId);
                // Refresh the schedules list
                const schedules = await api.loadSchedules();
                showSchedulesList(schedules, scheduleTable, scheduleSection);
                
                // If the current displayed schedule was deleted, hide it
                document.dispatchEvent(new CustomEvent('schedule-deleted', { 
                    detail: { scheduleId } 
                }));
            }
        });
    });
}

/**
 * Add event listeners to modal buttons
 */
function addModalEventListeners(modal, bootstrapModal, scheduleTable, scheduleSection) {
    // Add event listeners to modal view buttons
    modal.querySelectorAll('.modal-view-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const scheduleId = btn.dataset.scheduleId;
            const schedule = await api.loadScheduleById(scheduleId);
            
            if (schedule) {
                bootstrapModal.hide();
                document.dispatchEvent(new CustomEvent('schedule-selected', { 
                    detail: { scheduleId, schedule } 
                }));
                displaySchedule(schedule, 8, 22, scheduleTable, scheduleId);
                scheduleSection.classList.remove('d-none');
                addScheduleManagementButtons(scheduleId, scheduleTable, scheduleSection);
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
            showScheduleEditModal(scheduleId, scheduleTable);
        });
    });
    
    // Add event listeners to modal delete buttons
    modal.querySelectorAll('.modal-delete-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const scheduleId = btn.dataset.scheduleId;
            if (confirm('Biztosan törölni szeretné ezt az ütemezést?')) {
                await api.deleteSchedule(scheduleId);
                
                // Refresh the modal content
                bootstrapModal.hide();
                const schedules = await api.loadSchedules();
                showSchedulesList(schedules, scheduleTable, scheduleSection);
                
                // If the current displayed schedule was deleted, notify
                document.dispatchEvent(new CustomEvent('schedule-deleted', { 
                    detail: { scheduleId } 
                }));
            }
        });
    });
}

/**
 * Show a modal to edit a schedule
 */
export function showScheduleEditModal(scheduleId, scheduleTable) {
    // First, load the schedule data
    api.loadScheduleById(scheduleId).then(schedule => {
        if (!schedule) {
            alert('Nem sikerült betölteni az ütemezést.');
            return;
        }
        
        // Normalize schedule properties
        const name = schedule.Name || schedule.name;
        const description = schedule.Description || schedule.description || '';
        const totalDays = schedule.TotalDays || schedule.totalDays;
        
        const modalContent = `
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
        `;
        
        // Create the modal
        const { modal, bootstrapModal } = createModal({
            id: 'scheduleEditModal',
            title: 'Ütemezés szerkesztése',
            content: modalContent,
            onSave: async () => {
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
                    await api.updateSchedule(scheduleId, updatedSchedule);
                    
                    // Close modal
                    bootstrapModal.hide();
                    
                    // Reload and display the updated schedule
                    const refreshedSchedule = await api.loadScheduleById(scheduleId);
                    if (refreshedSchedule) {
                        document.dispatchEvent(new CustomEvent('schedule-updated', { 
                            detail: { schedule: refreshedSchedule } 
                        }));
                        displaySchedule(refreshedSchedule, 8, 22, scheduleTable, scheduleId);
                    }
                    
                    // Refresh the schedules list
                    const schedules = await api.loadSchedules();
                    document.dispatchEvent(new CustomEvent('schedules-updated', { 
                        detail: { schedules } 
                    }));
                    
                } catch (error) {
                    alert(`Hiba történt az ütemezés frissítése során: ${error.message}`);
                }
            }
        });
        
        bootstrapModal.show();
    });
}