// Settings Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Check password protection for settings access
    const settings = JSON.parse(localStorage.getItem('diarySettings') || '{}');
    if (settings.passwordProtection && settings.password) {
        const sessionAuth = sessionStorage.getItem('diaryAuth');
        if (!sessionAuth || sessionAuth !== 'authenticated') {
            // Redirect back to main app for authentication
            window.location.href = 'index.html';
            return;
        }
    }
    
    initializeSettings();
    setupEventListeners();
    loadSettings();
});

function initializeSettings() {
    // Initialize any default settings if needed
    console.log('Settings page initialized');
}

function setupEventListeners() {
    // Back button
    document.getElementById('backButton').addEventListener('click', function() {
        // Disable any beforeunload warnings
        window.onbeforeunload = null;
        window.location.href = 'index.html';
    });

    // Theme selector
    document.getElementById('themeSelect').addEventListener('change', function() {
        saveSettings();
        applyTheme(this.value);
    });

    // Font size slider
    const fontSizeRange = document.getElementById('fontSizeRange');
    const fontSizeValue = document.getElementById('fontSizeValue');
    
    fontSizeRange.addEventListener('input', function() {
        fontSizeValue.textContent = this.value + 'px';
        document.documentElement.style.fontSize = this.value + 'px';
        saveSettings();
    });

    // Splash duration slider
    const splashDurationRange = document.getElementById('splashDurationRange');
    const splashDurationValue = document.getElementById('splashDurationValue');
    
    splashDurationRange.addEventListener('input', function() {
        splashDurationValue.textContent = this.value + 's';
        saveSettings();
    });

    // Auto-save toggle
    document.getElementById('autoSaveToggle').addEventListener('change', saveSettings);

    // Backup frequency
    document.getElementById('backupFrequency').addEventListener('change', saveSettings);

    // Notifications toggle
    document.getElementById('notificationsToggle').addEventListener('change', async function() {
        if (this.checked) {
            const permission = await requestNotificationPermission();
            if (permission !== 'granted') {
                this.checked = false;
                return;
            }
        }
        saveSettings();
        renderNotificationsList();
        
        if (this.checked) {
            scheduleNotifications();
        } else {
            // Clear all scheduled notifications
            if (window.notificationTimeouts) {
                window.notificationTimeouts.forEach(timeout => clearTimeout(timeout));
                window.notificationTimeouts = [];
            }
        }
    });

    // Add notification button
    document.getElementById('addNotificationBtn').addEventListener('click', addNewNotification);

    // Password protection toggle
    const passwordToggle = document.getElementById('passwordToggle');
    if (passwordToggle) {
        passwordToggle.addEventListener('change', function() {
            console.log('Password toggle changed:', this.checked);
            const authTypeSection = document.getElementById('authTypeSection');
            if (this.checked) {
                authTypeSection.style.display = 'flex';
                updateAuthSections();
            } else {
                // Confirm disable password protection
                if (confirm('Are you sure you want to disable password protection?')) {
                    authTypeSection.style.display = 'none';
                    document.getElementById('passwordSection').style.display = 'none';
                    document.getElementById('patternSection').style.display = 'none';
                    document.getElementById('passwordInput').value = '';
                    if (typeof clearPattern === 'function') clearPattern();
                } else {
                    this.checked = true;
                    return;
                }
            }
            saveSettings();
        });
    }
    
    // Auth type selector
    const authTypeSelect = document.getElementById('authType');
    if (authTypeSelect) {
        authTypeSelect.addEventListener('change', function() {
            console.log('Auth type changed:', this.value);
            updateAuthSections();
            saveSettings();
        });
    }

    // Password input with validation
    document.getElementById('passwordInput').addEventListener('input', function() {
        const password = this.value.trim();
        if (password.length > 0 && password.length < 4) {
            this.style.borderColor = 'var(--danger-color)';
            this.setCustomValidity('Password must be at least 4 characters');
        } else {
            this.style.borderColor = 'var(--tertiary-bg)';
            this.setCustomValidity('');
        }
    });
    
    document.getElementById('passwordInput').addEventListener('change', function() {
        const password = this.value.trim();
        if (password.length > 0 && password.length < 4) {
            alert('Password must be at least 4 characters long');
            this.focus();
            return;
        }
        saveSettings();
        if (password) {
            // Clear current session when password is set/changed
            sessionStorage.removeItem('diaryAuth');
        }
    });

    // Clear all data button
    document.getElementById('clearAllDataBtn').addEventListener('click', function() {
        if (confirm('Are you sure you want to clear all diary data? This action cannot be undone.')) {
            clearAllData();
        }
    });

    // About button
    document.getElementById('aboutBtn').addEventListener('click', function() {
        showAboutDialog();
    });
}

