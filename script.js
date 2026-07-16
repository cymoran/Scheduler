(() => {
  "use strict";

  const START_HOUR = 7;
  const END_HOUR = 18;
  const SLOT_MINUTES = 30;
  const SLOT_HEIGHT = 36;
  const TOTAL_SLOTS = ((END_HOUR - START_HOUR) * 60) / SLOT_MINUTES;
  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const STORAGE_KEY = "abaSchedulerPrototypeV1";

  const makeId = () =>
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const defaultClients = [
    { id: makeId(), name: "Rhyki", hours: 12, color: "blue" },
    { id: makeId(), name: "LJ", hours: 10, color: "purple" },
    { id: makeId(), name: "Geto", hours: 15, color: "green" },
    { id: makeId(), name: "Client D", hours: 8, color: "yellow" }
  ];

  const state = {
    weekStart: startOfWeek(new Date()),
    clients: [],
    appointments: []
  };

  const elements = {
    weekLabel: document.querySelector("#weekLabel"),
    dayHeaders: document.querySelector("#dayHeaders"),
    timeLabels: document.querySelector("#timeLabels"),
    scheduleGrid: document.querySelector("#scheduleGrid"),
    clientList: document.querySelector("#clientList"),
    clientCount: document.querySelector("#clientCount"),
    clientSearch: document.querySelector("#clientSearch"),
    weeklyHoursText: document.querySelector("#weeklyHoursText"),
    weeklyHoursFill: document.querySelector("#weeklyHoursFill"),
    weeklyHoursMessage: document.querySelector("#weeklyHoursMessage"),
    previousWeekBtn: document.querySelector("#previousWeekBtn"),
    nextWeekBtn: document.querySelector("#nextWeekBtn"),
    todayBtn: document.querySelector("#todayBtn"),
    addClientBtn: document.querySelector("#addClientBtn"),
    clearScheduleBtn: document.querySelector("#clearScheduleBtn"),
    clientModal: document.querySelector("#clientModal"),
    clientForm: document.querySelector("#clientForm"),
    clientNameInput: document.querySelector("#clientNameInput"),
    clientHoursInput: document.querySelector("#clientHoursInput"),
    clientColorInput: document.querySelector("#clientColorInput"),
    closeModalBtn: document.querySelector("#closeModalBtn"),
    cancelModalBtn: document.querySelector("#cancelModalBtn"),
    toast: document.querySelector("#toast")
  };

  function startOfWeek(date) {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    const day = result.getDay();
    const difference = day === 0 ? -6 : 1 - day;
    result.setDate(result.getDate() + difference);
    return result;
  }

  function dateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function addDays(date, count) {
    const result = new Date(date);
    result.setDate(result.getDate() + count);
    return result;
  }

  function formatMonthDay(date) {
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  function formatWeekRange() {
    const start = state.weekStart;
    const end = addDays(start, 4);
    const sameMonth = start.getMonth() === end.getMonth();
    const sameYear = start.getFullYear() === end.getFullYear();

    const startText = start.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: sameYear ? undefined : "numeric"
    });

    const endText = end.toLocaleDateString(undefined, {
      month: sameMonth ? undefined : "short",
      day: "numeric",
      year: "numeric"
    });

    return `${startText} – ${endText}`;
  }

  function minutesToTime(minutesFromStart) {
    const totalMinutes = START_HOUR * 60 + minutesFromStart;
    const hour24 = Math.floor(totalMinutes / 60);
    const minute = totalMinutes % 60;
    const suffix = hour24 >= 12 ? "PM" : "AM";
    const hour12 = hour24 % 12 || 12;
    return `${hour12}:${String(minute).padStart(2, "0")} ${suffix}`;
  }

  function formatHours(hours) {
    return Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
  }

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && Array.isArray(saved.clients) && Array.isArray(saved.appointments)) {
        state.clients = saved.clients;
        state.appointments = saved.appointments;
        if (saved.weekStart) {
          state.weekStart = new Date(`${saved.weekStart}T00:00:00`);
        }
        return;
      }
    } catch (error) {
      console.warn("Could not load saved schedule:", error);
    }

    state.clients = defaultClients;
    state.appointments = [];
  }

  function saveState() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        weekStart: dateKey(state.weekStart),
        clients: state.clients,
        appointments: state.appointments
      })
    );
  }

  function getCurrentWeekAppointments() {
    const currentWeekKey = dateKey(state.weekStart);
    return state.appointments.filter(
      (appointment) => appointment.weekKey === currentWeekKey
    );
  }

  function getScheduledHours(clientId) {
    const totalSlots = getCurrentWeekAppointments()
      .filter((appointment) => appointment.clientId === clientId)
      .reduce((sum, appointment) => sum + appointment.durationSlots, 0);

    return (totalSlots * SLOT_MINUTES) / 60;
  }

  function getHoursStatus(scheduled, required) {
    if (scheduled > required + 0.001) return "over";
    if (scheduled >= required - 0.001) return "met";
    return "under";
  }

  function render() {
    renderWeekHeader();
    renderTimeLabels();
    renderGrid();
    renderClients();
    renderWeeklySummary();
  }

  function renderWeekHeader() {
    elements.weekLabel.textContent = formatWeekRange();
    elements.dayHeaders.innerHTML = "";

    const today = dateKey(new Date());

    DAYS.forEach((dayName, index) => {
      const date = addDays(state.weekStart, index);
      const header = document.createElement("div");
      header.className = "day-header";
      if (dateKey(date) === today) header.classList.add("today");
      header.textContent = `${dayName} ${formatMonthDay(date)}`;
      elements.dayHeaders.appendChild(header);
    });
  }

  function renderTimeLabels() {
    elements.timeLabels.innerHTML = "";

    for (let slot = 0; slot < TOTAL_SLOTS; slot += 1) {
      const label = document.createElement("div");
      const minutes = slot * SLOT_MINUTES;
      const isHour = minutes % 60 === 0;
      label.className = `time-label${isHour ? " on-hour" : ""}`;
      label.textContent = minutesToTime(minutes);
      elements.timeLabels.appendChild(label);
    }
  }

  function renderGrid() {
    elements.scheduleGrid.innerHTML = "";
    const today = dateKey(new Date());

    DAYS.forEach((_, dayIndex) => {
      const column = document.createElement("div");
      column.className = "day-column";
      column.dataset.dayIndex = String(dayIndex);
      column.style.height = `${TOTAL_SLOTS * SLOT_HEIGHT}px`;

      const columnDate = addDays(state.weekStart, dayIndex);
      if (dateKey(columnDate) === today) column.classList.add("today");

      elements.scheduleGrid.appendChild(column);
    });

    getCurrentWeekAppointments().forEach(renderAppointment);
  }

  function renderClients() {
    const query = elements.clientSearch.value.trim().toLowerCase();
    elements.clientList.innerHTML = "";

    const filteredClients = state.clients.filter((client) =>
      client.name.toLowerCase().includes(query)
    );

    filteredClients.forEach((client) => {
      const scheduled = getScheduledHours(client.id);
      const required = Number(client.hours);
      const status = getHoursStatus(scheduled, required);
      const percentage = required > 0 ? Math.min((scheduled / required) * 100, 100) : 0;
      const statusText =
        status === "met" ? "Met" : status === "over" ? "Over" : "Under";

      const card = document.createElement("div");
      card.className = `client-card color-${client.color}`;
      card.dataset.clientId = client.id;
      card.innerHTML = `
        <div class="client-initials">${getInitials(client.name)}</div>
        <div>
          <div class="client-name-row">
            <div class="client-name">${escapeHtml(client.name)}</div>
            <span class="hours-status ${status}">${statusText}</span>
          </div>
          <div class="client-hours">${formatHours(scheduled)} of ${formatHours(required)} hrs scheduled</div>
          <div class="client-progress" aria-label="${formatHours(scheduled)} of ${formatHours(required)} required hours">
            <div class="client-progress-fill progress-${status}" style="width:${percentage}%"></div>
          </div>
        </div>
        <button class="client-menu" type="button" title="Remove client">×</button>
      `;

      card.addEventListener("pointerdown", (event) => {
        if (event.target.closest(".client-menu")) return;
        beginClientDrag(event, client);
      });

      card.querySelector(".client-menu").addEventListener("click", () => {
        const hasAppointments = state.appointments.some(
          (appointment) => appointment.clientId === client.id
        );
        const message = hasAppointments
          ? `Remove ${client.name} and all of their scheduled blocks?`
          : `Remove ${client.name}?`;

        if (confirm(message)) {
          state.clients = state.clients.filter((item) => item.id !== client.id);
          state.appointments = state.appointments.filter(
            (appointment) => appointment.clientId !== client.id
          );
          saveState();
          render();
        }
      });

      elements.clientList.appendChild(card);
    });

    if (filteredClients.length === 0) {
      const empty = document.createElement("p");
      empty.textContent = "No matching clients.";
      empty.style.color = "var(--muted)";
      empty.style.textAlign = "center";
      elements.clientList.appendChild(empty);
    }

    elements.clientCount.textContent = String(state.clients.length);
  }

  function renderWeeklySummary() {
    const scheduled = state.clients.reduce(
      (sum, client) => sum + getScheduledHours(client.id),
      0
    );
    const required = state.clients.reduce(
      (sum, client) => sum + Number(client.hours || 0),
      0
    );
    const percentage = required > 0 ? Math.min((scheduled / required) * 100, 100) : 0;
    const status = getHoursStatus(scheduled, required);

    elements.weeklyHoursText.textContent = `${formatHours(scheduled)} / ${formatHours(required)} hrs`;
    elements.weeklyHoursFill.style.width = `${percentage}%`;
    elements.weeklyHoursFill.className = `summary-progress-fill progress-${status}`;

    if (required === 0) {
      elements.weeklyHoursMessage.textContent = "Add clients to begin tracking weekly requirements.";
    } else if (status === "met") {
      elements.weeklyHoursMessage.textContent = "All combined required hours are scheduled.";
    } else if (status === "over") {
      elements.weeklyHoursMessage.textContent = `${formatHours(scheduled - required)} hours above the combined target.`;
    } else {
      elements.weeklyHoursMessage.textContent = `${formatHours(required - scheduled)} hours remain to be scheduled.`;
    }
  }

  function getInitials(name) {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("");
  }

  function escapeHtml(value) {
    const element = document.createElement("div");
    element.textContent = value;
    return element.innerHTML;
  }

  function renderAppointment(appointment) {
    const column = elements.scheduleGrid.querySelector(
      `.day-column[data-day-index="${appointment.dayIndex}"]`
    );
    const client = state.clients.find((item) => item.id === appointment.clientId);
    if (!column || !client) return;

    const block = document.createElement("div");
    block.className = `appointment color-${client.color}`;
    block.dataset.appointmentId = appointment.id;
    block.style.top = `${appointment.startSlot * SLOT_HEIGHT + 3}px`;
    block.style.height = `${appointment.durationSlots * SLOT_HEIGHT - 6}px`;

    const startMinutes = appointment.startSlot * SLOT_MINUTES;
    const endMinutes = startMinutes + appointment.durationSlots * SLOT_MINUTES;

    block.innerHTML = `
      <div class="appointment-title">
        <span>${escapeHtml(client.name)}</span>
        <button class="delete-appointment" type="button" title="Delete appointment">×</button>
      </div>
      <span class="appointment-time">${minutesToTime(startMinutes)} – ${minutesToTime(endMinutes)}</span>
      <div class="resize-handle" title="Drag to resize"></div>
    `;

    block.querySelector(".delete-appointment").addEventListener("click", (event) => {
      event.stopPropagation();
      state.appointments = state.appointments.filter(
        (item) => item.id !== appointment.id
      );
      saveState();
      render();
    });

    block.addEventListener("pointerdown", (event) => {
      if (event.target.closest(".delete-appointment")) return;
      if (event.target.closest(".resize-handle")) {
        beginResize(event, appointment, block);
      } else {
        beginAppointmentMove(event, appointment, block);
      }
    });

    column.appendChild(block);
  }

  let activeDrag = null;

  function createSnapPreview(client, durationSlots) {
    const preview = document.createElement("div");
    preview.className = `snap-preview color-${client.color}`;
    preview.style.height = `${durationSlots * SLOT_HEIGHT - 6}px`;
    preview.innerHTML = `
      <div class="appointment-title"><span>${escapeHtml(client.name)}</span></div>
      <span class="appointment-time"></span>
    `;
    return preview;
  }

  function beginClientDrag(event, client) {
    event.preventDefault();
    const durationSlots = 2;

    activeDrag = {
      type: "new-client",
      clientId: client.id,
      durationSlots,
      preview: createSnapPreview(client, durationSlots),
      dayIndex: null,
      startSlot: null
    };

    document.addEventListener("pointermove", globalPointerMove);
    document.addEventListener("pointerup", globalPointerUp, { once: true });
    updateSnapPreview(event);
  }

  function beginAppointmentMove(event, appointment, block) {
    event.preventDefault();
    const client = state.clients.find((item) => item.id === appointment.clientId);
    if (!client) return;

    const rect = block.getBoundingClientRect();
    block.classList.add("drag-source");

    activeDrag = {
      type: "move-appointment",
      appointmentId: appointment.id,
      durationSlots: appointment.durationSlots,
      pointerOffsetY: event.clientY - rect.top,
      preview: createSnapPreview(client, appointment.durationSlots),
      originalBlock: block,
      dayIndex: null,
      startSlot: null
    };

    document.addEventListener("pointermove", globalPointerMove);
    document.addEventListener("pointerup", globalPointerUp, { once: true });
    updateSnapPreview(event);
  }

  function beginResize(event, appointment, block) {
    event.preventDefault();
    event.stopPropagation();

    activeDrag = {
      type: "resize",
      appointmentId: appointment.id,
      startY: event.clientY,
      originalDuration: appointment.durationSlots,
      block,
      previewDuration: appointment.durationSlots
    };

    document.addEventListener("pointermove", globalPointerMove);
    document.addEventListener("pointerup", globalPointerUp, { once: true });
  }

  function globalPointerMove(event) {
    if (!activeDrag) return;

    if (activeDrag.type === "resize") {
      const appointment = state.appointments.find(
        (item) => item.id === activeDrag.appointmentId
      );
      if (!appointment) return;

      const slotDelta = Math.round((event.clientY - activeDrag.startY) / SLOT_HEIGHT);
      const maxDuration = TOTAL_SLOTS - appointment.startSlot;
      const newDuration = clamp(
        activeDrag.originalDuration + slotDelta,
        1,
        maxDuration
      );

      activeDrag.previewDuration = newDuration;
      activeDrag.block.style.height = `${newDuration * SLOT_HEIGHT - 6}px`;
      const timeLabel = activeDrag.block.querySelector(".appointment-time");
      const startMinutes = appointment.startSlot * SLOT_MINUTES;
      timeLabel.textContent = `${minutesToTime(startMinutes)} – ${minutesToTime(
        startMinutes + newDuration * SLOT_MINUTES
      )}`;
      return;
    }

    updateSnapPreview(event);
  }

  function updateSnapPreview(event) {
    document.querySelectorAll(".day-column").forEach((column) => {
      column.classList.remove("drop-active");
    });

    const target = document.elementFromPoint(event.clientX, event.clientY);
    const column = target?.closest(".day-column");

    if (!column || !activeDrag?.preview) {
      removePreviewFromGrid();
      return;
    }

    const dayIndex = Number(column.dataset.dayIndex);
    const rect = column.getBoundingClientRect();
    const offset = activeDrag.type === "move-appointment"
      ? activeDrag.pointerOffsetY
      : SLOT_HEIGHT / 2;

    const rawY = event.clientY - rect.top - offset;
    const maxStartSlot = TOTAL_SLOTS - activeDrag.durationSlots;
    const startSlot = clamp(Math.round(rawY / SLOT_HEIGHT), 0, maxStartSlot);

    if (activeDrag.preview.parentElement !== column) {
      activeDrag.preview.remove();
      column.appendChild(activeDrag.preview);
    }

    column.classList.add("drop-active");
    activeDrag.preview.style.top = `${startSlot * SLOT_HEIGHT + 3}px`;
    activeDrag.preview.style.height = `${activeDrag.durationSlots * SLOT_HEIGHT - 6}px`;

    const startMinutes = startSlot * SLOT_MINUTES;
    activeDrag.preview.querySelector(".appointment-time").textContent =
      `${minutesToTime(startMinutes)} – ${minutesToTime(
        startMinutes + activeDrag.durationSlots * SLOT_MINUTES
      )}`;

    activeDrag.dayIndex = dayIndex;
    activeDrag.startSlot = startSlot;
  }

  function removePreviewFromGrid() {
    if (activeDrag?.preview) activeDrag.preview.remove();
    if (activeDrag) {
      activeDrag.dayIndex = null;
      activeDrag.startSlot = null;
    }
  }

  function globalPointerUp() {
    document.removeEventListener("pointermove", globalPointerMove);

    if (!activeDrag) return;

    if (activeDrag.type === "resize") {
      const appointment = state.appointments.find(
        (item) => item.id === activeDrag.appointmentId
      );
      if (appointment) {
        appointment.durationSlots = activeDrag.previewDuration;
        saveState();
        showToast("Appointment duration updated.");
      }
      activeDrag = null;
      render();
      return;
    }

    if (activeDrag.dayIndex !== null && activeDrag.startSlot !== null) {
      const weekKey = dateKey(state.weekStart);

      if (activeDrag.type === "new-client") {
        state.appointments.push({
          id: makeId(),
          clientId: activeDrag.clientId,
          weekKey,
          dayIndex: activeDrag.dayIndex,
          startSlot: activeDrag.startSlot,
          durationSlots: activeDrag.durationSlots
        });
        showToast("Client added to the schedule.");
      }

      if (activeDrag.type === "move-appointment") {
        const appointment = state.appointments.find(
          (item) => item.id === activeDrag.appointmentId
        );
        if (appointment) {
          appointment.weekKey = weekKey;
          appointment.dayIndex = activeDrag.dayIndex;
          appointment.startSlot = activeDrag.startSlot;
          showToast("Appointment moved.");
        }
      }

      saveState();
    }

    cleanupDrag();
    render();
  }

  function cleanupDrag() {
    document.querySelectorAll(".day-column").forEach((column) => {
      column.classList.remove("drop-active");
    });

    if (activeDrag?.preview) activeDrag.preview.remove();
    if (activeDrag?.originalBlock) activeDrag.originalBlock.classList.remove("drag-source");
    activeDrag = null;
  }

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function showModal() {
    elements.clientModal.classList.remove("hidden");
    elements.clientNameInput.focus();
  }

  function hideModal() {
    elements.clientModal.classList.add("hidden");
    elements.clientForm.reset();
    elements.clientHoursInput.value = "10";
  }

  let toastTimer = null;
  function showToast(message) {
    clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.remove("hidden");
    toastTimer = setTimeout(() => {
      elements.toast.classList.add("hidden");
    }, 1900);
  }

  elements.previousWeekBtn.addEventListener("click", () => {
    state.weekStart = addDays(state.weekStart, -7);
    saveState();
    render();
  });

  elements.nextWeekBtn.addEventListener("click", () => {
    state.weekStart = addDays(state.weekStart, 7);
    saveState();
    render();
  });

  elements.todayBtn.addEventListener("click", () => {
    state.weekStart = startOfWeek(new Date());
    saveState();
    render();
  });

  elements.addClientBtn.addEventListener("click", showModal);
  elements.closeModalBtn.addEventListener("click", hideModal);
  elements.cancelModalBtn.addEventListener("click", hideModal);

  elements.clientModal.addEventListener("click", (event) => {
    if (event.target === elements.clientModal) hideModal();
  });

  elements.clientForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = elements.clientNameInput.value.trim();
    const hours = Number(elements.clientHoursInput.value);
    const color = elements.clientColorInput.value;

    if (!name || !Number.isFinite(hours) || hours <= 0) return;

    state.clients.push({
      id: makeId(),
      name,
      hours,
      color
    });

    saveState();
    hideModal();
    render();
    showToast(`${name} added.`);
  });

  elements.clientSearch.addEventListener("input", renderClients);

  elements.clearScheduleBtn.addEventListener("click", () => {
    const currentWeekKey = dateKey(state.weekStart);
    const currentWeekCount = state.appointments.filter(
      (appointment) => appointment.weekKey === currentWeekKey
    ).length;

    if (currentWeekCount === 0) {
      showToast("This week is already empty.");
      return;
    }

    if (confirm("Clear every appointment displayed in this week?")) {
      state.appointments = state.appointments.filter(
        (appointment) => appointment.weekKey !== currentWeekKey
      );
      saveState();
      render();
      showToast("Week cleared.");
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (!elements.clientModal.classList.contains("hidden")) hideModal();
      cleanupDrag();
      render();
    }
  });

  loadState();
  render();
})();
