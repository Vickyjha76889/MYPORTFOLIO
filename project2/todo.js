// Todo App Class
class TodoApp {
    constructor() {
        this.todos = [];
        this.filteredTodos = [];
        this.currentFilter = 'all';
        this.selectedTodos = new Set();
        this.settings = {
            theme: 'light',
            sortBy: 'created',
            autoSave: true,
            showCompleted: true
        };
        
        this.init();
    }

    init() {
        this.loadFromStorage();
        this.setupEventListeners();
        this.applySettings();
        this.render();
        this.showNotification('Welcome to Todo Master! 🎉', 'success');
    }

    // Event Listeners
    setupEventListeners() {
        // Add todo form
        const addForm = document.getElementById('addTodoForm');
        addForm.addEventListener('submit', (e) => this.handleAddTodo(e));

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleFilter(e));
        });

        // Settings
        document.getElementById('settingsFab').addEventListener('click', () => this.toggleSettings());
        document.getElementById('closeSettings').addEventListener('click', () => this.toggleSettings());
        
        // Settings controls
        document.getElementById('themeSelect').addEventListener('change', (e) => this.handleThemeChange(e));
        document.getElementById('sortSelect').addEventListener('change', (e) => this.handleSortChange(e));
        document.getElementById('autoSave').addEventListener('change', (e) => this.handleAutoSaveChange(e));
        document.getElementById('showCompleted').addEventListener('change', (e) => this.handleShowCompletedChange(e));

        // Bulk actions
        document.getElementById('markSelectedComplete').addEventListener('click', () => this.markSelectedComplete());
        document.getElementById('deleteSelected').addEventListener('click', () => this.deleteSelected());
        document.getElementById('clearSelection').addEventListener('click', () => this.clearSelection());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    // Add Todo
    handleAddTodo(e) {
        e.preventDefault();
        
        const input = document.getElementById('todoInput');
        const priority = document.getElementById('prioritySelect').value;
        const dueDate = document.getElementById('dueDate').value;
        const dueTime = document.getElementById('dueTime').value;
        
        const text = input.value.trim();
        if (!text) {
            this.showNotification('Please enter a task!', 'error');
            return;
        }

        const todo = {
            id: Date.now() + Math.random(),
            text: text,
            completed: false,
            priority: priority,
            dueDate: dueDate,
            dueTime: dueTime,
            createdAt: new Date().toISOString(),
            selected: false
        };

        this.todos.unshift(todo);
        this.saveToStorage();
        this.render();
        
        input.value = '';
        document.getElementById('dueDate').value = '';
        document.getElementById('dueTime').value = '';
        
        this.showNotification('Task added successfully! ✅', 'success');
        
        // Focus back to input
        input.focus();
    }

    // Toggle Todo Completion
    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveToStorage();
            this.render();
            
            const message = todo.completed ? 'Task completed! 🎉' : 'Task marked as pending';
            this.showNotification(message, 'success');
        }
    }

    // Delete Todo
    deleteTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            this.todos = this.todos.filter(t => t.id !== id);
            this.selectedTodos.delete(id);
            this.saveToStorage();
            this.render();
            this.showNotification('Task deleted! 🗑️', 'success');
        }
    }

    // Edit Todo
    editTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            const newText = prompt('Edit task:', todo.text);
            if (newText !== null && newText.trim() !== '') {
                todo.text = newText.trim();
                this.saveToStorage();
                this.render();
                this.showNotification('Task updated! ✏️', 'success');
            }
        }
    }

    // Toggle Todo Selection
    toggleTodoSelection(id) {
        if (this.selectedTodos.has(id)) {
            this.selectedTodos.delete(id);
        } else {
            this.selectedTodos.add(id);
        }
        this.updateBulkActions();
    }

    // Mark Selected Complete
    markSelectedComplete() {
        let count = 0;
        this.selectedTodos.forEach(id => {
            const todo = this.todos.find(t => t.id === id);
            if (todo && !todo.completed) {
                todo.completed = true;
                count++;
            }
        });
        
        if (count > 0) {
            this.saveToStorage();
            this.render();
            this.showNotification(`${count} task(s) marked as complete! 🎉`, 'success');
        }
        this.clearSelection();
    }

    // Delete Selected
    deleteSelected() {
        const count = this.selectedTodos.size;
        if (count > 0) {
            this.todos = this.todos.filter(t => !this.selectedTodos.has(t.id));
            this.saveToStorage();
            this.render();
            this.showNotification(`${count} task(s) deleted! 🗑️`, 'success');
        }
        this.clearSelection();
    }

    // Clear Selection
    clearSelection() {
        this.selectedTodos.clear();
        this.updateBulkActions();
    }

    // Update Bulk Actions
    updateBulkActions() {
        const bulkActions = document.getElementById('bulkActions');
        const selectedCount = document.getElementById('selectedCount');
        
        if (this.selectedTodos.size > 0) {
            selectedCount.textContent = this.selectedTodos.size;
            bulkActions.style.display = 'flex';
        } else {
            bulkActions.style.display = 'none';
        }
    }

    // Filter Todos
    handleFilter(e) {
        const filter = e.currentTarget.dataset.filter;
        
        // Update active filter button
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        e.currentTarget.classList.add('active');
        
        this.currentFilter = filter;
        this.render();
    }

    // Apply Filters
    applyFilters() {
        let filtered = [...this.todos];
        
        // Apply current filter
        switch (this.currentFilter) {
            case 'pending':
                filtered = filtered.filter(todo => !todo.completed);
                break;
            case 'completed':
                filtered = filtered.filter(todo => todo.completed);
                break;
            case 'high':
                filtered = filtered.filter(todo => todo.priority === 'high');
                break;
        }
        
        // Apply show completed setting
        if (!this.settings.showCompleted) {
            filtered = filtered.filter(todo => !todo.completed);
        }
        
        this.filteredTodos = filtered;
    }

    // Sort Todos
    sortTodos() {
        switch (this.settings.sortBy) {
            case 'created':
                this.filteredTodos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            case 'due':
                this.filteredTodos.sort((a, b) => {
                    if (!a.dueDate && !b.dueDate) return 0;
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(a.dueDate + ' ' + (a.dueTime || '00:00')) - new Date(b.dueDate + ' ' + (b.dueTime || '00:00'));
                });
                break;
            case 'priority':
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                this.filteredTodos.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
                break;
            case 'alphabetical':
                this.filteredTodos.sort((a, b) => a.text.localeCompare(b.text));
                break;
        }
    }

    // Render Todos
    render() {
        this.applyFilters();
        this.sortTodos();
        this.updateStats();
        this.renderTodoList();
        this.updateBulkActions();
    }

    // Render Todo List
    renderTodoList() {
        const todoList = document.getElementById('todoList');
        const emptyState = document.getElementById('emptyState');
        
        if (this.filteredTodos.length === 0) {
            todoList.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }
        
        emptyState.style.display = 'none';
        
        todoList.innerHTML = this.filteredTodos.map(todo => this.createTodoHTML(todo)).join('');
        
        // Add event listeners to new elements
        this.addTodoEventListeners();
    }

    // Create Todo HTML
    createTodoHTML(todo) {
        const isSelected = this.selectedTodos.has(todo.id);
        const isOverdue = this.isOverdue(todo);
        
        return `
            <div class="todo-item ${todo.completed ? 'completed' : ''} ${todo.priority}-priority ${isSelected ? 'selected' : ''}" data-id="${todo.id}">
                <div class="todo-checkbox ${todo.completed ? 'checked' : ''}" data-id="${todo.id}"></div>
                <div class="todo-content">
                    <div class="todo-text">${this.escapeHtml(todo.text)}</div>
                    <div class="todo-meta">
                        <span class="todo-priority ${todo.priority}">${todo.priority}</span>
                        ${todo.dueDate ? `
                            <span class="todo-due ${isOverdue ? 'overdue' : ''}">
                                <i class="fas fa-calendar"></i>
                                ${this.formatDate(todo.dueDate)} ${todo.dueTime ? this.formatTime(todo.dueTime) : ''}
                                ${isOverdue ? ' (Overdue)' : ''}
                            </span>
                        ` : ''}
                    </div>
                </div>
                <div class="todo-actions">
                    <button class="action-btn edit" data-id="${todo.id}" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" data-id="${todo.id}" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    // Add Todo Event Listeners
    addTodoEventListeners() {
        // Checkbox clicks
        document.querySelectorAll('.todo-checkbox').forEach(checkbox => {
            checkbox.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleTodo(parseFloat(e.currentTarget.dataset.id));
            });
        });

        // Todo item clicks (for selection)
        document.querySelectorAll('.todo-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.todo-checkbox') && !e.target.closest('.todo-actions')) {
                    this.toggleTodoSelection(parseFloat(e.currentTarget.dataset.id));
                    e.currentTarget.classList.toggle('selected');
                }
            });
        });

        // Action buttons
        document.querySelectorAll('.action-btn.edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.editTodo(parseFloat(e.currentTarget.dataset.id));
            });
        });

        document.querySelectorAll('.action-btn.delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteTodo(parseFloat(e.currentTarget.dataset.id));
            });
        });
    }

    // Update Stats
    updateStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(todo => todo.completed).length;
        const pending = total - completed;
        
        document.getElementById('totalTasks').textContent = total;
        document.getElementById('completedTasks').textContent = completed;
        document.getElementById('pendingTasks').textContent = pending;
    }

    // Settings Methods
    toggleSettings() {
        const panel = document.getElementById('settingsPanel');
        panel.classList.toggle('open');
    }

    handleThemeChange(e) {
        this.settings.theme = e.target.value;
        this.applySettings();
        this.saveSettings();
    }

    handleSortChange(e) {
        this.settings.sortBy = e.target.value;
        this.render();
        this.saveSettings();
    }

    handleAutoSaveChange(e) {
        this.settings.autoSave = e.target.checked;
        this.saveSettings();
    }

    handleShowCompletedChange(e) {
        this.settings.showCompleted = e.target.checked;
        this.render();
        this.saveSettings();
    }

    applySettings() {
        // Apply theme
        document.documentElement.setAttribute('data-theme', this.settings.theme);
        
        // Apply other settings
        document.getElementById('themeSelect').value = this.settings.theme;
        document.getElementById('sortSelect').value = this.settings.sortBy;
        document.getElementById('autoSave').checked = this.settings.autoSave;
        document.getElementById('showCompleted').checked = this.settings.showCompleted;
    }

    // Keyboard Shortcuts
    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + Enter to add todo
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            document.getElementById('addTodoForm').dispatchEvent(new Event('submit'));
        }
        
        // Escape to close settings
        if (e.key === 'Escape') {
            document.getElementById('settingsPanel').classList.remove('open');
        }
        
        // Ctrl/Cmd + A to select all
        if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
            e.preventDefault();
            this.selectAll();
        }
    }

    selectAll() {
        this.filteredTodos.forEach(todo => {
            this.selectedTodos.add(todo.id);
        });
        this.updateBulkActions();
        this.render();
    }

    // Utility Methods
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    }

    formatTime(timeString) {
        return timeString;
    }

    isOverdue(todo) {
        if (!todo.dueDate) return false;
        const dueDate = new Date(todo.dueDate + ' ' + (todo.dueTime || '23:59'));
        return dueDate < new Date() && !todo.completed;
    }

    // Storage Methods
    saveToStorage() {
        if (this.settings.autoSave) {
            localStorage.setItem('todos', JSON.stringify(this.todos));
        }
    }

    loadFromStorage() {
        const stored = localStorage.getItem('todos');
        if (stored) {
            this.todos = JSON.parse(stored);
        }
        
        const settings = localStorage.getItem('todoSettings');
        if (settings) {
            this.settings = { ...this.settings, ...JSON.parse(settings) };
        }
    }

    saveSettings() {
        localStorage.setItem('todoSettings', JSON.stringify(this.settings));
    }

    // Notification System
    showNotification(message, type = 'info') {
        const container = document.getElementById('notificationContainer');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span>${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;
        
        container.appendChild(notification);
        
        // Add close functionality
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.remove();
        });
        
        // Auto remove after 4 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 4000);
    }

    // Export/Import
    exportTodos() {
        const data = {
            todos: this.todos,
            settings: this.settings,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `todos-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showNotification('Todos exported successfully! 📁', 'success');
    }

    importTodos(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.todos && Array.isArray(data.todos)) {
                    this.todos = data.todos;
                    if (data.settings) {
                        this.settings = { ...this.settings, ...data.settings };
                    }
                    this.saveToStorage();
                    this.saveSettings();
                    this.applySettings();
                    this.render();
                    this.showNotification('Todos imported successfully! 📂', 'success');
                } else {
                    throw new Error('Invalid file format');
                }
            } catch (error) {
                this.showNotification('Error importing todos. Please check the file format.', 'error');
            }
        };
        reader.readAsText(file);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.todoApp = new TodoApp();
    
    // Add some sample todos for demonstration
    if (window.todoApp.todos.length === 0) {
        const sampleTodos = [
            {
                id: Date.now() + 1,
                text: 'Welcome to Todo Master! 🎉',
                completed: false,
                priority: 'high',
                dueDate: '',
                dueTime: '',
                createdAt: new Date().toISOString(),
                selected: false
            },
            {
                id: Date.now() + 2,
                text: 'Click the checkbox to mark as complete',
                completed: false,
                priority: 'medium',
                dueDate: '',
                dueTime: '',
                createdAt: new Date().toISOString(),
                selected: false
            },
            {
                id: Date.now() + 3,
                text: 'Try adding a new task with priority and due date',
                completed: false,
                priority: 'low',
                dueDate: '',
                dueTime: '',
                createdAt: new Date().toISOString(),
                selected: false
            }
        ];
        
        window.todoApp.todos = sampleTodos;
        window.todoApp.saveToStorage();
        window.todoApp.render();
    }
});

// Add CSS for selected state
const selectedStyles = document.createElement('style');
selectedStyles.textContent = `
    .todo-item.selected {
        background: rgba(102, 126, 234, 0.1);
        border-color: var(--primary-color);
    }
    
    .todo-item.selected .todo-text {
        color: var(--primary-color);
        font-weight: 600;
    }
    
    .todo-due.overdue {
        color: var(--danger-color);
        font-weight: 600;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: inherit;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        margin-left: 10px;
    }
    
    .notification-close:hover {
        opacity: 0.7;
    }
`;
document.head.appendChild(selectedStyles);

console.log('Todo Master app loaded successfully! 🚀'); 