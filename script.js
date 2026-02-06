const teamMembers = [
    {
        id: 1,
        name: "Alice Johnson",
        role: "Frontend Dev",
        avatar: "https://ui-avatars.com/api/?name=Alice+Johnson&background=fca5a5&color=fff",
        status: "In Progress",
        statusColor: "#f59e0b",
        yesterday: "Completed the login form validation and unit tests.",
        today: "Working on the dashboard sidebar responsive layout.",
        blockers: "None"
    },
    {
        id: 2,
        name: "Bob Smith",
        role: "Backend Dev",
        avatar: "https://ui-avatars.com/api/?name=Bob+Smith&background=60a5fa&color=fff",
        status: "Done",
        statusColor: "#10b981",
        yesterday: "Fixed API latency issue in user profile endpoint.",
        today: "Reviewing PRs and documentation.",
        blockers: "None"
    },
    {
        id: 3,
        name: "Charlie Brown",
        role: "UI/UX Designer",
        avatar: "https://ui-avatars.com/api/?name=Charlie+Brown&background=a78bfa&color=fff",
        status: "Blocked",
        statusColor: "#ef4444",
        yesterday: "Designed the new settings page wireframes.",
        today: "Waiting for feedback on the wireframes.",
        blockers: "Waiting for PM approval on design."
    },
    {
        id: 4,
        name: "Dave Wilson",
        role: "Full Stack",
        avatar: "https://ui-avatars.com/api/?name=Dave+Wilson&background=34d399&color=fff",
        status: "In Progress",
        statusColor: "#f59e0b",
        yesterday: "Integrated payment gateway.",
        today: "Debugging webhook failures.",
        blockers: "Webhook documentation is outdated."
    }
];

let tasks = [
    { id: "t1", title: "Design Login Page", assignee: "Charlie Brown", status: "done", priority: "high" },
    { id: "t2", title: "Setup React Router", assignee: "Alice Johnson", status: "done", priority: "medium" },
    { id: "t3", title: "Create API Endpoints", assignee: "Bob Smith", status: "progress", priority: "high" },
    { id: "t4", title: "Database Schema Draft", assignee: "Bob Smith", status: "todo", priority: "medium" },
    { id: "t5", title: "Fix CSS variables", assignee: "Alice Johnson", status: "progress", priority: "low" },
    { id: "t6", title: "Research AWS deployment", assignee: "Dave Wilson", status: "todo", priority: "high" }
];

// STATE MANAGEMENT
let draggedTaskId = null;

// DOM LOADED
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    // Re-render chart on window resize to fix resolution issues
    window.addEventListener('resize', () => {
        if (document.getElementById('burndown-view').classList.contains('active')) {
            renderBurndownChart();
        }
    });
});

function initApp() {
    updateDate();
    setupNavigation();
    renderDashboard();
    renderTeam();
    renderBoard();
    renderUpdates();
    renderBlockers();
    // renderBurndownChart(); // Removed from init as it renders with 0 size when hidden
}

// DATE DISPLAY
function updateDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = new Date().toLocaleDateString('en-US', options);
    document.getElementById('current-date').textContent = dateStr;
}

