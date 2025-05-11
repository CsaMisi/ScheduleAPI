import { elements, appState } from './config.js';
import { utils } from './common.js';
import { api } from './api.js';
import { scheduleHandlers } from './scheduleHandlers.js';

// Schedule Generation Handlers
export const generationHandlers = {
    initGenerateForm() {
        // Clear tasks container
        elements.genTasksContainer.innerHTML = '';

        // Reset form
        document.getElementById('generate-form').reset();

        // Add one empty task template by default
        this.addGenerationTask();
    },

    addGenerationTask() {
        const taskTemplate = elements.genTaskTemplate.cloneNode(true);
        taskTemplate.classList.remove('hidden');
        taskTemplate.removeAttribute('id'); // Remove ID to avoid duplicates

        elements.genTasksContainer.appendChild(taskTemplate);

        // Add event listener to remove button
        taskTemplate.querySelector('.remove-gen-task').addEventListener('click', (e) => {
            // Ensure there's at least one task remaining
            if (elements.genTasksContainer.querySelectorAll('.gen-task-item').length > 1) {
                e.target.closest('.gen-task-item').remove();
            } else {
                utils.showToast('You must have at least one task to generate a schedule.', 'warning');
            }
        });
    },

    async generateSchedule(e) {
        e.preventDefault();

        // Collect tasks from the form
        const taskItems = document.querySelectorAll('.gen-task-item');
        const tasks = [];

        taskItems.forEach(item => {
            const nameInput = item.querySelector('.gen-task-name');
            const durationInput = item.querySelector('.gen-task-duration');
            const typeSelect = item.querySelector('.gen-task-type');

            // Basic validation for required fields in generation tasks
            if (!nameInput.value || !durationInput.value || !typeSelect.value) {
                utils.showToast('Please fill in all required fields for each task.', 'warning');
                return; // Skip this task or stop the process? Let's stop for now.
            }

            tasks.push({
                name: nameInput.value,
                description: item.querySelector('.gen-task-description').value,
                durationHours: parseFloat(durationInput.value),
                type: parseInt(typeSelect.value)
            });
        });

        // If no tasks were collected (e.g., due to validation failure), stop.
        if (tasks.length === 0) {
            utils.showToast('No valid tasks provided for generation.', 'warning');
            return;
        }

        const generationData = {
            name: document.getElementById('gen-name').value,
            description: document.getElementById('gen-description').value,
            totalDays: parseInt(document.getElementById('gen-days').value),
            dayStartHour: parseInt(document.getElementById('gen-start-hour').value),
            dayEndHour: parseInt(document.getElementById('gen-end-hour').value),
            restHoursBetweenTasks: parseFloat(document.getElementById('gen-rest-hours').value),
            tasks: tasks // Include the collected tasks
        };

        // Basic validation for generation form
        if (!generationData.name || !generationData.totalDays) {
            utils.showToast('Please fill in the schedule name and total days.', 'warning');
            return;
        }

        try {
            const generatedSchedule = await api.generateSchedule(generationData);
            utils.showToast('Schedule generated successfully', 'success');

            // Refresh schedules list and show the generated schedule details
            await scheduleHandlers.loadSchedules();
            if (generatedSchedule && generatedSchedule.id) {
                scheduleHandlers.viewScheduleDetails(generatedSchedule.id);
            } else {
                // If API didn't return the generated schedule ID, go to schedules list
                utils.showView('view-schedules');
            }
        } catch (error) {
            console.error('Failed to generate schedule:', error);
            utils.showToast('Failed to generate schedule', 'danger');
        }
    }
};