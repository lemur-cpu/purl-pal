(function () {
  "use strict";

  var math = window.PurlMath;
  var store = window.PurlStorage;

  var state = store.load();
  var undoStack = [];
  var toastTimer = null;
  var wakeLock = null;
  var celebrateTimer = null;

  var els = {
    sheep: document.getElementById("sheep"),
    projectList: document.getElementById("project-list"),
    addProject: document.getElementById("add-project"),
    projectName: document.getElementById("project-name"),
    deleteProject: document.getElementById("delete-project"),
    rowNumber: document.getElementById("row-number"),
    rowLabel: document.getElementById("row-label"),
    increment: document.getElementById("increment"),
    decrement: document.getElementById("decrement"),
    plusTen: document.getElementById("plus-ten"),
    undo: document.getElementById("undo"),
    reset: document.getElementById("reset"),
    repeatEvery: document.getElementById("repeat-every"),
    repeatStatus: document.getElementById("repeat-status"),
    repeatFill: document.getElementById("repeat-fill"),
    goal: document.getElementById("goal"),
    goalStatus: document.getElementById("goal-status"),
    goalFill: document.getElementById("goal-fill"),
    reminderRow: document.getElementById("reminder-row"),
    reminderText: document.getElementById("reminder-text"),
    notes: document.getElementById("notes"),
    reminderBanner: document.getElementById("reminder-banner"),
    toast: document.getElementById("toast"),
    keepAwake: document.getElementById("keep-awake"),
    haptics: document.getElementById("haptics"),
    celebrate: document.getElementById("celebrate"),
  };

  function activeProject() {
    return state.projects.find(function (p) { return p.id === state.activeId; }) || state.projects[0];
  }

  function persist() {
    var project = activeProject();
    if (project) project.updatedAt = store.now();
    store.save(state);
  }

  function pushUndo(project) {
    undoStack.push({ id: project.id, row: project.row });
    if (undoStack.length > 50) undoStack.shift();
  }

  function buzz(kind) {
    if (!state.haptics || !navigator.vibrate) return;
    if (kind === "repeat") navigator.vibrate([18, 40, 28]);
    else if (kind === "goal") navigator.vibrate([12, 30, 12, 30, 40]);
    else navigator.vibrate(12);
  }

  function showToast(message) {
    els.toast.textContent = message;
    els.toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      els.toast.hidden = true;
    }, 2400);
  }

  function burstCelebrate(kind) {
    var layer = els.celebrate;
    layer.innerHTML = "";
    layer.hidden = false;
    var bits = kind === "goal" ? 18 : 12;
    for (var i = 0; i < bits; i += 1) {
      var speck = document.createElement("span");
      speck.className = "yarn-speck speck-" + (i % 5);
      speck.style.left = 20 + Math.random() * 60 + "%";
      speck.style.setProperty("--drift", (Math.random() * 160 - 80) + "px");
      speck.style.setProperty("--spin", (Math.random() * 280 - 140) + "deg");
      speck.style.animationDelay = Math.random() * 0.12 + "s";
      layer.appendChild(speck);
    }
    clearTimeout(celebrateTimer);
    celebrateTimer = setTimeout(function () {
      layer.hidden = true;
      layer.innerHTML = "";
    }, 1100);
  }

  function hopSheep() {
    els.sheep.classList.remove("hop");
    void els.sheep.offsetWidth;
    els.sheep.classList.add("hop");
  }

  function renderProjects() {
    els.projectList.innerHTML = "";
    state.projects.forEach(function (project) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "project-chip color-" + project.color + (project.id === state.activeId ? " is-active" : "");
      button.setAttribute("aria-pressed", project.id === state.activeId ? "true" : "false");
      button.textContent = project.name;
      button.addEventListener("click", function () {
        state.activeId = project.id;
        persist();
        render();
      });
      els.projectList.appendChild(button);
    });
  }

  function renderCounter(project) {
    els.rowNumber.textContent = String(project.row);
    els.rowLabel.textContent = project.row === 1 ? "row" : "rows";
    document.body.dataset.color = project.color;

    var every = project.repeatEvery;
    if (every > 0 && project.row > 0) {
      var pos = math.positionInRepeat(project.row, every);
      var rep = math.repeatNumber(project.row, every);
      els.repeatStatus.textContent = "Row " + pos + " of " + every + " · repeat " + rep;
      els.repeatFill.style.width = Math.round((pos / every) * 100) + "%";
    } else if (every > 0) {
      els.repeatStatus.textContent = "Repeat starts on your first row";
      els.repeatFill.style.width = "0%";
    } else {
      els.repeatStatus.textContent = "No repeat set";
      els.repeatFill.style.width = "0%";
    }

    if (project.goal > 0) {
      var pct = Math.round(math.progressTowardGoal(project.row, project.goal) * 100);
      var left = Math.max(0, project.goal - project.row);
      els.goalStatus.textContent = math.isGoalMet(project.row, project.goal)
        ? "Goal reached — " + project.goal + " rows"
        : pct + "% of " + project.goal + " · " + left + " to go";
      els.goalFill.style.width = pct + "%";
    } else {
      els.goalStatus.textContent = "No goal set";
      els.goalFill.style.width = "0%";
    }

    var showReminder = project.reminderRow > 0 && project.row === project.reminderRow && project.reminderText;
    els.reminderBanner.hidden = !showReminder;
    if (showReminder) {
      els.reminderBanner.textContent = "Row " + project.reminderRow + " — " + project.reminderText;
    }
  }

  function renderForm(project) {
    if (document.activeElement !== els.projectName) {
      els.projectName.value = project.name;
    }
    if (document.activeElement !== els.repeatEvery) {
      els.repeatEvery.value = project.repeatEvery || "";
    }
    if (document.activeElement !== els.goal) {
      els.goal.value = project.goal || "";
    }
    if (document.activeElement !== els.reminderRow) {
      els.reminderRow.value = project.reminderRow || "";
    }
    if (document.activeElement !== els.reminderText) {
      els.reminderText.value = project.reminderText;
    }
    if (document.activeElement !== els.notes) {
      els.notes.value = project.notes;
    }
    els.keepAwake.checked = state.keepAwake;
    els.haptics.checked = state.haptics;
    els.undo.disabled = undoStack.length === 0;
    els.deleteProject.disabled = state.projects.length <= 1;
  }

  function render() {
    var project = activeProject();
    renderProjects();
    renderCounter(project);
    renderForm(project);
  }

  function changeRow(delta, opts) {
    var project = activeProject();
    var before = project.row;
    var next = math.applyDelta(project.row, delta);
    if (next === before) return;
    pushUndo(project);
    project.row = next;
    persist();
    render();
    hopSheep();

    var kind = "tap";
    if (math.isGoalMet(next, project.goal) && !math.isGoalMet(before, project.goal)) {
      kind = "goal";
      burstCelebrate("goal");
      showToast("You made it — " + project.goal + " rows!");
    } else if (delta > 0 && math.isRepeatComplete(next, project.repeatEvery)) {
      kind = "repeat";
      burstCelebrate("repeat");
      showToast("Repeat " + math.repeatNumber(next, project.repeatEvery) + " done. Soft reset for the next one.");
    }
    if (!opts || !opts.quiet) buzz(kind);
  }

  function addProject() {
    var color = store.COLORS[state.projects.length % store.COLORS.length];
    var project = store.defaultProject("New project", color);
    state.projects.push(project);
    state.activeId = project.id;
    persist();
    render();
    els.projectName.focus();
    els.projectName.select();
  }

  function deleteProject() {
    if (state.projects.length <= 1) return;
    var doomed = activeProject();
    if (!window.confirm("Delete “" + doomed.name + "”? This cannot be undone.")) return;
    state.projects = state.projects.filter(function (p) { return p.id !== doomed.id; });
    state.activeId = state.projects[0].id;
    undoStack = undoStack.filter(function (item) { return item.id !== doomed.id; });
    persist();
    render();
    showToast("Project tucked away.");
  }

  async function setWakeLock(on) {
    if (!on) {
      if (wakeLock) {
        try { await wakeLock.release(); } catch (err) { /* ignore */ }
        wakeLock = null;
      }
      return;
    }
    if (!navigator.wakeLock) {
      showToast("This browser cannot keep the screen awake.");
      state.keepAwake = false;
      persist();
      render();
      return;
    }
    try {
      wakeLock = await navigator.wakeLock.request("screen");
      wakeLock.addEventListener("release", function () {
        wakeLock = null;
      });
    } catch (err) {
      showToast("Could not keep the screen awake.");
      state.keepAwake = false;
      persist();
      render();
    }
  }

  els.increment.addEventListener("click", function () { changeRow(1); });
  els.decrement.addEventListener("click", function () { changeRow(-1); });
  els.plusTen.addEventListener("click", function () { changeRow(10); });

  els.undo.addEventListener("click", function () {
    var last = undoStack.pop();
    if (!last) return;
    var project = state.projects.find(function (p) { return p.id === last.id; });
    if (!project) {
      render();
      return;
    }
    state.activeId = project.id;
    project.row = last.row;
    persist();
    render();
    showToast("Undid the last tap.");
  });

  els.reset.addEventListener("click", function () {
    var project = activeProject();
    if (project.row === 0) return;
    if (!window.confirm("Reset “" + project.name + "” back to row 0?")) return;
    pushUndo(project);
    project.row = 0;
    persist();
    render();
    showToast("Back to the cast-on.");
  });

  els.addProject.addEventListener("click", addProject);
  els.deleteProject.addEventListener("click", deleteProject);

  els.projectName.addEventListener("input", function () {
    activeProject().name = els.projectName.value.slice(0, 48) || "Untitled";
    persist();
    renderProjects();
  });

  els.repeatEvery.addEventListener("change", function () {
    activeProject().repeatEvery = math.clampPositive(els.repeatEvery.value);
    persist();
    render();
  });

  els.goal.addEventListener("change", function () {
    activeProject().goal = math.clampPositive(els.goal.value);
    persist();
    render();
  });

  els.reminderRow.addEventListener("change", function () {
    activeProject().reminderRow = math.clampPositive(els.reminderRow.value);
    persist();
    render();
  });

  els.reminderText.addEventListener("input", function () {
    activeProject().reminderText = els.reminderText.value.slice(0, 80);
    persist();
    renderCounter(activeProject());
  });

  els.notes.addEventListener("input", function () {
    activeProject().notes = els.notes.value.slice(0, 400);
    persist();
  });

  els.keepAwake.addEventListener("change", function () {
    state.keepAwake = els.keepAwake.checked;
    persist();
    setWakeLock(state.keepAwake);
  });

  els.haptics.addEventListener("change", function () {
    state.haptics = els.haptics.checked;
    persist();
  });

  document.addEventListener("keydown", function (event) {
    var tag = event.target && event.target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    if (event.code === "Space" || event.key === "+" || event.key === "=") {
      event.preventDefault();
      changeRow(1);
    } else if (event.key === "-" || event.key === "_") {
      event.preventDefault();
      changeRow(-1);
    } else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
      event.preventDefault();
      els.undo.click();
    }
  });

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible" && state.keepAwake) {
      setWakeLock(true);
    }
  });

  render();
  if (state.keepAwake) setWakeLock(true);
})();
