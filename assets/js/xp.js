/* VITA · lógica pura de XP y niveles (sin DOM, sin storage).
 * UMD: funciona en navegador (window.VITA_XP) y en Node (module.exports).
 * Fuente canónica del spec en docs/sistema-xp.md
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.VITA_XP = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var BASE_TASK_XP = 100;
  var GROWTH = 1.25;
  var MASTERY_BONUS = 250;
  var GOAL_BONUS = 1000;
  var GLOBAL_K = 500;

  /** XP de una tarea del nivel n (1-based). L1=100, L2=125, L3=156… */
  function taskXPForLevel(n) {
    n = Math.max(1, Math.floor(n || 1));
    return Math.round(BASE_TASK_XP * Math.pow(GROWTH, n - 1));
  }

  /** Nivel global a partir del XP total. Curva cuadrática: acumulado = 500·(n-1)² */
  function globalLevelForXP(totalXP) {
    totalXP = Math.max(0, totalXP || 0);
    return Math.floor(Math.sqrt(totalXP / GLOBAL_K)) + 1;
  }

  /** XP acumulado necesario para alcanzar el nivel global n */
  function xpForGlobalLevel(n) {
    n = Math.max(1, Math.floor(n || 1));
    return GLOBAL_K * Math.pow(n - 1, 2);
  }

  /** Progreso 0-100 hacia el siguiente nivel global */
  function globalProgress(totalXP) {
    totalXP = Math.max(0, totalXP || 0);
    var lvl = globalLevelForXP(totalXP);
    var base = xpForGlobalLevel(lvl);
    var next = xpForGlobalLevel(lvl + 1);
    if (next <= base) return 100;
    return Math.min(100, Math.round(((totalXP - base) / (next - base)) * 100));
  }

  /**
   * Estado de un nivel: 'completed' | 'current' | 'locked'.
   * levels: [{tasks:[{done:bool}]}]. Un nivel es current si el anterior está 100%.
   */
  function levelStates(levels) {
    levels = levels || [];
    var states = [];
    var prevDone = true;
    for (var i = 0; i < levels.length; i++) {
      var tasks = levels[i].tasks || [];
      var allDone = tasks.length > 0 && tasks.every(function (t) { return !!t.done; });
      if (allDone) states.push('completed');
      else if (prevDone) states.push('current');
      else states.push('locked');
      prevDone = allDone;
    }
    return states;
  }

  /**
   * Estadísticas de una meta.
   * goal: {levels:[{tasks:[{done:bool}]}], streakXP?:number}
   * Devuelve {totalTasks, doneTasks, globalPct, levelPct[], xp, level, completedLevels, isComplete}
   */
  function computeGoalStats(goal) {
    goal = goal || {};
    var levels = goal.levels || [];
    var totalTasks = 0, doneTasks = 0, xp = 0, completedLevels = 0;

    levels.forEach(function (lv, idx) {
      var n = idx + 1;
      var tasks = lv.tasks || [];
      var done = tasks.filter(function (t) { return !!t.done; }).length;
      totalTasks += tasks.length;
      doneTasks += done;
      xp += done * taskXPForLevel(n);
      if (tasks.length > 0 && done === tasks.length) {
        completedLevels++;
        xp += MASTERY_BONUS;
      }
    });

    var isComplete = levels.length > 0 && completedLevels === levels.length;
    if (isComplete) xp += GOAL_BONUS;
    xp += Math.max(0, goal.streakXP || 0);

    var states = levelStates(levels);
    var currentIdx = states.indexOf('current');
    var level = currentIdx === -1 ? levels.length : currentIdx + 1;

    var levelPct = levels.map(function (lv) {
      var t = (lv.tasks || []).length;
      if (!t) return 0;
      var d = (lv.tasks || []).filter(function (x) { return !!x.done; }).length;
      return Math.round((d / t) * 100);
    });

    return {
      totalTasks: totalTasks,
      doneTasks: doneTasks,
      globalPct: totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0,
      levelPct: levelPct,
      states: states,
      xp: xp,
      level: level,
      completedLevels: completedLevels,
      isComplete: isComplete
    };
  }

  return {
    BASE_TASK_XP: BASE_TASK_XP,
    GROWTH: GROWTH,
    MASTERY_BONUS: MASTERY_BONUS,
    GOAL_BONUS: GOAL_BONUS,
    taskXPForLevel: taskXPForLevel,
    globalLevelForXP: globalLevelForXP,
    xpForGlobalLevel: xpForGlobalLevel,
    globalProgress: globalProgress,
    levelStates: levelStates,
    computeGoalStats: computeGoalStats
  };
}));