// NAVIGATION Logic
function setupNavigation() {
    const menuItems = document.querySelectorAll('.menu-item');
    const sections = document.querySelectorAll('.view-section');

    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();

            // Remove active class from all items
            menuItems.forEach(i => i.classList.remove('active'));
            // Add active class to clicked item
            item.classList.add('active');

            // Hide all sections
            sections.forEach(section => {
                section.classList.remove('active');
                section.classList.add('hidden');
            });

            // Show target section
            const viewId = item.getAttribute('data-view') + '-view';
            const target = document.getElementById(viewId);
            if (target) {
                target.classList.remove('hidden');
                target.classList.add('active');

                // Logic specifically for views that need re-rendering or size calculation
                if (viewId === 'burndown-view') {
                    // Small timeout to ensure DOM is painted and has dimensions
                    setTimeout(renderBurndownChart, 50);
                }
            }
        });
    });

    // Start Meeting Button
    document.querySelector('.start-meeting-btn').addEventListener('click', () => {
        startMeeting();
    });

    // End Meeting Button
    document.getElementById('end-meeting-btn').addEventListener('click', () => {
        endMeeting();
    });

    // Sidebar Toggle
    const sidebar = document.querySelector('.sidebar');
    const toggleBtn = document.getElementById('sidebar-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }

    // Fullscreen Toggle Logic
    function toggleFullscreen(btn) {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }

    const globalFullscreenBtn = document.getElementById('global-fullscreen-btn');
    const meetingFullscreenBtn = document.getElementById('fullscreen-btn');

    if (globalFullscreenBtn) {
        globalFullscreenBtn.addEventListener('click', () => toggleFullscreen(globalFullscreenBtn));
    }
    if (meetingFullscreenBtn) {
        meetingFullscreenBtn.addEventListener('click', () => toggleFullscreen(meetingFullscreenBtn));
    }

    // Listen for fullscreen change to sync icons
    document.addEventListener('fullscreenchange', () => {
        const isFullscreen = !!document.fullscreenElement;
        const iconClass = isFullscreen ? 'fa-compress' : 'fa-expand';

        if (globalFullscreenBtn) globalFullscreenBtn.querySelector('i').className = `fa-solid ${iconClass}`;
        if (meetingFullscreenBtn) meetingFullscreenBtn.querySelector('i').className = `fa-solid ${iconClass}`;
    });

    // Meeting Sidebar Toggle
    const meetingInfoBtn = document.getElementById('meeting-info-btn');
    const meetingContainer = document.querySelector('.meeting-container');
    if (meetingInfoBtn && meetingContainer) {
        meetingInfoBtn.addEventListener('click', () => {
            meetingContainer.classList.toggle('sidebar-open');
            meetingInfoBtn.classList.toggle('active', meetingContainer.classList.contains('sidebar-open'));
        });
    }

    // Meeting control active states
    const toggleButtons = ['meeting-mic-btn', 'meeting-video-btn', 'meeting-screen-btn'];
    toggleButtons.forEach((btnId) => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.addEventListener('click', () => {
                btn.classList.toggle('active');
            });
        }
    });
}

function startMeeting() {
    // Hide current active section
    document.querySelectorAll('.view-section').forEach(s => {
        s.classList.remove('active');
        s.classList.add('hidden');
    });

    // Show meeting view
    const meetingView = document.getElementById('meeting-view');
    meetingView.classList.remove('hidden');
    meetingView.classList.add('active');

    // Populate Video Grid
    renderMeetingRoom();
}

function endMeeting() {
    // Go back to dashboard
    document.querySelector('[data-view="dashboard"]').click();
}

function renderMeetingRoom() {
    const videoGrid = document.getElementById('meeting-video-grid');
    const participantsList = document.getElementById('meeting-participants-list');

    // Current user (Scrum Master) + Team Members
    const participants = [
        { name: "Scrum Master (You)", role: "Admin", avatar: "https://ui-avatars.com/api/?name=Admin+User&background=3b82f6&color=fff" },
        ...teamMembers
    ];

    // Render Video Slots
    videoGrid.innerHTML = participants.map(p => `
        <div class="video-slot">
            <img src="${p.avatar.replace('24px', '400px').replace('width:24px; height:24px;', '')}" alt="${p.name}">
            <div class="name-tag">${p.name}</div>
        </div>
    `).join('');

    // Render Participants Sidebar
    participantsList.innerHTML = participants.map(p => `
        <div class="participant-item">
            <img src="${p.avatar}" alt="${p.name}">
            <div class="info">
                <span class="p-name">${p.name}</span>
                <span class="p-role">${p.role}</span>
            </div>
            <div class="p-mic"><i class="fa-solid fa-microphone"></i></div>
        </div>
    `).join('');
}