function loadSettings() {
    const settings = getStoredSettings();
    
    // Apply loaded settings to UI
    document.getElementById('themeSelect').value = settings.theme || 'dark';
    document.getElementById('fontSizeRange').value = settings.fontSize || 16;
    document.getElementById('fontSizeValue').textContent = (settings.fontSize || 16) + 'px';
    document.getElementById('splashDurationRange').value = settings.splashDuration || 4;
    document.getElementById('splashDurationValue').textContent = (settings.splashDuration || 4) + 's';
    document.getElementById('autoSaveToggle').checked = settings.autoSave !== false;
    document.getElementById('backupFrequency').value = settings.backupFrequency || 'weekly';
    document.getElementById('notificationsToggle').checked = settings.notifications || false;
    const passwordToggle = document.getElementById('passwordToggle');
    const authTypeSelect = document.getElementById('authType');
    const passwordInput = document.getElementById('passwordInput');
    const authTypeSection = document.getElementById('authTypeSection');
    
    if (passwordToggle) {
        passwordToggle.checked = settings.passwordProtection || false;
        console.log('Password protection loaded:', settings.passwordProtection);
    }
    
    if (authTypeSelect) {
        authTypeSelect.value = settings.authType || 'password';
        console.log('Auth type loaded:', settings.authType);
    }
    
    if (passwordInput && settings.password) {
        passwordInput.value = settings.password;
    }
    
    // Show/hide auth sections
    if (authTypeSection) {
        authTypeSection.style.display = settings.passwordProtection ? 'flex' : 'none';
        console.log('Auth type section display:', settings.passwordProtection ? 'flex' : 'none');
    }
    
    if (settings.passwordProtection) {
        updateAuthSections();
        if (settings.authType === 'pattern' && settings.pattern) {
            setTimeout(() => {
                const patternStatus = document.getElementById('patternStatus');
                if (patternStatus) {
                    patternStatus.textContent = 'Pattern is set';
                    patternStatus.className = 'pattern-status success';
                }
            }, 100);
        }
    }
    
    // Apply theme and font size
    applyTheme(settings.theme || 'dark');
    document.documentElement.style.fontSize = (settings.fontSize || 16) + 'px';
    
    // Render notifications list
    renderNotificationsList();
    
    // Schedule notifications
    if (settings.notifications) {
        scheduleNotifications();
    }
    
    // Listen for system theme changes when auto is selected
    if (settings.theme === 'auto') {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            applyTheme('auto');
        });
    }
}

function saveSettings() {
    const settings = {
        theme: document.getElementById('themeSelect').value,
        fontSize: parseInt(document.getElementById('fontSizeRange').value),
        splashDuration: parseInt(document.getElementById('splashDurationRange').value),
        autoSave: document.getElementById('autoSaveToggle').checked,
        backupFrequency: document.getElementById('backupFrequency').value,
        notifications: document.getElementById('notificationsToggle').checked,
        notificationsList: getStoredSettings().notificationsList || [],
        passwordProtection: document.getElementById('passwordToggle').checked,
        authType: document.getElementById('authType').value,
        password: document.getElementById('passwordInput').value,
        pattern: getStoredSettings().pattern || ''
    };
    
    localStorage.setItem('diarySettings', JSON.stringify(settings));
}

function getStoredSettings() {
    const stored = localStorage.getItem('diarySettings');
    return stored ? JSON.parse(stored) : {};
}

