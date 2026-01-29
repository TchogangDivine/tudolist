  /* =========================================================================
           1. APPLICATION STATE
        ========================================================================= */
        let tasks = [];
        let timers = {};
        let currentFilter = 'all';
        let taskToDelete = null;
        let db = null;
        const DB_NAME = 'GestachesDB';
        const DB_VERSION = 1;
        const STORE_NAME = 'tasks';
        const SETTINGS_STORE = 'settings';

        /* =========================================================================
           2. DOM ELEMENTS
        ========================================================================= */
        const tasksList = document.getElementById('tasksList');
        const searchInput = document.getElementById('searchInput');
        const taskTitle = document.getElementById('taskTitle');
        const taskPriority = document.getElementById('taskPriority');
        const taskDueDate = document.getElementById('taskDueDate');
        const addTaskBtn = document.getElementById('addTaskBtn');
        const filterTabs = document.querySelectorAll('.filter-tab');
        const deleteModal = document.getElementById('deleteModal');
        const cancelDelete = document.getElementById('cancelDelete');
        const confirmDelete = document.getElementById('confirmDelete');
        const toastContainer = document.getElementById('toastContainer');
        const themeToggle = document.getElementById('themeToggle');

        /* =========================================================================
           3. INDEXEDDB FUNCTIONS FOR PERSISTENCE
        ========================================================================= */
        function openDatabase() {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(DB_NAME, DB_VERSION);

                request.onerror = () => reject(request.error);
                request.onsuccess = () => {
                    db = request.result;
                    resolve(db);
                };

                request.onupgradeneeded = (event) => {
                    const database = event.target.result;

                    // Create tasks store
                    if (!database.objectStoreNames.contains(STORE_NAME)) {
                        database.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    }

                    // Create settings store for theme preference
                    if (!database.objectStoreNames.contains(SETTINGS_STORE)) {
                        database.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
                    }
                };
            });
        }

        function saveTasksToDB() {
            if (!db) return;

            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            // Clear all and add current tasks
            store.clear();
            tasks.forEach(task => {
                store.add(task);
            });
        }

        function loadTasksFromDB() {
            return new Promise((resolve, reject) => {
                if (!db) {
                    resolve([]);
                    return;
                }

                const transaction = db.transaction([STORE_NAME], 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.getAll();

                request.onsuccess = () => resolve(request.result || []);
                request.onerror = () => reject(request.error);
            });
        }

        function saveThemeToDB(isDark) {
            if (!db) return;

            const transaction = db.transaction([SETTINGS_STORE], 'readwrite');
            const store = transaction.objectStore(SETTINGS_STORE);
            store.put({ key: 'theme', value: isDark ? 'dark' : 'light' });
        }

        function loadThemeFromDB() {
            return new Promise((resolve, reject) => {
                if (!db) {
                    resolve(null);
                    return;
                }

                const transaction = db.transaction([SETTINGS_STORE], 'readonly');
                const store = transaction.objectStore(SETTINGS_STORE);
                const request = store.get('theme');

                request.onsuccess = () => resolve(request.result ? request.result.value : null);
                request.onerror = () => reject(request.error);
            });
        }

        /* =========================================================================
           4. THEME TOGGLE FUNCTIONALITY
        ========================================================================= */
        function toggleTheme() {
            const isDark = document.documentElement.classList.toggle('dark');
            saveThemeToDB(isDark);
        }

        async function initializeTheme() {
            try {
                const savedTheme = await loadThemeFromDB();

                if (savedTheme) {
                    // Use saved preference
                    if (savedTheme === 'dark') {
                        document.documentElement.classList.add('dark');
                    } else {
                        document.documentElement.classList.remove('dark');
                    }
                } else {
                    // Use system preference as default
                    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                        document.documentElement.classList.add('dark');
                    }
                }
            } catch (e) {
                // Fallback to system preference
                if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    document.documentElement.classList.add('dark');
                }
            }
        }

        /* =========================================================================
           5. GREETING FUNCTION
        ========================================================================= */
        function updateGreeting() {
            const hour = new Date().getHours();
            const greetingText = document.getElementById('greetingText');
            const motivationalText = document.getElementById('motivationalText');

            const greetings = {
                morning: {
                    text: 'Bonjour ! ☀️',
                    message: 'Une nouvelle journée pleine de possibilités vous attend !'
                },
                afternoon: {
                    text: 'Bon après-midi ! 🌤️',
                    message: 'Continuez sur votre lancée, vous êtes formidable !'
                },
                evening: {
                    text: 'Bonsoir ! 🌙',
                    message: 'Finissez la journée en beauté avec vos tâches !'
                },
                night: {
                    text: 'Bonne nuit ! ✨',
                    message: 'Planifiez demain pour un réveil productif !'
                }
            };

            let period;
            if (hour >= 5 && hour < 12) period = 'morning';
            else if (hour >= 12 && hour < 18) period = 'afternoon';
            else if (hour >= 18 && hour < 22) period = 'evening';
            else period = 'night';

            greetingText.textContent = greetings[period].text;
            motivationalText.textContent = greetings[period].message;
        }

        /* =========================================================================
           6. TOAST NOTIFICATIONS
        ========================================================================= */
        function showToast(message, type = 'info') {
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;

            const icons = {
                success: 'fa-check-circle',
                error: 'fa-times-circle',
                info: 'fa-info-circle',
                warning: 'fa-exclamation-triangle'
            };

            toast.innerHTML = `<i class="fas ${icons[type]}"></i> ${message}`;
            toastContainer.appendChild(toast);

            setTimeout(() => {
                toast.remove();
            }, 3000);
        }

        /* =========================================================================
           7. CONFETTI EFFECT
        ========================================================================= */
        function createConfetti() {
            const colors = ['#6366f1', '#ec4899', '#14b8a6', '#22c55e', '#f59e0b'];

            for (let i = 0; i < 50; i++) {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.left = Math.random() * 100 + 'vw';
                confetti.style.top = '-10px';
                confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
                confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
                confetti.style.animationDelay = Math.random() * 0.5 + 's';
                document.body.appendChild(confetti);

                setTimeout(() => confetti.remove(), 4000);
            }
        }

        /* =========================================================================
           8. UTILITY FUNCTIONS
        ========================================================================= */
        function formatTime(seconds) {
            const hrs = Math.floor(seconds / 3600);
            const mins = Math.floor((seconds % 3600) / 60);
            const secs = seconds % 60;
            return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }

        function generateId() {
            return Date.now().toString(36) + Math.random().toString(36).substr(2);
        }

        function formatDate(dateString) {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
        }

        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        /* =========================================================================
           9. TASK CRUD OPERATIONS
        ========================================================================= */
        function addTask() {
            const title = taskTitle.value.trim();

            if (!title) {
                showToast('Veuillez entrer un titre pour la tâche !', 'warning');
                taskTitle.focus();
                return;
            }

            const task = {
                id: generateId(),
                title,
                priority: taskPriority.value,
                dueDate: taskDueDate.value,
                completed: false,
                elapsedTime: 0,
                createdAt: new Date().toISOString()
            };

            tasks.unshift(task);
            taskTitle.value = '';
            taskDueDate.value = '';

            saveTasksToDB();
            renderTasks();
            updateStats();
            showToast('🎉 Tâche ajoutée avec succès !', 'success');
        }

        function toggleTask(id) {
            const task = tasks.find(t => t.id === id);
            if (task) {
                task.completed = !task.completed;

                if (task.completed) {
                    if (timers[id]) {
                        clearInterval(timers[id].interval);
                        delete timers[id];
                    }
                    createConfetti();
                    showToast('🏆 Bravo ! Tâche accomplie avec succès !', 'success');
                } else {
                    showToast('📋 Tâche remise en attente', 'info');
                }

                saveTasksToDB();
                renderTasks();
                updateStats();
            }
        }

        function deleteTask(id) {
            taskToDelete = id;
            deleteModal.classList.add('active');
        }

        function confirmDeleteTask() {
            if (taskToDelete) {
                // IMPORTANT: Capture the ID before nullifying taskToDelete
                const idToDelete = taskToDelete;
                const taskCard = document.querySelector(`[data-id="${idToDelete}"]`);

                if (timers[idToDelete]) {
                    clearInterval(timers[idToDelete].interval);
                    delete timers[idToDelete];
                }

                // Reset taskToDelete immediately
                taskToDelete = null;
                deleteModal.classList.remove('active');

                if (taskCard) {
                    taskCard.classList.add('deleting');
                    setTimeout(() => {
                        tasks = tasks.filter(t => t.id !== idToDelete);
                        saveTasksToDB();
                        renderTasks();
                        updateStats();
                        showToast('🗑️ Tâche supprimée', 'info');
                    }, 400);
                } else {
                    // If card not found, still delete from array
                    tasks = tasks.filter(t => t.id !== idToDelete);
                    saveTasksToDB();
                    renderTasks();
                    updateStats();
                    showToast('🗑️ Tâche supprimée', 'info');
                }
            } else {
                deleteModal.classList.remove('active');
            }
        }

        /* =========================================================================
           10. TIMER FUNCTIONS
        ========================================================================= */
        function startTimer(id) {
            const task = tasks.find(t => t.id === id);
            if (!task || task.completed) return;

            if (timers[id] && timers[id].running) return;

            timers[id] = {
                running: true,
                interval: setInterval(() => {
                    task.elapsedTime++;
                    updateTimerDisplay(id, task.elapsedTime);
                    // Save periodically (every 10 seconds to reduce writes)
                    if (task.elapsedTime % 10 === 0) {
                        saveTasksToDB();
                    }
                }, 1000)
            };

            updateTimerButtons(id, true);
            showToast('⏱️ Chronomètre démarré !', 'info');
        }

        function pauseTimer(id) {
            if (timers[id]) {
                clearInterval(timers[id].interval);
                timers[id].running = false;
                updateTimerButtons(id, false);
                saveTasksToDB();
                showToast('⏸️ Chronomètre en pause', 'info');
            }
        }

        function resetTimer(id) {
            const task = tasks.find(t => t.id === id);
            if (task) {
                if (timers[id]) {
                    clearInterval(timers[id].interval);
                    delete timers[id];
                }
                task.elapsedTime = 0;
                updateTimerDisplay(id, 0);
                updateTimerButtons(id, false);
                saveTasksToDB();
                showToast('🔄 Chronomètre réinitialisé', 'info');
            }
        }

        function updateTimerDisplay(id, seconds) {
            const display = document.querySelector(`[data-id="${id}"] .timer-display`);
            if (display) {
                display.textContent = formatTime(seconds);
            }
        }

        function updateTimerButtons(id, isRunning) {
            const startBtn = document.querySelector(`[data-id="${id}"] .timer-btn.start`);
            const pauseBtn = document.querySelector(`[data-id="${id}"] .timer-btn.pause`);

            if (startBtn && pauseBtn) {
                startBtn.style.display = isRunning ? 'none' : 'flex';
                pauseBtn.style.display = isRunning ? 'flex' : 'none';
            }
        }

        /* =========================================================================
           11. FILTER & SEARCH FUNCTIONS
        ========================================================================= */
        function filterTasks(filter) {
            currentFilter = filter;
            filterTabs.forEach(tab => {
                tab.classList.toggle('active', tab.dataset.filter === filter);
            });
            renderTasks();
        }

        function searchTasks(query) {
            renderTasks(query.toLowerCase());
        }

        /* =========================================================================
           12. UPDATE STATS
        ========================================================================= */
        function updateStats() {
            const total = tasks.length;
            const completed = tasks.filter(t => t.completed).length;
            const pending = total - completed;

            document.getElementById('totalTasks').textContent = total;
            document.getElementById('completedTasks').textContent = completed;
            document.getElementById('pendingTasks').textContent = pending;

            const motivationalText = document.getElementById('motivationalText');
            if (total === 0) {
                motivationalText.textContent = 'Ajoutez votre première tâche pour commencer !';
            } else if (completed === total && total > 0) {
                motivationalText.textContent = '🎊 Incroyable ! Toutes vos tâches sont terminées !';
            } else if (pending === 1) {
                motivationalText.textContent = '💪 Plus qu\'une tâche ! Vous y êtes presque !';
            } else if (completed > 0) {
                motivationalText.textContent = `✨ Super ! ${completed} tâche${completed > 1 ? 's' : ''} terminée${completed > 1 ? 's' : ''} !`;
            }
        }

        /* =========================================================================
           13. RENDER TASKS
        ========================================================================= */
        function renderTasks(searchQuery = '') {
            let filteredTasks = [...tasks];

            // Apply filter
            switch (currentFilter) {
                case 'pending':
                    filteredTasks = filteredTasks.filter(t => !t.completed);
                    break;
                case 'completed':
                    filteredTasks = filteredTasks.filter(t => t.completed);
                    break;
                case 'high':
                    filteredTasks = filteredTasks.filter(t => t.priority === 'high');
                    break;
            }

            // Apply search
            if (searchQuery) {
                filteredTasks = filteredTasks.filter(t =>
                    t.title.toLowerCase().includes(searchQuery)
                );
            }

            // Sort by priority
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            filteredTasks.sort((a, b) => {
                if (a.completed !== b.completed) return a.completed ? 1 : -1;
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            });

            if (filteredTasks.length === 0) {
                tasksList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-clipboard-list"></i>
                        <h3>${searchQuery ? 'Aucun résultat trouvé' : 'Aucune tâche'}</h3>
                        <p>${searchQuery ? 'Essayez une autre recherche' : 'Créez votre première tâche ci-dessus !'}</p>
                    </div>
                `;
                return;
            }

            const priorityLabels = {
                high: 'Haute',
                medium: 'Moyenne',
                low: 'Basse'
            };

            tasksList.innerHTML = filteredTasks.map(task => {
                const isRunning = timers[task.id] && timers[task.id].running;

                return `
                    <div class="task-card priority-${task.priority} ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                        <div class="task-header">
                            <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="toggleTask('${task.id}')">
                                ${task.completed ? '<i class="fas fa-check"></i>' : ''}
                            </div>
                            <div class="task-content">
                                <div class="task-title">${escapeHtml(task.title)}</div>
                                <div class="task-meta">
                                    <span class="priority-badge ${task.priority}">${priorityLabels[task.priority]}</span>
                                    ${task.dueDate ? `<span><i class="fas fa-calendar-alt"></i> ${formatDate(task.dueDate)}</span>` : ''}
                                </div>
                            </div>
                            <div class="task-actions">
                                <button class="action-btn delete" onclick="deleteTask('${task.id}')" title="Supprimer">
                                    <i class="fas fa-trash-alt"></i>
                                </button>
                            </div>
                        </div>
                        ${!task.completed ? `
                            <div class="task-timer">
                                <div class="timer-display">${formatTime(task.elapsedTime)}</div>
                                <button class="timer-btn start" onclick="startTimer('${task.id}')" style="display: ${isRunning ? 'none' : 'flex'}">
                                    <i class="fas fa-play"></i> Démarrer
                                </button>
                                <button class="timer-btn pause" onclick="pauseTimer('${task.id}')" style="display: ${isRunning ? 'flex' : 'none'}">
                                    <i class="fas fa-pause"></i> Pause
                                </button>
                                <button class="timer-btn reset" onclick="resetTimer('${task.id}')">
                                    <i class="fas fa-redo"></i>
                                </button>
                            </div>
                        ` : ''}
                    </div>
                `;
            }).join('');
        }

        /* =========================================================================
           14. EVENT LISTENERS
        ========================================================================= */
        addTaskBtn.addEventListener('click', addTask);

        taskTitle.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addTask();
        });

        searchInput.addEventListener('input', (e) => {
            searchTasks(e.target.value);
        });

        filterTabs.forEach(tab => {
            tab.addEventListener('click', () => filterTasks(tab.dataset.filter));
        });

        cancelDelete.addEventListener('click', () => {
            taskToDelete = null;
            deleteModal.classList.remove('active');
        });

        confirmDelete.addEventListener('click', confirmDeleteTask);

        deleteModal.addEventListener('click', (e) => {
            if (e.target === deleteModal) {
                taskToDelete = null;
                deleteModal.classList.remove('active');
            }
        });

        themeToggle.addEventListener('click', toggleTheme);

        /* =========================================================================
           15. INITIALIZATION
        ========================================================================= */
        async function initialize() {
            try {
                // Open database
                await openDatabase();

                // Load theme preference
                await initializeTheme();

                // Load tasks from database
                tasks = await loadTasksFromDB();

                // Sort tasks by creation date (newest first)
                tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            } catch (error) {
                console.log('IndexedDB not available, using memory storage');
                // Fallback to system theme preference
                if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    document.documentElement.classList.add('dark');
                }
            }

            updateGreeting();
            updateStats();
            renderTasks();

            // Welcome toast
            setTimeout(() => {
                if (tasks.length > 0) {
                    showToast(`👋 Bon retour ! Vous avez ${tasks.length} tâche${tasks.length > 1 ? 's' : ''}`, 'info');
                } else {
                    showToast('👋 Bienvenue sur GESTACHES!', 'info');
                }
            }, 500);
        }

        // Start the app
        initialize();