// RENDER DASHBOARD
function renderDashboard() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'done').length;
    const progress = tasks.filter(t => t.status === 'progress').length;
    const todo = tasks.filter(t => t.status === 'todo').length; // Treating 'todo' generally or potentially blocked if marked

    // Check for "Blocked" tasks in our task list logic if we had a specific 'blocked' status,
    // but for now let's use the Team status blocked count for the 'Blocked' card or deduce from tasks.
    // Let's deduce "Blocked" count from team members status for diversity.
    const blockedCount = teamMembers.filter(m => m.status === 'Blocked').length;

    document.querySelector('#stat-total .value').textContent = total;
    document.querySelector('#stat-completed .value').textContent = completed;
    document.querySelector('#stat-progress .value').textContent = progress;
    document.querySelector('#stat-blocked .value').textContent = blockedCount;

    // Add click events to stat cards
    document.getElementById('stat-total').onclick = () => showTasks('total');
    document.getElementById('stat-completed').onclick = () => showTasks('completed');
    document.getElementById('stat-progress').onclick = () => showTasks('progress');
    document.getElementById('stat-blocked').onclick = () => showTasks('blocked');

    // Render Recent Activity (Mock)
    const activities = [
        "Alice moved 'Design Login' to Done",
        "Bob commented on 'API Endpoints'",
        "Charlie raised a blocker: Design Approval",
        "Dave pushed code to branch 'feature/payment'"
    ];

    const activityList = document.getElementById('recent-activity-list');
    activityList.innerHTML = activities.map(act => `
        <li style="padding: 0.5rem 0; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem;">
            <i class="fa-solid fa-circle-dot" style="font-size: 8px; color: var(--primary-color); margin-right: 8px;"></i>
            ${act}
        </li>
    `).join('');

    // Team Availability Widget
    const availabilityList = document.getElementById('team-availability-list');
    availabilityList.innerHTML = teamMembers.map(m => `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid rgba(0,0,0,0.03);">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
                <img src="${m.avatar}" style="width:28px; height:28px; border-radius:8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <span style="font-size: 0.95rem; font-weight: 600;">${m.name}</span>
            </div>
            <span style="font-size: 0.7rem; padding: 4px 10px; border-radius: 1rem; background: ${m.statusColor}15; color: ${m.statusColor}; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; box-shadow: 0 0 10px ${m.statusColor}20;">
                ${m.status}
            </span>
        </div>
    `).join('');
}

// SHOW TASKS IN MODAL
function showTasks(type) {
    let filteredTasks = [];
    let title = "";
    let icon = "";
    let color = "";

    if (type === 'total') {
        filteredTasks = tasks;
        title = "All Sprint Tasks";
        icon = "fa-clipboard-list";
        color = "var(--primary-color)";
    } else if (type === 'completed') {
        filteredTasks = tasks.filter(t => t.status === 'done');
        title = "Completed Tasks";
        icon = "fa-check-circle";
        color = "var(--success-color)";
    } else if (type === 'progress') {
        filteredTasks = tasks.filter(t => t.status === 'progress');
        title = "Tasks In Progress";
        icon = "fa-spinner";
        color = "var(--warning-color)";
    } else if (type === 'blocked') {
        const blockedMemberNames = teamMembers.filter(m => m.status === 'Blocked').map(m => m.name);
        filteredTasks = tasks.filter(t => blockedMemberNames.includes(t.assignee));
        title = "Blocked Tasks";
        icon = "fa-ban";
        color = "var(--danger-color)";
    }

    const modal = document.getElementById('task-modal');
    modal.querySelector('.modal-header').innerHTML = `
        <div style="background: ${color}15; color: ${color}; width: 60px; height: 60px; border-radius: 1.5rem; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; box-shadow: 0 4px 12px ${color}20;">
            <i class="fa-solid ${icon}"></i>
        </div>
        <div>
            <h2 id="modal-name">${title}</h2>
            <p id="modal-role" style="color: ${color}; font-weight: 700;">${filteredTasks.length} items found</p>
        </div>
    `;

    const tasksHtml = filteredTasks.map(t => `
        <div class="modal-task-item">
            <div class="task-header">
                <span class="task-title">${t.title}</span>
                <span class="status-indicator" style="background: ${t.priority === 'high' ? '#ef4444' : t.priority === 'medium' ? '#f59e0b' : '#10b981'}15; color: ${t.priority === 'high' ? '#ef4444' : t.priority === 'medium' ? '#f59e0b' : '#10b981'};">
                    ${t.priority.toUpperCase()}
                </span>
            </div>
            <div class="task-assignee">
                <i class="fa-solid fa-user-circle"></i> ${t.assignee}
            </div>
        </div>
    `).join('');

    modal.querySelector('.modal-body').innerHTML = `
        <div class="modal-task-list">
            ${filteredTasks.length > 0 ? tasksHtml : '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No tasks found.</p>'}
        </div>
    `;

    modal.classList.remove('hidden');
}