function applyTheme(theme) {
    const root = document.documentElement;
    
    if (theme === 'light') {
        root.style.setProperty('--primary-bg', '#fafbfc');
        root.style.setProperty('--secondary-bg', '#ffffff');
        root.style.setProperty('--tertiary-bg', '#f1f5f9');
        root.style.setProperty('--text-primary', '#0f172a');
        root.style.setProperty('--text-secondary', '#334155');
        root.style.setProperty('--text-muted', '#64748b');
        root.style.setProperty('--accent-light', 'rgba(245, 158, 11, 0.12)');
        root.style.setProperty('--box-shadow', '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04)');
        root.style.setProperty('--box-shadow-lg', '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)');
    } else if (theme === 'dark') {
        root.style.setProperty('--primary-bg', '#0f172a');
        root.style.setProperty('--secondary-bg', '#1e293b');
        root.style.setProperty('--tertiary-bg', '#334155');
        root.style.setProperty('--text-primary', '#f8fafc');
        root.style.setProperty('--text-secondary', '#94a3b8');
        root.style.setProperty('--text-muted', '#64748b');
        root.style.setProperty('--accent-light', 'rgba(245, 158, 11, 0.1)');
        root.style.setProperty('--box-shadow', '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)');
        root.style.setProperty('--box-shadow-lg', '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)');
    } else if (theme === 'black') {
        root.style.setProperty('--primary-bg', '#000000');
        root.style.setProperty('--secondary-bg', '#0a0a0a');
        root.style.setProperty('--tertiary-bg', '#1a1a1a');
        root.style.setProperty('--text-primary', '#ffffff');
        root.style.setProperty('--text-secondary', '#b3b3b3');
        root.style.setProperty('--text-muted', '#666666');
        root.style.setProperty('--accent-light', 'rgba(245, 158, 11, 0.15)');
        root.style.setProperty('--box-shadow', '0 4px 6px -1px rgba(255, 255, 255, 0.02), 0 2px 4px -1px rgba(255, 255, 255, 0.01)');
        root.style.setProperty('--box-shadow-lg', '0 10px 15px -3px rgba(255, 255, 255, 0.03), 0 4px 6px -2px rgba(255, 255, 255, 0.02)');
    } else if (theme === 'auto') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        applyTheme(isDark ? 'dark' : 'light');
        return;
    }
}

function requestNotificationPermission() {
    if (!('Notification' in window)) {
        alert('This browser does not support notifications');
        return Promise.resolve('denied');
    }
    
    if (Notification.permission === 'granted') {
        return Promise.resolve('granted');
    }
    
    if (Notification.permission === 'denied') {
        alert('Notifications are blocked. Please enable them in browser settings.');
        return Promise.resolve('denied');
    }
    
    return Notification.requestPermission().then(function(permission) {
        if (permission === 'granted') {
            console.log('Notification permission granted');
            // Test notification
            showNotification('Notifications enabled! You will receive daily reminders.');
        } else {
            alert('Notification permission denied. Please enable in browser settings.');
        }
        return permission;
    });
}

function clearAllData() {
    // Clear all diary-related data from localStorage
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('diary_') || key === 'diaryEntries')) {
            keysToRemove.push(key);
        }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    alert('All diary data has been cleared successfully.');
}

// Notification Management
function addNewNotification() {
    const settings = getStoredSettings();
    const notifications = settings.notificationsList || [];
    
    const newNotification = {
        id: Date.now(),
        label: 'Daily Reminder',
        time: '20:00',
        enabled: true
    };
    
    notifications.push(newNotification);
    settings.notificationsList = notifications;
    localStorage.setItem('diarySettings', JSON.stringify(settings));
    
    renderNotificationsList();
}

