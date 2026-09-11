/* Tests VITA — sin dependencias: `node tests/run.js` */
'use strict';
const XP = require('../assets/js/xp.js');
const LLM = require('../assets/js/llm.js');

let pass = 0, fail = 0;
function eq(actual, expected, name) {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a === e) { pass++; console.log('  ok  ' + name); }
  else { fail++; console.log('  FAIL ' + name + '\n    esperado: ' + e + '\n    actual:   ' + a); }
}

console.log('XP por tarea (100·1.25^(n-1))');
eq(XP.taskXPForLevel(1), 100, 'L1 = 100');
eq(XP.taskXPForLevel(2), 125, 'L2 = 125');
eq(XP.taskXPForLevel(3), 156, 'L3 = 156');
eq(XP.taskXPForLevel(0), 100, 'nivel 0 se trata como 1');

console.log('Nivel global cuadrático (500·(n-1)²)');
eq(XP.globalLevelForXP(0), 1, '0 XP = nivel 1');
eq(XP.globalLevelForXP(499), 1, '499 XP = nivel 1');
eq(XP.globalLevelForXP(500), 2, '500 XP = nivel 2');
eq(XP.globalLevelForXP(1999), 2, '1999 XP = nivel 2');
eq(XP.globalLevelForXP(2000), 3, '2000 XP = nivel 3');
eq(XP.globalLevelForXP(4500), 4, '4500 XP = nivel 4');
eq(XP.globalLevelForXP(8000), 5, '8000 XP = nivel 5');
eq(XP.xpForGlobalLevel(3), 2000, 'xpForGlobalLevel(3) = 2000');

console.log('Progreso global');
eq(XP.globalProgress(0), 0, '0 XP = 0%');
eq(XP.globalProgress(2000), 0, 'recién subido = 0% al siguiente');
eq(XP.globalProgress(500), 0, 'recién nivel 2 = 0%');

console.log('Estados de nivel (desbloqueo secuencial)');
const lv = (d, t) => ({ tasks: Array.from({ length: t }, (_, i) => ({ done: i < d })) });
eq(XP.levelStates([lv(3, 3), lv(2, 3), lv(0, 2)]), ['completed', 'current', 'locked'], 'completado→actual→bloqueado');
eq(XP.levelStates([lv(0, 2)]), ['current'], 'primer nivel siempre actual');
eq(XP.levelStates([]), [], 'sin niveles = vacío');

console.log('Stats de meta + bonus');
const goal = { streakXP: 50, levels: [lv(3, 3), { tasks: [{ done: true }, { done: true }, { done: false }] }] };
// L1: 3×100+250=550 · L2: 2×125=250 · racha 50 → 850 · global 5/6=83%
const s = XP.computeGoalStats(goal);
eq(s.xp, 850, 'XP total 850 con bonus y racha');
eq(s.globalPct, 83, 'global 5/6 = 83%');
eq(s.levelPct, [100, 67], 'porcentaje por nivel');
eq(s.level, 2, 'nivel actual = 2');
eq(s.isComplete, false, 'no completada');

console.log('Meta 100% (bonus +1000)');
const full = XP.computeGoalStats({ levels: [lv(2, 2)] });
eq(full.xp, 2 * 100 + 250 + 1000, '2 tareas L1 + mastery + gran logro');
eq(full.isComplete, true, 'marcada completa');

console.log('Regresión ante edición (spec §3)');
const edited = XP.computeGoalStats({ levels: [{ tasks: [{ done: true }, { done: true }] }, lv(0, 1)] });
// Nivel 1 al 100% conserva bonus aunque se añada tarea en nivel 2: 200+250+0
eq(edited.xp, 450, 'bonus del nivel intacto se conserva');

console.log('LLM · extracción y validación de plan');
const raw = '```json\n{"levels":[{"title":"Cimientos","desc":"Base","tasks":["A","B"]}]}\n```';
eq(LLM.extractJSON(raw), { levels: [{ title: 'Cimientos', desc: 'Base', tasks: ['A', 'B'] }] }, 'extrae JSON de bloque de código');
eq(LLM.validatePlan({ levels: [] }).ok, false, 'rechaza plan vacío');
eq(LLM.validatePlan({ levels: [{ title: '  ', tasks: ['x'] }] }).ok, false, 'rechaza nivel sin título');
const good = LLM.validatePlan({ levels: [{ title: 'N1', desc: '', tasks: ['a', 'b'] }, { title: 'N2', tasks: ['c'] }] });
eq(good.ok, true, 'acepta plan válido');
eq(good.plan.levels.length, 2, 'conserva 2 niveles');
eq(LLM.planLocal('Aprender inglés', 2, 2).levels.length, 2, 'fallback local genera N niveles');
eq(LLM.planLocal('Aprender inglés', 2, 2).levels[0].tasks.length, 2, 'fallback local genera M tareas');

console.log(`\n${pass} ok · ${fail} fallos`);
process.exit(fail ? 1 : 0);
