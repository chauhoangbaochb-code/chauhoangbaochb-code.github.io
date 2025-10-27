const taskBoard = {
    init() {
        this.bindEvents();
    },

    bindEvents() {
        const form = document.querySelector('#new-task-form form');
        const filterSelect = document.getElementById('status-filter');
        const newTaskBtn = document.getElementById('new-task-btn');

        if (form) {
            form.addEventListener('submit', (event) => {
                event.preventDefault();
                alert('Tính năng tạo task sẽ được cập nhật trong tương lai.');
            });
        }

        if (filterSelect) {
            filterSelect.addEventListener('change', () => {
                console.log(`Filter theo trạng thái: ${filterSelect.value}`);
            });
        }

        if (newTaskBtn) {
            newTaskBtn.addEventListener('click', () => {
                document.getElementById('task-title')?.focus();
            });
        }
    }
};

window.addEventListener('DOMContentLoaded', () => taskBoard.init());
