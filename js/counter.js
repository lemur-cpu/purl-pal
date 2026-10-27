(function (root) {
  "use strict";

  function clampRow(row) {
    var n = Number(row);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.floor(n));
  }

  function clampPositive(value) {
    var n = Number(value);
    if (!Number.isFinite(n) || n < 1) return 0;
    return Math.floor(n);
  }

  function positionInRepeat(row, every) {
    var r = clampRow(row);
    var e = clampPositive(every);
    if (e === 0 || r === 0) return 0;
    return ((r - 1) % e) + 1;
  }

  function repeatNumber(row, every) {
    var r = clampRow(row);
    var e = clampPositive(every);
    if (e === 0 || r === 0) return 0;
    return Math.floor((r - 1) / e) + 1;
  }

  function isRepeatComplete(row, every) {
    var r = clampRow(row);
    var e = clampPositive(every);
    return e > 0 && r > 0 && r % e === 0;
  }

  function progressTowardGoal(row, goal) {
    var r = clampRow(row);
    var g = clampPositive(goal);
    if (g === 0) return 0;
    return Math.min(1, r / g);
  }

  function isGoalMet(row, goal) {
    var r = clampRow(row);
    var g = clampPositive(goal);
    return g > 0 && r >= g;
  }

  function applyDelta(row, delta) {
    return clampRow(clampRow(row) + Number(delta || 0));
  }

  var api = {
    clampRow: clampRow,
    clampPositive: clampPositive,
    positionInRepeat: positionInRepeat,
    repeatNumber: repeatNumber,
    isRepeatComplete: isRepeatComplete,
    progressTowardGoal: progressTowardGoal,
    isGoalMet: isGoalMet,
    applyDelta: applyDelta,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.PurlMath = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
