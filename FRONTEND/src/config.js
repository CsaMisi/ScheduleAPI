// Application configuration
export const config = {
    apiBaseUrl: "https://localhost:7064/api/", // Change to your API's URL
    token: "static-api-token" // You can set this to whatever token value the API expects
};

// DOM elements - used throughout the application
export const elements = {
    // Navigation
    navDashboard: document.getElementById('nav-dashboard'),
    navSchedules: document.getElementById('nav-schedules'),
    navGenerate: document.getElementById('nav-generate'),

    // View sections
    viewDashboard: document.getElementById('view-dashboard'),
    viewSchedules: document.getElementById('view-schedules'),
    viewScheduleDetails: document.getElementById('view-schedule-details'),
    viewEditSchedule: document.getElementById('view-edit-schedule'),
    viewEditTask: document.getElementById('view-edit-task'),
    viewGenerateSchedule: document.getElementById('view-generate-schedule'),

    // Forms
    scheduleForm: document.getElementById('schedule-form'),
    taskForm: document.getElementById('task-form'),
    generateForm: document.getElementById('generate-form'),

    // Containers
    schedulesContainer: document.getElementById('schedules-container'),
    tasksContainer: document.getElementById('tasks-container'),
    genTasksContainer: document.getElementById('gen-tasks-container'),

    // Templates
    genTaskTemplate: document.getElementById('gen-task-template'),

    // Buttons and links
    createScheduleBtn: document.getElementById('create-schedule-btn'),
    gotoSchedules: document.getElementById('goto-schedules'),
    gotoCreateSchedule: document.getElementById('goto-create-schedule'),
    gotoGenerateSchedule: document.getElementById('goto-generate-schedule'),
    backToSchedules: document.getElementById('back-to-schedules'),
    backFromEditSchedule: document.getElementById('back-from-edit-schedule'),
    backFromEditTask: document.getElementById('back-from-edit-task'),
    backFromGenerate: document.getElementById('back-from-generate'),
    addTaskBtn: document.getElementById('add-task-btn'),
    addGenTask: document.getElementById('add-gen-task'),
    editScheduleBtn: document.getElementById('edit-schedule-btn'),
    deleteScheduleBtn: document.getElementById('delete-schedule-btn'),
    exportScheduleBtn: document.getElementById('export-schedule-btn'),
    confirmDelete: document.getElementById('confirm-delete'),

    // Detail elements
    scheduleDetailTitle: document.getElementById('schedule-detail-title'),
    detailScheduleName: document.getElementById('detail-schedule-name'),
    detailScheduleDescription: document.getElementById('detail-schedule-description'),
    detailScheduleDays: document.getElementById('detail-schedule-days'),
    detailScheduleTaskCount: document.getElementById('detail-schedule-task-count'),
    scheduleCount: document.getElementById('schedule-count'),

    // Modals
    deleteModal: new bootstrap.Modal(document.getElementById('deleteModal')),

    // Loading
    loading: document.getElementById('loading')
};

// Application state
export const appState = {
    currentView: null,
    currentSchedule: null,
    currentTask: null,
    deleteCallback: null,
    schedules: [],
    toastCounter: 0
};