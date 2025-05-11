import { elements, appState } from './config.js';

// Utility functions
export const utils = {
    showLoading: () => {
        elements.loading.classList.remove('hidden');
    },

    hideLoading: () => {
        elements.loading.classList.add('hidden');
    },

    showToast: (message, type = 'success') => {
        const toastId = `toast-${appState.toastCounter++}`;
        const toastHtml = `
            <div id="${toastId}" class="toast align-items-center text-white bg-${type} border-0" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body">
                        ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            </div>
        `;
        document.querySelector('.toast-container').insertAdjacentHTML('beforeend', toastHtml);
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement);
        toast.show();

        // Auto-remove toast from DOM after it's hidden
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    },

    showView: (viewId) => {
        // Hide all views
        document.querySelectorAll('.view-section').forEach(view => {
            view.classList.add('hidden');
        });

        // Show the requested view
        const view = document.getElementById(viewId);
        if (view) {
            view.classList.remove('hidden');
            appState.currentView = viewId;

            // Update active navigation link
            document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
                link.classList.remove('active');
            });
            if (viewId === 'view-dashboard') {
                elements.navDashboard.classList.add('active');
            } else if (viewId === 'view-schedules' || viewId === 'view-schedule-details' || viewId === 'view-edit-schedule' || viewId === 'view-edit-task') {
                elements.navSchedules.classList.add('active');
            } else if (viewId === 'view-generate-schedule') {
                elements.navGenerate.classList.add('active');
            }
        }
    },

    formatDatetime: (datetimeStr) => {
        if (!datetimeStr) return 'Not set';
        const date = new Date(datetimeStr);
        // Format date to be compatible with datetime-local input for editing
        const year = date.getFullYear();
        const month = ('0' + (date.getMonth() + 1)).slice(-2);
        const day = ('0' + date.getDate()).slice(-2);
        const hours = ('0' + date.getHours()).slice(-2);
        const minutes = ('0' + date.getMinutes()).slice(-2);
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    },

    displayDatetime: (datetimeStr) => {
        if (!datetimeStr) return 'Not set';
        const date = new Date(datetimeStr);
        return date.toLocaleString();
    },

    getTaskTypeString: (typeId) => {
        const types = ['Physical', 'Mental', 'Free Time', 'Work', 'Study', 'Other'];
        return types[typeId] || 'Unknown';
    },

    getTaskStatusString: (statusId) => {
        const statuses = ['Not Started', 'In Progress', 'Completed', 'On Hold', 'Cancelled'];
        return statuses[statusId] || 'Unknown';
    },

    getTaskStatusClass: (statusId) => {
        const classes = [
            'task-status-not-started',
            'task-status-in-progress',
            'task-status-completed',
            'task-status-on-hold',
            'task-status-cancelled'
        ];
        return classes[statusId] || '';
    },

    getTaskTypeClass: (typeId) => {
        const classes = [
            'task-type-physical',
            'task-type-mental',
            'task-type-freetime',
            'task-type-work',
            'task-type-study',
            'task-type-other'
        ];
        return classes[typeId] || '';
    },

    confirmDelete: (message, callback) => {
        document.getElementById('delete-modal-message').textContent = message;
        appState.deleteCallback = callback;
        elements.deleteModal.show();
    }
};