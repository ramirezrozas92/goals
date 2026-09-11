/* VITA · store compartido de metas (navegador). UMD básico. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.VITA_STORE = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var KEY = 'vita-goals-v1';

  function uid() {
    return 'id-' + Date.now().toString(36) + '-' + Math.floor(Math.random() * 1e6).toString(36);
  }

  function t(title, done) { return { id: uid(), title: title, done: !!done }; }

  /* Semilla canónica: coherente con el spec (meta 1: 5/13 = 38% · 850 XP · Nivel 2). */
  function seed() {
    return [
      {
        id: 'g-inmobiliario', icon: '🎯', title: 'Líder Inmobiliario', tag: '#Trabajo', tagColor: 'indigo',
        color: 'from-indigo-500 to-purple-500', streak: 3, streakXP: 50,
        levels: [
          { id: uid(), title: 'Nivel 1: Cimientos', desc: 'Definir nicho y primeros pasos estratégicos.', tasks: [t('Definir nicho objetivo', true), t('Crear propuesta de valor', true), t('Publicar primera presentación', true)] },
          { id: uid(), title: 'Nivel 2: Marca Personal', desc: 'Establecer presencia online consistente.', tasks: [t('Publicar video corto', true), t('Crear calendario semanal', true), t('Investigar 3 tendencias', false)] },
          { id: uid(), title: 'Nivel 3: Ampliación', desc: 'Escalar sistema de captación de clientes.', tasks: [t('Automatizar seguimiento', false), t('Alianza con 2 brokers', false), t('Webinar mensual', false), t('CRM con 100 contactos', false), t('Sistema de referidos', false), t('Anuncios segmentados', false), t('Reporte mensual de KPIs', false)] }
        ]
      },
      {
        id: 'g-finanzas', icon: '💰', title: 'Libertad Financiera', tag: '#Finanzas', tagColor: 'emerald',
        color: 'from-emerald-500 to-teal-500', streak: 0, streakXP: 0,
        levels: [
          { id: uid(), title: 'Nivel 1: Orden', desc: 'Visibilidad total del dinero.', tasks: [t('Crear presupuesto mensual', false), t('Fondo de emergencia inicial', false), t('Cancelar 1 gasto hormiga', false), t('Automatizar ahorro 10%', false)] }
        ]
      },
      {
        id: 'g-ingles', icon: '🎓', title: 'Inglés B2', tag: '#Educación', tagColor: 'amber',
        color: 'from-amber-500 to-orange-500', streak: 12, streakXP: 50,
        levels: [
          { id: uid(), title: 'Nivel 1: Base', desc: 'Rutina diaria mínima.', tasks: [t('500 palabras frecuentes', true), t('Presente y pasado', true)] },
          { id: uid(), title: 'Nivel 2: Fluidez', desc: 'Producir sin miedo.', tasks: [t('Listening 30 min', true), t('Shadowing diario', false), t('1 conversación semanal', false)] },
          { id: uid(), title: 'Nivel 3: Examen B2', desc: 'Preparación oficial.', tasks: [t('Mock exam 1', false), t('Writing semanal', false)] }
        ]
      },
      {
        id: 'g-maraton', icon: '💪', title: 'Maratón 42K', tag: '#Salud', tagColor: 'rose',
        color: 'from-rose-500 to-pink-500', streak: 2, streakXP: 0,
        levels: [
          { id: uid(), title: 'Nivel 1: Hábito', desc: 'Correr sin lesionarse.', tasks: [t('Correr 5K intervalos', true), t('Fuerza 2x semana', false), t('Dormir 8h', false)] }
        ]
      }
    ];
  }

  function memStorage() {
    var m = {};
    return {
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(m, k) ? m[k] : null; },
      setItem: function (k, v) { m[k] = String(v); },
      removeItem: function (k) { delete m[k]; }
    };
  }

  function browserStorage() {
    try {
      if (typeof localStorage !== 'undefined') return localStorage;
    } catch (e) { /* privado / bloqueado */ }
    return memStorage();
  }

  function createStore(storage) {
    storage = storage || browserStorage();
    function load() {
      try {
        var raw = storage.getItem(KEY);
        if (!raw) { var s = seed(); save(s); return s; }
        var goals = JSON.parse(raw);
        if (!Array.isArray(goals) || !goals.length) { var s2 = seed(); save(s2); return s2; }
        return goals;
      } catch (e) { var s3 = seed(); try { save(s3); } catch (_) {} return s3; }
    }
    function save(goals) { storage.setItem(KEY, JSON.stringify(goals)); }
    function reset() { var s = seed(); save(s); return s; }
    return { KEY: KEY, load: load, save: save, reset: reset, uid: uid, task: t };
  }

  return { createStore: createStore, seed: seed, uid: uid, task: t, memStorage: memStorage };
}));
