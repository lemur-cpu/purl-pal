const test = require("node:test");
const assert = require("node:assert/strict");
const math = require("../js/counter.js");

test("clampRow never goes below zero", () => {
  assert.equal(math.clampRow(-3), 0);
  assert.equal(math.clampRow(12.9), 12);
  assert.equal(math.clampRow("nope"), 0);
});

test("repeat position wraps after every N rows", () => {
  assert.equal(math.positionInRepeat(1, 8), 1);
  assert.equal(math.positionInRepeat(8, 8), 8);
  assert.equal(math.positionInRepeat(9, 8), 1);
  assert.equal(math.positionInRepeat(16, 8), 8);
  assert.equal(math.positionInRepeat(0, 8), 0);
});

test("repeat number counts completed cycles", () => {
  assert.equal(math.repeatNumber(1, 8), 1);
  assert.equal(math.repeatNumber(8, 8), 1);
  assert.equal(math.repeatNumber(9, 8), 2);
  assert.equal(math.isRepeatComplete(8, 8), true);
  assert.equal(math.isRepeatComplete(9, 8), false);
});

test("goal progress caps at 100 percent", () => {
  assert.equal(math.progressTowardGoal(20, 80), 0.25);
  assert.equal(math.progressTowardGoal(80, 80), 1);
  assert.equal(math.progressTowardGoal(90, 80), 1);
  assert.equal(math.isGoalMet(79, 80), false);
  assert.equal(math.isGoalMet(80, 80), true);
});

test("applyDelta stays non-negative", () => {
  assert.equal(math.applyDelta(3, 1), 4);
  assert.equal(math.applyDelta(0, -1), 0);
  assert.equal(math.applyDelta(12, 10), 22);
});
