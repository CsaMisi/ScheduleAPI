document.addEventListener('DOMContentLoaded', function() {
    // API endpoint
    const API_URL = 'http://localhost:5173/api';
    
    // Task types mapping
    const taskTypes = [
        'Physical',
        'Mental',
        'FreeTime',
        'Work',
        'Study',
        'Other'
    ];
    
    // Store tasks in memory
    let tasks = [];
    
    // DOM elements
    const taskForm = document.getElementById('taskForm');
    const taskList = document.getElementById('taskList');
    const scheduleForm = document.getElementById('scheduleForm');
    const scheduleTable = document.getElementById('scheduleTable');
    const loadingSpinner = document.getElementById('loadingSpinner');
    
    // Add event listeners
    taskForm.addEventListener('submit', addTask);
    scheduleForm.addEventListener('submit', generateSchedule);
    
    /**
     * Add a new task to the list
     */
    async function addTask(e) {
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
            type
        };
        
        // Add to tasks array
        tasks.push(task);
        
        // Update UI
        updateTaskList();
        
        // Reset form
        taskForm.reset();
    }
    
    /**
     * Update the task list display
     */
    function updateTaskList() {
        taskList.innerHTML = '';
        
        if (tasks.length === 0) {
            taskList.innerHTML = '<li class="list-group-item">Nincsenek hozzáadott tevékenységek</li>';
            return;
        }
        
        tasks.forEach((task, index) => {
            const li = document.createElement('li');
            li.className = 'list-group-item task-item';
            
            // Create task info div
            const taskInfo = document.createElement('div');
            taskInfo.innerHTML = `
                <strong>${task.name}</strong> (${task.durationHours} óra)
                <span class="badge bg-secondary">${taskTypes[task.type]}</span>
                ${task.description ? `<small class="text-muted d-block">${task.description}</small>` : ''}
            `;
            
            // Create delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-sm btn-danger';
            deleteBtn.textContent = 'Törlés';
            deleteBtn.addEventListener('click', () => {
                tasks.splice(index, 1);
                updateTaskList();
            });
            
            // Append elements
            li.appendChild(taskInfo);
            li.appendChild(deleteBtn);
            taskList.appendChild(li);
        });
    }
    
    /**
     * Generate schedule based on tasks and settings
     */
    async function generateSchedule(e) {
        e.preventDefault();
        
        // Check if we have tasks
        if (tasks.length === 0) {
            alert('Kérem adjon hozzá legalább egy tevékenységet!');
            return;
        }
        
        // Get form values
        const name = document.getElementById('scheduleName').value;
        const totalDays = parseInt(document.getElementById('totalDays').value);
        const dayStartHour = parseInt(document.getElementById('dayStartHour').value);
        const dayEndHour = parseInt(document.getElementById('dayEndHour').value);
        const minRestHours = parseInt(document.getElementById('minRestHours').value);
        
        // Create schedule data
        const scheduleData = {
            name,
            description: 'Generated schedule',
            totalDays,
            dayStartHour,
            dayEndHour,
            minRestHours,
            tasks: tasks.map(task => ({
                name: task.name,
                description: task.description,
                durationHours: task.durationHours,
                type: task.type
            }))
        };
        
        // Show loading spinner
        loadingSpinner.classList.remove('d-none');
        
        try {
            // Use the API
            console.log('Sending request to API:', scheduleData);
            const response = await fetch(`${API_URL}/Schedules/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(scheduleData)
            });
            
            if (!response.ok) {
                console.error('API Response not OK:', response.status, response.statusText);
                throw new Error(`Failed to generate schedule: ${response.status} ${response.statusText}`);
            }
            
            const schedule = await response.json();
            console.log('Received schedule from API:', schedule);
            
            // Display the schedule
            displaySchedule(schedule, dayStartHour, dayEndHour);
        } catch (error) {
            console.error('Error generating schedule:', error);
            alert(`Hiba történt az ütemezés generálása során: ${error.message}. Ellenőrizze, hogy a backend fut-e a http://localhost:5173 címen.`);
            
            // Since we're getting CORS errors, show helpful troubleshooting info
            console.log('CORS Troubleshooting Info:');
            console.log('- Make sure your backend is running on http://localhost:5173');
            console.log('- Check that CORS is properly configured in your backend');
            console.log('- Try running your frontend from the same origin as your backend');
        } finally {
            // Hide loading spinner
            loadingSpinner.classList.add('d-none');
        }
        
    }
    
    /**
     * Display the generated schedule in a table
     */
    function displaySchedule(schedule, dayStartHour, dayEndHour) {

        console.log("tasks form sched:" ,schedule.task)
        console.log(dayStartHour , ", " , dayEndHour)
        console.log(schedule)
        const tasks = schedule.tasks.$values || [];
        console.log(tasks)
        console.log(schedule.totalDays)
        const totalDays = schedule.TotalDays;
        console.log(totalDays)
        
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
        console.log(tasks.$values)
        if (tasks.length > 0) {                        
            for (let index = 0; index < tasks.length; index++){
                if (tasks[index].ScheduledDay && tasks[index].ScheduledStartTime && tasks[index].ScheduledEndTime) {
                    // Parse scheduled times
                    const startTime = new Date(tasks[index].ScheduledStartTime);
                    const endTime = new Date(tasks[index].ScheduledEndTime);
                    const startHour = startTime.getHours();
                    const endHour = endTime.getHours();
                    const duration = tasks[index].DurationHours;
                    const day = tasks[index].ScheduledDay;
                    
                    // Find cell for the task's start time
                    const dayCell = table.querySelector(`td[data-day="${day}"][data-hour="${startHour}"]`);
                    
                    if (dayCell) {
                        // Set task styling
                        dayCell.className = `task-cell task-type-${tasks[index].Type}`;
                        dayCell.rowSpan = duration; // Merge cells vertically based on duration
                        
                        // Add task content
                        dayCell.innerHTML = `
                            <div class="task-name">${tasks[index].Name}</div>
                            <div class="task-duration">${duration} óra</div>
                            ${tasks[index].description ? `<div class="task-description">${tasks[index].Description}</div>` : ''}
                        `;
                        
                        // Remove cells that are now covered by the rowspan
                        for (let h = 1; h < duration; h++) {
                            const cellToRemove = table.querySelector(`td[data-day="${day}"][data-hour="${startHour + h}"]`);
                            if (cellToRemove) {
                                cellToRemove.remove();
                            }
                        }
                    }
                }
            }
        }
    }
    
    // Initialize task list
    updateTaskList();
});