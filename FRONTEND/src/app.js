import { utils } from './common.js';
import { scheduleHandlers } from './scheduleHandlers.js';
import { setupEventListeners } from './eventListeners.js';

// Initialization
const init = () => {
    setupEventListeners(); // Set up all event listeners
    utils.showView('view-dashboard'); // Show the dashboard view initially
    scheduleHandlers.loadSchedules(); // Load schedules on application start
};

// Run initialization when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);