function renderNotificationsList() {
    const container = document.getElementById('notificationsList');
    const settings = getStoredSettings();
    const notifications = settings.notificationsList || [];
    const notificationsEnabled = settings.notifications || false;
    
    container.innerHTML = '';
    
    if (!notificationsEnabled) {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'block';
    
    notifications.forEach(notification => {
        const item = document.createElement('div');
        item.className = 'notification-item';
        item.innerHTML = `
            <div class="notification-item-header">
                <span class="notification-item-label">${notification.label}</span>
                <div class="notification-item-controls">
                    <div class="toggle-switch">
                        <input type="checkbox" ${notification.enabled ? 'checked' : ''} 
                               onchange="toggleNotification(${notification.id})">
                        <span class="slider"></span>
                    </div>
                    <button type="button" class="btn-small btn-delete" 
                            onclick="deleteNotification(${notification.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="notification-item-time">
                <input type="time" value="${notification.time}" 
                       onchange="updateNotificationTime(${notification.id}, this.value)">
                <input type="text" value="${notification.label}" 
                       onchange="updateNotificationLabel(${notification.id}, this.value)"
                       placeholder="Reminder label">
            </div>
        `;
        container.appendChild(item);
    });
}

function toggleNotification(id) {
    const settings = getStoredSettings();
    const notifications = settings.notificationsList || [];
    const notification = notifications.find(n => n.id === id);
    
    if (notification) {
        notification.enabled = !notification.enabled;
        settings.notificationsList = notifications;
        localStorage.setItem('diarySettings', JSON.stringify(settings));
        scheduleNotifications();
    }
}

function deleteNotification(id) {
    const settings = getStoredSettings();
    const notifications = settings.notificationsList || [];
    settings.notificationsList = notifications.filter(n => n.id !== id);
    localStorage.setItem('diarySettings', JSON.stringify(settings));
    renderNotificationsList();
    scheduleNotifications();
}

function updateNotificationTime(id, time) {
    const settings = getStoredSettings();
    const notifications = settings.notificationsList || [];
    const notification = notifications.find(n => n.id === id);
    
    if (notification) {
        notification.time = time;
        settings.notificationsList = notifications;
        localStorage.setItem('diarySettings', JSON.stringify(settings));
        scheduleNotifications();
    }
}

function updateNotificationLabel(id, label) {
    const settings = getStoredSettings();
    const notifications = settings.notificationsList || [];
    const notification = notifications.find(n => n.id === id);
    
    if (notification) {
        notification.label = label;
        settings.notificationsList = notifications;
        localStorage.setItem('diarySettings', JSON.stringify(settings));
    }
}

function scheduleNotifications() {
    // Clear existing timeouts
    if (window.notificationTimeouts) {
        window.notificationTimeouts.forEach(timeout => clearTimeout(timeout));
    }
    window.notificationTimeouts = [];
    
    const settings = getStoredSettings();
    if (!settings.notifications || Notification.permission !== 'granted') {
        console.log('Notifications disabled or permission not granted');
        return;
    }
    
    const notifications = settings.notificationsList || [];
    console.log('Scheduling notifications:', notifications);
    
    notifications.forEach(notification => {
        if (!notification.enabled) return;
        
        const [hours, minutes] = notification.time.split(':').map(Number);
        const now = new Date();
        const scheduledTime = new Date();
        scheduledTime.setHours(hours, minutes, 0, 0);
        
        // If time has passed today, schedule for tomorrow
        if (scheduledTime <= now) {
            scheduledTime.setDate(scheduledTime.getDate() + 1);
        }
        
        const timeUntilNotification = scheduledTime.getTime() - now.getTime();
        console.log(`Scheduling "${notification.label}" in ${Math.round(timeUntilNotification / 1000 / 60)} minutes`);
        
        const timeout = setTimeout(() => {
            showNotification(notification.label);
            // Reschedule for next day after 1 second
            setTimeout(scheduleNotifications, 1000);
        }, timeUntilNotification);
        
        window.notificationTimeouts.push(timeout);
    });
}

function showNotification(message) {
    if (!('Notification' in window)) {
        console.log('Notifications not supported');
        return;
    }
    
    if (Notification.permission !== 'granted') {
        console.log('Notification permission not granted');
        return;
    }
    
    try {
        const notification = new Notification('My Personal Diary', {
            body: message,
            icon: 'images/logo256.png',
            badge: 'images/logo64.png',
            requireInteraction: false,
            silent: false
        });
        
        // Auto close after 5 seconds
        setTimeout(() => {
            notification.close();
        }, 5000);
        
        // Handle click
        notification.onclick = function() {
            window.focus();
            notification.close();
        };
        
        console.log('Notification shown:', message);
    } catch (error) {
        console.error('Error showing notification:', error);
    }
}

// Pattern Lock Functions
let currentPattern = [];
let isDrawing = false;

function initializePatternGrid() {
    const grid = document.getElementById('patternGrid');
    grid.innerHTML = '';
    
    for (let i = 1; i <= 9; i++) {
        const dot = document.createElement('div');
        dot.className = 'pattern-dot';
        dot.dataset.id = i;
        
        dot.addEventListener('mousedown', startPattern);
        dot.addEventListener('mouseenter', addToPattern);
        dot.addEventListener('mouseup', endPattern);
        
        // Touch events
        dot.addEventListener('touchstart', startPattern);
        dot.addEventListener('touchmove', handleTouchMove);
        dot.addEventListener('touchend', endPattern);
        
        grid.appendChild(dot);
    }
    
    // Add status display
    const status = document.createElement('div');
    status.className = 'pattern-status';
    status.id = 'patternStatus';
    status.textContent = 'Draw your pattern (minimum 4 dots)';
    grid.parentNode.appendChild(status);
    
    // Clear pattern button
    document.getElementById('clearPatternBtn').addEventListener('click', clearPattern);
}

function startPattern(e) {
    e.preventDefault();
    isDrawing = true;
    currentPattern = [];
    clearPatternVisual();
    addDotToPattern(e.target);
}

function addToPattern(e) {
    if (isDrawing) {
        addDotToPattern(e.target);
    }
}

function handleTouchMove(e) {
    if (isDrawing) {
        const touch = e.touches[0];
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        if (element && element.classList.contains('pattern-dot')) {
            addDotToPattern(element);
        }
    }
}

function addDotToPattern(dot) {
    if (!dot.classList.contains('pattern-dot')) return;
    
    const dotId = parseInt(dot.dataset.id);
    if (!currentPattern.includes(dotId)) {
        currentPattern.push(dotId);
        dot.classList.add('active');
        updatePatternStatus();
    }
}

function endPattern() {
    if (isDrawing && currentPattern.length >= 4) {
        savePattern();
    } else if (currentPattern.length > 0 && currentPattern.length < 4) {
        document.getElementById('patternStatus').textContent = 'Pattern too short (minimum 4 dots)';
        document.getElementById('patternStatus').className = 'pattern-status error';
        setTimeout(clearPattern, 1500);
    }
    isDrawing = false;
}

function updatePatternStatus() {
    const status = document.getElementById('patternStatus');
    if (currentPattern.length === 0) {
        status.textContent = 'Draw your pattern (minimum 4 dots)';
        status.className = 'pattern-status';
    } else if (currentPattern.length < 4) {
        status.textContent = `Pattern: ${currentPattern.length}/4 dots (minimum)`;
        status.className = 'pattern-status';
    } else {
        status.textContent = `Pattern: ${currentPattern.length} dots - Release to save`;
        status.className = 'pattern-status success';
    }
}

function savePattern() {
    const settings = getStoredSettings();
    settings.pattern = currentPattern.join(',');
    localStorage.setItem('diarySettings', JSON.stringify(settings));
    
    document.getElementById('patternStatus').textContent = 'Pattern saved successfully!';
    document.getElementById('patternStatus').className = 'pattern-status success';
    
    // Clear session when pattern is set/changed
    sessionStorage.removeItem('diaryAuth');
    
    setTimeout(() => {
        document.getElementById('patternStatus').textContent = 'Pattern is set';
        document.getElementById('patternStatus').className = 'pattern-status success';
    }, 2000);
}

function clearPattern() {
    currentPattern = [];
    clearPatternVisual();
    document.getElementById('patternStatus').textContent = 'Draw your pattern (minimum 4 dots)';
    document.getElementById('patternStatus').className = 'pattern-status';
}

function clearPatternVisual() {
    document.querySelectorAll('.pattern-dot').forEach(dot => {
        dot.classList.remove('active');
    });
}

function updateAuthSections() {
    const authTypeSelect = document.getElementById('authType');
    const passwordSection = document.getElementById('passwordSection');
    const patternSection = document.getElementById('patternSection');
    
    if (!authTypeSelect || !passwordSection || !patternSection) {
        console.error('Auth sections not found');
        return;
    }
    
    const authType = authTypeSelect.value;
    console.log('Updating auth sections for type:', authType);
    
    if (authType === 'password') {
        passwordSection.style.display = 'flex';
        patternSection.style.display = 'none';
        const passwordInput = document.getElementById('passwordInput');
        if (passwordInput) passwordInput.focus();
    } else if (authType === 'pattern') {
        passwordSection.style.display = 'none';
        patternSection.style.display = 'flex';
        if (typeof initializePatternGrid === 'function') {
            initializePatternGrid();
        }
    }
}

function showAboutDialog() {
    alert(`Diary v3.0.0

A simple, secure, and private diary application that stores your entries locally on your device.

Features:
• Offline functionality
• Local data storage
• Export/Import capabilities
• Responsive design
• Privacy-focused
• Settings panel
• Custom notifications
• Pattern & Password lock

Created with ❤️ by Kanhaiya lal`);
}