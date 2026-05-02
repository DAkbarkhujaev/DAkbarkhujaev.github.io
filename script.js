document.addEventListener('DOMContentLoaded', () => {
    if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
    }

    const tabs = document.querySelectorAll('.tab-btn');
    const addBtn = document.getElementById('btn-add');
    const grid = document.getElementById('timers-grid');
    const alertSound = document.getElementById('alert-sound');

    let timerIdCounter = 0;
    const timers = {};

    // Tab Switching Logic
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.setup-section').forEach(s => s.classList.add('hidden'));
            
            tab.classList.add('active');
            document.getElementById(tab.dataset.target).classList.remove('hidden');
        });
    });

    // Add Timer Logic
    addBtn.addEventListener('click', () => {
        const activeTab = document.querySelector('.tab-btn.active').dataset.target;
        const labelInput = document.getElementById('timer-label').value || 'Timer';
        let totalSeconds = 0;
        let isScheduled = false;

        if (activeTab === 'duration-setup') {
            const h = parseInt(document.getElementById('in-hours').value) || 0;
            const m = parseInt(document.getElementById('in-minutes').value) || 0;
            const s = parseInt(document.getElementById('in-seconds').value) || 0;
            totalSeconds = (h * 3600) + (m * 60) + s;
            
            if (totalSeconds <= 0) return alert("Please enter a valid duration.");
        } else {
            const datetimeVal = document.getElementById('in-datetime').value;
            if (!datetimeVal) return alert("Please select a date and time.");
            
            const targetTime = new Date(datetimeVal).getTime();
            const now = new Date().getTime();
            totalSeconds = Math.floor((targetTime - now) / 1000);
            isScheduled = true;
            
            if (totalSeconds <= 0) return alert("Scheduled time must be in the future.");
        }

        createTimer(labelInput, totalSeconds, isScheduled);
    });

    function createTimer(label, duration, isScheduled) {
        const id = `timer-${timerIdCounter++}`;
        
        // Timer Object State
        timers[id] = {
            duration: duration,
            remaining: duration,
            interval: null,
            isRunning: true, // Auto-start
            isScheduled: isScheduled
        };

        // Build UI
        const card = document.createElement('div');
        card.className = 'timer-card card';
        card.id = id;
        
        card.innerHTML = `
            <div class="timer-label">${label}</div>
            <div class="timer-display" id="display-${id}">${formatTime(duration)}</div>
            <div class="controls">
                <button class="btn-toggle" onclick="toggleTimer('${id}')">Pause</button>
                ${!isScheduled ? `<button onclick="resetTimer('${id}')">Reset</button>` : ''}
                <button class="btn-delete" onclick="deleteTimer('${id}')">Remove</button>
            </div>
        `;
        
        grid.prepend(card);
        startTimer(id);
    }

    // Timer Interval Logic
    window.startTimer = (id) => {
        const timer = timers[id];
        if (!timer || !timer.isRunning) return;

        timer.interval = setInterval(() => {
            timer.remaining--;
            updateDisplay(id);

            if (timer.remaining <= 0) {
                clearInterval(timer.interval);
                timer.remaining = 0;
                timer.isRunning = false;
                updateDisplay(id);
                triggerAlarm(id);
            }
        }, 1000);
    };

    window.toggleTimer = (id) => {
        const timer = timers[id];
        const btn = document.querySelector(`#${id} .btn-toggle`);
        
        if (timer.isRunning) {
            clearInterval(timer.interval);
            timer.isRunning = false;
            btn.textContent = 'Resume';
        } else {
            if (timer.remaining <= 0) return; // Prevent resuming finished timer
            timer.isRunning = true;
            btn.textContent = 'Pause';
            startTimer(id);
        }
    };

    window.resetTimer = (id) => {
        const timer = timers[id];
        clearInterval(timer.interval);
        timer.remaining = timer.duration;
        timer.isRunning = false;
        
        // Grab the toggle button
        const toggleBtn = document.querySelector(`#${id} .btn-toggle`);
        
        // Reset text and re-enable the button
        toggleBtn.textContent = 'Start';
        toggleBtn.disabled = false; 
        
        updateDisplay(id);
        document.getElementById(id).classList.remove('finished');
    };

    window.deleteTimer = (id) => {
        const timer = timers[id];
        clearInterval(timer.interval);
        delete timers[id];
        
        const card = document.getElementById(id);
        card.style.animation = 'none'; // Clear entry animation
        card.style.transition = 'all 0.3s ease';
        card.style.opacity = '0';
        card.style.transform = 'scale(0.9)';
        
        setTimeout(() => card.remove(), 300);
    };

    function updateDisplay(id) {
        const display = document.getElementById(`display-${id}`);
        if (display) {
            display.textContent = formatTime(timers[id].remaining);
        }
    }

    function formatTime(totalSeconds) {
        if (totalSeconds < 0) totalSeconds = 0;
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        
        if (h > 0) {
            return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        }
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    function triggerAlarm(id) {
        const card = document.getElementById(id);
        const label = card.querySelector('.timer-label').textContent;
        const toggleBtn = card.querySelector('.btn-toggle');
        
        card.classList.add('finished');
        toggleBtn.textContent = 'Done';
        toggleBtn.disabled = true;

        // Play Sound
        alertSound.currentTime = 0;
        alertSound.play().catch(e => console.log("Audio play blocked by browser. User interaction needed."));

        // Show Desktop Notification
        if (Notification.permission === "granted") {
            new Notification("Timer Complete!", {
                body: `${label} has finished.`,
                icon: 'https://cdn-icons-png.flaticon.com/512/8112/8112660.png'
            });
        }
    }
});