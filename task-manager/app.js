(function () {
  const STORAGE_KEY = "task-manager.tasks";

  const loadTasks = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }

    try {
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed
        .filter((item) => item && typeof item === "object")
        .map((item) => ({
          id: typeof item.id === "number" ? item.id : Number(item.id) || Date.now(),
          title: typeof item.title === "string" ? item.title : "",
          description: typeof item.description === "string" ? item.description : "",
          status: typeof item.status === "string" ? item.status : "todo",
          priority: typeof item.priority === "string" ? item.priority : "",
          dueDate: typeof item.dueDate === "string" ? item.dueDate : "",
        }));
    } catch (error) {
      console.error("Không thể parse dữ liệu tasks từ localStorage", error);
      return [];
    }
  };

  let tasks = loadTasks();
  let nextTaskId =
    tasks.reduce((maxId, task) => {
      const numericId = Number(task.id);
      return Number.isFinite(numericId) ? Math.max(maxId, numericId) : maxId;
    }, 0) + 1;

  const generateTaskId = () => {
    const id = nextTaskId;
    nextTaskId += 1;
    return id;
  };

  const saveTasks = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  };

  const formatDueDate = (value) => {
    if (!value) {
      return "Không có hạn";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString("vi-VN");
  };

  const renderTasks = () => {
    const statusColumns = Array.from(document.querySelectorAll("[data-status]"));
    const statuses = statusColumns.map((column) => column.dataset.status);

    if (statuses.length > 0) {
      let didNormalize = false;
      tasks.forEach((task) => {
        if (!statuses.includes(task.status)) {
          task.status = statuses[0];
          didNormalize = true;
        }
      });
      if (didNormalize) {
        saveTasks();
      }
    }

    const createTaskCard = (task) => {
      const card = document.createElement("article");
      card.className = "task-card";
      card.dataset.taskId = task.id;

      const header = document.createElement("header");
      header.className = "task-card__header";

      const title = document.createElement("h3");
      title.className = "task-card__title";
      title.textContent = task.title || "(Không có tiêu đề)";

      header.appendChild(title);
      card.appendChild(header);

      if (task.description) {
        const description = document.createElement("p");
        description.className = "task-card__description";
        description.textContent = task.description;
        card.appendChild(description);
      }

      const meta = document.createElement("div");
      meta.className = "task-card__meta";

      const priority = document.createElement("span");
      priority.className = "task-card__priority";
      priority.textContent = `Ưu tiên: ${task.priority || "Không có"}`;
      meta.appendChild(priority);

      const dueDate = document.createElement("span");
      dueDate.className = "task-card__due-date";
      dueDate.textContent = `Hạn: ${formatDueDate(task.dueDate)}`;
      meta.appendChild(dueDate);

      card.appendChild(meta);

      if (statuses.length > 0) {
        const statusWrapper = document.createElement("div");
        statusWrapper.className = "task-card__status";

        const statusLabel = document.createElement("label");
        statusLabel.textContent = "Trạng thái:";
        statusLabel.htmlFor = `task-status-${task.id}`;
        statusWrapper.appendChild(statusLabel);

        const statusSelect = document.createElement("select");
        statusSelect.id = `task-status-${task.id}`;
        statusSelect.className = "task-card__status-select";

        statuses.forEach((status) => {
          const option = document.createElement("option");
          option.value = status;
          option.textContent = status;
          statusSelect.appendChild(option);
        });

        statusSelect.value = task.status;
        statusSelect.addEventListener("change", (event) => {
          const { value } = event.target;
          const index = tasks.findIndex((candidate) => candidate.id === task.id);
          if (index !== -1) {
            tasks[index] = { ...tasks[index], status: value };
            saveTasks();
            renderTasks();
          }
        });

        statusWrapper.appendChild(statusSelect);
        card.appendChild(statusWrapper);
      }

      const actions = document.createElement("div");
      actions.className = "task-card__actions";

      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.className = "task-card__action task-card__action--edit";
      editButton.textContent = "Chỉnh sửa";
      editButton.addEventListener("click", () => {
        const newTitle = prompt("Tiêu đề mới", task.title);
        if (newTitle === null) {
          return;
        }

        const newDescription = prompt("Mô tả mới", task.description || "");
        if (newDescription === null) {
          return;
        }

        const newPriority = prompt("Độ ưu tiên mới", task.priority || "");
        if (newPriority === null) {
          return;
        }

        const newDueDate = prompt("Hạn mới (YYYY-MM-DD)", task.dueDate || "");
        if (newDueDate === null) {
          return;
        }

        const index = tasks.findIndex((candidate) => candidate.id === task.id);
        if (index !== -1) {
          tasks[index] = {
            ...tasks[index],
            title: newTitle.trim() || tasks[index].title,
            description: newDescription.trim(),
            priority: newPriority.trim(),
            dueDate: newDueDate.trim(),
          };
          saveTasks();
          renderTasks();
        }
      });

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "task-card__action task-card__action--delete";
      deleteButton.textContent = "Xóa";
      deleteButton.addEventListener("click", () => {
        const confirmed = confirm(`Bạn có chắc muốn xóa task "${task.title}"?`);
        if (!confirmed) {
          return;
        }

        tasks = tasks.filter((candidate) => candidate.id !== task.id);
        saveTasks();
        renderTasks();
      });

      actions.appendChild(editButton);
      actions.appendChild(deleteButton);
      card.appendChild(actions);

      return card;
    };

    if (statusColumns.length === 0) {
      const fallbackContainer =
        document.querySelector("[data-role='task-list']") ||
        document.querySelector(".task-list") ||
        document.querySelector("#task-list");

      if (fallbackContainer) {
        fallbackContainer.innerHTML = "";
        const fragment = document.createDocumentFragment();
        tasks.forEach((task) => {
          fragment.appendChild(createTaskCard(task));
        });
        fallbackContainer.appendChild(fragment);
      }
      return;
    }

    statusColumns.forEach((column) => {
      const { status } = column.dataset;
      const container =
        column.querySelector("[data-role='task-list']") || column.querySelector(".task-list") || column;
      container.innerHTML = "";

      const fragment = document.createDocumentFragment();
      tasks
        .filter((task) => task.status === status)
        .forEach((task) => {
          fragment.appendChild(createTaskCard(task));
        });

      container.appendChild(fragment);
    });
  };

  document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("form");

    if (form) {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const formData = new FormData(form);

        const title = (formData.get("title") || "").toString().trim();
        if (!title) {
          alert("Vui lòng nhập tiêu đề cho task.");
          return;
        }

        const description = (formData.get("description") || "").toString().trim();
        const priority = (formData.get("priority") || "").toString().trim();
        const dueDate = (formData.get("dueDate") || "").toString().trim();

        const statusColumns = Array.from(document.querySelectorAll("[data-status]"));
        const statuses = statusColumns.map((column) => column.dataset.status);
        const submittedStatus = (formData.get("status") || "").toString().trim();
        const status = statuses.includes(submittedStatus)
          ? submittedStatus
          : statuses[0] || submittedStatus || "todo";

        const newTask = {
          id: generateTaskId(),
          title,
          description,
          status,
          priority,
          dueDate,
        };

        tasks.push(newTask);
        saveTasks();
        renderTasks();
        form.reset();

        if (form.elements.status && statuses.length > 0) {
          form.elements.status.value = statuses[0];
        }
      });
    }

    renderTasks();
  });
})();
