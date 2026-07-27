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
    { id: makeId(), name: "Client A", color: "blue", targets: { [DEFAULT_RULE_IDS.supervision]: 5, [DEFAULT_RULE_IDS.parentTraining]: 2 }, targetFrequencies: {}, availability: [true, true, true, true, true] },
    { id: makeId(), name: "Client B", color: "purple", targets: { [DEFAULT_RULE_IDS.supervision]: 4, [DEFAULT_RULE_IDS.parentTraining]: 1 }, targetFrequencies: {}, availability: [true, true, true, true, true] },
    { id: makeId(), name: "Client C", color: "green", targets: { [DEFAULT_RULE_IDS.supervision]: 6, [DEFAULT_RULE_IDS.parentTraining]: 2 }, targetFrequencies: {}, availability: [true, true, true, true, true] },
    { id: makeId(), name: "Client D", color: "yellow", targets: { [DEFAULT_RULE_IDS.supervision]: 3, [DEFAULT_RULE_IDS.parentTraining]: 1 }, targetFrequencies: {}, availability: [true, true, true, true, true] }
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
    clientPanelHint: document.querySelector("#clientPanelHint"),
    clientSearch: document.querySelector("#clientSearch"),
    weeklyHoursText: document.querySelector("#weeklyHoursText"),
    weeklyHoursFill: document.querySelector("#weeklyHoursFill"),
    weeklyHoursMessage: document.querySelector("#weeklyHoursMessage"),
    periodSummaryLabel: document.querySelector("#periodSummaryLabel"),
    periodServiceSummary: document.querySelector("#periodServiceSummary"),
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
    sessionRbtSelect: document.querySelector("#sessionRbtSelect"),
    sessionRbtCustomInput: document.querySelector("#sessionRbtCustomInput"),
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
    summaryModalTitle: document.querySelector("#summaryModalTitle"),
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
    optimizerSpacingList: document.querySelector("#optimizerSpacingList"),
    optimizerSpacingEditor: document.querySelector("#optimizerSpacingEditor"),
    optimizerSpacingRule: document.querySelector("#optimizerSpacingRule"),
    addOptimizerSpacingBtn: document.querySelector("#addOptimizerSpacingBtn"),
    showOptimizerSpacingEditorBtn: document.querySelector("#showOptimizerSpacingEditorBtn"),
    optimizerMinDuration: document.querySelector("#optimizerMinDuration"),
    optimizerMaxDuration: document.querySelector("#optimizerMaxDuration"),
    optimizerGap: document.querySelector("#optimizerGap"),
    optimizerPriority: document.querySelector("#optimizerPriority"),
    optimizerUsePriorityClient: document.querySelector("#optimizerUsePriorityClient"),
    optimizerPriorityClientLabel: document.querySelector("#optimizerPriorityClientLabel"),
    optimizerPriorityClient: document.querySelector("#optimizerPriorityClient"),
    optimizerReplaceGenerated: document.querySelector("#optimizerReplaceGenerated"),
    optimizerResult: document.querySelector("#optimizerResult"),
    calendarContextMenu: document.querySelector("#calendarContextMenu"),
    calendarContextTime: document.querySelector("#calendarContextTime"),
    calendarContextClients: document.querySelector("#calendarContextClients")
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
          ? normalizeOptimizerSettings(saved.optimizerSettings)
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
          if (!client.targetFrequencies || typeof client.targetFrequencies !== "object") {
            client.targetFrequencies = {};
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

  function appointmentDate(appointment) {
    return addDays(dateFromKey(appointment.weekKey), Number(appointment.dayIndex) || 0);
  }

  function getMonthAppointments(monthDate = state.weekStart) {
    const month = monthDate.getMonth();
    const year = monthDate.getFullYear();
    return state.appointments.filter((appointment) => {
      const date = appointmentDate(appointment);
      return date.getMonth() === month && date.getFullYear() === year;
    });
  }

  function monthKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }

  function clientServiceDaysInMonth(client, monthDate, notBefore = null) {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    let count = 0;
    for (let day = 1; day <= lastDay; day += 1) {
      const date = new Date(year, month, day);
      if (notBefore && date < notBefore) continue;
      const weekdayIndex = date.getDay() - 1;
      if (weekdayIndex >= 0 && weekdayIndex < DAYS.length && client.availability?.[weekdayIndex] !== false) count += 1;
    }
    return count;
  }

  function getWeekMonthSegments(weekStart = state.weekStart) {
    const segments = new Map();
    const normalizedWeekStart = startOfWeek(weekStart);
    DAYS.forEach((_, dayIndex) => {
      const date = addDays(normalizedWeekStart, dayIndex);
      const key = monthKey(date);
      if (!segments.has(key)) {
        segments.set(key, {
          key,
          monthDate: new Date(date.getFullYear(), date.getMonth(), 1),
          dates: []
        });
      }
      segments.get(key).dates.push({ dayIndex, date });
    });
    return [...segments.values()];
  }

  function getProportionalWeekTarget(client, ruleId = null, weekStart = state.weekStart) {
    if (!ruleId) {
      return state.rules.reduce(
        (sum, rule) => sum + getProportionalWeekTarget(client, rule.id, weekStart),
        0
      );
    }

    return getWeekMonthSegments(weekStart).reduce((sum, segment) => {
      const availableSegmentDays = segment.dates.filter(
        ({ dayIndex }) => client.availability?.[dayIndex] !== false
      ).length;
      const availableMonthDays = clientServiceDaysInMonth(client, segment.monthDate);
      if (!availableSegmentDays || !availableMonthDays) return sum;
      return sum + getMonthlyClientTarget(client, ruleId) * availableSegmentDays / availableMonthDays;
    }, 0);
  }

  function getScheduledHoursForDays(clientId, ruleId, weekKey, dayIndexes) {
    const includedDays = new Set(dayIndexes);
    const slots = state.appointments
      .filter((appointment) =>
        appointment.weekKey === weekKey &&
        appointment.clientId === clientId &&
        includedDays.has(appointment.dayIndex) &&
        (!ruleId || appointment.ruleId === ruleId)
      )
      .reduce((sum, appointment) => sum + appointment.durationSlots, 0);
    return slots * SLOT_MINUTES / 60;
  }

  function getMonthlyScheduledHours(clientId, ruleId = null, monthDate = state.weekStart) {
    const slots = getMonthAppointments(monthDate)
      .filter((appointment) => appointment.clientId === clientId && (!ruleId || appointment.ruleId === ruleId))
      .reduce((sum, appointment) => sum + appointment.durationSlots, 0);
    return slots * SLOT_MINUTES / 60;
  }

  function getPeriodScheduledHours(clientId, ruleId = null) {
    return state.view === "month"
      ? getMonthlyScheduledHours(clientId, ruleId)
      : getScheduledHours(clientId, ruleId);
  }

  function getClientTarget(client, ruleId = null) {
    if (ruleId) {
      const amount = Number(client.targets?.[ruleId] || 0);
      const frequency = client.targetFrequencies?.[ruleId] || "weekly";
      if (frequency === "biweekly") return amount / 2;
      if (frequency === "monthly") return amount * 12 / 52;
      return amount;
    }
    return state.rules.reduce((sum, rule) => sum + getClientTarget(client, rule.id), 0);
  }

  function getMonthlyClientTarget(client, ruleId = null) {
    if (ruleId) return getClientTarget(client, ruleId) * 52 / 12;
    return state.rules.reduce((sum, rule) => sum + getMonthlyClientTarget(client, rule.id), 0);
  }

  function getPeriodClientTarget(client, ruleId = null) {
    return state.view === "month"
      ? getMonthlyClientTarget(client, ruleId)
      : getProportionalWeekTarget(client, ruleId);
  }

  function getRawClientTarget(client, ruleId) {
    return Number(client?.targets?.[ruleId] || 0);
  }

  function getTargetFrequency(client, ruleId) {
    return client?.targetFrequencies?.[ruleId] || "weekly";
  }

  function frequencyLabel(frequency) {
    return frequency === "biweekly" ? "biweekly" : frequency === "monthly" ? "monthly" : "weekly";
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
    elements.weeklySummaryBtn.disabled = false;
    elements.weeklySummaryBtn.textContent = state.view === "month" ? "Monthly summary" : "Weekly summary";
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
    const monthAppointments = getMonthAppointments(monthDate);
    const scheduledHours = monthAppointments.reduce((sum, item) => sum + item.durationSlots * SLOT_MINUTES / 60, 0);
    const targetHours = state.clients.reduce((sum, client) => sum + getMonthlyClientTarget(client), 0);
    const creditedHours = state.clients.reduce((clientSum, client) => clientSum + state.rules.reduce((ruleSum, rule) =>
      ruleSum + Math.min(getMonthlyScheduledHours(client.id, rule.id, monthDate), getMonthlyClientTarget(client, rule.id)), 0), 0);
    const completion = targetHours > 0 ? Math.round(creditedHours / targetHours * 100) : 0;
    const trackedClients = state.clients.filter((client) => getMonthlyClientTarget(client) > 0);
    const onTrackClients = trackedClients.filter(
      (client) => getMonthlyScheduledHours(client.id, null, monthDate) + 0.001 >= getMonthlyClientTarget(client)
    ).length;
    const dayHours = DAYS.map((_, dayIndex) => monthAppointments
      .filter((item) => item.dayIndex === dayIndex)
      .reduce((sum, item) => sum + item.durationSlots * SLOT_MINUTES / 60, 0));
    const maxDayHours = Math.max(1, ...dayHours);
    const serviceRows = state.rules.map((rule) => {
      const tracked = state.clients.filter((client) => getMonthlyClientTarget(client, rule.id) > 0);
      const target = tracked.reduce((sum, client) => sum + getMonthlyClientTarget(client, rule.id), 0);
      if (target <= 0) return "";
      const clientRows = tracked.map((client) => {
        const clientTarget = getMonthlyClientTarget(client, rule.id);
        const actual = getMonthlyScheduledHours(client.id, rule.id, monthDate);
        const percent = Math.min(100, actual / clientTarget * 100);
        const met = actual + 0.001 >= clientTarget;
        return `<div class="month-service-client-row">
          <div><span class="client-mini-avatar color-${client.color}">${getInitials(client.name)}</span><strong>${escapeHtml(client.name)}</strong><em class="${met ? "met" : "under"}">${met ? "Met" : `${formatHours(clientTarget - actual)}h left`}</em></div>
          <div><span style="width:${percent}%"></span></div><small>${formatHours(actual)} / ${formatHours(clientTarget)}h</small>
        </div>`;
      }).join("");
      const credited = tracked.reduce((sum, client) => sum + Math.min(getMonthlyScheduledHours(client.id, rule.id, monthDate), getMonthlyClientTarget(client, rule.id)), 0);
      const metClients = tracked.filter((client) => getMonthlyScheduledHours(client.id, rule.id, monthDate) + 0.001 >= getMonthlyClientTarget(client, rule.id)).length;
      return `<details class="month-service-row">
        <summary>
          <div><span><i class="rule-dot color-solid-${rule.color}"></i>${escapeHtml(rule.name)}</span><strong>${formatHours(credited)} / ${formatHours(target)}h</strong></div>
          <div class="month-metric-track"><span class="color-solid-${rule.color}" style="width:${Math.min(100, credited / target * 100)}%"></span></div>
          <small>${metClients}/${tracked.length} clients met <b>⌄</b></small>
        </summary>
        <div class="month-service-clients">${clientRows}</div>
      </details>`;
    }).join("");
    const insights = document.createElement("section");
    insights.className = "month-insights";
    insights.innerHTML = `
      <div class="month-insights-heading"><div><span>Monthly overview</span><h2>${monthDate.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</h2></div><p>Targets are converted to their monthly equivalent automatically.</p></div>
      <div class="month-kpi-grid">
        <div><span>Scheduled hours</span><strong>${formatHours(scheduledHours)}</strong><small>${monthAppointments.length} sessions</small></div>
        <div><span>Monthly target</span><strong>${formatHours(targetHours)}</strong><small>${formatHours(Math.max(0, targetHours - creditedHours))} credited hours remaining</small></div>
        <div><span>Clients on track</span><strong>${onTrackClients}/${trackedClients.length}</strong><small>${Math.max(0, trackedClients.length - onTrackClients)} need attention</small></div>
        <div><span>Target completion</span><strong>${completion}%</strong><small>${completion >= 100 ? "Every client goal covered" : "Client overages are excluded"}</small></div>
      </div>
      <div class="month-chart-grid">
        <div class="month-chart-card">
          <div class="month-chart-heading"><strong>Service target progress</strong><span>Scheduled against monthly need</span></div>
          <div class="month-service-list">${serviceRows || '<p class="month-empty">No service targets assigned.</p>'}</div>
        </div>
        <div class="month-chart-card">
          <div class="month-chart-heading"><strong>Hours by weekday</strong><span>Where the month’s schedule is concentrated</span></div>
          <div class="month-day-chart">${DAYS.map((day, index) => `<div><strong>${formatHours(dayHours[index])}h</strong><span><i style="height:${Math.max(5, dayHours[index] / maxDayHours * 100)}%"></i></span><em>${day}</em></div>`).join("")}</div>
        </div>
      </div>
      <div class="month-weeks-label"><strong>Weekly detail</strong><span>Open any week to make scheduling changes.</span></div>
    `;
    elements.monthView.appendChild(insights);
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
          const ruleTarget = getProportionalWeekTarget(client, rule.id, week);
          return hours > 0
            ? `<span class="month-rule-stat"><i class="rule-dot color-solid-${rule.color}"></i>${escapeHtml(rule.name)} ${formatHours(hours)}/${formatHours(ruleTarget)}h</span>`
            : "";
        }).join("");
        const target = getProportionalWeekTarget(client, null, week);
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

  let calendarHoverSlot = null;
  let calendarContextPlacement = null;

  function clearCalendarHoverSlot() {
    calendarHoverSlot?.remove();
    calendarHoverSlot = null;
  }

  function calendarPlacementFromEvent(event, column = event.target.closest(".day-column")) {
    if (!column) return null;
    const rect = column.getBoundingClientRect();
    const durationSlots = 2;
    const rawSlot = Math.floor((event.clientY - rect.top) / SLOT_HEIGHT);
    return {
      dayIndex: Number(column.dataset.dayIndex),
      startSlot: clamp(Math.floor(rawSlot / durationSlots) * durationSlots, 0, TOTAL_SLOTS - durationSlots),
      durationSlots
    };
  }

  function updateCalendarHoverSlot(event) {
    if (state.view !== "week") return;
    if (!elements.calendarContextMenu.classList.contains("hidden")) return;
    const column = event.target.closest(".day-column");
    if (!column) {
      clearCalendarHoverSlot();
      return;
    }
    const placement = calendarPlacementFromEvent(event, column);
    if (!isCalendarPlacementFree(placement)) {
      clearCalendarHoverSlot();
      return;
    }
    if (!calendarHoverSlot || calendarHoverSlot.parentElement !== column) {
      clearCalendarHoverSlot();
      calendarHoverSlot = document.createElement("div");
      calendarHoverSlot.className = "calendar-slot-hover";
      column.appendChild(calendarHoverSlot);
    }
    calendarHoverSlot.style.top = `${placement.startSlot * SLOT_HEIGHT}px`;
    calendarHoverSlot.style.height = `${placement.durationSlots * SLOT_HEIGHT}px`;
    calendarHoverSlot.innerHTML = `<span>+ Right-click to add</span><small>${minutesToTime(placement.startSlot * SLOT_MINUTES)}–${minutesToTime((placement.startSlot + placement.durationSlots) * SLOT_MINUTES)}</small>`;
    calendarHoverSlot.dataset.dayIndex = String(placement.dayIndex);
    calendarHoverSlot.dataset.startSlot = String(placement.startSlot);
  }

  function hideCalendarContextMenu({ keepPreview = false } = {}) {
    elements.calendarContextMenu.classList.add("hidden");
    elements.calendarContextClients.classList.add("hidden");
    calendarContextPlacement = null;
    if (!keepPreview) clearCalendarHoverSlot();
  }

  function showCalendarContextMenu(event, placement) {
    calendarContextPlacement = placement;
    elements.calendarContextTime.textContent = `${DAYS[placement.dayIndex]} · ${minutesToTime(placement.startSlot * SLOT_MINUTES)}`;
    elements.calendarContextClients.innerHTML = state.clients.map((client) => {
      const available = client.availability?.[placement.dayIndex] !== false;
      return `<button type="button" data-context-client-id="${client.id}" ${available ? "" : "disabled"}>
        <span class="client-context-avatar color-${client.color}">${escapeHtml(getInitials(client.name))}</span>
        <span><strong>${escapeHtml(client.name)}</strong><small>${available ? "Add 30-minute session" : `Unavailable ${DAYS[placement.dayIndex]}`}</small></span>
      </button>`;
    }).join("") || '<p class="calendar-context-empty">Add a client first.</p>';
    elements.calendarContextMenu.classList.remove("hidden");
    const menuWidth = 310;
    const menuHeight = 330;
    elements.calendarContextMenu.style.left = `${Math.max(8, Math.min(event.clientX, window.innerWidth - menuWidth - 8))}px`;
    elements.calendarContextMenu.style.top = `${Math.max(8, Math.min(event.clientY, window.innerHeight - menuHeight - 8))}px`;
  }

  function renderClients() {
    elements.clientHoverPopup.classList.remove("visible");
    const query = elements.clientSearch.value.trim().toLowerCase();
    elements.clientList.innerHTML = "";

    const filteredClients = state.clients.filter((client) =>
      client.name.toLowerCase().includes(query)
    );
    const periodAppointments = state.view === "month" ? getMonthAppointments() : getCurrentWeekAppointments();
    const periodName = state.view === "month" ? "month" : "week";
    elements.clientPanelHint.textContent = state.view === "month"
      ? "Review monthly targets and service progress."
      : "Drag a client onto the calendar.";

    filteredClients.forEach((client) => {
      const scheduled = getPeriodScheduledHours(client.id);
      const required = getPeriodClientTarget(client);
      const status = getHoursStatus(scheduled, required);
      const percentage = required > 0 ? Math.min((scheduled / required) * 100, 100) : 0;
      const statusText =
        status === "met" ? "Met" : status === "over" ? "Over" : "Under";
      const ruleProgressRows = state.rules
        .filter((rule) => getClientTarget(client, rule.id) > 0)
        .map((rule) => {
          const ruleScheduled = getPeriodScheduledHours(client.id, rule.id);
          const ruleTarget = getPeriodClientTarget(client, rule.id);
          const rulePercentage = Math.min((ruleScheduled / ruleTarget) * 100, 100);
          const ruleStatus = getHoursStatus(ruleScheduled, ruleTarget);
          const frequency = getTargetFrequency(client, rule.id);
          return `<div class="client-rule-progress">
            <div><span><i class="rule-dot color-solid-${rule.color}"></i>${escapeHtml(rule.name)}${frequency === "weekly" ? "" : ` · ${frequencyLabel(frequency)}`}</span><strong>${formatHours(ruleScheduled)} / ${formatHours(ruleTarget)}h/${state.view === "month" ? "mo" : "wk"}</strong></div>
            <div class="client-progress"><div class="client-progress-fill progress-${ruleStatus}" style="width:${rulePercentage}%"></div></div>
          </div>`;
        }).join("");
      const hoverNoteDays = DAYS.map((day, dayIndex) => {
        const notes = periodAppointments
          .filter((appointment) => appointment.clientId === client.id && appointment.dayIndex === dayIndex)
          .flatMap(getSessionNotes);
        return notes.length
          ? `<section><strong>${day}</strong><ul>${notes.map((note) => `<li>${escapeHtml(note)}</li>`).join("")}</ul></section>`
          : "";
      }).join("");
      const availableDays = DAYS.filter((_, index) => client.availability?.[index] !== false);
      const hoverRules = state.rules
        .filter((rule) => getClientTarget(client, rule.id) > 0)
        .map((rule) => `<li><span><i class="rule-dot color-solid-${rule.color}"></i>${escapeHtml(rule.name)} · ${frequencyLabel(getTargetFrequency(client, rule.id))}</span><strong>${formatHours(getPeriodScheduledHours(client.id, rule.id))} / ${formatHours(getPeriodClientTarget(client, rule.id))} hrs/${state.view === "month" ? "mo" : "wk"}</strong></li>`)
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
          <div class="client-hours">${formatHours(scheduled)} of ${formatHours(required)} hrs scheduled this ${periodName}</div>
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
        <div class="hover-notes"><strong>Notes this ${periodName}</strong>${hoverNoteDays || "<p>No notes recorded yet.</p>"}</div>
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
    const isMonth = state.view === "month";
    const scheduled = state.clients.reduce(
      (sum, client) => sum + getPeriodScheduledHours(client.id),
      0
    );
    const required = state.clients.reduce(
      (sum, client) => sum + getPeriodClientTarget(client),
      0
    );
    const credited = state.clients.reduce((clientSum, client) => clientSum + state.rules.reduce((ruleSum, rule) =>
      ruleSum + Math.min(getPeriodScheduledHours(client.id, rule.id), getPeriodClientTarget(client, rule.id)), 0), 0);
    const percentage = required > 0 ? Math.min((credited / required) * 100, 100) : 0;
    const status = getHoursStatus(credited, required);

    elements.periodSummaryLabel.textContent = `Tracked this ${isMonth ? "month" : "week"}`;
    elements.weeklyHoursText.textContent = `${formatHours(credited)} / ${formatHours(required)} hrs`;
    elements.weeklyHoursFill.style.width = `${percentage}%`;
    elements.weeklyHoursFill.className = `summary-progress-fill progress-${status}`;

    if (required === 0) {
      elements.weeklyHoursMessage.textContent = `Add clients to begin tracking ${isMonth ? "monthly" : "weekly"} requirements.`;
    } else if (status === "met") {
      elements.weeklyHoursMessage.textContent = `All combined ${isMonth ? "monthly" : "weekly"} hours are scheduled.`;
    } else {
      const excluded = Math.max(0, scheduled - credited);
      elements.weeklyHoursMessage.textContent = `${formatHours(required - credited)} hours remain${excluded ? ` · ${formatHours(excluded)} excess hours excluded` : ""}.`;
    }

    elements.periodServiceSummary.innerHTML = state.rules.map((rule) => {
      const target = state.clients.reduce((sum, client) => sum + getPeriodClientTarget(client, rule.id), 0);
      if (target <= 0) return "";
      const completed = state.clients.reduce((sum, client) =>
        sum + Math.min(getPeriodScheduledHours(client.id, rule.id), getPeriodClientTarget(client, rule.id)), 0);
      const ruleStatus = getHoursStatus(completed, target);
      const percentage = Math.min(100, completed / target * 100);
      return `<div class="period-service-row">
        <div><span><i class="rule-dot color-solid-${rule.color}"></i>${escapeHtml(rule.name)}</span><strong>${formatHours(completed)} / ${formatHours(target)}h</strong></div>
        <div class="period-service-track"><div class="progress-${ruleStatus}" style="width:${percentage}%"></div></div>
      </div>`;
    }).join("");
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

  function normalizeSpacingRule(rule) {
    return {
      ruleId: rule?.ruleId || "all",
      minMinutes: Math.max(15, Number(rule?.minMinutes) || 60),
      maxMinutes: Math.max(15, Number(rule?.maxMinutes) || 120),
      gapMinutes: Math.max(0, Number(rule?.gapMinutes) || 0)
    };
  }

  function normalizeOptimizerSettings(settings = {}) {
    const legacySpacing = {
      ruleId: "all",
      minMinutes: Number(settings.minMinutes) || 60,
      maxMinutes: Number(settings.maxMinutes) || 120,
      gapMinutes: Number.isFinite(Number(settings.gapMinutes)) ? Number(settings.gapMinutes) : 15
    };
    const spacingRules = Array.isArray(settings.spacingRules) && settings.spacingRules.length
      ? settings.spacingRules.map(normalizeSpacingRule)
      : [normalizeSpacingRule(legacySpacing)];
    return {
      ...defaultOptimizerSettings(),
      ...settings,
      spacingRules
    };
  }

  function spacingForService(settings, ruleId) {
    const rules = settings.spacingRules || [];
    return normalizeSpacingRule(
      rules.find((rule) => rule.ruleId === ruleId) ||
      rules.find((rule) => rule.ruleId === "all") ||
      defaultOptimizerSettings().spacingRules[0]
    );
  }

  let optimizerSpacingDraft = [];

  function spacingRuleName(ruleId) {
    if (ruleId === "all") return "Apply to all service targets";
    return getRule(ruleId)?.name || "Removed service target";
  }

  function populateOptimizerSpacingRuleOptions(selected = "all") {
    elements.optimizerSpacingRule.innerHTML = [
      '<option value="all">Apply to all service targets</option>',
      ...state.rules.map((rule) => `<option value="${rule.id}">${escapeHtml(rule.name)}</option>`)
    ].join("");
    elements.optimizerSpacingRule.value = selected;
  }

  function renderOptimizerSpacingRules() {
    elements.optimizerSpacingList.innerHTML = optimizerSpacingDraft.map((rule, index) => `
      <div class="optimizer-spacing-item">
        <div><strong>${escapeHtml(spacingRuleName(rule.ruleId))}</strong><span>${rule.minMinutes}–${rule.maxMinutes} min sessions · ${rule.gapMinutes ? `${rule.gapMinutes} min between clients` : "no required transition"}</span></div>
        <button type="button" data-spacing-index="${index}" aria-label="Remove ${escapeHtml(spacingRuleName(rule.ruleId))}">×</button>
      </div>
    `).join("");
    elements.showOptimizerSpacingEditorBtn.classList.toggle("hidden", optimizerSpacingDraft.length === 0 || !elements.optimizerSpacingEditor.classList.contains("hidden"));
  }

  function showOptimizerSpacingEditor(selected = "all") {
    populateOptimizerSpacingRuleOptions(selected);
    const existing = optimizerSpacingDraft.find((rule) => rule.ruleId === selected) || normalizeSpacingRule({ ruleId: selected });
    elements.optimizerMinDuration.value = String(existing.minMinutes);
    elements.optimizerMaxDuration.value = String(existing.maxMinutes);
    elements.optimizerGap.value = String(existing.gapMinutes);
    elements.optimizerSpacingEditor.classList.remove("hidden");
    elements.showOptimizerSpacingEditorBtn.classList.add("hidden");
  }

  function commitOptimizerSpacingEditor() {
    const rule = normalizeSpacingRule({
      ruleId: elements.optimizerSpacingRule.value,
      minMinutes: Number(elements.optimizerMinDuration.value),
      maxMinutes: Number(elements.optimizerMaxDuration.value),
      gapMinutes: Number(elements.optimizerGap.value)
    });
    if (rule.maxMinutes < rule.minMinutes) {
      elements.optimizerResult.textContent = "Maximum session length must be at least the minimum session length.";
      elements.optimizerResult.className = "optimizer-result partial";
      return false;
    }
    const existingIndex = optimizerSpacingDraft.findIndex((item) => item.ruleId === rule.ruleId);
    if (existingIndex >= 0) optimizerSpacingDraft[existingIndex] = rule;
    else optimizerSpacingDraft.push(rule);
    elements.optimizerSpacingEditor.classList.add("hidden");
    renderOptimizerSpacingRules();
    return true;
  }

  function showOptimizerModal() {
    const settings = normalizeOptimizerSettings(state.optimizerSettings || defaultOptimizerSettings());
    elements.optimizerStartTime.value = slotToTimeValue(settings.startSlot);
    elements.optimizerEndTime.value = slotToTimeValue(settings.endSlot);
    optimizerSpacingDraft = settings.spacingRules.map((rule) => ({ ...rule }));
    elements.optimizerSpacingEditor.classList.add("hidden");
    renderOptimizerSpacingRules();
    if (!optimizerSpacingDraft.length) showOptimizerSpacingEditor();
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
    settings = normalizeOptimizerSettings(settings);
    const weekKey = dateKey(startOfWeek(state.weekStart));
    if (settings.replaceGenerated) {
      state.appointments = state.appointments.filter(
        (item) => item.weekKey !== weekKey || item.createdBy !== "optimizer"
      );
    }

    const appointments = state.appointments.filter((item) => item.weekKey === weekKey);
    const blocks = state.blocks.filter((item) => item.weekKey === weekKey);
    const created = [];
    const shuffle = (items) => {
      const copy = [...items];
      for (let index = copy.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
      }
      return copy;
    };

    const weekSegments = getWeekMonthSegments(state.weekStart);

    const needs = [];
    state.clients.forEach((client, clientOrder) => {
      state.rules.forEach((rule, ruleOrder) => {
        weekSegments.forEach((segment) => {
          const allowedDays = segment.dates
            .filter(({ dayIndex }) => client.availability?.[dayIndex] !== false)
            .map(({ dayIndex }) => dayIndex);
          if (!allowedDays.length) return;
          const monthlyTarget = getMonthlyClientTarget(client, rule.id);
          const serviceDaysInMonth = clientServiceDaysInMonth(client, segment.monthDate);
          if (!serviceDaysInMonth) return;
          const segmentTarget = monthlyTarget * allowedDays.length / serviceDaysInMonth;
          const segmentScheduled = getScheduledHoursForDays(
            client.id,
            rule.id,
            weekKey,
            segment.dates.map(({ dayIndex }) => dayIndex)
          );
          const remainingMinutes = Math.max(0, Math.round((segmentTarget - segmentScheduled) * 60));
          if (remainingMinutes > 0) {
            needs.push({
              client,
              rule,
              targetMonth: segment.key,
              allowedDays,
              remainingSlots: Math.ceil(remainingMinutes / SLOT_MINUTES),
              clientOrder,
              ruleOrder,
              spacing: spacingForService(settings, rule.id)
            });
          }
        });
      });
    });

    const priorityId = settings.usePriorityClient ? settings.priorityClientId : "";

    const canPlace = (need, dayIndex, startSlot, durationSlots) => {
      if (!need.allowedDays.includes(dayIndex)) return false;
      if (need.client.availability?.[dayIndex] === false) return false;
      if (startSlot < settings.startSlot || startSlot + durationSlots > settings.endSlot) return false;
      if (blocks.some((block) => {
        const coversDay = dayIndex >= block.dayIndex && dayIndex < block.dayIndex + (Number(block.daySpan) || 1);
        return coversDay && intervalsOverlap(startSlot, durationSlots, block.startSlot, block.durationSlots);
      })) return false;
      return !appointments.concat(created).some((item) => {
        if (item.dayIndex !== dayIndex) return false;
        if (intervalsOverlap(startSlot, durationSlots, item.startSlot, item.durationSlots)) return true;
        const itemSpacing = spacingForService(settings, item.ruleId);
        const requiredGap = item.clientId === need.client.id
          ? 1
          : Math.ceil(Math.max(need.spacing.gapMinutes, itemSpacing.gapMinutes) / SLOT_MINUTES);
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

    const scoreCandidate = (need, candidate) => {
      const scheduled = appointments.concat(created);
      const load = getDayLoad(candidate.dayIndex);
      const sameClientToday = scheduled.filter(
        (item) => item.dayIndex === candidate.dayIndex && item.clientId === need.client.id
      ).length;
      const ordered = scheduled
        .filter((item) => item.dayIndex === candidate.dayIndex)
        .concat({
          clientId: need.client.id,
          startSlot: candidate.startSlot,
          durationSlots: candidate.durationSlots,
          candidate: true
        })
        .sort((a, b) => a.startSlot - b.startSlot);
      const candidateIndex = ordered.findIndex((item) => item.candidate);
      const adjacentSameClient = [ordered[candidateIndex - 1], ordered[candidateIndex + 1]]
        .filter((item) => item?.clientId === need.client.id).length;
      const sameServiceToday = scheduled.filter(
        (item) => item.dayIndex === candidate.dayIndex && item.ruleId === need.rule.id
      ).length;

      return adjacentSameClient * 180 +
        sameClientToday * 55 +
        sameServiceToday * 8 +
        load.itemCount * 9 +
        load.occupiedSlots * 0.3 +
        Math.random() * 32;
    };

    const durationChoices = (need) => {
      const minSlots = Math.ceil(need.spacing.minMinutes / SLOT_MINUTES);
      const maxSlots = Math.max(minSlots, Math.floor(need.spacing.maxMinutes / SLOT_MINUTES));
      if (need.remainingSlots < minSlots) return [need.remainingSlots];
      const largest = Math.min(maxSlots, need.remainingSlots);
      const choices = [];
      for (let duration = minSlots; duration <= largest; duration += 1) {
        const remainder = need.remainingSlots - duration;
        if (remainder === 0 || remainder >= minSlots) choices.push(duration);
      }
      return shuffle(choices.length ? choices : [largest]);
    };

    const orderedNeeds = () => shuffle(needs).sort((a, b) => {
      if ((a.client.id === priorityId) !== (b.client.id === priorityId)) return a.client.id === priorityId ? -1 : 1;
      if (settings.priority === "largest" && b.remainingSlots !== a.remainingSlots) {
        return b.remainingSlots - a.remainingSlots;
      }
      return 0;
    });

    let progress = true;
    let passes = 0;
    while (progress && needs.some((need) => need.remainingSlots > 0) && passes < 500) {
      progress = false;
      passes += 1;
      for (const need of orderedNeeds()) {
        if (need.remainingSlots <= 0) continue;
        let placement = null;

        for (const duration of durationChoices(need)) {
          const candidates = [];
          for (let dayIndex = 0; dayIndex < DAYS.length; dayIndex += 1) {
            for (let startSlot = settings.startSlot; startSlot + duration <= settings.endSlot; startSlot += 1) {
              if (canPlace(need, dayIndex, startSlot, duration)) {
                candidates.push({
                  dayIndex,
                  startSlot,
                  durationSlots: duration
                });
              }
            }
          }
          candidates.forEach((candidate) => {
            candidate.score = scoreCandidate(need, candidate);
          });
          candidates.sort((a, b) => a.score - b.score);
          if (candidates.length) {
            const variedShortlist = candidates.slice(0, Math.min(14, candidates.length));
            const pick = Math.floor(Math.pow(Math.random(), 1.7) * variedShortlist.length);
            placement = variedShortlist[pick];
            delete placement.score;
            break;
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
          need.remainingSlots = Math.max(0, need.remainingSlots - placement.durationSlots);
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
      spacingRules: [{ ruleId: "all", minMinutes: 60, maxMinutes: 120, gapMinutes: 15 }],
      priority: "balanced",
      usePriorityClient: false,
      priorityClientId: "",
      replaceGenerated: true
    };
  }

  function allCurrentTargetsMet() {
    const weekKey = dateKey(startOfWeek(state.weekStart));
    const hasTargets = state.clients.some((client) => getProportionalWeekTarget(client) > 0);
    return hasTargets && state.clients.every((client) =>
      state.rules.every((rule) =>
        getScheduledHours(client.id, rule.id, weekKey) + 0.001 >= getProportionalWeekTarget(client, rule.id)
      )
    );
  }

  function runSavedOptimizer() {
    closeActionMenus();
    const result = buildOptimizedSchedule({
      ...(state.optimizerSettings || defaultOptimizerSettings()),
      replaceGenerated: true
    });
    saveState();
    render();
    const scheduledHours = result.created.reduce((sum, item) => sum + item.durationSlots, 0) * SLOT_MINUTES / 60;
    const remainingHours = result.unscheduledSlots * SLOT_MINUTES / 60;
    if (result.created.length === 0 && remainingHours === 0) {
      showToast("This week’s month-aware target allocation is already covered.");
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
        <input type="number" min="0" max="320" step="0.5" value="${client ? getRawClientTarget(client, rule.id) : 0}" data-target-amount data-rule-id="${rule.id}" aria-label="${escapeHtml(rule.name)} target hours" />
        <select data-target-frequency data-rule-id="${rule.id}" aria-label="${escapeHtml(rule.name)} target frequency">
          <option value="weekly" ${!client || getTargetFrequency(client, rule.id) === "weekly" ? "selected" : ""}>Weekly</option>
          <option value="biweekly" ${client && getTargetFrequency(client, rule.id) === "biweekly" ? "selected" : ""}>Biweekly</option>
          <option value="monthly" ${client && getTargetFrequency(client, rule.id) === "monthly" ? "selected" : ""}>Monthly</option>
        </select>
        <em>${client ? `${formatHours(getClientTarget(client, rule.id))}h/wk` : "weekly goal"}</em>
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
          if (client.targetFrequencies) delete client.targetFrequencies[rule.id];
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

  function clinicRbtIdentifiers() {
    return [...new Set(clinicScheduleData.flatMap((group) => group.rows.map((row) => row.rbt)).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }

  function populateSessionRbtOptions(currentValue = "") {
    const rbts = clinicRbtIdentifiers();
    elements.sessionRbtSelect.innerHTML = [
      '<option value="">Select an RBT</option>',
      ...rbts.map((rbt) => `<option value="${escapeHtml(rbt)}">${escapeHtml(rbt)}</option>`),
      '<option value="__custom__">Other / custom identifier…</option>'
    ].join("");
    const isClinicRbt = rbts.includes(currentValue);
    elements.sessionRbtSelect.value = isClinicRbt ? currentValue : currentValue ? "__custom__" : "";
    elements.sessionRbtCustomInput.value = !isClinicRbt ? currentValue : "";
    elements.sessionRbtCustomInput.classList.toggle("hidden", elements.sessionRbtSelect.value !== "__custom__");
  }

  function selectedSessionRbt() {
    return elements.sessionRbtSelect.value === "__custom__"
      ? elements.sessionRbtCustomInput.value.trim()
      : elements.sessionRbtSelect.value;
  }

  function showSessionModal(appointment) {
    const client = state.clients.find((item) => item.id === appointment.clientId);
    const scheduledMinutes = appointment.durationSlots * SLOT_MINUTES;
    elements.sessionIdInput.value = appointment.id;
    elements.sessionModalSubtitle.textContent = `${client?.name || "Client"} · ${DAYS[appointment.dayIndex]} · ${minutesToTime(appointment.startSlot * SLOT_MINUTES)}`;
    populateSessionRbtOptions(appointment.rbtId || "");
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
    elements.sessionRbtSelect.focus();
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

  function showBlockModal(item = null, preset = null) {
    populateBlockOptions();
    elements.blockForm.dataset.blockId = item?.id || "";
    elements.blockTitleInput.value = item?.title || preset?.title || "Billing";
    elements.blockDayInput.value = String(item?.dayIndex ?? preset?.dayIndex ?? 0);
    updateBlockDaySpanOptions(item?.daySpan ?? 1);
    elements.blockStartInput.value = String(item?.startSlot ?? preset?.startSlot ?? timeValueToSlot("12:00"));
    elements.blockDurationInput.value = String(item?.durationSlots ?? preset?.durationSlots ?? 4);
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

  function showMonthlySummary() {
    const monthDate = new Date(state.weekStart.getFullYear(), state.weekStart.getMonth(), 1);
    const appointments = getMonthAppointments(monthDate);
    const scheduled = appointments.reduce((sum, item) => sum + item.durationSlots * SLOT_MINUTES / 60, 0);
    const target = state.clients.reduce((sum, client) => sum + getMonthlyClientTarget(client), 0);
    const credited = state.clients.reduce((clientSum, client) => clientSum + state.rules.reduce((ruleSum, rule) =>
      ruleSum + Math.min(getMonthlyScheduledHours(client.id, rule.id, monthDate), getMonthlyClientTarget(client, rule.id)), 0), 0);
    const clientStats = state.clients
      .filter((client) => getMonthlyClientTarget(client) > 0)
      .map((client) => {
        const clientTarget = getMonthlyClientTarget(client);
        const actual = getMonthlyScheduledHours(client.id, null, monthDate);
        const clientCredited = state.rules.reduce((sum, rule) =>
          sum + Math.min(getMonthlyScheduledHours(client.id, rule.id, monthDate), getMonthlyClientTarget(client, rule.id)), 0);
        return { client, target: clientTarget, actual, credited: clientCredited, deficit: Math.max(0, clientTarget - clientCredited) };
      })
      .sort((a, b) => b.deficit - a.deficit || a.client.name.localeCompare(b.client.name));
    const onTrack = clientStats.filter((item) => item.deficit <= 0.001).length;
    const serviceCards = state.rules.map((rule) => {
      const tracked = state.clients.filter((client) => getMonthlyClientTarget(client, rule.id) > 0);
      if (!tracked.length) return "";
      const serviceTarget = tracked.reduce((sum, client) => sum + getMonthlyClientTarget(client, rule.id), 0);
      const serviceCredit = tracked.reduce((sum, client) => sum + Math.min(getMonthlyScheduledHours(client.id, rule.id, monthDate), getMonthlyClientTarget(client, rule.id)), 0);
      const met = tracked.filter((client) => getMonthlyScheduledHours(client.id, rule.id, monthDate) + 0.001 >= getMonthlyClientTarget(client, rule.id)).length;
      return `<article class="monthly-summary-service">
        <div><span><i class="rule-dot color-solid-${rule.color}"></i>${escapeHtml(rule.name)}</span><strong>${formatHours(serviceCredit)} / ${formatHours(serviceTarget)}h</strong></div>
        <div class="monthly-summary-track"><i class="color-solid-${rule.color}" style="width:${Math.min(100, serviceCredit / serviceTarget * 100)}%"></i></div>
        <small>${met} of ${tracked.length} clients met their individual target</small>
      </article>`;
    }).join("");
    const clientRows = clientStats.map(({ client, target: clientTarget, actual, credited: clientCredited, deficit }) => `
      <div class="monthly-summary-client ${deficit <= 0.001 ? "met" : "under"}">
        <span class="client-mini-avatar color-${client.color}">${getInitials(client.name)}</span>
        <div><strong>${escapeHtml(client.name)}</strong><small>${deficit <= 0.001 ? "All targets met" : `${formatHours(deficit)} credited hours remaining`}</small></div>
        <span>${formatHours(clientCredited)} / ${formatHours(clientTarget)}h${actual > clientCredited + 0.001 ? `<small>${formatHours(actual - clientCredited)}h excess excluded</small>` : ""}</span>
      </div>`).join("");

    elements.summaryModalTitle.textContent = "Monthly summary";
    elements.summaryWeekLabel.textContent = monthDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });
    elements.summaryContent.innerHTML = `
      <div class="summary-stats monthly-summary-stats">
        <div><strong>${formatHours(credited)}</strong><span>Credited target hrs</span></div>
        <div><strong>${formatHours(target)}</strong><span>Monthly target hrs</span></div>
        <div><strong>${onTrack}/${clientStats.length}</strong><span>Clients on track</span></div>
        <div><strong>${appointments.length}</strong><span>Scheduled sessions</span></div>
      </div>
      <p class="monthly-summary-note">${formatHours(scheduled)} total hours are scheduled. Client hours above an individual service target are shown, but never counted toward another client’s goal.</p>
      <div class="monthly-summary-layout">
        <section><div class="monthly-summary-heading"><strong>Service health</strong><span>Individual-goal credit only</span></div><div class="monthly-summary-services">${serviceCards}</div></section>
        <section><div class="monthly-summary-heading"><strong>Client progress</strong><span>Largest gaps first</span></div><div class="monthly-summary-clients">${clientRows || '<p class="muted">No tracked clients.</p>'}</div></section>
      </div>`;
    elements.summaryModal.classList.remove("hidden");
  }

  function showPeriodSummary() {
    if (state.view === "month") showMonthlySummary();
    else showWeeklySummary();
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

    elements.summaryModalTitle.textContent = "Weekly summary";
    elements.summaryWeekLabel.textContent = formatWeekRange();
    const clientCards = state.clients.map((client) => {
      const clientAppointments = appointments.filter((item) => item.clientId === client.id);
      const actual = getActualHours(client.id);
      const target = getProportionalWeekTarget(client);
      const status = getHoursStatus(actual, target);
      const serviceProgress = state.rules
        .filter((rule) => getClientTarget(client, rule.id) > 0)
        .map((rule) => {
          const completed = getScheduledHours(client.id, rule.id);
          const ruleTarget = getProportionalWeekTarget(client, rule.id);
          return `<span><i class="rule-dot color-solid-${rule.color}"></i>${escapeHtml(rule.name)} (${frequencyLabel(getTargetFrequency(client, rule.id))}): ${formatHours(completed)} / ${formatHours(ruleTarget)} hrs/wk</span>`;
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

  elements.scheduleGrid.addEventListener("pointermove", updateCalendarHoverSlot);
  elements.scheduleGrid.addEventListener("pointerleave", () => {
    if (elements.calendarContextMenu.classList.contains("hidden")) clearCalendarHoverSlot();
  });
  elements.scheduleGrid.addEventListener("contextmenu", (event) => {
    const column = event.target.closest(".day-column");
    if (!column || state.view !== "week") return;
    event.preventDefault();
    const placement = calendarPlacementFromEvent(event, column);
    if (!isCalendarPlacementFree(placement)) {
      hideCalendarContextMenu();
      return;
    }
    updateCalendarHoverSlot(event);
    showCalendarContextMenu(event, placement);
  });
  elements.calendarContextMenu.addEventListener("click", (event) => {
    const action = event.target.closest("[data-calendar-action]")?.dataset.calendarAction;
    if (!action || !calendarContextPlacement) return;
    if (action === "client") {
      elements.calendarContextClients.classList.toggle("hidden");
      return;
    }
    const placement = { ...calendarContextPlacement };
    hideCalendarContextMenu();
    showBlockModal(null, {
      ...placement,
      title: action === "custom" ? "Custom time" : "Blocked time"
    });
  });
  elements.calendarContextClients.addEventListener("click", (event) => {
    const button = event.target.closest("[data-context-client-id]");
    if (!button || button.disabled || !calendarContextPlacement) return;
    const client = state.clients.find((item) => item.id === button.dataset.contextClientId);
    const placement = { ...calendarContextPlacement };
    if (!client || !isCalendarPlacementFree(placement)) {
      hideCalendarContextMenu();
      showToast("That time is no longer available.");
      return;
    }
    const preferredRule = state.rules.find((rule) => getProportionalWeekTarget(client, rule.id) > getScheduledHours(client.id, rule.id)) || state.rules[0];
    const appointment = {
      id: makeId(),
      clientId: client.id,
      ruleId: preferredRule?.id || "",
      weekKey: dateKey(startOfWeek(state.weekStart)),
      ...placement,
      createdBy: "manual"
    };
    state.appointments.push(appointment);
    hideCalendarContextMenu();
    saveState();
    render();
    showSessionModal(appointment);
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
  elements.weeklySummaryBtn.addEventListener("click", showPeriodSummary);
  elements.optimizerUsePriorityClient.addEventListener("change", () => {
    elements.optimizerPriorityClientLabel.classList.toggle(
      "hidden",
      !elements.optimizerUsePriorityClient.checked
    );
  });
  elements.addOptimizerSpacingBtn.addEventListener("click", commitOptimizerSpacingEditor);
  elements.showOptimizerSpacingEditorBtn.addEventListener("click", () => showOptimizerSpacingEditor("all"));
  elements.optimizerSpacingRule.addEventListener("change", () => {
    const existing = optimizerSpacingDraft.find((rule) => rule.ruleId === elements.optimizerSpacingRule.value);
    if (!existing) return;
    elements.optimizerMinDuration.value = String(existing.minMinutes);
    elements.optimizerMaxDuration.value = String(existing.maxMinutes);
    elements.optimizerGap.value = String(existing.gapMinutes);
  });
  elements.optimizerSpacingList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-spacing-index]");
    if (!button) return;
    optimizerSpacingDraft.splice(Number(button.dataset.spacingIndex), 1);
    renderOptimizerSpacingRules();
    if (!optimizerSpacingDraft.length) showOptimizerSpacingEditor("all");
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

    if (endSlot <= startSlot) {
      elements.optimizerResult.textContent = "The ending time must be later than the starting time.";
      elements.optimizerResult.className = "optimizer-result partial";
      return;
    }
    if (!elements.optimizerSpacingEditor.classList.contains("hidden") && !commitOptimizerSpacingEditor()) return;
    if (!optimizerSpacingDraft.length) optimizerSpacingDraft = defaultOptimizerSettings().spacingRules.map((rule) => ({ ...rule }));

    const settings = {
      startSlot,
      endSlot,
      spacingRules: optimizerSpacingDraft.map((rule) => ({ ...rule })),
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
      elements.optimizerResult.textContent = "This week’s month-aware target allocation is already covered.";
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
  elements.sessionRbtSelect.addEventListener("change", () => {
    const custom = elements.sessionRbtSelect.value === "__custom__";
    elements.sessionRbtCustomInput.classList.toggle("hidden", !custom);
    if (custom) elements.sessionRbtCustomInput.focus();
  });
  elements.blockRepeatInput.addEventListener("change", updateBlockRepeatControls);
  elements.blockDayInput.addEventListener("change", () =>
    updateBlockDaySpanOptions(elements.blockDaySpanInput.value)
  );
  elements.closeModalBtn.addEventListener("click", hideModal);
  elements.cancelModalBtn.addEventListener("click", hideModal);

  elements.clientModal.addEventListener("click", (event) => {
    if (event.target === elements.clientModal) hideModal();
  });
  elements.clientTargetInputs.addEventListener("input", (event) => {
    const row = event.target.closest(".target-input-row");
    if (!row) return;
    const amount = Number(row.querySelector("[data-target-amount]")?.value) || 0;
    const frequency = row.querySelector("[data-target-frequency]")?.value || "weekly";
    const weekly = frequency === "biweekly" ? amount / 2 : frequency === "monthly" ? amount * 12 / 52 : amount;
    row.querySelector("em").textContent = `${formatHours(weekly)}h/wk`;
  });
  elements.clientTargetInputs.addEventListener("change", (event) => {
    if (event.target.matches("[data-target-frequency]")) {
      event.target.dispatchEvent(new Event("input", { bubbles: true }));
    }
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
    appointment.rbtId = selectedSessionRbt();
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
    const targetFrequencies = {};
    elements.clientTargetInputs.querySelectorAll("[data-target-amount]").forEach((input) => {
      targets[input.dataset.ruleId] = Math.max(0, Number(input.value) || 0);
    });
    elements.clientTargetInputs.querySelectorAll("[data-target-frequency]").forEach((select) => {
      targetFrequencies[select.dataset.ruleId] = select.value;
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
      existingClient.targetFrequencies = targetFrequencies;
      existingClient.availability = availability;
    } else {
      state.clients.push({
        id: makeId(),
        name,
        color,
        targets,
        targetFrequencies,
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
    if (!event.target.closest("#calendarContextMenu")) hideCalendarContextMenu();
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
      hideCalendarContextMenu();
      hideDetailModals();
      cleanupDrag();
      render();
    }
  });


  // --- Shared clinic schedule prototype ---
  const clinicScheduleData = [
    { group: "Early Learners", bcba: "Ashley M.", rows: [
      { rbt: "RBT-101 · Maya", am: "Client A", lunch: "11:30–12:00", pm: "Client B", calledOut: false },
      { rbt: "RBT-102 · Jordan", am: "Client B", lunch: "12:00–12:30", pm: "Client C", calledOut: false },
      { rbt: "RBT-103 · Priya", am: "Client C", lunch: "12:30–1:00", pm: "Client A", calledOut: false },
      { rbt: "RBT-104 · Luis", am: "Client D", lunch: "11:30–12:00", pm: "Client D", calledOut: false },
      { rbt: "RBT-105 · Sam", am: "Client L", lunch: "—", pm: "Client M", calledOut: true }
    ]},
    { group: "School Age", bcba: "Ashley M.", rows: [
      { rbt: "RBT-201 · Noah", am: "Client E", lunch: "11:30–12:00", pm: "Client F", calledOut: false },
      { rbt: "RBT-202 · Ava", am: "Client F", lunch: "12:00–12:30", pm: "Client G", calledOut: false },
      { rbt: "RBT-203 · Eli", am: "Client G", lunch: "12:30–1:00", pm: "Client E", calledOut: false },
      { rbt: "RBT-204 · Tessa", am: "Client H", lunch: "11:30–12:00", pm: "", calledOut: false },
      { rbt: "RBT-205 · Marcus", am: "", lunch: "12:00–12:30", pm: "Client H", calledOut: false }
    ]},
    { group: "Transition", bcba: "James T.", rows: [
      { rbt: "RBT-301 · Chloe", am: "Client I", lunch: "11:30–12:00", pm: "Client J", calledOut: false },
      { rbt: "RBT-302 · Andre", am: "Client J", lunch: "12:00–12:30", pm: "Client I", calledOut: false },
      { rbt: "RBT-303 · Ren", am: "Client K", lunch: "12:30–1:00", pm: "", calledOut: false },
      { rbt: "RBT-304 · Fatima", am: "", lunch: "11:30–12:00", pm: "Client K", calledOut: false }
    ]}
  ];
  const clinicClientRoster = [...new Set(clinicScheduleData.flatMap((group) => group.rows.flatMap((row) => [row.am, row.pm]).filter(Boolean)))];
  const clinicGroupClientRosters = new Map(clinicScheduleData.map((group) => [
    group.group,
    [...new Set(group.rows.flatMap((row) => [row.am, row.pm]).filter(Boolean))]
  ]));

  const clinicEls = {
    clinicView: document.querySelector("#clinicScheduleView"),
    bcbaView: document.querySelector("#bcbaScheduleView"),
    clinicTab: document.querySelector("#clinicScheduleTab"),
    bcbaTab: document.querySelector("#bcbaScheduleTab"),
    rbtTab: document.querySelector("#rbtScheduleTab"),
    clientTab: document.querySelector("#clientScheduleTab"),
    groupFilter: document.querySelector("#clinicGroupFilter"),
    search: document.querySelector("#clinicSearch"),
    optimizeBtn: document.querySelector("#clinicOptimizeBtn"),
    editToggle: document.querySelector("#clinicEditToggle"),
    viewModeBtn: document.querySelector("#clinicViewModeBtn"),
    tableTitle: document.querySelector("#clinicTableTitle"),
    tableSubtitle: document.querySelector("#clinicTableSubtitle"),
    groups: document.querySelector("#clinicGroups"),
    alerts: document.querySelector("#clinicAlerts"),
    alertBadge: document.querySelector("#clinicAlertBadge"),
    covered: document.querySelector("#clinicCoveredCount"),
    callouts: document.querySelector("#clinicCalloutCount"),
    opens: document.querySelector("#clinicOpenCount"),
    warnings: document.querySelector("#clinicWarningCount"),
    coverageVisualStatus: document.querySelector("#clinicCoverageVisualStatus"),
    coverageVisualDonut: document.querySelector("#clinicCoverageVisualDonut"),
    coverageVisualPercent: document.querySelector("#clinicCoverageVisualPercent"),
    coverageVisualLegend: document.querySelector("#clinicCoverageVisualLegend"),
    groupCoverageBars: document.querySelector("#clinicGroupCoverageBars"),
    clientCalloutSelect: document.querySelector("#clinicClientCalloutSelect"),
    clientCalloutBtn: document.querySelector("#clinicClientCalloutBtn"),
    rbtCalloutSelect: document.querySelector("#clinicRbtCalloutSelect"),
    rbtCalloutBtn: document.querySelector("#clinicRbtCalloutBtn"),
    totalCallouts: document.querySelector("#clinicTotalCallouts"),
    activeCallouts: document.querySelector("#clinicActiveCallouts"),
    idleCount: document.querySelector("#clinicIdleCount"),
    idleRbts: document.querySelector("#clinicIdleRbts"),
    clientView: document.querySelector("#clientScheduleView"),
    clientOpsDateLabel: document.querySelector("#clientOpsDateLabel"),
    clientOpsMetrics: document.querySelector("#clientOpsMetrics"),
    clientOpsSummaryBtn: document.querySelector("#clientOpsSummaryBtn"),
    clientOpsAssignmentsBtn: document.querySelector("#clientOpsAssignmentsBtn"),
    clientOpsOpenEditorBtn: document.querySelector("#clientOpsOpenEditorBtn"),
    clientOpsSummaryPanel: document.querySelector("#clientOpsSummaryPanel"),
    clientOpsAssignmentsPanel: document.querySelector("#clientOpsAssignmentsPanel"),
    clientOpsCoverageDonut: document.querySelector("#clientOpsCoverageDonut"),
    clientOpsCoveragePercent: document.querySelector("#clientOpsCoveragePercent"),
    clientOpsCoverageStatus: document.querySelector("#clientOpsCoverageStatus"),
    clientOpsCoverageLegend: document.querySelector("#clientOpsCoverageLegend"),
    clientOpsGroupBars: document.querySelector("#clientOpsGroupBars"),
    clientOpsAttentionCount: document.querySelector("#clientOpsAttentionCount"),
    clientOpsAttention: document.querySelector("#clientOpsAttention")
  };
  let clinicSchedulerMode = false;
  let clinicExceptionsOnly = true;
  const clinicClientCallouts = new Set();
  let activeScheduleTab = "clinic";
  let placeholderView = null;

  function allClinicClients() {
    return [...clinicClientRoster];
  }

  function clinicInitials(name) {
    const rbtNumber = name.match(/RBT-(\d+)/i)?.[1];
    if (rbtNumber) return rbtNumber.slice(-2);
    return name.split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase();
  }

  function assignmentOptions(selected) {
    const options = ['<option value="">Open assignment</option>'];
    allClinicClients().forEach((client) => {
      const calledOut = clinicClientCallouts.has(client);
      if (!calledOut || client === selected) {
        options.push(`<option value="${client}" ${client === selected ? "selected" : ""} ${calledOut ? "disabled" : ""}>${client}${calledOut ? " · called out" : ""}</option>`);
      }
    });
    return options.join("");
  }

  function activeClinicAssignment(row, period) {
    return !row.calledOut && row[period] && !clinicClientCallouts.has(row[period]) ? row[period] : "";
  }

  function clinicClientRbt(client, period) {
    for (const group of clinicScheduleData) {
      const row = group.rows.find((item) => activeClinicAssignment(item, period) === client);
      if (row) return row.rbt;
    }
    return "";
  }

  function clinicStats() {
    const rows = clinicScheduleData.flatMap(group => group.rows);
    const callouts = rows.filter(row => row.calledOut).length;
    const activeRows = rows.filter(row => !row.calledOut);
    const clients = allClinicClients().filter((client) => !clinicClientCallouts.has(client));
    const coveredPeriods = clients.reduce((sum, client) => sum + Number(Boolean(clinicClientRbt(client, "am"))) + Number(Boolean(clinicClientRbt(client, "pm"))), 0);
    const open = Math.max(0, clients.length * 2 - coveredPeriods);
    const warnings = clients.filter((client) => {
      const amRbt = clinicClientRbt(client, "am");
      return amRbt && amRbt === clinicClientRbt(client, "pm");
    }).length;
    const fullyCovered = clients.filter(client => {
      const am = Boolean(clinicClientRbt(client, "am"));
      const pm = Boolean(clinicClientRbt(client, "pm"));
      return am && pm;
    }).length;
    const idlePeriods = activeRows.reduce((sum, row) => sum + Number(!activeClinicAssignment(row, "am")) + Number(!activeClinicAssignment(row, "pm")), 0);
    return { callouts, clientCallouts: clinicClientCallouts.size, open, warnings, clients, fullyCovered, coveredPeriods, idlePeriods, activeRows };
  }

  function renderClinicSchedule() {
    if (!clinicEls.groups) return;
    const groupFilter = clinicEls.groupFilter.value;
    const search = clinicEls.search.value.trim().toLowerCase();
    clinicEls.groups.innerHTML = "";

    const rowHasException = (row) => row.calledOut ||
      !activeClinicAssignment(row, "am") ||
      !activeClinicAssignment(row, "pm") ||
      (activeClinicAssignment(row, "am") && activeClinicAssignment(row, "am") === activeClinicAssignment(row, "pm"));

    clinicScheduleData
      .filter(group => groupFilter === "all" || group.group === groupFilter)
      .forEach((group) => {
        const groupIndex = clinicScheduleData.indexOf(group);
        const visibleRows = group.rows.filter((row) => {
          const matchesSearch = !search || [row.rbt, row.am, row.pm].some(value => String(value).toLowerCase().includes(search));
          return matchesSearch && (!clinicExceptionsOnly || rowHasException(row));
        });
        if (!visibleRows.length) return;
        const exceptionCount = visibleRows.filter(rowHasException).length;
        const card = document.createElement("section");
        card.className = "clinic-group-card";
        card.innerHTML = `
          <div class="clinic-group-header">
            <div class="clinic-group-title"><h3>${group.group}</h3><span>BCBA: ${group.bcba}</span></div>
            <span class="coverage-pill ${exceptionCount ? "warning" : ""}">${exceptionCount ? `${exceptionCount} exception${exceptionCount === 1 ? "" : "s"}` : "Nominal"}</span>
          </div>
          <div class="clinic-table-wrap"><table class="clinic-table">
            <thead><tr><th>RBT</th><th>AM assignment</th><th>Lunch</th><th>PM assignment</th><th>Status</th><th></th></tr></thead>
            <tbody>${visibleRows.map(row => {
              const rowIndex = group.rows.indexOf(row);
              const amActive = activeClinicAssignment(row, "am");
              const pmActive = activeClinicAssignment(row, "pm");
              const repeat = amActive && amActive === pmActive;
              const assignment = (period, value) => clinicSchedulerMode && !row.calledOut
                ? `<select class="assignment-select" data-group-index="${groupIndex}" data-row-index="${rowIndex}" data-period="${period}">${assignmentOptions(value)}</select>`
                : `<div class="assignment-chip ${period === "pm" ? "pm" : ""} ${!value ? "open" : ""} ${row.calledOut || clinicClientCallouts.has(value) ? "unavailable" : ""} ${repeat ? "warning" : ""}">${row.calledOut ? "RBT unavailable" : clinicClientCallouts.has(value) ? `${value} · called out` : (value || "Open assignment")}</div>`;
              const statuses = row.calledOut
                ? '<span class="status-tag callout">RBT called out</span>'
                : `${[row.am, row.pm].some((client) => clinicClientCallouts.has(client)) ? '<span class="status-tag callout">Client called out</span>' : ""}${repeat ? '<span class="status-tag warning">Repeat pairing</span>' : ""}${(!amActive || !pmActive) ? '<span class="status-tag warning">Needs coverage</span>' : '<span class="status-tag">Covered</span>'}`;
              return `<tr>
                <td><div class="rbt-cell"><span class="avatar-circle">${clinicInitials(row.rbt)}</span>${row.rbt}</div></td>
                <td>${assignment("am", row.am)}</td>
                <td>${row.calledOut ? "—" : row.lunch}</td>
                <td>${assignment("pm", row.pm)}</td>
                <td><div class="status-stack">${statuses}</div></td>
                <td>${clinicSchedulerMode ? `<button class="mini-action ${row.calledOut ? "" : "danger"}" data-callout-group="${groupIndex}" data-callout-row="${rowIndex}">${row.calledOut ? "Restore" : "Call out"}</button>` : ""}</td>
              </tr>`;
            }).join("")}</tbody>
          </table></div>`;
        clinicEls.groups.appendChild(card);
      });

    if (!clinicEls.groups.children.length) {
      clinicEls.groups.innerHTML = `<div class="clinic-nominal-state"><span>✓</span><div><strong>No exceptions in this view</strong><p>Coverage is nominal. Use “Show all assignments” to review the complete schedule.</p></div></div>`;
    }

    const stats = clinicStats();
    clinicEls.covered.textContent = `${stats.fullyCovered} / ${stats.clients.length}`;
    clinicEls.callouts.textContent = stats.callouts + stats.clientCallouts;
    clinicEls.opens.textContent = stats.open;
    clinicEls.warnings.textContent = stats.warnings;
    const alerts = [];
    clinicClientCallouts.forEach((client) => alerts.push({ type: "critical", text: `${client} called out. Their AM and PM assignments have been released from coverage.` }));
    stats.clients.forEach((client) => {
      if (!clinicClientRbt(client, "am")) alerts.push({ type: "critical", text: `${client} does not have active AM coverage.` });
      if (!clinicClientRbt(client, "pm")) alerts.push({ type: "critical", text: `${client} does not have active PM coverage.` });
    });
    clinicScheduleData.forEach(group => group.rows.forEach(row => {
      if (row.calledOut) alerts.push({ type: "critical", text: `${row.rbt} called out (${group.group}). Their assignments need review.` });
      else {
        if (!row.am) alerts.push({ type: "critical", text: `${row.rbt} has an open AM assignment in ${group.group}.` });
        if (!row.pm) alerts.push({ type: "critical", text: `${row.rbt} has an open PM assignment in ${group.group}.` });
        if (row.am && row.am === row.pm) alerts.push({ type: "", text: `${row.rbt} is paired with ${row.am} in both AM and PM.` });
      }
    }));
    clinicEls.alertBadge.textContent = alerts.length;
    clinicEls.alerts.innerHTML = alerts.length
      ? alerts.slice(0, 8).map(alert => `<div class="clinic-alert ${alert.type}">${alert.text}</div>`).join("")
      : '<div class="clinic-alert success">No coverage issues detected.</div>';
    renderClinicVisuals(stats);
  }

  function renderClinicVisuals(stats = clinicStats()) {
    const totalPeriods = Math.max(1, stats.clients.length * 2);
    const percent = Math.round(stats.coveredPeriods / totalPeriods * 100);
    clinicEls.coverageVisualDonut.style.setProperty("--coverage", `${percent * 3.6}deg`);
    clinicEls.coverageVisualPercent.textContent = `${percent}%`;
    clinicEls.coverageVisualStatus.textContent = stats.open === 0 && stats.warnings === 0 ? "Nominal" : stats.open <= 2 ? "Monitor" : "Action needed";
    clinicEls.coverageVisualStatus.className = stats.open === 0 && stats.warnings === 0 ? "healthy" : stats.open <= 2 ? "monitor" : "critical";
    clinicEls.coverageVisualLegend.innerHTML = `
      <div><i class="legend-dot covered"></i><span><strong>${stats.coveredPeriods}</strong> covered client periods</span></div>
      <div><i class="legend-dot partial"></i><span><strong>${stats.open}</strong> periods need coverage</span></div>
      <div><i class="legend-dot uncovered"></i><span><strong>${stats.warnings}</strong> repeat-pairing warnings</span></div>`;
    clinicEls.groupCoverageBars.innerHTML = clinicScheduleData.map((group) => {
      const clients = clinicGroupClientRosters.get(group.group).filter((client) => !clinicClientCallouts.has(client));
      const covered = clients.reduce((sum, client) => sum + Number(group.rows.some((row) => activeClinicAssignment(row, "am") === client)) + Number(group.rows.some((row) => activeClinicAssignment(row, "pm") === client)), 0);
      const total = Math.max(1, clients.length * 2);
      const groupPercent = Math.round(covered / total * 100);
      return `<div class="clinic-group-bar"><div><span>${escapeHtml(group.group)}</span><strong>${groupPercent}%</strong></div><div><i style="width:${groupPercent}%"></i></div><small>${covered}/${total} active client periods · ${group.rows.filter((row) => !row.calledOut).length} RBTs available</small></div>`;
    }).join("");

    const selectedClient = clinicEls.clientCalloutSelect.value;
    clinicEls.clientCalloutSelect.innerHTML = allClinicClients().map((client) => `<option value="${client}">${client}${clinicClientCallouts.has(client) ? " · called out" : ""}</option>`).join("");
    if (allClinicClients().includes(selectedClient)) clinicEls.clientCalloutSelect.value = selectedClient;
    const currentClient = clinicEls.clientCalloutSelect.value;
    clinicEls.clientCalloutBtn.textContent = clinicClientCallouts.has(currentClient) ? "Restore client" : "Mark called out";
    clinicEls.clientCalloutBtn.classList.toggle("restore", clinicClientCallouts.has(currentClient));
    const selectedRbt = clinicEls.rbtCalloutSelect.value;
    clinicEls.rbtCalloutSelect.innerHTML = clinicScheduleData.flatMap((group, groupIndex) => group.rows.map((row, rowIndex) =>
      `<option value="${groupIndex}:${rowIndex}">${escapeHtml(row.rbt)}${row.calledOut ? " · called out" : ""}</option>`
    )).join("");
    if (clinicScheduleData.some((group, groupIndex) => group.rows.some((_, rowIndex) => `${groupIndex}:${rowIndex}` === selectedRbt))) clinicEls.rbtCalloutSelect.value = selectedRbt;
    const [selectedGroupIndex, selectedRowIndex] = clinicEls.rbtCalloutSelect.value.split(":").map(Number);
    const selectedRbtRow = clinicScheduleData[selectedGroupIndex]?.rows[selectedRowIndex];
    clinicEls.rbtCalloutBtn.textContent = selectedRbtRow?.calledOut ? "Restore RBT" : "Mark called out";
    clinicEls.rbtCalloutBtn.classList.toggle("restore", Boolean(selectedRbtRow?.calledOut));
    clinicEls.totalCallouts.textContent = `${stats.callouts + stats.clientCallouts} active`;
    const rbtCallouts = [];
    clinicScheduleData.forEach((group, groupIndex) => group.rows.forEach((row, rowIndex) => {
      if (row.calledOut) rbtCallouts.push(`<button type="button" data-restore-rbt-group="${groupIndex}" data-restore-rbt-row="${rowIndex}"><span><strong>${escapeHtml(row.rbt)}</strong><small>RBT callout · ${escapeHtml(group.group)}</small></span><b>Restore</b></button>`);
    }));
    const clientCallouts = [...clinicClientCallouts].map((client) => `<button type="button" data-restore-client="${escapeHtml(client)}"><span><strong>${escapeHtml(client)}</strong><small>Client callout · assignments excluded</small></span><b>Restore</b></button>`);
    clinicEls.activeCallouts.innerHTML = [...rbtCallouts, ...clientCallouts].join("") || '<p class="clinic-visual-empty">No active callouts.</p>';

    const idle = [];
    clinicScheduleData.forEach((group) => group.rows.forEach((row) => {
      if (row.calledOut) return;
      const periods = [];
      if (!activeClinicAssignment(row, "am")) periods.push("AM");
      if (!activeClinicAssignment(row, "pm")) periods.push("PM");
      if (periods.length) idle.push(`<div><span class="avatar-circle">${clinicInitials(row.rbt)}</span><span><strong>${escapeHtml(row.rbt)}</strong><small>${periods.join(" + ")} available · ${escapeHtml(group.group)}</small></span></div>`);
    }));
    clinicEls.idleCount.textContent = `${idle.length} RBT${idle.length === 1 ? "" : "s"}`;
    clinicEls.idleRbts.innerHTML = idle.join("") || '<p class="clinic-visual-empty">Every available RBT has a client in both periods.</p>';
    clinicEls.tableTitle.textContent = clinicExceptionsOnly ? "Exceptions requiring attention" : "All clinic assignments";
    clinicEls.tableSubtitle.textContent = clinicExceptionsOnly ? "Callouts, open coverage, and repeat pairings appear here." : "Review or update every AM and PM assignment.";
    clinicEls.viewModeBtn.textContent = clinicExceptionsOnly ? "Show all assignments" : "Show exceptions only";
  }

  function optimizeClinicCoverage() {
    clinicScheduleData.forEach((group) => {
      const clients = clinicGroupClientRosters.get(group.group).filter((client) => !clinicClientCallouts.has(client));
      const activeRows = group.rows.filter((row) => !row.calledOut);
      group.rows.forEach((row) => { row.am = ""; row.pm = ""; });
      const coveredClients = clients.slice(0, activeRows.length);
      coveredClients.forEach((client, index) => { activeRows[index].am = client; });
      if (coveredClients.length === 1) {
        activeRows[0].pm = coveredClients[0];
      } else {
        coveredClients.forEach((client, index) => {
          const pmRow = activeRows[(index + 1) % coveredClients.length];
          pmRow.pm = client;
        });
      }
    });
    clinicExceptionsOnly = true;
    renderClinicSchedule();
    renderClientOperations();
    const stats = clinicStats();
    showToast(stats.open ? `Coverage rebalanced; ${stats.open} client periods still need staffing.` : "Coverage balanced with different AM and PM RBTs.");
  }

  function clientPeriodAssignment(client, period) {
    if (clinicClientCallouts.has(client)) return null;
    const matches = [];
    clinicScheduleData.forEach((group) => group.rows.forEach((row) => {
      if (row[period] === client) matches.push({ group: group.group, row });
    }));
    return matches.find((match) => !match.row.calledOut) || matches[0] || null;
  }

  function renderClientOperations() {
    if (!clinicEls.clientView) return;
    const stats = clinicStats();
    const clients = allClinicClients().filter((client) => !clinicClientCallouts.has(client));
    const fullyCovered = clients.filter((client) =>
      clientPeriodAssignment(client, "am")?.row.calledOut === false &&
      clientPeriodAssignment(client, "pm")?.row.calledOut === false
    );
    const partiallyCovered = clients.filter((client) => {
      const am = clientPeriodAssignment(client, "am");
      const pm = clientPeriodAssignment(client, "pm");
      const covered = Number(am && !am.row.calledOut) + Number(pm && !pm.row.calledOut);
      return covered === 1;
    });
    const uncovered = clients.filter((client) => {
      const am = clientPeriodAssignment(client, "am");
      const pm = clientPeriodAssignment(client, "pm");
      return (!am || am.row.calledOut) && (!pm || pm.row.calledOut);
    });
    const coveredSlots = clients.reduce((sum, client) => {
      const am = clientPeriodAssignment(client, "am");
      const pm = clientPeriodAssignment(client, "pm");
      return sum + Number(am && !am.row.calledOut) + Number(pm && !pm.row.calledOut);
    }, 0);
    const totalSlots = Math.max(1, clients.length * 2);
    const coveragePercent = Math.round(coveredSlots / totalSlots * 100);
    const attention = [];
    clinicClientCallouts.forEach((client) => attention.push({ level: "critical", title: `${client} called out`, detail: "AM and PM assignments are excluded from active coverage." }));
    clinicScheduleData.forEach((group) => group.rows.forEach((row) => {
      if (row.calledOut) attention.push({ level: "critical", title: `${row.rbt} called out`, detail: `${row.am || "AM open"} and ${row.pm || "PM open"} need backup coverage.` });
      if (!row.calledOut && !row.am) attention.push({ level: "warning", title: `${group.group} has an open AM slot`, detail: `${row.rbt} is available for reassignment.` });
      if (!row.calledOut && !row.pm) attention.push({ level: "warning", title: `${group.group} has an open PM slot`, detail: `${row.rbt} is available for reassignment.` });
      if (!row.calledOut && row.am && row.am === row.pm) attention.push({ level: "notice", title: `${row.am} repeats the same RBT`, detail: `${row.rbt} is paired in both AM and PM.` });
    }));

    clinicEls.clientOpsDateLabel.textContent = `${new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })} · Quick coverage, staffing-risk, and continuity review.`;
    clinicEls.clientOpsMetrics.innerHTML = `
      <div><span>Clients fully covered</span><strong>${fullyCovered.length}/${clients.length}</strong><small>${partiallyCovered.length} partially covered</small></div>
      <div><span>Assignment coverage</span><strong>${coveragePercent}%</strong><small>${coveredSlots} of ${totalSlots} client periods</small></div>
      <div><span>Staff available</span><strong>${clinicScheduleData.flatMap((group) => group.rows).length - stats.callouts}</strong><small>${stats.callouts} callout${stats.callouts === 1 ? "" : "s"}</small></div>
      <div><span>Continuity warnings</span><strong>${stats.warnings}</strong><small>Same RBT in AM and PM</small></div>`;
    clinicEls.clientOpsCoverageDonut.style.setProperty("--coverage", `${coveragePercent * 3.6}deg`);
    clinicEls.clientOpsCoveragePercent.textContent = `${coveragePercent}%`;
    clinicEls.clientOpsCoverageStatus.textContent = coveragePercent >= 95 ? "Healthy" : coveragePercent >= 80 ? "Monitor" : "Action needed";
    clinicEls.clientOpsCoverageStatus.className = coveragePercent >= 95 ? "healthy" : coveragePercent >= 80 ? "monitor" : "critical";
    clinicEls.clientOpsCoverageLegend.innerHTML = `
      <div><i class="legend-dot covered"></i><span><strong>${fullyCovered.length}</strong> fully covered clients</span></div>
      <div><i class="legend-dot partial"></i><span><strong>${partiallyCovered.length}</strong> partially covered</span></div>
      <div><i class="legend-dot uncovered"></i><span><strong>${uncovered.length}</strong> without active coverage</span></div>`;
    clinicEls.clientOpsGroupBars.innerHTML = clinicScheduleData.map((group) => {
      const total = group.rows.length * 2;
      const filled = group.rows.reduce((sum, row) => sum + Number(Boolean(activeClinicAssignment(row, "am"))) + Number(Boolean(activeClinicAssignment(row, "pm"))), 0);
      const percent = Math.round(filled / total * 100);
      return `<div class="ops-bar-row"><div><span>${escapeHtml(group.group)}</span><strong>${filled}/${total}</strong></div><div><i style="width:${percent}%"></i></div><small>${escapeHtml(group.bcba)} · ${percent}% covered</small></div>`;
    }).join("");
    clinicEls.clientOpsAttentionCount.textContent = `${attention.length} item${attention.length === 1 ? "" : "s"}`;
    clinicEls.clientOpsAttention.innerHTML = attention.length
      ? attention.slice(0, 5).map((item) => `<button type="button" class="ops-attention-item ${item.level}" data-open-clinic><i></i><span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.detail)}</small></span><b>Review</b></button>`).join("")
      : '<div class="ops-all-clear"><strong>All clear</strong><span>No coverage or continuity problems detected.</span></div>';
    clinicEls.clientOpsAssignmentsPanel.innerHTML = clients.map((client) => {
      const am = clientPeriodAssignment(client, "am");
      const pm = clientPeriodAssignment(client, "pm");
      const amCovered = am && !am.row.calledOut;
      const pmCovered = pm && !pm.row.calledOut;
      const status = amCovered && pmCovered ? "covered" : amCovered || pmCovered ? "partial" : "critical";
      const group = am?.group || pm?.group || "Unassigned";
      return `<article class="client-ops-card ${status}">
        <div class="client-ops-card-heading"><span class="client-ops-avatar">${clinicInitials(client)}</span><div><strong>${escapeHtml(client)}</strong><small>${escapeHtml(group)}</small></div><em>${status === "covered" ? "Covered" : status === "partial" ? "Partial" : "At risk"}</em></div>
        <div class="client-period-row"><span>AM</span><strong>${amCovered ? escapeHtml(am.row.rbt) : "Needs coverage"}</strong></div>
        <div class="client-period-row"><span>PM</span><strong>${pmCovered ? escapeHtml(pm.row.rbt) : "Needs coverage"}</strong></div>
        <button type="button" data-review-client="${escapeHtml(client)}">Review assignment</button>
      </article>`;
    }).join("");
  }

  function openClinicEditor(search = "") {
    showScheduleTab("clinic");
    if (!clinicSchedulerMode) {
      clinicSchedulerMode = true;
      clinicEls.editToggle.textContent = "Scheduler mode: On";
      clinicEls.editToggle.classList.add("primary");
      clinicEls.editToggle.classList.remove("secondary");
    }
    clinicEls.search.value = search;
    renderClinicSchedule();
    if (search) showToast(`Showing assignments for ${search}.`);
  }

  function showScheduleTab(tab) {
    activeScheduleTab = tab;
    [clinicEls.clinicTab, clinicEls.bcbaTab, clinicEls.rbtTab, clinicEls.clientTab].forEach(button => button.classList.remove("active"));
    clinicEls.clinicView.classList.add("hidden");
    clinicEls.bcbaView.classList.add("hidden");
    clinicEls.clientView.classList.add("hidden");
    document.querySelector(".week-controls").classList.add("hidden");
    document.querySelector(".top-actions").classList.add("hidden");
    if (placeholderView) placeholderView.remove();

    if (tab === "clinic") {
      clinicEls.clinicTab.classList.add("active");
      clinicEls.clinicView.classList.remove("hidden");
    } else if (tab === "bcba") {
      clinicEls.bcbaTab.classList.add("active");
      clinicEls.bcbaView.classList.remove("hidden");
      document.querySelector(".week-controls").classList.remove("hidden");
      document.querySelector(".top-actions").classList.remove("hidden");
    } else if (tab === "client") {
      clinicEls.clientTab.classList.add("active");
      clinicEls.clientView.classList.remove("hidden");
      renderClientOperations();
    } else {
      clinicEls.rbtTab.classList.add("active");
      placeholderView = document.createElement("section");
      placeholderView.className = "clinic-schedule-view";
      placeholderView.innerHTML = '<div class="view-placeholder"><p class="eyebrow">Focused schedule</p><h2>RBT View</h2><p>This tab will show one RBT’s simple day, total hours, lunch, and assignments.</p><p>The Clinic, BCBA, and Client operational views are available now.</p></div>';
      document.querySelector(".app-shell").appendChild(placeholderView);
    }
  }

  clinicScheduleData.forEach(group => {
    const option = document.createElement("option");
    option.value = group.group;
    option.textContent = group.group;
    clinicEls.groupFilter.appendChild(option);
  });
  clinicEls.clinicTab.addEventListener("click", () => showScheduleTab("clinic"));
  clinicEls.bcbaTab.addEventListener("click", () => showScheduleTab("bcba"));
  clinicEls.rbtTab.addEventListener("click", () => showScheduleTab("rbt"));
  clinicEls.clientTab.addEventListener("click", () => showScheduleTab("client"));
  clinicEls.optimizeBtn.addEventListener("click", optimizeClinicCoverage);
  clinicEls.viewModeBtn.addEventListener("click", () => {
    clinicExceptionsOnly = !clinicExceptionsOnly;
    renderClinicSchedule();
  });
  clinicEls.clientCalloutSelect.addEventListener("change", () => renderClinicVisuals());
  clinicEls.rbtCalloutSelect.addEventListener("change", () => renderClinicVisuals());
  clinicEls.clientCalloutBtn.addEventListener("click", () => {
    const client = clinicEls.clientCalloutSelect.value;
    if (!client) return;
    if (clinicClientCallouts.has(client)) clinicClientCallouts.delete(client);
    else clinicClientCallouts.add(client);
    renderClinicSchedule();
    renderClientOperations();
    showToast(clinicClientCallouts.has(client) ? `${client} marked called out.` : `${client} restored.`);
  });
  clinicEls.rbtCalloutBtn.addEventListener("click", () => {
    const [groupIndex, rowIndex] = clinicEls.rbtCalloutSelect.value.split(":").map(Number);
    const row = clinicScheduleData[groupIndex]?.rows[rowIndex];
    if (!row) return;
    row.calledOut = !row.calledOut;
    renderClinicSchedule();
    renderClientOperations();
    showToast(row.calledOut ? `${row.rbt} marked called out.` : `${row.rbt} restored.`);
  });
  clinicEls.activeCallouts.addEventListener("click", (event) => {
    const clientButton = event.target.closest("[data-restore-client]");
    if (clientButton) {
      clinicClientCallouts.delete(clientButton.dataset.restoreClient);
      renderClinicSchedule();
      renderClientOperations();
      showToast(`${clientButton.dataset.restoreClient} restored.`);
      return;
    }
    const rbtButton = event.target.closest("[data-restore-rbt-group]");
    if (rbtButton) {
      const row = clinicScheduleData[Number(rbtButton.dataset.restoreRbtGroup)].rows[Number(rbtButton.dataset.restoreRbtRow)];
      row.calledOut = false;
      renderClinicSchedule();
      renderClientOperations();
      showToast(`${row.rbt} restored.`);
    }
  });
  clinicEls.clientOpsSummaryBtn.addEventListener("click", () => {
    clinicEls.clientOpsSummaryPanel.classList.remove("hidden");
    clinicEls.clientOpsAssignmentsPanel.classList.add("hidden");
    clinicEls.clientOpsSummaryBtn.className = "button primary";
    clinicEls.clientOpsAssignmentsBtn.className = "button secondary";
  });
  clinicEls.clientOpsAssignmentsBtn.addEventListener("click", () => {
    clinicEls.clientOpsSummaryPanel.classList.add("hidden");
    clinicEls.clientOpsAssignmentsPanel.classList.remove("hidden");
    clinicEls.clientOpsSummaryBtn.className = "button secondary";
    clinicEls.clientOpsAssignmentsBtn.className = "button primary";
  });
  clinicEls.clientOpsOpenEditorBtn.addEventListener("click", () => openClinicEditor());
  clinicEls.clientView.addEventListener("click", (event) => {
    const clientButton = event.target.closest("[data-review-client]");
    if (clientButton) {
      openClinicEditor(clientButton.dataset.reviewClient);
      return;
    }
    if (event.target.closest("[data-open-clinic]")) openClinicEditor();
  });
  clinicEls.groupFilter.addEventListener("change", renderClinicSchedule);
  clinicEls.search.addEventListener("input", renderClinicSchedule);
  clinicEls.editToggle.addEventListener("click", () => {
    clinicSchedulerMode = !clinicSchedulerMode;
    clinicEls.editToggle.textContent = `Scheduler mode: ${clinicSchedulerMode ? "On" : "Off"}`;
    clinicEls.editToggle.classList.toggle("primary", clinicSchedulerMode);
    clinicEls.editToggle.classList.toggle("secondary", !clinicSchedulerMode);
    renderClinicSchedule();
  });
  clinicEls.groups.addEventListener("change", event => {
    const select = event.target.closest(".assignment-select");
    if (!select) return;
    const group = clinicScheduleData[Number(select.dataset.groupIndex)];
    const row = group.rows[Number(select.dataset.rowIndex)];
    row[select.dataset.period] = select.value;
    renderClinicSchedule();
    renderClientOperations();
    showToast(`${row.rbt} assignment updated.`);
  });
  clinicEls.groups.addEventListener("click", event => {
    const button = event.target.closest("[data-callout-group]");
    if (!button) return;
    const group = clinicScheduleData[Number(button.dataset.calloutGroup)];
    const row = group.rows[Number(button.dataset.calloutRow)];
    row.calledOut = !row.calledOut;
    renderClinicSchedule();
    renderClientOperations();
    showToast(row.calledOut ? `${row.rbt} marked called out.` : `${row.rbt} restored.`);
  });

  loadState();
  const realWeekStart = startOfWeek(new Date());
  state.lastWeekStart = new Date(realWeekStart);
  if (state.view === "week") state.weekStart = new Date(realWeekStart);
  let observedRealWeekKey = dateKey(realWeekStart);
  window.setInterval(() => {
    const currentRealWeek = startOfWeek(new Date());
    const currentRealWeekKey = dateKey(currentRealWeek);
    if (currentRealWeekKey === observedRealWeekKey) return;
    const wasShowingCurrentWeek = state.view === "week" && dateKey(startOfWeek(state.weekStart)) === observedRealWeekKey;
    observedRealWeekKey = currentRealWeekKey;
    state.lastWeekStart = new Date(currentRealWeek);
    if (wasShowingCurrentWeek) {
      state.weekStart = new Date(currentRealWeek);
      saveState();
      render();
    }
  }, 60000);
  saveState();
  render();
  renderClinicSchedule();
  renderClientOperations();
  showScheduleTab("clinic");
})();
