(function (root) {
  "use strict";

  var KEY = "purl-pal.v1";
  var COLORS = ["blush", "sage", "honey", "sky", "lilac"];

  function uid() {
    if (root.crypto && typeof root.crypto.randomUUID === "function") {
      return root.crypto.randomUUID();
    }
    return "p-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }

  function now() {
    return new Date().toISOString();
  }

  function defaultProject(name, color) {
    var stamp = now();
    return {
      id: uid(),
      name: name || "New project",
      row: 0,
      repeatEvery: 0,
      goal: 0,
      notes: "",
      reminderRow: 0,
      reminderText: "",
      color: color || COLORS[0],
      createdAt: stamp,
      updatedAt: stamp,
    };
  }

  function defaultState() {
    var first = defaultProject("Cozy socks", "blush");
    return {
      version: 1,
      activeId: first.id,
      keepAwake: false,
      haptics: true,
      projects: [first],
    };
  }

  function sanitizeProject(raw) {
    var base = defaultProject("Untitled", "blush");
    if (!raw || typeof raw !== "object") return base;
    var math = root.PurlMath;
    base.id = typeof raw.id === "string" && raw.id ? raw.id : base.id;
    base.name = typeof raw.name === "string" && raw.name.trim() ? raw.name.trim().slice(0, 48) : "Untitled";
    base.row = math.clampRow(raw.row);
    base.repeatEvery = math.clampPositive(raw.repeatEvery);
    base.goal = math.clampPositive(raw.goal);
    base.notes = typeof raw.notes === "string" ? raw.notes.slice(0, 400) : "";
    base.reminderRow = math.clampPositive(raw.reminderRow);
    base.reminderText = typeof raw.reminderText === "string" ? raw.reminderText.slice(0, 80) : "";
    base.color = COLORS.indexOf(raw.color) >= 0 ? raw.color : COLORS[0];
    base.createdAt = typeof raw.createdAt === "string" ? raw.createdAt : base.createdAt;
    base.updatedAt = typeof raw.updatedAt === "string" ? raw.updatedAt : now();
    return base;
  }

  function sanitizeState(raw) {
    var state = defaultState();
    if (!raw || typeof raw !== "object") return state;
    var projects = Array.isArray(raw.projects) ? raw.projects.map(sanitizeProject) : [];
    if (projects.length === 0) return state;
    state.projects = projects.slice(0, 24);
    state.activeId = state.projects.some(function (p) { return p.id === raw.activeId; })
      ? raw.activeId
      : state.projects[0].id;
    state.keepAwake = Boolean(raw.keepAwake);
    state.haptics = raw.haptics !== false;
    return state;
  }

  function load() {
    try {
      var raw = root.localStorage && root.localStorage.getItem(KEY);
      if (!raw) return defaultState();
      return sanitizeState(JSON.parse(raw));
    } catch (err) {
      return defaultState();
    }
  }

  function save(state) {
    try {
      if (root.localStorage) {
        root.localStorage.setItem(KEY, JSON.stringify(state));
      }
    } catch (err) {
      // Private mode or full disk — keep working in memory.
    }
  }

  var api = {
    KEY: KEY,
    COLORS: COLORS,
    uid: uid,
    now: now,
    defaultProject: defaultProject,
    defaultState: defaultState,
    sanitizeProject: sanitizeProject,
    sanitizeState: sanitizeState,
    load: load,
    save: save,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.PurlStorage = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
