(() => {
  "use strict";

  const START_HOUR = 7;
  const END_HOUR = 18;
  const SLOT_MINUTES = 30;
  const SLOT_HEIGHT = 36;
  const TOTAL_SLOTS = ((END_HOUR - START_HOUR) * 60) / SLOT_MINUTES;
  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const STORAGE_KEY = "abaSchedulerPrototypeV1";
  const DEFAULT_RULE_IDS = {
    supervision: "rule-supervision",
    parentTraining: "rule-parent-training"
  };

  const makeId = () =>
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const defaultRules = [
    { id: DEFAULT_RULE_IDS.supervision, name: "Supervision", color: "blue" },
    { id: DEFAULT_RULE_IDS.parentTraining, name: "Parent training", color: "purple" }
  ];

  const defaultClients = [
    { id: makeId(), name: "Rhyki", color: "blue", targets: { [DEFAULT_RULE_IDS.supervision]: 5, [DEFAULT_RULE_IDS.parentTraining]: 2 }, availability: [true, true, true, true, true] },
    { id: makeId(), name: "LJ", color: "purple", targets: { [DEFAULT_RULE_IDS.supervision]: 4, [DEFAULT_RULE_IDS.parentTraining]: 1 }, availability: [true, true, true, true, true] },
    { id: makeId(), name: "Geto", color: "green", targets: { [DEFAULT_RULE_IDS.supervision]: 6, [DEFAULT_RULE_IDS.parentTraining]: 2 }, availability: [true, true, true, true, true] },
    { id: makeId(), name: "Client D", color: "yellow", targets: { [DEFAULT_RULE_IDS.supervision]: 3, [DEFAULT_RULE_IDS.parentTraining]: 1 }, availability: [true, true, true, true, true] }
  ];

  const state = {
    weekStart: startOfWeek(new Date()),
    clients: [],
    appointments: [],
    blocks: [],
    rules: [],
    view: "week",
    lastWeekStart: startOfWeek(new Date())
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
    addBlockBtn: document.querySelector("#addBlockBtn"),
    weeklySummaryBtn: document.querySelector("#weeklySummaryBtn"),
    clearScheduleBtn: document.querySelector("#clearScheduleBtn"),
    clientModal: document.querySelector("#clientModal"),
    clientForm: document.querySelector("#clientForm"),
    clientModalTitle: document.querySelector("#clientModalTitle"),
    saveClientBtn: document.querySelector("#saveClientBtn"),
    clientNameInput: document.querySelector("#clientNameInput"),
    clientColorInput: document.querySelector("#clientColorInput"),
    clientTargetInputs: document.querySelector("#clientTargetInputs"),
    clientAvailabilityInputs: document.querySelector("#clientAvailabilityInputs"),
    closeModalBtn: document.querySelector("#closeModalBtn"),
    cancelModalBtn: document.querySelector("#cancelModalBtn"),
    toast: document.querySelector("#toast"),
    sessionModal: document.querySelector("#sessionModal"),
    sessionForm: document.querySelector("#sessionForm"),
    sessionIdInput: document.querySelector("#sessionIdInput"),
    sessionModalSubtitle: document.querySelector("#sessionModalSubtitle"),
    sessionRbtInput: document.querySelector("#sessionRbtInput"),
    sessionActualMinutesInput: document.querySelector("#sessionActualMinutesInput"),
    sessionRuleInput: document.querySelector("#sessionRuleInput"),
    sessionNotesInput: document.querySelector("#sessionNotesInput"),
    sessionBillingNotesInput: document.querySelector("#sessionBillingNotesInput"),
    sessionTargetsMetInput: document.querySelector("#sessionTargetsMetInput"),
    sessionRepeatInput: document.querySelector("#sessionRepeatInput"),
    sessionRepeatCountInput: document.querySelector("#sessionRepeatCountInput"),
    sessionRepeatCountLabel: document.querySelector("#sessionRepeatCountLabel"),
    closeSessionModalBtn: document.querySelector("#closeSessionModalBtn"),
    cancelSessionModalBtn: document.querySelector("#cancelSessionModalBtn"),
    deleteSessionBtn: document.querySelector("#deleteSessionBtn"),
    blockModal: document.querySelector("#blockModal"),
    blockForm: document.querySelector("#blockForm"),
    blockTitleInput: document.querySelector("#blockTitleInput"),
    blockDayInput: document.querySelector("#blockDayInput"),
    blockStartInput: document.querySelector("#blockStartInput"),
    blockDurationInput: document.querySelector("#blockDurationInput"),
    blockNotesInput: document.querySelector("#blockNotesInput"),
    blockRepeatInput: document.querySelector("#blockRepeatInput"),
    blockRepeatCountInput: document.querySelector("#blockRepeatCountInput"),
    blockRepeatCountLabel: document.querySelector("#blockRepeatCountLabel"),
    closeBlockModalBtn: document.querySelector("#closeBlockModalBtn"),
    cancelBlockModalBtn: document.querySelector("#cancelBlockModalBtn"),
    deleteBlockBtn: document.querySelector("#deleteBlockBtn"),
    summaryModal: document.querySelector("#summaryModal"),
    summaryWeekLabel: document.querySelector("#summaryWeekLabel"),
    summaryContent: document.querySelector("#summaryContent"),
    closeSummaryModalBtn: document.querySelector("#closeSummaryModalBtn"),
    closeSummaryBtn: document.querySelector("#closeSummaryBtn"),
    weekView: document.querySelector("#weekView"),
    monthView: document.querySelector("#monthView"),
    weekViewBtn: document.querySelector("#weekViewBtn"),
    monthViewBtn: document.querySelector("#monthViewBtn"),
    manageRulesBtn: document.querySelector("#manageRulesBtn"),
    rulesModal: document.querySelector("#rulesModal"),
    closeRulesModalBtn: document.querySelector("#closeRulesModalBtn"),
    closeRulesBtn: document.querySelector("#closeRulesBtn"),
    addRuleForm: document.querySelector("#addRuleForm"),
    ruleNameInput: document.querySelector("#ruleNameInput"),
    ruleColorInput: document.querySelector("#ruleColorInput"),
    rulesList: document.querySelector("#rulesList"),
    clientHoverPopup: document.querySelector("#clientHoverPopup")
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

  function dateFromKey(key) {
    return new Date(`${key}T00:00:00`);
  }

  function createWeeklyRecurrences(collection, source, count, type) {
    const totalWeeks = clamp(Number(count) || 2, 2, 52);
    const groupId = source.recurrenceGroupId || makeId();
    const recurrenceStartWeek = source.recurrenceStartWeek || source.weekKey;
    source.recurrenceGroupId = groupId;
    source.recurrence = "weekly";
    source.recurrenceCount = totalWeeks;
    source.recurrenceStartWeek = recurrenceStartWeek;

    for (let offset = 1; offset < totalWeeks; offset += 1) {
      const weekKey = dateKey(addDays(dateFromKey(recurrenceStartWeek), offset * 7));
      const alreadyExists = collection.some(
        (item) => item.recurrenceGroupId === groupId && item.weekKey === weekKey
      );
      if (alreadyExists) continue;
      const copy = {
        ...source,
        id: makeId(),
        weekKey,
        recurrenceGroupId: groupId,
        recurrence: "weekly"
      };
      if (type === "session") {
        copy.actualMinutes = undefined;
        copy.notes = [];
        copy.billingNotes = "";
        copy.targetsMet = false;
      }
      collection.push(copy);
    }
  }

  function updateRepeatVisibility(select, label) {
    label.classList.toggle("hidden", select.value !== "weekly");
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
      month: "long",
      day: "numeric",
      year: undefined
    });

    const endText = end.toLocaleDateString(undefined, {
      month: sameMonth ? undefined : "long",
      day: "numeric",
      year: undefined
    });

    const yearText = sameYear
      ? String(end.getFullYear())
      : `${start.getFullYear()}–${end.getFullYear()}`;
    return `${startText} – ${endText}, ${yearText}`;
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
        state.blocks = Array.isArray(saved.blocks) ? saved.blocks : [];
        state.rules = Array.isArray(saved.rules) && saved.rules.length
          ? saved.rules
          : [{ id: "rule-legacy-service", name: "Client service", color: "blue" }];
        state.view = saved.view === "month" ? "month" : "week";
        state.lastWeekStart = saved.lastWeekStart
          ? new Date(`${saved.lastWeekStart}T00:00:00`)
          : saved.weekStart
            ? startOfWeek(new Date(`${saved.weekStart}T00:00:00`))
            : startOfWeek(new Date());
        const fallbackRuleId = state.rules[0].id;
        state.clients.forEach((client) => {
          if (!client.targets || typeof client.targets !== "object") {
            client.targets = { [fallbackRuleId]: Number(client.hours || 0) };
          }
          if (!Array.isArray(client.availability) || client.availability.length !== DAYS.length) {
            client.availability = DAYS.map(() => true);
          }
        });
        state.appointments.forEach((appointment) => {
          if (!appointment.ruleId) appointment.ruleId = fallbackRuleId;
        });
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
    state.blocks = [];
    state.rules = defaultRules;
    state.lastWeekStart = startOfWeek(new Date());
  }

  function saveState() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        weekStart: dateKey(state.weekStart),
        clients: state.clients,
        appointments: state.appointments,
        blocks: state.blocks,
        rules: state.rules,
        view: state.view,
        lastWeekStart: dateKey(state.lastWeekStart)
      })
    );
  }

  function getCurrentWeekAppointments() {
    const currentWeekKey = dateKey(startOfWeek(state.weekStart));
    return state.appointments.filter(
      (appointment) => appointment.weekKey === currentWeekKey
    );
  }

  function getScheduledHours(clientId, ruleId = null, weekKey = dateKey(startOfWeek(state.weekStart))) {
    const totalSlots = state.appointments
      .filter((appointment) =>
        appointment.clientId === clientId &&
        appointment.weekKey === weekKey &&
        (!ruleId || appointment.ruleId === ruleId)
      )
      .reduce((sum, appointment) => sum + appointment.durationSlots, 0);

    return (totalSlots * SLOT_MINUTES) / 60;
  }

  function getClientTarget(client, ruleId = null) {
    if (ruleId) return Number(client.targets?.[ruleId] || 0);
    return Object.values(client.targets || {}).reduce((sum, value) => sum + Number(value || 0), 0);
  }

  function getRule(ruleId) {
    return state.rules.find((rule) => rule.id === ruleId);
  }

  function getActualHours(clientId) {
    return getCurrentWeekAppointments()
      .filter((appointment) => appointment.clientId === clientId)
      .reduce((sum, appointment) => {
        const fallback = appointment.durationSlots * SLOT_MINUTES;
        const actual = Number(appointment.actualMinutes);
        return sum + (Number.isFinite(actual) ? actual : fallback);
      }, 0) / 60;
  }

  function getHoursStatus(scheduled, required) {
    if (required <= 0) return "under";
    if (scheduled > required + 0.001) return "over";
    if (scheduled >= required - 0.001) return "met";
    return "under";
  }

  function render() {
    renderWeekHeader();
    elements.weekView.classList.toggle("hidden", state.view !== "week");
    elements.monthView.classList.toggle("hidden", state.view !== "month");
    elements.weekViewBtn.classList.toggle("active", state.view === "week");
    elements.monthViewBtn.classList.toggle("active", state.view === "month");
    elements.addBlockBtn.disabled = state.view === "month";
    elements.clearScheduleBtn.disabled = state.view === "month";
    elements.weeklySummaryBtn.disabled = state.view === "month";
    elements.addBlockBtn.title = state.view === "month" ? "Open a week before adding blocked time" : "";
    if (state.view === "week") {
      renderTimeLabels();
      renderGrid();
    } else {
      renderMonthView();
    }
    renderClients();
    renderWeeklySummary();
  }

  function renderWeekHeader() {
    elements.weekLabel.textContent = state.view === "month"
      ? state.weekStart.toLocaleDateString(undefined, { month: "long", year: "numeric" })
      : formatWeekRange();
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

  function renderMonthView() {
    elements.monthView.innerHTML = "";
    const monthDate = new Date(state.weekStart.getFullYear(), state.weekStart.getMonth(), 1);
    const lastOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
    let week = startOfWeek(monthDate);

    while (week <= lastOfMonth) {
      const weekKey = dateKey(week);
      const weekEnd = addDays(week, 4);
      const card = document.createElement("section");
      card.className = "month-week-card";
      const clientRows = state.clients.map((client) => {
        const total = getScheduledHours(client.id, null, weekKey);
        if (total === 0) return "";
        const ruleStats = state.rules.map((rule) => {
          const hours = getScheduledHours(client.id, rule.id, weekKey);
          const ruleTarget = getClientTarget(client, rule.id);
          return hours > 0
            ? `<span class="month-rule-stat"><i class="rule-dot color-solid-${rule.color}"></i>${escapeHtml(rule.name)} ${formatHours(hours)}/${formatHours(ruleTarget)}h</span>`
            : "";
        }).join("");
        const target = getClientTarget(client);
        const status = getHoursStatus(total, target);
        return `<div class="month-client-row color-${client.color}">
          <div class="month-client-main">
            <strong>${escapeHtml(client.name)}</strong>
            <span class="hours-status ${status}">${formatHours(total)} / ${formatHours(target)}h</span>
          </div>
          <div class="month-rule-stats">${ruleStats}</div>
        </div>`;
      }).join("");
      card.innerHTML = `
        <button class="month-week-heading" type="button" data-week-key="${weekKey}">
          <span>Week of</span>
          <strong>${formatMonthDay(week)} – ${formatMonthDay(weekEnd)}</strong>
          <em>Open week →</em>
        </button>
        <div class="month-client-rows">${clientRows || '<p class="month-empty">No client sessions scheduled.</p>'}</div>
      `;
      card.querySelector(".month-week-heading").addEventListener("click", () => {
        state.weekStart = new Date(`${weekKey}T00:00:00`);
        state.lastWeekStart = new Date(`${weekKey}T00:00:00`);
        state.view = "week";
        saveState();
        render();
      });
      elements.monthView.appendChild(card);
      week = addDays(week, 7);
    }
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
    state.blocks
      .filter((block) => block.weekKey === dateKey(state.weekStart))
      .forEach(renderBlock);
  }

  function renderClients() {
    elements.clientHoverPopup.classList.remove("visible");
    const query = elements.clientSearch.value.trim().toLowerCase();
    elements.clientList.innerHTML = "";

    const filteredClients = state.clients.filter((client) =>
      client.name.toLowerCase().includes(query)
    );

    filteredClients.forEach((client) => {
      const scheduled = getScheduledHours(client.id);
      const required = getClientTarget(client);
      const status = getHoursStatus(scheduled, required);
      const percentage = required > 0 ? Math.min((scheduled / required) * 100, 100) : 0;
      const statusText =
        status === "met" ? "Met" : status === "over" ? "Over" : "Under";
      const ruleProgressRows = state.rules
        .filter((rule) => getClientTarget(client, rule.id) > 0)
        .map((rule) => {
          const ruleScheduled = getScheduledHours(client.id, rule.id);
          const ruleTarget = getClientTarget(client, rule.id);
          const rulePercentage = Math.min((ruleScheduled / ruleTarget) * 100, 100);
          const ruleStatus = getHoursStatus(ruleScheduled, ruleTarget);
          return `<div class="client-rule-progress">
            <div><span><i class="rule-dot color-solid-${rule.color}"></i>${escapeHtml(rule.name)}</span><strong>${formatHours(ruleScheduled)} / ${formatHours(ruleTarget)}h</strong></div>
            <div class="client-progress"><div class="client-progress-fill progress-${ruleStatus}" style="width:${rulePercentage}%"></div></div>
          </div>`;
        }).join("");
      const hoverNoteDays = DAYS.map((day, dayIndex) => {
        const notes = getCurrentWeekAppointments()
          .filter((appointment) => appointment.clientId === client.id && appointment.dayIndex === dayIndex)
          .flatMap(getSessionNotes);
        return notes.length
          ? `<section><strong>${day}</strong><ul>${notes.map((note) => `<li>${escapeHtml(note)}</li>`).join("")}</ul></section>`
          : "";
      }).join("");
      const availableDays = DAYS.filter((_, index) => client.availability?.[index] !== false);
      const hoverRules = state.rules
        .filter((rule) => getClientTarget(client, rule.id) > 0)
        .map((rule) => `<li><span><i class="rule-dot color-solid-${rule.color}"></i>${escapeHtml(rule.name)}</span><strong>${formatHours(getScheduledHours(client.id, rule.id))} / ${formatHours(getClientTarget(client, rule.id))} hrs</strong></li>`)
        .join("");

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
          <div class="client-hours">${formatHours(scheduled)} of ${formatHours(required)} total hrs scheduled</div>
          <div class="client-rule-progress-list">${ruleProgressRows || '<span class="no-targets">No service targets assigned</span>'}</div>
        </div>
        <div class="client-card-actions">
          <button class="client-edit-button client-action-button" type="button" title="Edit client targets">Edit</button>
          <button class="client-menu client-action-button" type="button" title="Remove client">×</button>
        </div>
      `;

      card.addEventListener("pointerdown", (event) => {
        if (event.target.closest(".client-action-button")) return;
        beginClientDrag(event, client);
      });

      card.querySelector(".client-edit-button").addEventListener("click", () => {
        showModal(client);
      });

      const hoverSummaryHtml = `
        <div class="hover-summary-heading"><strong>${escapeHtml(client.name)}</strong><span>${formatHours(scheduled)} / ${formatHours(required)} hrs</span></div>
        <ul class="hover-rule-list">${hoverRules || "<li>No targets assigned</li>"}</ul>
        <div class="hover-availability"><strong>Available:</strong> ${availableDays.length ? availableDays.join(", ") : "No weekdays selected"}</div>
        <div class="hover-notes"><strong>Notes this week</strong>${hoverNoteDays || "<p>No notes recorded yet.</p>"}</div>
      `;
      let hoverTimer = null;
      card.addEventListener("mouseenter", () => {
        clearTimeout(hoverTimer);
        hoverTimer = setTimeout(() => {
          const rect = card.getBoundingClientRect();
          const summaryWidth = 320;
          const left = rect.left > summaryWidth + 16
            ? rect.left - summaryWidth - 10
            : Math.min(window.innerWidth - summaryWidth - 10, rect.right + 10);
          elements.clientHoverPopup.innerHTML = hoverSummaryHtml;
          elements.clientHoverPopup.style.left = `${Math.max(10, left)}px`;
          elements.clientHoverPopup.style.top = `${Math.max(10, Math.min(rect.top, window.innerHeight - 390))}px`;
          elements.clientHoverPopup.classList.add("visible");
        }, 500);
      });
      card.addEventListener("mouseleave", () => {
        clearTimeout(hoverTimer);
        elements.clientHoverPopup.classList.remove("visible");
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
      (sum, client) => sum + getClientTarget(client),
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

  function getSessionNotes(appointment) {
    if (Array.isArray(appointment.notes)) {
      return appointment.notes.map((note) => String(note).trim()).filter(Boolean);
    }
    if (typeof appointment.notes === "string" && appointment.notes.trim()) {
      return appointment.notes.split(/\r?\n|•/).map((note) => note.trim()).filter(Boolean);
    }
    return [];
  }

  function renderAppointment(appointment) {
    const column = elements.scheduleGrid.querySelector(
      `.day-column[data-day-index="${appointment.dayIndex}"]`
    );
    const client = state.clients.find((item) => item.id === appointment.clientId);
    const rule = getRule(appointment.ruleId);
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
        <button class="edit-appointment" type="button" title="Open session details">Notes</button>
      </div>
      <span class="appointment-time">${minutesToTime(startMinutes)} – ${minutesToTime(endMinutes)}</span>
      <span class="appointment-service">${rule ? escapeHtml(rule.name) : "Uncategorized"}</span>
      <span class="appointment-meta">${appointment.recurrence === "weekly" ? "↻ Weekly · " : ""}${appointment.rbtId ? `RBT: ${escapeHtml(appointment.rbtId)}` : "Add RBT + notes"}</span>
      <div class="resize-handle" title="Drag to resize"></div>
    `;

    block.querySelector(".edit-appointment").addEventListener("click", (event) => {
      event.stopPropagation();
      showSessionModal(appointment);
    });

    block.addEventListener("pointerdown", (event) => {
      if (event.target.closest(".edit-appointment")) return;
      if (event.target.closest(".resize-handle")) {
        beginResize(event, appointment, block);
      } else {
        beginAppointmentMove(event, appointment, block);
      }
    });

    column.appendChild(block);
  }

  function renderBlock(item) {
    const column = elements.scheduleGrid.querySelector(
      `.day-column[data-day-index="${item.dayIndex}"]`
    );
    if (!column) return;
    const block = document.createElement("div");
    block.className = "appointment calendar-block";
    block.style.top = `${item.startSlot * SLOT_HEIGHT + 3}px`;
    block.style.height = `${item.durationSlots * SLOT_HEIGHT - 6}px`;
    const start = item.startSlot * SLOT_MINUTES;
    block.innerHTML = `
      <div class="appointment-title"><span>${escapeHtml(item.title)}</span><button class="edit-appointment" type="button">Edit</button></div>
      <span class="appointment-time">${minutesToTime(start)} – ${minutesToTime(start + item.durationSlots * SLOT_MINUTES)}</span>
      <span class="appointment-meta">${item.recurrence === "weekly" ? "↻ Weekly" : ""}${item.recurrence === "weekly" && item.notes ? " · " : ""}${item.notes ? escapeHtml(item.notes) : ""}</span>
    `;
    block.querySelector(".edit-appointment").addEventListener("click", (event) => {
      event.stopPropagation();
      showBlockModal(item);
    });
    block.addEventListener("pointerdown", (event) => {
      if (event.target.closest(".edit-appointment")) return;
      beginBlockMove(event, item, block);
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

  function createBlockPreview(item) {
    const preview = document.createElement("div");
    preview.className = "snap-preview calendar-block";
    preview.style.height = `${item.durationSlots * SLOT_HEIGHT - 6}px`;
    preview.innerHTML = `
      <div class="appointment-title"><span>${escapeHtml(item.title)}</span></div>
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

  function beginBlockMove(event, item, block) {
    event.preventDefault();
    const rect = block.getBoundingClientRect();
    block.classList.add("drag-source");
    activeDrag = {
      type: "move-block",
      blockId: item.id,
      durationSlots: item.durationSlots,
      pointerOffsetY: event.clientY - rect.top,
      preview: createBlockPreview(item),
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
    const offset = activeDrag.type === "move-appointment" || activeDrag.type === "move-block"
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

    let appointmentToEdit = null;
    if (activeDrag.dayIndex !== null && activeDrag.startSlot !== null) {
      const weekKey = dateKey(state.weekStart);

      if (activeDrag.type === "new-client") {
        const client = state.clients.find((item) => item.id === activeDrag.clientId);
        if (client?.availability?.[activeDrag.dayIndex] === false) {
          showToast(`${client.name} is not available on ${DAYS[activeDrag.dayIndex]}.`);
        } else {
          appointmentToEdit = {
            id: makeId(),
            clientId: activeDrag.clientId,
            weekKey,
            dayIndex: activeDrag.dayIndex,
            startSlot: activeDrag.startSlot,
            durationSlots: activeDrag.durationSlots,
            ruleId: state.rules[0]?.id || ""
          };
          state.appointments.push(appointmentToEdit);
          showToast("Client added to the schedule.");
        }
      }

      if (activeDrag.type === "move-appointment") {
        const appointment = state.appointments.find(
          (item) => item.id === activeDrag.appointmentId
        );
        if (appointment) {
          const client = state.clients.find((item) => item.id === appointment.clientId);
          if (client?.availability?.[activeDrag.dayIndex] === false) {
            showToast(`${client.name} is not available on ${DAYS[activeDrag.dayIndex]}.`);
          } else {
            appointment.weekKey = weekKey;
            appointment.dayIndex = activeDrag.dayIndex;
            appointment.startSlot = activeDrag.startSlot;
            showToast("Appointment moved.");
          }
        }
      }

      if (activeDrag.type === "move-block") {
        const block = state.blocks.find((item) => item.id === activeDrag.blockId);
        if (block) {
          block.weekKey = weekKey;
          block.dayIndex = activeDrag.dayIndex;
          block.startSlot = activeDrag.startSlot;
          showToast("Blocked time moved.");
        }
      }

      saveState();
    }

    cleanupDrag();
    render();
    if (appointmentToEdit) showSessionModal(appointmentToEdit);
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

  function showModal(client = null) {
    elements.clientForm.dataset.clientId = client?.id || "";
    elements.clientModalTitle.textContent = client ? "Edit client" : "Add client";
    elements.saveClientBtn.textContent = client ? "Save client" : "Add client";
    elements.clientNameInput.value = client?.name || "";
    elements.clientColorInput.value = client?.color || "blue";
    renderClientTargetInputs(client);
    renderClientAvailabilityInputs(client);
    elements.clientModal.classList.remove("hidden");
    elements.clientNameInput.focus();
  }

  function hideModal() {
    elements.clientModal.classList.add("hidden");
    elements.clientForm.reset();
    elements.clientForm.dataset.clientId = "";
  }

  function renderClientTargetInputs(client = null) {
    elements.clientTargetInputs.innerHTML = state.rules.map((rule) => `
      <label class="target-input-row">
        <span><i class="rule-dot color-solid-${rule.color}"></i>${escapeHtml(rule.name)}</span>
        <input type="number" min="0" max="80" step="0.5" value="${client ? getClientTarget(client, rule.id) : 0}" data-rule-id="${rule.id}" aria-label="${escapeHtml(rule.name)} weekly target hours" />
        <em>hrs/week</em>
      </label>
    `).join("");
  }

  function renderClientAvailabilityInputs(client = null) {
    elements.clientAvailabilityInputs.innerHTML = DAYS.map((day, index) => {
      const checked = client?.availability?.[index] !== false;
      return `<label class="weekday-check">
        <input type="checkbox" data-day-index="${index}" ${checked ? "checked" : ""} />
        <span>${day}</span>
      </label>`;
    }).join("");
  }

  function showRulesModal() {
    renderRulesList();
    elements.rulesModal.classList.remove("hidden");
    elements.ruleNameInput.focus();
  }

  function hideRulesModal() {
    elements.rulesModal.classList.add("hidden");
    elements.addRuleForm.reset();
  }

  function renderRulesList() {
    elements.rulesList.innerHTML = state.rules.map((rule) => {
      const assignedClients = state.clients.filter((client) => getClientTarget(client, rule.id) > 0).length;
      const sessions = state.appointments.filter((item) => item.ruleId === rule.id).length;
      return `<div class="rule-row">
        <i class="rule-swatch color-solid-${rule.color}"></i>
        <div><strong>${escapeHtml(rule.name)}</strong><span>${assignedClients} clients · ${sessions} sessions</span></div>
        <button class="rule-delete-button" type="button" data-rule-id="${rule.id}" ${state.rules.length === 1 ? "disabled" : ""}>Remove</button>
      </div>`;
    }).join("");

    elements.rulesList.querySelectorAll(".rule-delete-button").forEach((button) => {
      button.addEventListener("click", () => {
        const rule = getRule(button.dataset.ruleId);
        if (!rule || state.rules.length === 1) return;
        if (!confirm(`Remove the "${rule.name}" rule? Existing sessions will be moved to another rule.`)) return;
        state.rules = state.rules.filter((item) => item.id !== rule.id);
        const fallbackId = state.rules[0].id;
        state.clients.forEach((client) => {
          if (client.targets) delete client.targets[rule.id];
        });
        state.appointments.forEach((appointment) => {
          if (appointment.ruleId === rule.id) appointment.ruleId = fallbackId;
        });
        saveState();
        renderRulesList();
        render();
      });
    });
  }

  function hideDetailModals() {
    elements.sessionModal.classList.add("hidden");
    elements.blockModal.classList.add("hidden");
    elements.summaryModal.classList.add("hidden");
  }

  function showSessionModal(appointment) {
    const client = state.clients.find((item) => item.id === appointment.clientId);
    const scheduledMinutes = appointment.durationSlots * SLOT_MINUTES;
    elements.sessionIdInput.value = appointment.id;
    elements.sessionModalSubtitle.textContent = `${client?.name || "Client"} · ${DAYS[appointment.dayIndex]} · ${minutesToTime(appointment.startSlot * SLOT_MINUTES)}`;
    elements.sessionRbtInput.value = appointment.rbtId || "";
    elements.sessionRuleInput.innerHTML = state.rules.map((rule) =>
      `<option value="${rule.id}">${escapeHtml(rule.name)}</option>`
    ).join("");
    elements.sessionRuleInput.value = appointment.ruleId || state.rules[0]?.id || "";
    elements.sessionActualMinutesInput.value = Number.isFinite(Number(appointment.actualMinutes))
      ? String(appointment.actualMinutes)
      : String(scheduledMinutes);
    const existingNotes = getSessionNotes(appointment);
    elements.sessionNotesInput.value = existingNotes.length
      ? `• ${existingNotes.join("\n• ")}`
      : "• ";
    elements.sessionBillingNotesInput.value = appointment.billingNotes || "";
    elements.sessionTargetsMetInput.checked = Boolean(appointment.targetsMet);
    elements.sessionRepeatInput.value = appointment.recurrence === "weekly" ? "weekly" : "none";
    elements.sessionRepeatCountInput.value = String(appointment.recurrenceCount || 4);
    updateRepeatVisibility(elements.sessionRepeatInput, elements.sessionRepeatCountLabel);
    elements.sessionModal.classList.remove("hidden");
    elements.sessionRbtInput.focus();
  }

  function populateBlockOptions() {
    elements.blockDayInput.innerHTML = DAYS.map((day, index) =>
      `<option value="${index}">${day} ${formatMonthDay(addDays(state.weekStart, index))}</option>`
    ).join("");
    elements.blockStartInput.innerHTML = Array.from({ length: TOTAL_SLOTS }, (_, slot) =>
      `<option value="${slot}">${minutesToTime(slot * SLOT_MINUTES)}</option>`
    ).join("");
    elements.blockDurationInput.innerHTML = Array.from({ length: 12 }, (_, index) => {
      const slots = index + 1;
      return `<option value="${slots}">${formatHours(slots * SLOT_MINUTES / 60)} hours</option>`;
    }).join("");
  }

  function showBlockModal(item = null) {
    populateBlockOptions();
    elements.blockForm.dataset.blockId = item?.id || "";
    elements.blockTitleInput.value = item?.title || "Billing";
    elements.blockDayInput.value = String(item?.dayIndex ?? 0);
    elements.blockStartInput.value = String(item?.startSlot ?? 10);
    elements.blockDurationInput.value = String(item?.durationSlots ?? 2);
    elements.blockNotesInput.value = item?.notes || "";
    elements.blockRepeatInput.value = item?.recurrence === "weekly" ? "weekly" : "none";
    elements.blockRepeatCountInput.value = String(item?.recurrenceCount || 4);
    updateRepeatVisibility(elements.blockRepeatInput, elements.blockRepeatCountLabel);
    elements.deleteBlockBtn.classList.toggle("hidden", !item);
    elements.blockModal.classList.remove("hidden");
    elements.blockTitleInput.focus();
  }

  function showWeeklySummary() {
    const appointments = getCurrentWeekAppointments();
    const blocks = state.blocks.filter((item) => item.weekKey === dateKey(state.weekStart));
    const totalScheduled = appointments.reduce((sum, item) => sum + item.durationSlots * SLOT_MINUTES, 0) / 60;
    const totalActual = appointments.reduce((sum, item) => {
      const actual = Number(item.actualMinutes);
      return sum + (Number.isFinite(actual) ? actual : item.durationSlots * SLOT_MINUTES);
    }, 0) / 60;
    const blockHours = blocks.reduce((sum, item) => sum + item.durationSlots * SLOT_MINUTES, 0) / 60;
    const targetSessions = appointments.filter((item) => item.targetsMet).length;

    elements.summaryWeekLabel.textContent = formatWeekRange();
    const clientCards = state.clients.map((client) => {
      const clientAppointments = appointments.filter((item) => item.clientId === client.id);
      const actual = getActualHours(client.id);
      const target = getClientTarget(client);
      const status = getHoursStatus(actual, target);
      const serviceProgress = state.rules
        .filter((rule) => getClientTarget(client, rule.id) > 0)
        .map((rule) => {
          const completed = getScheduledHours(client.id, rule.id);
          const ruleTarget = getClientTarget(client, rule.id);
          return `<span><i class="rule-dot color-solid-${rule.color}"></i>${escapeHtml(rule.name)}: ${formatHours(completed)} / ${formatHours(ruleTarget)} hrs</span>`;
        }).join("");
      const notes = DAYS.map((day, dayIndex) => {
        const dayAppointments = clientAppointments.filter((item) => item.dayIndex === dayIndex);
        const dayNotes = dayAppointments.flatMap(getSessionNotes);
        const billingNotes = dayAppointments.map((item) => item.billingNotes).filter(Boolean);
        if (!dayNotes.length && !billingNotes.length) return "";
        return `<section class="summary-day-notes">
          <strong>${day}</strong>
          ${dayNotes.length ? `<ul>${dayNotes.map((note) => `<li>${escapeHtml(note)}</li>`).join("")}</ul>` : ""}
          ${billingNotes.map((note) => `<small><b>Billing:</b> ${escapeHtml(note)}</small>`).join("")}
        </section>`;
      }).join("");
      return `<article class="summary-client">
        <div class="summary-client-heading"><strong>${escapeHtml(client.name)}</strong><span class="hours-status ${status}">${status}</span></div>
        <p>${formatHours(actual)} actual / ${formatHours(target)} target hours · ${clientAppointments.length} sessions</p>
        <div class="summary-rule-progress">${serviceProgress}</div>
        ${notes ? `<div class="summary-notes-grid">${notes}</div>` : `<p class="muted">No notes recorded this week.</p>`}
      </article>`;
    }).join("");

    elements.summaryContent.innerHTML = `
      <div class="summary-stats">
        <div><strong>${formatHours(totalActual)}</strong><span>Actual client hrs</span></div>
        <div><strong>${formatHours(totalScheduled)}</strong><span>Scheduled hrs</span></div>
        <div><strong>${targetSessions}/${appointments.length}</strong><span>Session targets met</span></div>
        <div><strong>${formatHours(blockHours)}</strong><span>Blocked hrs</span></div>
      </div>
      <div class="summary-client-list">${clientCards || '<p>No clients yet.</p>'}</div>
    `;
    elements.summaryModal.classList.remove("hidden");
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
    state.weekStart = state.view === "month"
      ? new Date(state.weekStart.getFullYear(), state.weekStart.getMonth() - 1, 1)
      : addDays(state.weekStart, -7);
    if (state.view === "week") state.lastWeekStart = startOfWeek(state.weekStart);
    saveState();
    render();
  });

  elements.nextWeekBtn.addEventListener("click", () => {
    state.weekStart = state.view === "month"
      ? new Date(state.weekStart.getFullYear(), state.weekStart.getMonth() + 1, 1)
      : addDays(state.weekStart, 7);
    if (state.view === "week") state.lastWeekStart = startOfWeek(state.weekStart);
    saveState();
    render();
  });

  elements.todayBtn.addEventListener("click", () => {
    const today = new Date();
    state.weekStart = state.view === "month"
      ? new Date(today.getFullYear(), today.getMonth(), 1)
      : startOfWeek(today);
    if (state.view === "week") state.lastWeekStart = startOfWeek(today);
    saveState();
    render();
  });

  elements.addClientBtn.addEventListener("click", () => showModal());
  elements.manageRulesBtn.addEventListener("click", showRulesModal);
  elements.weekViewBtn.addEventListener("click", () => {
    state.weekStart = new Date(state.lastWeekStart);
    state.view = "week";
    saveState();
    render();
  });
  elements.monthViewBtn.addEventListener("click", () => {
    state.lastWeekStart = startOfWeek(state.weekStart);
    state.weekStart = new Date(state.weekStart.getFullYear(), state.weekStart.getMonth(), 1);
    state.view = "month";
    saveState();
    render();
  });
  elements.addBlockBtn.addEventListener("click", () => showBlockModal());
  elements.weeklySummaryBtn.addEventListener("click", showWeeklySummary);
  elements.sessionNotesInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    const input = elements.sessionNotesInput;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    input.setRangeText("\n• ", start, end, "end");
  });
  elements.sessionRepeatInput.addEventListener("change", () =>
    updateRepeatVisibility(elements.sessionRepeatInput, elements.sessionRepeatCountLabel)
  );
  elements.blockRepeatInput.addEventListener("change", () =>
    updateRepeatVisibility(elements.blockRepeatInput, elements.blockRepeatCountLabel)
  );
  elements.closeModalBtn.addEventListener("click", hideModal);
  elements.cancelModalBtn.addEventListener("click", hideModal);

  elements.clientModal.addEventListener("click", (event) => {
    if (event.target === elements.clientModal) hideModal();
  });

  elements.addRuleForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = elements.ruleNameInput.value.trim();
    if (!name) return;
    if (state.rules.some((rule) => rule.name.toLowerCase() === name.toLowerCase())) {
      showToast("A rule with that name already exists.");
      return;
    }
    state.rules.push({
      id: makeId(),
      name,
      color: elements.ruleColorInput.value
    });
    saveState();
    elements.addRuleForm.reset();
    renderRulesList();
    render();
    elements.ruleNameInput.focus();
  });

  elements.closeRulesModalBtn.addEventListener("click", hideRulesModal);
  elements.closeRulesBtn.addEventListener("click", hideRulesModal);
  elements.rulesModal.addEventListener("click", (event) => {
    if (event.target === elements.rulesModal) hideRulesModal();
  });

  elements.sessionForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const appointment = state.appointments.find((item) => item.id === elements.sessionIdInput.value);
    if (!appointment) return;
    appointment.rbtId = elements.sessionRbtInput.value.trim();
    appointment.ruleId = elements.sessionRuleInput.value;
    appointment.actualMinutes = Math.max(0, Number(elements.sessionActualMinutesInput.value) || 0);
    appointment.notes = elements.sessionNotesInput.value
      .split(/\r?\n/)
      .map((note) => note.replace(/^[\s•\-*]+/, "").trim())
      .filter(Boolean);
    appointment.billingNotes = elements.sessionBillingNotesInput.value.trim();
    appointment.targetsMet = elements.sessionTargetsMetInput.checked;
    if (elements.sessionRepeatInput.value === "weekly") {
      createWeeklyRecurrences(
        state.appointments,
        appointment,
        elements.sessionRepeatCountInput.value,
        "session"
      );
    }
    saveState();
    hideDetailModals();
    render();
    showToast("Session details saved.");
  });

  elements.deleteSessionBtn.addEventListener("click", () => {
    if (!confirm("Delete this client session?")) return;
    state.appointments = state.appointments.filter((item) => item.id !== elements.sessionIdInput.value);
    saveState();
    hideDetailModals();
    render();
    showToast("Session deleted.");
  });

  elements.blockForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const id = elements.blockForm.dataset.blockId;
    const existing = state.blocks.findIndex((item) => item.id === id);
    const previous = existing >= 0 ? state.blocks[existing] : {};
    const record = {
      ...previous,
      id: id || makeId(),
      weekKey: dateKey(state.weekStart),
      title: elements.blockTitleInput.value.trim(),
      dayIndex: Number(elements.blockDayInput.value),
      startSlot: Number(elements.blockStartInput.value),
      durationSlots: Number(elements.blockDurationInput.value),
      notes: elements.blockNotesInput.value.trim()
    };
    if (existing >= 0) state.blocks[existing] = record;
    else state.blocks.push(record);
    if (elements.blockRepeatInput.value === "weekly") {
      createWeeklyRecurrences(
        state.blocks,
        existing >= 0 ? state.blocks[existing] : record,
        elements.blockRepeatCountInput.value,
        "block"
      );
    }
    saveState();
    hideDetailModals();
    render();
    showToast("Blocked time saved.");
  });

  elements.deleteBlockBtn.addEventListener("click", () => {
    state.blocks = state.blocks.filter((item) => item.id !== elements.blockForm.dataset.blockId);
    saveState();
    hideDetailModals();
    render();
    showToast("Blocked time deleted.");
  });

  [elements.closeSessionModalBtn, elements.cancelSessionModalBtn, elements.closeBlockModalBtn,
    elements.cancelBlockModalBtn, elements.closeSummaryModalBtn, elements.closeSummaryBtn]
    .forEach((button) => button.addEventListener("click", hideDetailModals));

  [elements.sessionModal, elements.blockModal, elements.summaryModal].forEach((modal) => {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) hideDetailModals();
    });
  });

  elements.clientForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = elements.clientNameInput.value.trim();
    const color = elements.clientColorInput.value;
    const targets = {};
    elements.clientTargetInputs.querySelectorAll("[data-rule-id]").forEach((input) => {
      targets[input.dataset.ruleId] = Math.max(0, Number(input.value) || 0);
    });
    const availability = DAYS.map((_, index) =>
      Boolean(elements.clientAvailabilityInputs.querySelector(`[data-day-index="${index}"]`)?.checked)
    );

    if (!name) return;

    const existingClient = state.clients.find(
      (client) => client.id === elements.clientForm.dataset.clientId
    );
    if (existingClient) {
      existingClient.name = name;
      existingClient.color = color;
      existingClient.targets = targets;
      existingClient.availability = availability;
    } else {
      state.clients.push({
        id: makeId(),
        name,
        color,
        targets,
        availability
      });
    }

    saveState();
    hideModal();
    render();
    showToast(existingClient ? `${name} updated.` : `${name} added.`);
  });

  elements.clientSearch.addEventListener("input", renderClients);

  elements.clearScheduleBtn.addEventListener("click", () => {
    const currentWeekKey = dateKey(startOfWeek(state.weekStart));
    const currentWeekCount = state.appointments.filter(
      (appointment) => appointment.weekKey === currentWeekKey
    ).length + state.blocks.filter((block) => block.weekKey === currentWeekKey).length;

    if (currentWeekCount === 0) {
      showToast("This week is already empty.");
      return;
    }

    if (confirm("Clear every appointment displayed in this week?")) {
      state.appointments = state.appointments.filter(
        (appointment) => appointment.weekKey !== currentWeekKey
      );
      state.blocks = state.blocks.filter((block) => block.weekKey !== currentWeekKey);
      saveState();
      render();
      showToast("Week cleared.");
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (!elements.clientModal.classList.contains("hidden")) hideModal();
      if (!elements.rulesModal.classList.contains("hidden")) hideRulesModal();
      hideDetailModals();
      cleanupDrag();
      render();
    }
  });

  loadState();
  render();
})();
