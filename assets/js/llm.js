/* VITA · integración con LM (modelo de lenguaje) para generar planes de niveles.
 * UMD: navegador (window.VITA_LLM) y Node (module.exports).
 * - Proveedor: cualquier endpoint compatible con OpenAI Chat Completions.
 *   Por defecto Ollama en local (http://localhost:11434/v1) → sin clave, privado.
 * - Sin clave / sin red / error → fallback local heurístico (la app sigue funcionando).
 * - La clave SOLO vive en localStorage del navegador. Nunca se commitea.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.VITA_LLM = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var DEFAULTS = {
    endpoint: 'http://localhost:11434/v1',
    model: 'llama3.1',
    apiKey: '',
    timeoutMs: 45000
  };
  var SETTINGS_KEY = 'vita-llm-settings';

  function loadSettings(storage) {
    try {
      var s = (storage || {}).getItem
        ? JSON.parse(storage.getItem(SETTINGS_KEY) || '{}')
        : {};
      return {
        endpoint: (s.endpoint || DEFAULTS.endpoint).replace(/\/+$/, ''),
        model: s.model || DEFAULTS.model,
        apiKey: s.apiKey || '',
        timeoutMs: s.timeoutMs || DEFAULTS.timeoutMs
      };
    } catch (e) { return { endpoint: DEFAULTS.endpoint, model: DEFAULTS.model, apiKey: '', timeoutMs: DEFAULTS.timeoutMs }; }
  }

  function saveSettings(settings, storage) {
    if (storage && storage.setItem) storage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }

  /** Prompt que pide SOLO JSON con el esquema del plan. */
  function buildPlanPrompt(goalTitle, context, numLevels, tasksPerLevel) {
    return 'Eres un coach de metas personales. Diseña un plan por niveles para UNA persona.\n' +
      'Meta: "' + goalTitle + '"\n' +
      (context ? 'Contexto: ' + context + '\n' : '') +
      'Genera exactamente ' + numLevels + ' niveles progresivos, de ' + tasksPerLevel + ' tareas accionables cada uno.\n' +
      'Responde SOLO con JSON válido, sin markdown ni texto extra, con este esquema:\n' +
      '{"levels":[{"title":"...","desc":"...","tasks":["..."]}]}';
  }

  /** Extrae el primer objeto JSON de un texto (tolera ```json y texto alrededor). */
  function extractJSON(text) {
    text = String(text == null ? '' : text);
    var fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    var candidate = fenced ? fenced[1] : text;
    var start = candidate.indexOf('{');
    var end = candidate.lastIndexOf('}');
    if (start === -1 || end <= start) throw new Error('No se encontró JSON en la respuesta del modelo.');
    return JSON.parse(candidate.slice(start, end + 1));
  }

  /** Normaliza y valida un plan. Devuelve {ok, plan?, error?}. */
  function validatePlan(obj, maxLevels, maxTasks) {
    maxLevels = maxLevels || 8;
    maxTasks = maxTasks || 8;
    if (!obj || !Array.isArray(obj.levels) || obj.levels.length === 0)
      return { ok: false, error: 'El plan no contiene niveles.' };
    var levels = [];
    for (var i = 0; i < Math.min(obj.levels.length, maxLevels); i++) {
      var l = obj.levels[i] || {};
      var title = String(l.title || '').trim();
      var tasks = Array.isArray(l.tasks) ? l.tasks.map(function (t) { return String(t == null ? '' : t).trim(); }).filter(Boolean).slice(0, maxTasks) : [];
      if (!title) return { ok: false, error: 'El nivel ' + (i + 1) + ' no tiene título.' };
      if (!tasks.length) return { ok: false, error: 'El nivel "' + title + '" no tiene tareas.' };
      levels.push({ title: title, desc: String(l.desc || '').trim(), tasks: tasks });
    }
    return { ok: true, plan: { levels: levels } };
  }

  /** Fallback local: plan heurístico coherente cuando no hay LM disponible. */
  function planLocal(goalTitle, numLevels, tasksPerLevel) {
    numLevels = Math.max(1, Math.min(8, numLevels || 4));
    tasksPerLevel = Math.max(1, Math.min(8, tasksPerLevel || 3));
    var phases = ['Cimientos', 'Sistema base', 'Consistencia', 'Aceleración', 'Maestría', 'Escala', 'Automatización', 'Legado'];
    var verbs = ['Definir', 'Crear', 'Practicar', 'Medir', 'Repetir', 'Mejorar', 'Delegar', 'Publicar'];
    var levels = [];
    for (var i = 0; i < numLevels; i++) {
      var tasks = [];
      for (var j = 0; j < tasksPerLevel; j++)
        tasks.push(verbs[(i + j) % verbs.length] + ' paso ' + (j + 1) + ' de ' + goalTitle);
      levels.push({ title: 'Nivel ' + (i + 1) + ': ' + (phases[i] || 'Avance'), desc: 'Fase ' + (i + 1) + ' hacia ' + goalTitle + '.', tasks: tasks });
    }
    return { levels: levels, source: 'local' };
  }

  function fetchFn() {
    if (typeof fetch !== 'undefined') return fetch;
    try { return require('node-fetch'); } catch (e) { return null; }
  }

  /**
   * Genera un plan con el LM. Si falla (red, clave, formato) usa planLocal.
   * opts: {goalTitle, context, numLevels, tasksPerLevel, settings, fetchImpl}
   * Devuelve Promise<{levels, source:'lm'|'local', model?}>
   */
  function generatePlan(opts) {
    opts = opts || {};
    var settings = opts.settings || DEFAULTS;
    var prompt = buildPlanPrompt(opts.goalTitle || 'Mi meta', opts.context || '', opts.numLevels || 4, opts.tasksPerLevel || 3);
    var f = opts.fetchImpl || fetchFn();

    function fallback(reason) {
      var p = planLocal(opts.goalTitle || 'Mi meta', opts.numLevels || 4, opts.tasksPerLevel || 3);
      p.reason = reason;
      return p;
    }

    if (!f) return Promise.resolve(fallback('sin-fetch'));
    var ctrl = null, timer = null;
    try {
      if (typeof AbortController !== 'undefined') {
        ctrl = new AbortController();
        timer = setTimeout(function () { ctrl.abort(); }, settings.timeoutMs || 45000);
      }
    } catch (e) { /* sin abort */ }

    var headers = { 'Content-Type': 'application/json' };
    if (settings.apiKey) headers.Authorization = 'Bearer ' + settings.apiKey;

    return f((settings.endpoint || DEFAULTS.endpoint).replace(/\/+$/, '') + '/chat/completions', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        model: settings.model || DEFAULTS.model,
        messages: [
          { role: 'system', content: 'Respondes SOLO con JSON válido.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7
      }),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (res) {
      if (timer) clearTimeout(timer);
      if (!res.ok) return fallback('http-' + res.status);
      return res.json().then(function (data) {
        try {
          var content = (((data.choices || [])[0] || {}).message || {}).content || '';
          var v = validatePlan(extractJSON(content));
          if (!v.ok) return fallback('formato');
          v.plan.source = 'lm';
          v.plan.model = settings.model;
          return v.plan;
        } catch (e) { return fallback('parse'); }
      });
    }).catch(function () {
      if (timer) clearTimeout(timer);
      return fallback('red');
    });
  }

  return {
    DEFAULTS: DEFAULTS,
    SETTINGS_KEY: SETTINGS_KEY,
    loadSettings: loadSettings,
    saveSettings: saveSettings,
    buildPlanPrompt: buildPlanPrompt,
    extractJSON: extractJSON,
    validatePlan: validatePlan,
    planLocal: planLocal,
    generatePlan: generatePlan
  };
}));
