import { elements, appState } from './config.js';
import { utils } from './common.js';
import { api } from './api.js';
import { taskHandlers } from './taskHandlers.js';

// Schedule handlers
export const scheduleHandlers = {
    async loadSchedules() {
        try {
            appState.schedules = await api.getSchedules();
            elements.scheduleCount.textContent = appState.schedules.length;
            this.renderSchedulesList();
        } catch (error) {
            console.error('Failed to load schedules:', error);
            // If loading fails, clear the list and show an error message
            elements.schedulesContainer.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger">
                        Failed to load schedules. Please check the API URL and ensure the API is running. Error: ${error.message}
                    </div>
                </div>
            `;
            elements.scheduleCount.textContent = 'Error';
        }
    },

    renderSchedulesList() {
        elements.schedulesContainer.innerHTML = '';

        if (!appState.schedules || appState.schedules.length === 0) {
            elements.schedulesContainer.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-info">
                        You don't have any schedules yet. Create one to get started!
                    </div>
                </div>
            `;
            return;
        }

        appState.schedules.forEach(schedule => {
            const scheduleCard = document.createElement('div');
            scheduleCard.className = 'col-md-4 mb-4';
            scheduleCard.innerHTML = `
                <div class="card shadow-sm h-100">
                    <div class="card-body">
                        <h5 class="card-title">${schedule.name}</h5>
                        <p class="card-text">${schedule.description || 'No description'}</p>
                        <div class="d-flex justify-content-between">
                            <span class="badge bg-primary">${schedule.totalDays} days</span>
                            <span class="badge bg-secondary">${schedule.tasks?.length || 0} tasks</span>
                        </div>
                    </div>
                    <div class="card-footer bg-transparent border-top-0">
                        <button class="btn btn-outline-primary btn-sm view-schedule" data-id="${schedule.id}">
                            <i class="fas fa-eye me-1"></i> View Details
                        </button>
                    </div>
                </div>
            `;

            elements.schedulesContainer.appendChild(scheduleCard);

            // Add event listener to the view button
            scheduleCard.querySelector('.view-schedule').addEventListener('click', (e) => {
                const scheduleId = e.target.closest('.view-schedule').dataset.id;
                this.viewScheduleDetails(scheduleId);
            });
        });
    },

    async viewScheduleDetails(scheduleId) {
        try {
            appState.currentSchedule = await api.getScheduleById(scheduleId);

            // Update the schedule details
            elements.scheduleDetailTitle.textContent = appState.currentSchedule.name;
            elements.detailScheduleName.textContent = appState.currentSchedule.name;
            elements.detailScheduleDescription.textContent = appState.currentSchedule.description || 'No description';
            elements.detailScheduleDays.textContent = appState.currentSchedule.totalDays;
            elements.detailScheduleTaskCount.textContent = appState.currentSchedule.tasks?.length || 0;

            // Render tasks
            this.renderTasksList(appState.currentSchedule.tasks || []);

            // Show the schedule details view
            utils.showView('view-schedule-details');
        } catch (error) {
            console.error('Failed to load schedule details:', error);
            utils.showToast('Failed to load schedule details', 'danger');
        }
    },

    renderTasksList(tasks) {
        elements.tasksContainer.innerHTML = '';

        if (!tasks || tasks.length === 0) {
            elements.tasksContainer.innerHTML = `
                <div class="alert alert-info">
                    This schedule doesn't have any tasks yet. Add one to get started!
                </div>
            `;
            return;
        }

        // Sort tasks by day and then by start time
        tasks.sort((a, b) => {
            if (a.day !== b.day) {
                // Handle null/undefined day values
                if (a.day == null && b.day == null) return 0;
                if (a.day == null) return 1; // Unassigned comes after assigned
                if (b.day == null) return -1; // Unassigned comes after assigned
                return a.day - b.day;
            }

            const aTime = a.startTime ? new Date(a.startTime).getTime() : 0;
            const bTime = b.startTime ? new Date(b.startTime).getTime() : 0;
            // Handle null/undefined start times
            if (a.startTime == null && b.startTime == null) return 0;
            if (a.startTime == null) return 1; // Tasks without start time come after those with
            if (b.startTime == null) return -1; // Tasks without start time come after those with

            return aTime - bTime;
        });

        // Group tasks by day
        const tasksByDay = {};
        tasks.forEach(task => {
            const day = task.day != null ? task.day : 'Unassigned'; // Use != null to catch both null and undefined
            if (!tasksByDay[day]) {
                tasksByDay[day] = [];
            }
            tasksByDay[day].push(task);
        });

        // Create day sections
        const days = Object.keys(tasksByDay).sort((a, b) => {
            if (a === 'Unassigned') return 1;
            if (b === 'Unassigned') return -1;
            return parseInt(a) - parseInt(b);
        });

        days.forEach(day => {
            const dayTasks = tasksByDay[day];
            const daySection = document.createElement('div');
            daySection.className = 'day-section mb-4';
            daySection.innerHTML = `
                <h6 class="day-header mb-3">${day === 'Unassigned' ? 'Unassigned Tasks' : `Day ${day}`}</h6>
                <div class="task-list"></div>
            `;

            const taskList = daySection.querySelector('.task-list');

            dayTasks.forEach(task => {
                const taskCard = document.createElement('div');
                taskCard.className = `card task-card mb-2 ${utils.getTaskStatusClass(task.status)}`;

                const startTime = task.startTime ? utils.displayDatetime(task.startTime) : 'Not set';
                const endTime = task.endTime ? utils.displayDatetime(task.endTime) : 'Not set';

                taskCard.innerHTML = `
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-top">
                            <div class="task-main">
                                <h6 class="card-title mb-1">
                                    <span class="type-indicator ${utils.getTaskTypeClass(task.type)}"></span>
                                    ${task.name}
                                </h6>
                                <p class="card-text small text-muted mb-1">${task.description || 'No description'}</p>
                                <div class="task-details small">
                                    <span class="badge bg-secondary me-2">${utils.getTaskTypeString(task.type)}</span>
                                    <span class="badge ${task.status === 2 ? 'bg-success' : 'bg-secondary'}">${utils.getTaskStatusString(task.status)}</span>
                                </div>
                            </div>
                            <div class="task-time text-end">
                                <div class="small text-muted">${task.durationHours} hour${task.durationHours !== 1 ? 's' : ''}</div>
                                <div class="dropdown">
                                    <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                        Actions
                                    </button>
                                    <ul class="dropdown-menu dropdown-menu-end">
                                        <li><a class="dropdown-item edit-task" href="#" data-id="${task.id}">
                                            <i class="fas fa-edit me-1"></i> Edit
                                        </a></li>
                                        <li><hr class="dropdown-divider"></li>
                                        <li><a class="dropdown-item text-danger delete-task" href="#" data-id="${task.id}">
                                            <i class="fas fa-trash me-1"></i> Delete
                                        </a></li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                taskList.appendChild(taskCard);

                // Add event listeners
                taskCard.querySelector('.edit-task').addEventListener('click', (e) => {
                    e.preventDefault();
                    const taskId = e.target.closest('.edit-task').dataset.id;
                    taskHandlers.editTask(taskId);
                });

                taskCard.querySelector('.delete-task').addEventListener('click', (e) => {
                    e.preventDefault();
                    const taskId = e.target.closest('.delete-task').dataset.id;
                    taskHandlers.confirmDeleteTask(taskId);
                });
            });

            elements.tasksContainer.appendChild(daySection);
        });
    },

    async createOrUpdateSchedule(e) {
        e.preventDefault();

        // Base schedule data from user input
        const scheduleData = {
            name: document.getElementById('schedule-name').value,
            description: document.getElementById('schedule-description').value,
            totalDays: parseInt(document.getElementById('schedule-days').value),
            // Adding default values that are required by the /api/Schedules/generate endpoint
            tasks: [],
            dayStartHour: 8,
            dayEndHour: 20,
            restHoursBetweenTasks: 0.5
        };

        try {
            let schedule;
            const scheduleId = document.getElementById('edit-schedule-id').value;

            if (scheduleId) {
                // Update existing schedule
                let scheduleDTO = api.getScheduleById(scheduleId);
                schedule = await api.updateSchedule(scheduleId, {
                    id: scheduleId,
                    scheduleData : scheduleDTO
                });
                utils.showToast('Schedule updated successfully', 'success');
            } else {
                // Create new schedule
                console.log('Creating new schedule with data:', scheduleData);
                schedule = await api.createSchedule(scheduleData);
                utils.showToast('Schedule created successfully', 'success');
            }

            // Refresh schedules list and show details
            await this.loadSchedules();
            this.viewScheduleDetails(schedule.id);
        } catch (error) {
            console.error('Failed to save schedule:', error);
            utils.showToast('Failed to save schedule', 'danger');
        }
    },

    editSchedule() {
        if (!appState.currentSchedule) return; // Ensure a schedule is selected

        document.getElementById('edit-schedule-title').textContent = 'Edit Schedule';
        document.getElementById('edit-schedule-id').value = appState.currentSchedule.id;
        document.getElementById('schedule-name').value = appState.currentSchedule.name;
        document.getElementById('schedule-description').value = appState.currentSchedule.description || '';
        document.getElementById('schedule-days').value = appState.currentSchedule.totalDays;

        utils.showView('view-edit-schedule');
    },

    newSchedule() {
        document.getElementById('edit-schedule-title').textContent = 'Create New Schedule';
        document.getElementById('edit-schedule-id').value = '';
        document.getElementById('schedule-name').value = '';
        document.getElementById('schedule-description').value = '';
        document.getElementById('schedule-days').value = 7; // Default to 7 days

        utils.showView('view-edit-schedule');
    },

    confirmDeleteSchedule() {
        if (!appState.currentSchedule) return;

        utils.confirmDelete(
            `Are you sure you want to delete the schedule "${appState.currentSchedule.name}"? This will also delete all tasks associated with this schedule.`,
            async () => {
                try {
                    await api.deleteSchedule(appState.currentSchedule.id);
                    utils.showToast('Schedule deleted successfully', 'success');
                    await this.loadSchedules(); // Refresh the list after deletion
                    utils.showView('view-schedules'); // Go back to the schedules list
                } catch (error) {
                    console.error('Failed to delete schedule:', error);
                    utils.showToast('Failed to delete schedule', 'danger');
                }
            }
        );
    },

    exportSchedule() {
        if (!appState.currentSchedule) return;

        try {
            // Create a formatted text representation of the schedule and its tasks
            let exportText = `Schedule: ${appState.currentSchedule.name}\n`;
            exportText += `Description: ${appState.currentSchedule.description || 'No description'}\n`;
            exportText += `Total Days: ${appState.currentSchedule.totalDays}\n\n`;

            if (!appState.currentSchedule.tasks || appState.currentSchedule.tasks.length === 0) {
                exportText += 'No tasks in this schedule.\n';
            } else {
                // Group tasks by day
                const tasksByDay = {};
                appState.currentSchedule.tasks.forEach(task => {
                    const day = task.day != null ? task.day : 'Unassigned';
                    if (!tasksByDay[day]) {
                        tasksByDay[day] = [];
                    }
                    tasksByDay[day].push(task);
                });

                // Add tasks by day
                const days = Object.keys(tasksByDay).sort((a, b) => {
                    if (a === 'Unassigned') return 1;
                    if (b === 'Unassigned') return -1;
                    return parseInt(a) - parseInt(b);
                });

                days.forEach(day => {
                    exportText += `--- ${day === 'Unassigned' ? 'Unassigned Tasks' : `Day ${day}`} ---\n`;

                    tasksByDay[day].sort((a, b) => {
                        const aTime = a.startTime ? new Date(a.startTime).getTime() : 0;
                        const bTime = b.startTime ? new Date(b.startTime).getTime() : 0;
                        if (a.startTime == null && b.startTime == null) return 0;
                        if (a.startTime == null) return 1;
                        if (b.startTime == null) return -1;
                        return aTime - bTime;
                    }).forEach(task => {
                        exportText += `* ${task.name} (${utils.getTaskTypeString(task.type)}, ${task.durationHours} hours)\n`;
                        if (task.description) {
                            exportText += `  Description: ${task.description}\n`;
                        }
                        exportText += `  Status: ${utils.getTaskStatusString(task.status)}\n`;
                        if (task.startTime) {
                            exportText += `  Start: ${utils.displayDatetime(task.startTime)}\n`;
                        }
                        if (task.endTime) {
                            exportText += `  End: ${utils.displayDatetime(task.endTime)}\n`;
                        }
                        exportText += '\n';
                    });
                });
            }

            // Create a blob and download link
            const blob = new Blob([exportText], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${appState.currentSchedule.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-schedule.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            utils.showToast('Schedule exported successfully', 'success');
        } catch (error) {
            console.error('Failed to export schedule:', error);
            utils.showToast('Failed to export schedule', 'danger');
        }
    }
};