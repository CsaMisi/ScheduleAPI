import * as api from './api.js';
import { taskTypes, taskStatuses, updateTaskList, showTaskUpdateModal } from './taskManager.js';
import { displaySchedule, addScheduleManagementButtons, showSchedulesList, showScheduleEditModal } from './scheduleManager.js';

document.addEventListener('DOMContentLoaded', function() {
    // Store current schedule ID
    let currentScheduleId = null;
    
    // DOM elements
    const taskForm = document.getElementById('taskForm');
    const taskList = document.getElementById('taskList');
    const scheduleForm = document.getElementById('scheduleForm');
    const scheduleTable = document.getElementById('scheduleTable');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const scheduleSection = document.getElementById('scheduleSection');
    
    // Add event listeners
    taskForm.addEventListener('submit', handleAddTask);
    scheduleForm.addEventListener('submit', handleGenerateSchedule);
    
    // Add event listener for refresh tasks button if it exists
    const refreshTasksButton = document.getElementById('refreshTasksButton');
    if (refreshTasksButton) {
        refreshTasksButton.addEventListener('click', handleLoadTasks);
    }
    
    // Add event listener for view schedules button if it exists
    const viewSchedulesButton = document.getElementById('viewSchedulesButton');
    if (viewSchedulesButton) {
        viewSchedulesButton.addEventListener('click', handleViewSchedules);
    }
    
    // Add event listeners for custom events
    document.addEventListener('tasks-updated', handleLoadTasks);
    document.addEventListener('schedule-selected', handleScheduleSelected);
    document.addEventListener('schedule-updated', handleScheduleUpdated);
    document.addEventListener('schedule-deleted', handleScheduleDeleted);
    document.addEventListener('schedules-updated', handleSchedulesUpdated);
    
    // Initialize by loading tasks from API
    handleLoadTasks();
    
    /**
     * Handle loading tasks
     */
    async function handleLoadTasks() {
        try {
            const tasks = await api.loadTasks();
            updateTaskList(tasks, taskList, currentScheduleId);
        } catch (error) {
            console.error('Error loading tasks:', error);
            // Show a more user-friendly message
            taskList.innerHTML = '<li class="list-group-item text-danger">Nem sikerült betölteni a tevékenységeket. Ellenőrizze, hogy a backend fut-e.</li>';
        }
    }
    
    /**
     * Handle adding a new task
     */
    async function handleAddTask(e) {
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
            await api.createTask(task);
            
            // Reload tasks after adding
            handleLoadTasks();
            
            // Reset form
            taskForm.reset();
            
        } catch (error) {
            console.error('Error adding task:', error);
            alert(`Hiba történt a tevékenység hozzáadása során: ${error.message}`);
        }
    }
    
    /**
     * Handle generating a schedule
     */
    async function handleGenerateSchedule(e) {
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
            const tasks = await api.loadTasks();
            
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
            const schedule = await api.generateSchedule(scheduleData);
            console.log('Received schedule from API:', schedule);
            
            // Store current schedule ID
            currentScheduleId = schedule.ID;
            
            // Display the schedule
            displaySchedule(schedule, dayStartHour, dayEndHour, scheduleTable, currentScheduleId);
            
            // Update UI to show we have a schedule now
            scheduleSection.classList.remove('d-none');
            
            // Add schedule management buttons
            addScheduleManagementButtons(schedule.ID, scheduleTable, scheduleSection);
            
        } catch (error) {
            console.error('Error generating schedule:', error);
            alert(`Hiba történt az ütemezés generálása során: ${error.message}. Ellenőrizze, hogy a backend fut-e a http://localhost:5173 címen.`);
        } finally {
            // Hide loading spinner
            loadingSpinner.classList.add('d-none');
        }
    }
    
    /**
     * Handle viewing schedules
     */
    async function handleViewSchedules() {
        const schedules = await api.loadSchedules();
        showSchedulesList(schedules, scheduleTable, scheduleSection);
    }
    
    /**
     * Handle schedule selection
     */
    function handleScheduleSelected(event) {
        const { scheduleId, schedule } = event.detail;
        currentScheduleId = scheduleId;
    }
    
    /**
     * Handle schedule updates
     */
    function handleScheduleUpdated(event) {
        const { schedule } = event.detail;
        if (currentScheduleId === schedule.ID) {
            displaySchedule(schedule, 8, 22, scheduleTable, currentScheduleId);
        }
    }
    
    /**
     * Handle schedule deletion
     */
    function handleScheduleDeleted(event) {
        const { scheduleId } = event.detail || { scheduleId: null };
        
        if (currentScheduleId === scheduleId || scheduleId === null) {
            scheduleTable.innerHTML = '';
            scheduleSection.classList.add('d-none');
            currentScheduleId = null;
        }
    }
    
    /**
     * Handle schedules list updates
     */
    function handleSchedulesUpdated(event) {
        const { schedules } = event.detail;
        
        // Update schedules list if it's visible
        const schedulesList = document.getElementById('schedulesList');
        if (schedulesList && !schedulesList.querySelector('.text-center.text-muted')) {
            showSchedulesList(schedules, scheduleTable, scheduleSection);
        }
    }
});