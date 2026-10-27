const test = require("node:test");
const assert = require("node:assert/strict");

globalThis.PurlMath = require("../js/counter.js");
const store = require("../js/storage.js");

test("sanitizeProject fills safe defaults", () => {
  const project = store.sanitizeProject({
    name: "  Honey cowl  ",
    row: -4,
    repeatEvery: 6.8,
    color: "mystery",
  });
  assert.equal(project.name, "Honey cowl");
  assert.equal(project.row, 0);
  assert.equal(project.repeatEvery, 6);
  assert.equal(project.color, "blush");
});

test("sanitizeState keeps a valid active project", () => {
  const state = store.sanitizeState({
    activeId: "missing",
    projects: [{ id: "hat", name: "Rain hat", row: 11, color: "sage" }],
  });
  assert.equal(state.projects.length, 1);
  assert.equal(state.activeId, "hat");
  assert.equal(state.projects[0].row, 11);
});

test("empty or broken input becomes a starter project", () => {
  const state = store.sanitizeState(null);
  assert.ok(state.projects.length >= 1);
  assert.equal(state.projects[0].name, "Cozy socks");
});