// RENDER TEAM MEMBERS
function renderTeam() {
    const grid = document.getElementById('team-grid');
    grid.innerHTML = teamMembers.map(member => `
        <div class="team-card" onclick="openTeamModal(${member.id})">
            <img src="${member.avatar}" alt="${member.name}">
            <h3>${member.name}</h3>
            <p>${member.role}</p>
            <span class="status-indicator" style="background-color: ${member.statusColor}20; color: ${member.statusColor}">
                ${member.status}
            </span>
        </div>
    `).join('');
}

// TEAM MODAL logic
window.openTeamModal = function (id) {
    const member = teamMembers.find(m => m.id === id);
    if (!member) return;

    const modal = document.getElementById('team-modal');
    document.getElementById('modal-avatar').src = member.avatar;
    document.getElementById('modal-name').textContent = member.name;
    document.getElementById('modal-role').textContent = member.role;
    document.getElementById('modal-yesterday').textContent = member.yesterday;
    document.getElementById('modal-today').textContent = member.today;
    document.getElementById('modal-blockers').textContent = member.blockers;

    modal.classList.remove('hidden');
};

// MODAL CLOSING LOGIC
document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal');
        if (modal) modal.classList.add('hidden');
    });
});

// Close modal on outside click
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    });
});

// RENDER SCRUM BOARD
function renderBoard() {
    const todoList = document.getElementById('list-todo');
    const progressList = document.getElementById('list-progress');
    const doneList = document.getElementById('list-done');

    // Clear lists
    todoList.innerHTML = '';
    progressList.innerHTML = '';
    doneList.innerHTML = '';

    // Filter and Render
    renderColumn(tasks.filter(t => t.status === 'todo'), todoList);
    renderColumn(tasks.filter(t => t.status === 'progress'), progressList);
    renderColumn(tasks.filter(t => t.status === 'done'), doneList);

    // Update counts
    document.getElementById('count-todo').textContent = tasks.filter(t => t.status === 'todo').length;
    document.getElementById('count-progress').textContent = tasks.filter(t => t.status === 'progress').length;
    document.getElementById('count-done').textContent = tasks.filter(t => t.status === 'done').length;
}

function renderColumn(taskList, container) {
    taskList.forEach(task => {
        const card = document.createElement('div');
        card.className = `task-card priority-${task.priority}`;
        card.draggable = true;
        card.id = task.id;

        card.innerHTML = `
            <div class="task-title">${task.title}</div>
            <div class="task-meta">
                <span><i class="fa-solid fa-user-circle"></i> ${task.assignee.split(' ')[0]}</span>
                <span>${task.priority.toUpperCase()}</span>
            </div>
        `;

        // Drag start event
        card.addEventListener('dragstart', (e) => {
            draggedTaskId = task.id;
            e.dataTransfer.setData("text/plain", task.id);
            setTimeout(() => card.style.opacity = '0.5', 0);
        });

        // Drag end event
        card.addEventListener('dragend', () => {
            card.style.opacity = '1';
            draggedTaskId = null;
        });

        container.appendChild(card);
    });
}

// DRAG AND DROP HANDLERS (Global)
window.allowDrop = function (ev) {
    ev.preventDefault();
}

window.drop = function (ev) {
    ev.preventDefault();
    const targetCol = ev.target.closest('.column');
    if (!targetCol) return;

    let newStatus = '';
    if (targetCol.id === 'col-todo') newStatus = 'todo';
    if (targetCol.id === 'col-progress') newStatus = 'progress';
    if (targetCol.id === 'col-done') newStatus = 'done';

    if (newStatus && draggedTaskId) {
        // Update data
        const taskIndex = tasks.findIndex(t => t.id === draggedTaskId);
        if (taskIndex > -1) {
            tasks[taskIndex].status = newStatus;
            renderBoard(); // Re-render board
            renderDashboard(); // Re-render stats
        }
    }
}

// RENDER DAILY UPDATES
function renderUpdates() {
    const list = document.getElementById('updates-list');
    list.innerHTML = teamMembers.map(m => `
        <div class="update-item">
            <img src="${m.avatar}" style="width:40px; height:40px; border-radius:50%;">
            <div>
                <div style="font-weight:600; margin-bottom:4px;">${m.name}</div>
                <div style="font-size:0.9rem; color:#475569;">
                    <strong>Today:</strong> ${m.today}
                </div>
            </div>
        </div>
    `).join('');
}

