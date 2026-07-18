(() => {
  "use strict";

  const START_HOUR = 7;
  const END_HOUR = 18;
  const SLOT_MINUTES = 15;
  const SLOT_HEIGHT = 22;
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
    { id: makeId(), name: "Client A", color: "blue", targets: { [DEFAULT_RULE_IDS.supervision]: 5, [DEFAULT_RULE_IDS.parentTraining]: 2 }, availability: [true, true, true, true, true] },
    { id: makeId(), name: "Client B", color: "purple", targets: { [DEFAULT_RULE_IDS.supervision]: 4, [DEFAULT_RULE_IDS.parentTraining]: 1 }, availability: [true, true, true, true, true] },
    { id: makeId(), name: "Client C", color: "green", targets: { [DEFAULT_RULE_IDS.supervision]: 6, [DEFAULT_RULE_IDS.parentTraining]: 2 }, availability: [true, true, true, true, true] },
    { id: makeId(), name: "Client D", color: "yellow", targets: { [DEFAULT_RULE_IDS.supervision]: 3, [DEFAULT_RULE_IDS.parentTraining]: 1 }, availability: [true, true, true, true, true] }
  ];

  const state = {
    weekStart: startOfWeek(new Date()),
    clients: [],
    appointments: [],
    blocks: [],
    rules: [],
    view: "week",
    lastWeekStart: startOfWeek(new Date()),
    optimizerSettings: null
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
    blockDaySpanInput: document.querySelector("#blockDaySpanInput"),
    blockNotesInput: document.querySelector("#blockNotesInput"),
    blockRepeatInput: document.querySelector("#blockRepeatInput"),
    blockRepeatCountInput: document.querySelector("#blockRepeatCountInput"),
    blockRepeatCountLabel: document.querySelector("#blockRepeatCountLabel"),
    blockRepeatUnit: document.querySelector("#blockRepeatUnit"),
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
    clientHoverPopup: document.querySelector("#clientHoverPopup"),
    scheduleCreatorBtn: document.querySelector("#scheduleCreatorBtn"),
    scheduleMenuBtn: document.querySelector("#scheduleMenuBtn"),
    scheduleMenu: document.querySelector("#scheduleMenu"),
    optimizerSettingsBtn: document.querySelector("#optimizerSettingsBtn"),
    addMenuBtn: document.querySelector("#addMenuBtn"),
    addMenu: document.querySelector("#addMenu"),
    optimizerModal: document.querySelector("#optimizerModal"),
    optimizerForm: document.querySelector("#optimizerForm"),
    closeOptimizerModalBtn: document.querySelector("#closeOptimizerModalBtn"),
    cancelOptimizerModalBtn: document.querySelector("#cancelOptimizerModalBtn"),
    optimizerStartTime: document.querySelector("#optimizerStartTime"),
    optimizerEndTime: document.querySelector("#optimizerEndTime"),
    optimizerMinDuration: document.querySelector("#optimizerMinDuration"),
    optimizerMaxDuration: document.querySelector("#optimizerMaxDuration"),
    optimizerGap: document.querySelector("#optimizerGap"),
    optimizerPriority: document.querySelector("#optimizerPriority"),
    optimizerUsePriorityClient: document.querySelector("#optimizerUsePriorityClient"),
    optimizerPriorityClientLabel: document.querySelector("#optimizerPriorityClientLabel"),
    optimizerPriorityClient: document.querySelector("#optimizerPriorityClient"),
    optimizerReplaceGenerated: document.querySelector("#optimizerReplaceGenerated"),
    optimizerResult: document.querySelector("#optimizerResult")
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

  function addBusinessDays(date, count) {
    const result = new Date(date);
    let remaining = count;
    while (remaining > 0) {
      result.setDate(result.getDate() + 1);
      if (result.getDay() !== 0 && result.getDay() !== 6) remaining -= 1;
    }
    return result;
  }

  function createDailyBlockRecurrences(source, count) {
    const totalDays = clamp(Number(count) || 5, 2, 30);
    const groupId = source.recurrenceGroupId || makeId();
    const sourceDate = addDays(dateFromKey(source.weekKey), source.dayIndex);
    const recurrenceStartDate = source.recurrenceStartDate || dateKey(sourceDate);
    source.recurrenceGroupId = groupId;
    source.recurrence = "daily";
    source.recurrenceCount = totalDays;
    source.recurrenceStartDate = recurrenceStartDate;

    for (let offset = 1; offset < totalDays; offset += 1) {
      const occurrenceDate = addBusinessDays(dateFromKey(recurrenceStartDate), offset);
      const occurrenceWeek = startOfWeek(occurrenceDate);
      const weekKey = dateKey(occurrenceWeek);
      const dayIndex = Math.max(0, occurrenceDate.getDay() - 1);
      const alreadyExists = state.blocks.some(
        (item) =>
          item.recurrenceGroupId === groupId &&
          item.weekKey === weekKey &&
          item.dayIndex === dayIndex
      );
      if (alreadyExists) continue;
      state.blocks.push({
        ...source,
        id: makeId(),
        weekKey,
        dayIndex,
        daySpan: Math.min(Number(source.daySpan) || 1, DAYS.length - dayIndex),
        recurrenceGroupId: groupId,
        recurrence: "daily",
        recurrenceCount: totalDays,
        recurrenceStartDate
      });
    }
  }

  function updateRepeatVisibility(select, label) {
    label.classList.toggle("hidden", select.value === "none");
  }

  function updateBlockRepeatControls() {
    updateRepeatVisibility(elements.blockRepeatInput, elements.blockRepeatCountLabel);
    const isDaily = elements.blockRepeatInput.value === "daily";
    elements.blockRepeatUnit.textContent = isDaily ? "weekdays" : "weeks";
    elements.blockRepeatCountInput.max = isDaily ? "30" : "52";
    if (isDaily && Number(elements.blockRepeatCountInput.value) > 30) {
      elements.blockRepeatCountInput.value = "5";
    }
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

  function minutesToHourLabel(minutesFromStart) {
    const totalMinutes = START_HOUR * 60 + minutesFromStart;
    const hour24 = Math.floor(totalMinutes / 60);
    return `${hour24 % 12 || 12} ${hour24 >= 12 ? "PM" : "AM"}`;
  }

  function formatHours(hours) {
    return Number.isInteger(hours) ? String(hours) : String(Number(hours.toFixed(2)));
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
        state.optimizerSettings = saved.optimizerSettings && typeof saved.optimizerSettings === "object"
          ? saved.optimizerSettings
          : null;
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
        const savedSlotMinutes = Number(saved.slotMinutes) || 30;
        let migratedSlots = false;
        if (savedSlotMinutes !== SLOT_MINUTES) {
          const slotRatio = savedSlotMinutes / SLOT_MINUTES;
          [...state.appointments, ...state.blocks].forEach((item) => {
            item.startSlot = Math.round(Number(item.startSlot || 0) * slotRatio);
            item.durationSlots = Math.max(1, Math.round(Number(item.durationSlots || 1) * slotRatio));
          });
          migratedSlots = true;
        }
        if (saved.weekStart) {
          state.weekStart = new Date(`${saved.weekStart}T00:00:00`);
        }
        if (migratedSlots) saveState();
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
        lastWeekStart: dateKey(state.lastWeekStart),
        slotMinutes: SLOT_MINUTES,
        optimizerSettings: state.optimizerSettings
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
    elements.scheduleCreatorBtn.disabled = state.view === "month";
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
      header.innerHTML = `
        <span class="day-name">${dayName}</span>
        <span class="day-date">${formatMonthDay(date)}</span>
      `;
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
      const isHalfHour = minutes % 30 === 0;
      label.className = `time-label${isHour ? " on-hour" : isHalfHour ? " on-half-hour" : " on-quarter-hour"}`;
      label.textContent = isHour ? minutesToHourLabel(minutes) : "";
      label.title = minutesToTime(minutes);
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
    const isCompact = appointment.durationSlots === 1;
    const isShort = appointment.durationSlots <= 2;
    block.className = `appointment color-${client.color}${isShort ? " short-appointment" : ""}${isCompact ? " compact-appointment" : ""}`;
    block.dataset.appointmentId = appointment.id;
    block.style.top = `${appointment.startSlot * SLOT_HEIGHT + 3}px`;
    block.style.height = `${appointment.durationSlots * SLOT_HEIGHT - 6}px`;

    const startMinutes = appointment.startSlot * SLOT_MINUTES;
    const endMinutes = startMinutes + appointment.durationSlots * SLOT_MINUTES;

    block.innerHTML = `
      <div class="appointment-title">
        <span class="appointment-name">${escapeHtml(client.name)}</span>
        ${isShort ? `<span class="compact-service">${rule ? escapeHtml(rule.name) : "Uncategorized"}</span>` : ""}
        <button class="edit-appointment" type="button" title="Open session details" aria-label="Open session details">•••</button>
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
    const daySpan = Math.min(Number(item.daySpan) || 1, DAYS.length - item.dayIndex);
    for (let offset = 0; offset < daySpan; offset += 1) {
      const column = elements.scheduleGrid.querySelector(
        `.day-column[data-day-index="${item.dayIndex + offset}"]`
      );
      if (!column) continue;
      const block = document.createElement("div");
      block.className = "appointment calendar-block";
      block.dataset.blockId = item.id;
      block.style.top = `${item.startSlot * SLOT_HEIGHT + 3}px`;
      block.style.height = `${item.durationSlots * SLOT_HEIGHT - 6}px`;
      const start = item.startSlot * SLOT_MINUTES;
      const recurrenceText = item.recurrence === "daily"
        ? "↻ Daily"
        : item.recurrence === "weekly"
          ? "↻ Weekly"
          : "";
      block.innerHTML = `
        <div class="appointment-title"><span>${escapeHtml(item.title)}</span>${offset === 0 ? '<button class="edit-appointment" type="button">Edit</button>' : ""}</div>
        <span class="appointment-time">${minutesToTime(start)} – ${minutesToTime(start + item.durationSlots * SLOT_MINUTES)}</span>
        <span class="appointment-meta">${recurrenceText}${recurrenceText && item.notes ? " · " : ""}${item.notes ? escapeHtml(item.notes) : ""}</span>
        ${offset === daySpan - 1 ? '<div class="block-resize-handle" title="Drag down for duration and sideways for days"></div>' : ""}
      `;
      block.querySelector(".edit-appointment")?.addEventListener("click", (event) => {
        event.stopPropagation();
        showBlockModal(item);
      });
      block.addEventListener("pointerdown", (event) => {
        if (event.target.closest(".edit-appointment")) return;
        if (event.target.closest(".block-resize-handle")) {
          beginBlockResize(event, item);
        } else {
          beginBlockMove(event, item, block);
        }
      });
      column.appendChild(block);
    }
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
      <span class="appointment-meta">${Number(item.daySpan) > 1 ? `${item.daySpan} days` : ""}</span>
    `;
    return preview;
  }

  function beginClientDrag(event, client) {
    event.preventDefault();
    const durationSlots = 4;

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

  function beginBlockResize(event, item) {
    event.preventDefault();
    event.stopPropagation();
    const gridRect = elements.scheduleGrid.getBoundingClientRect();
    activeDrag = {
      type: "resize-block",
      blockId: item.id,
      startX: event.clientX,
      startY: event.clientY,
      columnWidth: gridRect.width / DAYS.length,
      originalDuration: item.durationSlots,
      originalDaySpan: Number(item.daySpan) || 1,
      previewDuration: item.durationSlots,
      previewDaySpan: Number(item.daySpan) || 1
    };
    document.addEventListener("pointermove", globalPointerMove);
    document.addEventListener("pointerup", globalPointerUp, { once: true });
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

    if (activeDrag.type === "resize-block") {
      const item = state.blocks.find((block) => block.id === activeDrag.blockId);
      if (!item) return;
      const slotDelta = Math.round((event.clientY - activeDrag.startY) / SLOT_HEIGHT);
      const dayDelta = Math.round((event.clientX - activeDrag.startX) / activeDrag.columnWidth);
      activeDrag.previewDuration = clamp(
        activeDrag.originalDuration + slotDelta,
        1,
        TOTAL_SLOTS - item.startSlot
      );
      activeDrag.previewDaySpan = clamp(
        activeDrag.originalDaySpan + dayDelta,
        1,
        DAYS.length - item.dayIndex
      );
      elements.scheduleGrid
        .querySelectorAll(`.calendar-block[data-block-id="${item.id}"]`)
        .forEach((block) => {
          block.style.height = `${activeDrag.previewDuration * SLOT_HEIGHT - 6}px`;
          const startMinutes = item.startSlot * SLOT_MINUTES;
          block.querySelector(".appointment-time").textContent =
            `${minutesToTime(startMinutes)} – ${minutesToTime(startMinutes + activeDrag.previewDuration * SLOT_MINUTES)} · ${activeDrag.previewDaySpan} ${activeDrag.previewDaySpan === 1 ? "day" : "days"}`;
        });
      return;
    }

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

    let dayIndex = Number(column.dataset.dayIndex);
    if (activeDrag.type === "move-block") {
      const movingBlock = state.blocks.find((item) => item.id === activeDrag.blockId);
      dayIndex = Math.min(dayIndex, DAYS.length - (Number(movingBlock?.daySpan) || 1));
    }
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

    if (activeDrag.type === "resize-block") {
      const item = state.blocks.find((block) => block.id === activeDrag.blockId);
      if (item) {
        if (isCalendarPlacementFree({
          dayIndex: item.dayIndex,
          startSlot: item.startSlot,
          durationSlots: activeDrag.previewDuration,
          daySpan: activeDrag.previewDaySpan,
          ignoreBlockId: item.id
        })) {
          item.durationSlots = activeDrag.previewDuration;
          item.daySpan = activeDrag.previewDaySpan;
          saveState();
          showToast(`Blocked time updated to ${item.daySpan} ${item.daySpan === 1 ? "day" : "days"}.`);
        } else {
          showToast("That size would overlap another item, so the block was restored.");
        }
      }
      activeDrag = null;
      render();
      return;
    }

    if (activeDrag.type === "resize") {
      const appointment = state.appointments.find(
        (item) => item.id === activeDrag.appointmentId
      );
      if (appointment) {
        if (isCalendarPlacementFree({
          dayIndex: appointment.dayIndex,
          startSlot: appointment.startSlot,
          durationSlots: activeDrag.previewDuration,
          ignoreAppointmentId: appointment.id
        })) {
          appointment.durationSlots = activeDrag.previewDuration;
          saveState();
          showToast("Appointment duration updated.");
        } else {
          showToast("That duration would overlap another item, so it was restored.");
        }
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
        const opening = findNearestCalendarOpening({
          dayIndex: activeDrag.dayIndex,
          startSlot: activeDrag.startSlot,
          durationSlots: activeDrag.durationSlots,
          client
        });
        if (!opening) {
          showToast(`No open time remains for ${client.name} after that point.`);
        } else {
          appointmentToEdit = {
            id: makeId(),
            clientId: activeDrag.clientId,
            weekKey,
            dayIndex: opening.dayIndex,
            startSlot: opening.startSlot,
            durationSlots: activeDrag.durationSlots,
            ruleId: state.rules[0]?.id || ""
          };
          state.appointments.push(appointmentToEdit);
          const bounced = opening.dayIndex !== activeDrag.dayIndex || opening.startSlot !== activeDrag.startSlot;
          showToast(bounced ? "That time was occupied, so the client moved to the next opening." : "Client added to the schedule.");
        }
      }

      if (activeDrag.type === "move-appointment") {
        const appointment = state.appointments.find(
          (item) => item.id === activeDrag.appointmentId
        );
        if (appointment) {
          const client = state.clients.find((item) => item.id === appointment.clientId);
          const opening = findNearestCalendarOpening({
            dayIndex: activeDrag.dayIndex,
            startSlot: activeDrag.startSlot,
            durationSlots: appointment.durationSlots,
            client,
            ignoreAppointmentId: appointment.id
          });
          if (!opening) {
            showToast(`No open time remains for ${client.name} after that point.`);
          } else {
            appointment.weekKey = weekKey;
            appointment.dayIndex = opening.dayIndex;
            appointment.startSlot = opening.startSlot;
            const bounced = opening.dayIndex !== activeDrag.dayIndex || opening.startSlot !== activeDrag.startSlot;
            showToast(bounced ? "That time was occupied, so the appointment moved to the next opening." : "Appointment moved.");
          }
        }
      }

      if (activeDrag.type === "move-block") {
        const block = state.blocks.find((item) => item.id === activeDrag.blockId);
        if (block) {
          const opening = findNearestCalendarOpening({
            dayIndex: activeDrag.dayIndex,
            startSlot: activeDrag.startSlot,
            durationSlots: block.durationSlots,
            daySpan: Number(block.daySpan) || 1,
            ignoreBlockId: block.id
          });
          if (!opening) {
            showToast("No open space remains for that block after this point.");
          } else {
            block.weekKey = weekKey;
            block.dayIndex = opening.dayIndex;
            block.startSlot = opening.startSlot;
            const bounced = opening.dayIndex !== activeDrag.dayIndex || opening.startSlot !== activeDrag.startSlot;
            showToast(bounced ? "That space was occupied, so the block moved to the next opening." : "Blocked time moved.");
          }
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

  function timeValueToSlot(value) {
    const [hours, minutes] = value.split(":").map(Number);
    return Math.round(((hours - START_HOUR) * 60 + minutes) / SLOT_MINUTES);
  }

  function slotToTimeValue(slot) {
    const totalMinutes = START_HOUR * 60 + Number(slot || 0) * SLOT_MINUTES;
    return `${String(Math.floor(totalMinutes / 60)).padStart(2, "0")}:${String(totalMinutes % 60).padStart(2, "0")}`;
  }

  function showOptimizerModal() {
    const settings = state.optimizerSettings || defaultOptimizerSettings();
    elements.optimizerStartTime.value = slotToTimeValue(settings.startSlot);
    elements.optimizerEndTime.value = slotToTimeValue(settings.endSlot);
    elements.optimizerMinDuration.value = String(settings.minMinutes);
    elements.optimizerMaxDuration.value = String(settings.maxMinutes);
    elements.optimizerGap.value = String(settings.gapMinutes);
    elements.optimizerPriority.value = settings.priority || "balanced";
    elements.optimizerUsePriorityClient.checked = Boolean(settings.usePriorityClient);
    elements.optimizerPriorityClient.innerHTML = state.clients
      .map((client) => `<option value="${client.id}">${escapeHtml(client.name)}</option>`)
      .join("");
    elements.optimizerPriorityClient.value = settings.priorityClientId || state.clients[0]?.id || "";
    elements.optimizerUsePriorityClient.disabled = state.clients.length === 0;
    elements.optimizerPriorityClientLabel.classList.toggle(
      "hidden",
      !elements.optimizerUsePriorityClient.checked
    );
    elements.optimizerResult.classList.add("hidden");
    elements.optimizerModal.classList.remove("hidden");
  }

  function hideOptimizerModal() {
    elements.optimizerModal.classList.add("hidden");
  }

  function closeActionMenus() {
    elements.addMenu.classList.add("hidden");
    elements.scheduleMenu.classList.add("hidden");
    elements.addMenuBtn.setAttribute("aria-expanded", "false");
    elements.scheduleMenuBtn.setAttribute("aria-expanded", "false");
  }

  function toggleActionMenu(menu, button) {
    const shouldOpen = menu.classList.contains("hidden");
    closeActionMenus();
    if (shouldOpen) {
      menu.classList.remove("hidden");
      button.setAttribute("aria-expanded", "true");
    }
  }

  function intervalsOverlap(startA, durationA, startB, durationB) {
    return startA < startB + durationB && startB < startA + durationA;
  }

  function isCalendarPlacementFree({
    dayIndex,
    startSlot,
    durationSlots,
    daySpan = 1,
    ignoreAppointmentId = "",
    ignoreBlockId = ""
  }) {
    const weekKey = dateKey(startOfWeek(state.weekStart));
    const lastDay = dayIndex + daySpan - 1;
    if (dayIndex < 0 || lastDay >= DAYS.length || startSlot < 0 || startSlot + durationSlots > TOTAL_SLOTS) {
      return false;
    }

    const hitsAppointment = state.appointments.some((item) =>
      item.id !== ignoreAppointmentId &&
      item.weekKey === weekKey &&
      item.dayIndex >= dayIndex &&
      item.dayIndex <= lastDay &&
      intervalsOverlap(startSlot, durationSlots, item.startSlot, item.durationSlots)
    );
    if (hitsAppointment) return false;

    return !state.blocks.some((item) => {
      if (item.id === ignoreBlockId || item.weekKey !== weekKey) return false;
      const itemLastDay = item.dayIndex + (Number(item.daySpan) || 1) - 1;
      const daysOverlap = dayIndex <= itemLastDay && item.dayIndex <= lastDay;
      return daysOverlap && intervalsOverlap(startSlot, durationSlots, item.startSlot, item.durationSlots);
    });
  }

  function getCalendarPlacementConflicts({
    dayIndex,
    startSlot,
    durationSlots,
    daySpan = 1,
    ignoreAppointmentId = "",
    ignoreBlockId = ""
  }) {
    const weekKey = dateKey(startOfWeek(state.weekStart));
    const lastDay = dayIndex + daySpan - 1;
    const conflicts = [];

    state.appointments.forEach((item) => {
      if (
        item.id !== ignoreAppointmentId &&
        item.weekKey === weekKey &&
        item.dayIndex >= dayIndex &&
        item.dayIndex <= lastDay &&
        intervalsOverlap(startSlot, durationSlots, item.startSlot, item.durationSlots)
      ) {
        conflicts.push(item);
      }
    });

    state.blocks.forEach((item) => {
      if (item.id === ignoreBlockId || item.weekKey !== weekKey) return;
      const itemLastDay = item.dayIndex + (Number(item.daySpan) || 1) - 1;
      const daysOverlap = dayIndex <= itemLastDay && item.dayIndex <= lastDay;
      if (daysOverlap && intervalsOverlap(startSlot, durationSlots, item.startSlot, item.durationSlots)) {
        conflicts.push(item);
      }
    });
    return conflicts;
  }

  function findNearestCalendarOpening({
    dayIndex,
    startSlot,
    durationSlots,
    daySpan = 1,
    client = null,
    ignoreAppointmentId = "",
    ignoreBlockId = ""
  }) {
    const placementIsFree = (candidateDay, candidateSlot) =>
      (client?.availability?.[candidateDay] !== false) &&
      isCalendarPlacementFree({
        dayIndex: candidateDay,
        startSlot: candidateSlot,
        durationSlots,
        daySpan,
        ignoreAppointmentId,
        ignoreBlockId
      });

    if (placementIsFree(dayIndex, startSlot)) return { dayIndex, startSlot };

    const conflicts = getCalendarPlacementConflicts({
      dayIndex,
      startSlot,
      durationSlots,
      daySpan,
      ignoreAppointmentId,
      ignoreBlockId
    });
    const draggedCenter = startSlot + durationSlots / 2;
    const closestConflict = conflicts.sort((a, b) => {
      const overlapA = Math.min(startSlot + durationSlots, a.startSlot + a.durationSlots) - Math.max(startSlot, a.startSlot);
      const overlapB = Math.min(startSlot + durationSlots, b.startSlot + b.durationSlots) - Math.max(startSlot, b.startSlot);
      return overlapB - overlapA;
    })[0];
    const conflictCenter = closestConflict
      ? closestConflict.startSlot + closestConflict.durationSlots / 2
      : draggedCenter;
    const preferredDirection = draggedCenter < conflictCenter ? -1 : 1;
    const maxStart = TOTAL_SLOTS - durationSlots;

    const searchDay = (candidateDay, direction, origin) => {
      if (candidateDay < 0 || candidateDay > DAYS.length - daySpan) return null;
      if (client?.availability?.[candidateDay] === false) return null;
      for (
        let candidateSlot = clamp(origin, 0, maxStart);
        candidateSlot >= 0 && candidateSlot <= maxStart;
        candidateSlot += direction
      ) {
        if (placementIsFree(candidateDay, candidateSlot)) {
          return { dayIndex: candidateDay, startSlot: candidateSlot };
        }
      }
      return null;
    };

    const preferredSameDay = searchDay(dayIndex, preferredDirection, startSlot + preferredDirection);
    if (preferredSameDay) return preferredSameDay;
    const oppositeSameDay = searchDay(dayIndex, -preferredDirection, startSlot - preferredDirection);
    if (oppositeSameDay) return oppositeSameDay;

    const dayDirections = preferredDirection > 0 ? [1, -1] : [-1, 1];
    for (const dayDirection of dayDirections) {
      for (
        let candidateDay = dayIndex + dayDirection;
        candidateDay >= 0 && candidateDay <= DAYS.length - daySpan;
        candidateDay += dayDirection
      ) {
        const opening = searchDay(
          candidateDay,
          dayDirection,
          dayDirection > 0 ? 0 : maxStart
        );
        if (opening) return opening;
      }
    }
    return null;
  }

  function buildOptimizedSchedule(settings) {
    const weekKey = dateKey(startOfWeek(state.weekStart));
    if (settings.replaceGenerated) {
      state.appointments = state.appointments.filter(
        (item) => item.weekKey !== weekKey || item.createdBy !== "optimizer"
      );
    }

    const appointments = state.appointments.filter((item) => item.weekKey === weekKey);
    const blocks = state.blocks.filter((item) => item.weekKey === weekKey);
    const gapSlots = Math.ceil(settings.gapMinutes / SLOT_MINUTES);
    const minSlots = Math.ceil(settings.minMinutes / SLOT_MINUTES);
    const maxSlots = Math.floor(settings.maxMinutes / SLOT_MINUTES);
    const created = [];

    const needs = [];
    state.clients.forEach((client, clientOrder) => {
      state.rules.forEach((rule, ruleOrder) => {
        const remainingMinutes = Math.max(
          0,
          Math.round((getClientTarget(client, rule.id) - getScheduledHours(client.id, rule.id, weekKey)) * 60)
        );
        if (remainingMinutes > 0) {
          needs.push({ client, rule, remainingSlots: Math.ceil(remainingMinutes / SLOT_MINUTES), clientOrder, ruleOrder });
        }
      });
    });

    const priorityId = settings.usePriorityClient ? settings.priorityClientId : "";
    needs.sort((a, b) => {
      if ((a.client.id === priorityId) !== (b.client.id === priorityId)) return a.client.id === priorityId ? -1 : 1;
      if (settings.priority === "largest" && b.remainingSlots !== a.remainingSlots) {
        return b.remainingSlots - a.remainingSlots;
      }
      return a.clientOrder - b.clientOrder || a.ruleOrder - b.ruleOrder;
    });

    const canPlace = (need, dayIndex, startSlot, durationSlots) => {
      if (need.client.availability?.[dayIndex] === false) return false;
      if (startSlot < settings.startSlot || startSlot + durationSlots > settings.endSlot) return false;
      if (blocks.some((block) => {
        const coversDay = dayIndex >= block.dayIndex && dayIndex < block.dayIndex + (Number(block.daySpan) || 1);
        return coversDay && intervalsOverlap(startSlot, durationSlots, block.startSlot, block.durationSlots);
      })) return false;
      return !appointments.concat(created).some((item) => {
        if (item.dayIndex !== dayIndex) return false;
        if (intervalsOverlap(startSlot, durationSlots, item.startSlot, item.durationSlots)) return true;
        const requiredGap = item.clientId === need.client.id ? 1 : gapSlots;
        if (requiredGap === 0) return false;
        return startSlot < item.startSlot + item.durationSlots + requiredGap &&
          item.startSlot < startSlot + durationSlots + requiredGap;
      });
    };

    const getDayLoad = (dayIndex) => {
      const dayAppointments = appointments.concat(created).filter((item) => item.dayIndex === dayIndex);
      const dayBlocks = blocks.filter(
        (block) => dayIndex >= block.dayIndex && dayIndex < block.dayIndex + (Number(block.daySpan) || 1)
      );
      return {
        itemCount: dayAppointments.length + dayBlocks.length,
        occupiedSlots:
          dayAppointments.reduce((sum, item) => sum + item.durationSlots, 0) +
          dayBlocks.reduce((sum, item) => sum + item.durationSlots, 0)
      };
    };

    let progress = true;
    while (progress && needs.some((need) => need.remainingSlots > 0)) {
      progress = false;
      for (const need of needs) {
        if (need.remainingSlots <= 0) continue;
        if (need.remainingSlots < minSlots) continue;
        let desired = Math.min(maxSlots, need.remainingSlots);
        let placement = null;

        for (let duration = desired; duration >= Math.min(minSlots, desired) && !placement; duration -= 1) {
          const candidates = [];
          for (let dayIndex = 0; dayIndex < DAYS.length; dayIndex += 1) {
            const load = getDayLoad(dayIndex);
            for (let startSlot = settings.startSlot; startSlot + duration <= settings.endSlot; startSlot += 1) {
              if (canPlace(need, dayIndex, startSlot, duration)) {
                candidates.push({
                  dayIndex,
                  startSlot,
                  durationSlots: duration,
                  itemCount: load.itemCount,
                  occupiedSlots: load.occupiedSlots,
                  variation: Math.random()
                });
              }
            }
          }
          candidates.sort((a, b) =>
            a.itemCount - b.itemCount ||
            a.occupiedSlots - b.occupiedSlots ||
            a.variation - b.variation
          );
          if (candidates.length) {
            const bestCount = candidates[0].itemCount;
            const bestOccupied = candidates[0].occupiedSlots;
            const equallyBalanced = candidates.filter(
              (candidate) =>
                candidate.itemCount === bestCount &&
                candidate.occupiedSlots === bestOccupied
            );
            placement = equallyBalanced[Math.floor(Math.random() * equallyBalanced.length)];
          }
        }

        if (placement) {
          created.push({
            id: makeId(),
            clientId: need.client.id,
            ruleId: need.rule.id,
            weekKey,
            ...placement,
            createdBy: "optimizer"
          });
          need.remainingSlots -= placement.durationSlots;
          progress = true;
        }
      }
    }

    state.appointments.push(...created);
    const unscheduledSlots = needs.reduce((sum, need) => sum + Math.max(0, need.remainingSlots), 0);
    return { created, unscheduledSlots };
  }

  function defaultOptimizerSettings() {
    return {
      startSlot: timeValueToSlot("08:00"),
      endSlot: timeValueToSlot("17:00"),
      minMinutes: 60,
      maxMinutes: 120,
      gapMinutes: 15,
      priority: "balanced",
      usePriorityClient: false,
      priorityClientId: "",
      replaceGenerated: true
    };
  }

  function allCurrentTargetsMet() {
    const weekKey = dateKey(startOfWeek(state.weekStart));
    const hasTargets = state.clients.some((client) => getClientTarget(client) > 0);
    return hasTargets && state.clients.every((client) =>
      state.rules.every((rule) =>
        getScheduledHours(client.id, rule.id, weekKey) + 0.001 >= getClientTarget(client, rule.id)
      )
    );
  }

  function runSavedOptimizer() {
    closeActionMenus();
    if (allCurrentTargetsMet() &&
        !confirm("The current schedule already meets every client target. Create a different valid combination anyway?")) {
      showToast("Kept the current schedule.");
      return;
    }
    const result = buildOptimizedSchedule({
      ...(state.optimizerSettings || defaultOptimizerSettings()),
      replaceGenerated: true
    });
    saveState();
    render();
    const scheduledHours = result.created.reduce((sum, item) => sum + item.durationSlots, 0) * SLOT_MINUTES / 60;
    const remainingHours = result.unscheduledSlots * SLOT_MINUTES / 60;
    if (result.created.length === 0 && remainingHours === 0) {
      showToast("All client goals are already met.");
    } else if (remainingHours > 0) {
      showToast(`Added ${result.created.length} sessions; ${formatHours(remainingHours)} hours could not fit.`);
    } else {
      showToast(`Created ${result.created.length} sessions covering ${formatHours(scheduledHours)} hours.`);
    }
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
    elements.blockDurationInput.innerHTML = Array.from({ length: 24 }, (_, index) => {
      const slots = index + 1;
      return `<option value="${slots}">${formatHours(slots * SLOT_MINUTES / 60)} hours</option>`;
    }).join("");
  }

  function updateBlockDaySpanOptions(selected = 1) {
    const dayIndex = Number(elements.blockDayInput.value) || 0;
    const maximum = DAYS.length - dayIndex;
    elements.blockDaySpanInput.innerHTML = Array.from({ length: maximum }, (_, index) => {
      const days = index + 1;
      return `<option value="${days}">${days} ${days === 1 ? "day" : "days"}</option>`;
    }).join("");
    elements.blockDaySpanInput.value = String(Math.min(Number(selected) || 1, maximum));
  }

  function showBlockModal(item = null) {
    populateBlockOptions();
    elements.blockForm.dataset.blockId = item?.id || "";
    elements.blockTitleInput.value = item?.title || "Billing";
    elements.blockDayInput.value = String(item?.dayIndex ?? 0);
    updateBlockDaySpanOptions(item?.daySpan ?? 1);
    elements.blockStartInput.value = String(item?.startSlot ?? timeValueToSlot("12:00"));
    elements.blockDurationInput.value = String(item?.durationSlots ?? 4);
    elements.blockNotesInput.value = item?.notes || "";
    elements.blockRepeatInput.value = ["daily", "weekly"].includes(item?.recurrence)
      ? item.recurrence
      : "none";
    elements.blockRepeatCountInput.value = String(item?.recurrenceCount || 4);
    updateBlockRepeatControls();
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
    const blockHours = blocks.reduce(
      (sum, item) => sum + item.durationSlots * SLOT_MINUTES * (Number(item.daySpan) || 1),
      0
    ) / 60;
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

  elements.addMenuBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleActionMenu(elements.addMenu, elements.addMenuBtn);
  });
  elements.scheduleMenuBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleActionMenu(elements.scheduleMenu, elements.scheduleMenuBtn);
  });
  elements.scheduleCreatorBtn.addEventListener("click", runSavedOptimizer);
  elements.optimizerSettingsBtn.addEventListener("click", () => {
    closeActionMenus();
    showOptimizerModal();
  });
  elements.addClientBtn.addEventListener("click", () => {
    closeActionMenus();
    showModal();
  });
  elements.manageRulesBtn.addEventListener("click", () => {
    closeActionMenus();
    showRulesModal();
  });
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
  elements.addBlockBtn.addEventListener("click", () => {
    closeActionMenus();
    showBlockModal();
  });
  elements.weeklySummaryBtn.addEventListener("click", showWeeklySummary);
  elements.optimizerUsePriorityClient.addEventListener("change", () => {
    elements.optimizerPriorityClientLabel.classList.toggle(
      "hidden",
      !elements.optimizerUsePriorityClient.checked
    );
  });
  elements.closeOptimizerModalBtn.addEventListener("click", hideOptimizerModal);
  elements.cancelOptimizerModalBtn.addEventListener("click", hideOptimizerModal);
  elements.optimizerModal.addEventListener("click", (event) => {
    if (event.target === elements.optimizerModal) hideOptimizerModal();
  });
  elements.optimizerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const startSlot = timeValueToSlot(elements.optimizerStartTime.value);
    const endSlot = timeValueToSlot(elements.optimizerEndTime.value);
    const minMinutes = Number(elements.optimizerMinDuration.value);
    const maxMinutes = Number(elements.optimizerMaxDuration.value);

    if (endSlot <= startSlot) {
      elements.optimizerResult.textContent = "The ending time must be later than the starting time.";
      elements.optimizerResult.className = "optimizer-result partial";
      return;
    }
    if (maxMinutes < minMinutes) {
      elements.optimizerResult.textContent = "Maximum session length must be at least the minimum session length.";
      elements.optimizerResult.className = "optimizer-result partial";
      return;
    }

    const settings = {
      startSlot,
      endSlot,
      minMinutes,
      maxMinutes,
      gapMinutes: Number(elements.optimizerGap.value),
      priority: elements.optimizerPriority.value,
      usePriorityClient: elements.optimizerUsePriorityClient.checked,
      priorityClientId: elements.optimizerPriorityClient.value,
      replaceGenerated: elements.optimizerReplaceGenerated.checked
    };
    state.optimizerSettings = settings;
    const result = buildOptimizedSchedule(settings);
    saveState();
    render();

    const scheduledHours = result.created.reduce((sum, item) => sum + item.durationSlots, 0) * SLOT_MINUTES / 60;
    const remainingHours = result.unscheduledSlots * SLOT_MINUTES / 60;
    elements.optimizerResult.className = `optimizer-result${remainingHours ? " partial" : ""}`;
    if (result.created.length === 0 && remainingHours === 0) {
      elements.optimizerResult.textContent = "All client goals for this week are already met.";
    } else if (remainingHours > 0) {
      elements.optimizerResult.textContent =
        `Added ${result.created.length} sessions (${formatHours(scheduledHours)} hours). ` +
        `${formatHours(remainingHours)} goal hours could not fit with these preferences. Try a wider time window, a shorter minimum session, or a smaller transition gap.`;
    } else {
      elements.optimizerResult.textContent =
        `Schedule created: ${result.created.length} sessions covering ${formatHours(scheduledHours)} hours. All remaining goals fit.`;
    }
  });
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
  elements.blockRepeatInput.addEventListener("change", updateBlockRepeatControls);
  elements.blockDayInput.addEventListener("change", () =>
    updateBlockDaySpanOptions(elements.blockDaySpanInput.value)
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
      daySpan: Number(elements.blockDaySpanInput.value) || 1,
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
    } else if (elements.blockRepeatInput.value === "daily") {
      createDailyBlockRecurrences(
        existing >= 0 ? state.blocks[existing] : record,
        elements.blockRepeatCountInput.value
      );
    } else {
      record.recurrence = "none";
      record.recurrenceCount = undefined;
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
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".dropdown-action, .split-action")) closeActionMenus();
  });

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
      if (!elements.optimizerModal.classList.contains("hidden")) hideOptimizerModal();
      hideDetailModals();
      cleanupDrag();
      render();
    }
  });

  loadState();
  render();
})();
