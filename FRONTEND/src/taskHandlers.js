import { elements, appState } from './config.js';
import { utils } from './common.js';
import { api } from './api.js';
import { scheduleHandlers } from './scheduleHandlers.js';

// Task handlers
export const taskHandlers = {
    async editTask(taskId) {
        // Reset form
        elements.taskForm.reset();
        document.getElementById('edit-task-title').textContent = 'Edit Task';

        try {
            if (taskId) {
                // Get the task details from the current schedule
                appState.currentTask = appState.currentSchedule.tasks.find(t => t.id === taskId);

                if (!appState.currentTask) {
                    throw new Error('Task not found in current schedule');
                }

                // Populate the form
                document.getElementById('edit-task-id').value = appState.currentTask.id;
                document.getElementById('task-name').value = appState.currentTask.name;
                document.getElementById('task-description').value = appState.currentTask.description || '';
                document.getElementById('task-type').value = appState.currentTask.type;
                document.getElementById('task-status').value = appState.currentTask.status;
                document.getElementById('task-duration').value = appState.currentTask.durationHours;
                document.getElementById('task-day').value = appState.currentTask.day || ''; // Handle null/undefined day

                // Format datetime values for the input fields
                document.getElementById('task-start-time').value = appState.currentTask.startTime ? utils.formatDatetime(appState.currentTask.startTime) : '';
                document.getElementById('task-end-time').value = appState.currentTask.endTime ? utils.formatDatetime(appState.currentTask.endTime) : '';

            } else {
                // New task - ensure appState.currentTask is null
                appState.currentTask = null;
                document.getElementById('edit-task-title').textContent = 'Add New Task';
                document.getElementById('edit-task-id').value = '';

                // Set default values for new task
                document.getElementById('task-status').value = 0; // Not Started
                document.getElementById('task-type').value = 0; // Physical
                document.getElementById('task-duration').value = 1;
                document.getElementById('task-day').value = 1; // Default to Day 1
                document.getElementById('task-start-time').value = '';
                document.getElementById('task-end-time').value = '';
            }

            utils.showView('view-edit-task');
        } catch (error) {
            console.error('Failed to load task details:', error);
            utils.showToast('Failed to load task details', 'danger');
        }
    },

    async createOrUpdateTask(e) {
        e.preventDefault();

        // Ensure a schedule is currently selected when saving a task
        if (!appState.currentSchedule) {
            utils.showToast('Cannot save task: No schedule selected.', 'danger');
            return;
        }

        const taskData = {
            description: document.getElementById('task-description').value,
            name: document.getElementById('task-name').value,
            type: parseInt(document.getElementById('task-type').value),
            status: parseInt(document.getElementById('task-status').value),
            durationHours: parseFloat(document.getElementById('task-duration').value),
            scheduleId: appState.currentSchedule.id, // This will be extracted in the API call
            scheduledDay: document.getElementById('task-day').value ? parseInt(document.getElementById('task-day').value) : null,
            scheduledStartTime: document.getElementById('task-start-time').value || null,
            scheduledEndTime: document.getElementById('task-end-time').value || null
        };

        try {
            const taskId = document.getElementById('edit-task-id').value;

            if (taskId) {
                // Update existing task
                await api.updateTask(taskId, {
                    id: taskId,
                    ...taskData
                });
                utils.showToast('Task updated successfully', 'success');
            } else {
                // Create new task
                await api.createTask(taskData);
                utils.showToast('Task created successfully', 'success');
            }

            // Refresh schedule details to show updated task list
            scheduleHandlers.viewScheduleDetails(appState.currentSchedule.id);
        } catch (error) {
            console.error('Failed to save task:', error);
            utils.showToast('Failed to save task', 'danger');
        }
    },

    confirmDeleteTask(taskId) {
        // Find the task in the current schedule's task list
        const task = appState.currentSchedule.tasks.find(t => t.id === taskId);

        if (!task) return; // Should not happen if called from task list

        utils.confirmDelete(
            `Are you sure you want to delete the task "${task.name}"?`,
            async () => {
                try {
                    await api.deleteTask(taskId);
                    utils.showToast('Task deleted successfully', 'success');
                    // Refresh schedule details to show updated task list
                    scheduleHandlers.viewScheduleDetails(appState.currentSchedule.id);
                } catch (error) {
                    console.error('Failed to delete task:', error);
                    utils.showToast('Failed to delete task', 'danger');
                }
            }
        );
    }
};