import { elements, appState } from './config.js';
import { utils } from './common.js';
import { scheduleHandlers } from './scheduleHandlers.js';
import { taskHandlers } from './taskHandlers.js';
import { generationHandlers } from './generationHandlers.js';

// Event Listeners
export const setupEventListeners = () => {
    // Navigation
    elements.navDashboard.addEventListener('click', (e) => {
        e.preventDefault();
        utils.showView('view-dashboard');
        // No need to load data for dashboard initially, but could add summary calls here later
    });

    elements.navSchedules.addEventListener('click', (e) => {
        e.preventDefault();
        utils.showView('view-schedules');
        scheduleHandlers.loadSchedules(); // Load schedules when navigating to the list
    });

    elements.navGenerate.addEventListener('click', (e) => {
        e.preventDefault();
        utils.showView('view-generate-schedule');
        generationHandlers.initGenerateForm(); // Initialize the generate form
    });

    // Dashboard Quick Actions
    elements.gotoSchedules.addEventListener('click', (e) => {
        e.preventDefault();
        utils.showView('view-schedules');
        scheduleHandlers.loadSchedules();
    });

    elements.gotoCreateSchedule.addEventListener('click', (e) => {
        e.preventDefault();
        scheduleHandlers.newSchedule(); // Go to new schedule form
    });

    elements.gotoGenerateSchedule.addEventListener('click', (e) => {
        e.preventDefault();
        utils.showView('view-generate-schedule');
        generationHandlers.initGenerateForm();
    });

    // Schedules List View
    elements.createScheduleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        scheduleHandlers.newSchedule(); // Go to new schedule form
    });

    // Schedule Details View
    elements.backToSchedules.addEventListener('click', (e) => {
        e.preventDefault();
        utils.showView('view-schedules');
        // Schedules list should already be loaded, but can refresh if needed:
        // scheduleHandlers.loadSchedules();
    });

    elements.addTaskBtn.addEventListener('click', (e) => {
        e.preventDefault();
        // Pass null to editTask to indicate adding a new task
        taskHandlers.editTask(null);
    });

    elements.editScheduleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        scheduleHandlers.editSchedule(); // Go to edit schedule form for the current schedule
    });

    elements.deleteScheduleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        scheduleHandlers.confirmDeleteSchedule(); // Show delete confirmation modal
    });

    elements.exportScheduleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        scheduleHandlers.exportSchedule(); // Export the current schedule
    });

    // Create/Edit Schedule View
    elements.scheduleForm.addEventListener('submit', (e) => {
        scheduleHandlers.createOrUpdateSchedule(e); // Handle form submission
    });

    elements.backFromEditSchedule.addEventListener('click', (e) => {
        e.preventDefault();
        // After editing/creating, go back to the schedule details (if editing) or schedules list (if creating)
        if (appState.currentSchedule && document.getElementById('edit-schedule-id').value) {
            scheduleHandlers.viewScheduleDetails(appState.currentSchedule.id);
        } else {
            // If creating a new schedule, go back to the list
            utils.showView('view-schedules');
            scheduleHandlers.loadSchedules(); // Refresh list after potential creation
        }
    });

    // Create/Edit Task View
    elements.taskForm.addEventListener('submit', (e) => {
        taskHandlers.createOrUpdateTask(e); // Handle form submission
    });

    elements.backFromEditTask.addEventListener('click', (e) => {
        e.preventDefault();
        // After editing/creating, go back to the schedule details
        if (appState.currentSchedule) {
            scheduleHandlers.viewScheduleDetails(appState.currentSchedule.id);
        } else {
            // Fallback in case currentSchedule is somehow null
            utils.showView('view-schedules');
            scheduleHandlers.loadSchedules();
        }
    });

    // Generate Schedule View
    elements.addGenTask.addEventListener('click', (e) => {
        e.preventDefault();
        generationHandlers.addGenerationTask(); // Add a new task input to the generate form
    });

    elements.generateForm.addEventListener('submit', (e) => {
        generationHandlers.generateSchedule(e); // Handle generate form submission
    });

    elements.backFromGenerate.addEventListener('click', (e) => {
        e.preventDefault();
        utils.showView('view-dashboard'); // Go back to dashboard after generating
    });

    // Delete Confirmation Modal
    elements.confirmDelete.addEventListener('click', () => {
        if (appState.deleteCallback) {
            appState.deleteCallback(); // Execute the stored delete callback
        }
        elements.deleteModal.hide(); // Hide the modal
    });
};