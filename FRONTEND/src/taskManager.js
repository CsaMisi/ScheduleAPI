import * as api from './api.js';
import { createModal } from './utils.js';

// Task types mapping
export const taskTypes = [
    'Physical',
    'Mental',
    'FreeTime',
    'Work',
    'Study',
    'Other'
];

// Task status mapping
export const taskStatuses = [
    'NotStarted',
    'InProgress',
    'Completed',
    'OnHold',
    'Cancelled'
];

/**
 * Update the task list display
 */
export function updateTaskList(tasks, taskList, currentScheduleId) {
    taskList.innerHTML = '';
    
    if (!tasks || tasks.length === 0) {
        taskList.innerHTML = '<li class="list-group-item">Nincsenek hozzáadott tevékenységek</li>';
        return;
    }
    
    for (let index = 0; index < tasks.length; index++) {
        let task = tasks[index];
        console.log(task);
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
        editBtn.addEventListener('click', () => showTaskUpdateModal(task, currentScheduleId));
        
        // Create delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-sm btn-danger';
        deleteBtn.textContent = 'Törlés';
        deleteBtn.addEventListener('click', async () => {
            try {
                await api.deleteTask(task.Id);
                const tasks = await api.loadTasks();
                updateTaskList(tasks, taskList, currentScheduleId);
            } catch (error) {
                alert(`Hiba történt a tevékenység törlése során: ${error.message}`);
            }
        });
        
        // Append buttons
        btnContainer.appendChild(editBtn);
        btnContainer.appendChild(deleteBtn);
        
        // Append elements
        li.appendChild(taskInfo);
        li.appendChild(btnContainer);
        taskList.appendChild(li);
    }
}

/**
 * Show a modal to edit a task
 */
export function showTaskUpdateModal(task, currentScheduleId) {
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
    
    const modalContent = `
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
    `;
    
    // Create the modal
    const { modal, bootstrapModal } = createModal({
        id: 'taskUpdateModal',
        title: 'Tevékenység szerkesztése',
        content: modalContent,
        onSave: async () => {
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
                await api.updateTask(taskId, updatedTask);
                
                // Close modal
                bootstrapModal.hide();
                
                // If we have a current schedule, reload it
                if (currentScheduleId) {
                    const updatedSchedule = await api.loadScheduleById(currentScheduleId);
                    if (updatedSchedule) {
                        // Let the calling code handle the schedule display refresh through the event
                        document.dispatchEvent(new CustomEvent('schedule-updated', { 
                            detail: { schedule: updatedSchedule } 
                        }));
                    }
                }
                
                // Reload task list through event
                document.dispatchEvent(new CustomEvent('tasks-updated'));
                
            } catch (error) {
                alert(`Hiba történt a tevékenység frissítése során: ${error.message}`);
            }
        }
    });
    
    bootstrapModal.show();
}