// RENDER BLOCKERS
function renderBlockers() {
    const list = document.getElementById('blockers-list');
    const blockers = teamMembers.filter(m => m.blockers && m.blockers !== "None");

    if (blockers.length === 0) {
        list.innerHTML = '<p style="color:#64748b;">No active blockers reported! 🎉</p>';
        return;
    }

    list.innerHTML = blockers.map(m => `
        <div class="blocker-item">
            <h4 style="margin-bottom:0.5rem;">${m.name} is blocked</h4>
            <p>${m.blockers}</p>
        </div>
    `).join('');
}

// BURNDOWN CHART (Canvas API)
function renderBurndownChart() {
    const canvas = document.getElementById('burndownCanvas');
    const container = canvas.parentElement; // Use parent for sizing
    const ctx = canvas.getContext('2d');

    // Resize canvas for high DPI and container size
    const dpr = window.devicePixelRatio || 1;
    // Get width/height from the container
    const width = container.clientWidth;
    const height = container.clientHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    // CSS size
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    ctx.scale(dpr, dpr);

    const padding = 60;
    const graphWidth = width - (padding * 2);
    const graphHeight = height - (padding * 2);

    // Mock Data points (Day 0 to 10)
    const idealData = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0];
    const actualData = [100, 95, 88, 75, 68, 55, 48, 40, 25, 20, 15]; // Changed slightly for variety
    const labels = ["Day 0", "Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7", "Day 8", "Day 9", "Day 10"];
    const days = 10;
    const maxValue = 100;

    // Helper: Map data to coordinates
    const getX = (i) => padding + (i * (graphWidth / days));
    const getY = (val) => (height - padding) - (val * (graphHeight / maxValue));

    // Clear
    ctx.clearRect(0, 0, width, height);

    // ================= GRID & AXES =================
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.font = '12px Inter';
    ctx.fillStyle = '#94a3b8';

    // Y Grid & Labels
    const steps = 5; // 0, 20, 40, 60, 80, 100
    for (let i = 0; i <= steps; i++) {
        const val = i * (maxValue / steps);
        const y = getY(val);

        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();

        ctx.textAlign = 'right';
        ctx.fillText(val, padding - 10, y + 4);
    }

    // X Labels
    for (let i = 0; i <= days; i++) {
        const x = getX(i);
        ctx.textAlign = 'center';
        ctx.fillText(i, x, height - padding + 20);
    }
    // X Axis Label Text
    ctx.fillText("Sprint Days", width / 2, height - 10);

    // Y Axis Label Text
    ctx.save();
    ctx.translate(20, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText("Remaining Effort (%)", 0, 0);
    ctx.restore();

    // ================= IDEAL LINE =================
    ctx.beginPath();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.moveTo(getX(0), getY(idealData[0]));
    for (let i = 1; i <= days; i++) {
        ctx.lineTo(getX(i), getY(idealData[i]));
    }
    ctx.stroke();

    // ================= ACTUAL AREA (Gradient) =================
    const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.2)'); // Blue with opacity
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');

    ctx.beginPath();
    ctx.moveTo(getX(0), getY(actualData[0]));
    for (let i = 1; i <= days; i++) {
        ctx.lineTo(getX(i), getY(actualData[i]));
    }
    // Close path for fill
    ctx.lineTo(getX(days), height - padding);
    ctx.lineTo(getX(0), height - padding);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // ================= ACTUAL LINE =================
    ctx.beginPath();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.setLineDash([]);
    ctx.lineJoin = 'round';
    ctx.moveTo(getX(0), getY(actualData[0]));
    for (let i = 1; i <= days; i++) {
        ctx.lineTo(getX(i), getY(actualData[i]));
    }
    ctx.stroke();

    // ================= POINTS =================
    for (let i = 0; i <= days; i++) {
        const x = getX(i);
        const y = getY(actualData[i]);

        // Glow effect
        ctx.shadowColor = 'rgba(59, 130, 246, 0.5)';
        ctx.shadowBlur = 10;

        ctx.beginPath();
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.shadowBlur = 0; // Reset shadow
    }
}
