# GOALS APP — VITA

App personal de metas y hábitos para **una persona**: defines tus metas, cada meta se parte en
**niveles progresivos** con tareas accionables, y el día a día se ejecuta en el **Daily Focus**.
Completar tareas suma **XP** (más cuanto más alto el nivel), los niveles dan bonus y el XP total
sube tu **nivel global**. Un **LM conectado** puede proponerte el plan de niveles; tú lo aplicas,
lo editas y lo vives. No es un juego: la gamificación solo hace visible tu progreso real.

## Estructura

```
screens/
  goals-page.html          # Home: tus metas, XP total + nivel global, siguiente acción
  goal-detail.html         # Planificador: roadmap de niveles (CRUD), XP en vivo, ✨ Plan con IA
  daily-focus-habitos.html # Hoy: tarjetas una a una + timer + racha
  tarjetas-metas.html      # Componente tarjeta (demo visual)
assets/
  css/vita.css             # Sistema visual: tokens, foco visible, toast, modal
  js/xp.js                 # Lógica XP/niveles (navegador + Node, sin dependencias)
  js/store.js              # Store localStorage de metas (semilla canónica)
  js/llm.js                # Cliente LM OpenAI-compatible + fallback local
docs/
  sistema-xp.md            # Spec del algoritmo XP local/global
  llm.md                   # Integración con el modelo: proveedores, privacidad, esquema
tests/
  run.js                   # Tests sin dependencias: node tests/run.js
```

## Flujo de uso

1. **goals-page**: elige meta → completa la *siguiente acción* (+XP) o entra al detalle.
2. **goal-detail**: marca tareas, añade tareas/niveles, desbloquea el siguiente nivel al 100%
   (+250 XP bonus, +1000 XP al cerrar la meta). ¿Sin plan? **✨ Plan con IA**.
3. **daily-focus**: ejecuta el día tarjeta a tarjeta con timer; la racha alimenta el XP.
4. Todo persiste en `localStorage`; las pantallas comparten el mismo store y motor XP.

## Modelo XP canónico

- Tarea nivel n: `round(100 × 1.25^(n-1))` → L1=100, L2=125, L3=156. Bonus +250 por nivel, +1000 al cerrar meta.
- Nivel global cuadrático: `floor(sqrt(XP/500)) + 1` → 500 XP = Nivel 2, 2000 XP = Nivel 3.
- Meta "Líder Inmobiliario": **850 XP · Nivel 2** (Nivel 1 3/3 + Nivel 2 2/3 + racha).
- `goals-page` muestra el % del **nivel actual**; `goal-detail` el % **global** de la meta.

## Plan con IA (LM)

En `goal-detail` → **✨ Plan con IA**. Funciona con cualquier endpoint OpenAI-compatible;
por defecto **Ollama en local** (`http://localhost:11434/v1`, sin clave, privado).
Sin modelo disponible usa el generador local para que la app nunca se bloquee.
Detalles en `docs/llm.md`. La clave, si usas una, vive solo en tu navegador.

## Cómo verlo

Sin build. Sirve la carpeta (los módulos usan rutas relativas `../assets`):

```powershell
# desde la raíz del repo
node --version  # solo para tests; las pantallas no lo necesitan
python -m http.server 8000
# abre http://localhost:8000/screens/goals-page.html
```

> Abrir el `.html` con doble clic también funciona, pero servido por HTTP es más fiel.

## Tests

```powershell
node tests/run.js   # 33 checks: XP, niveles, desbloqueo, bonus, LM (sin dependencias)
```

## Estado

Prototipos funcionales con store local compartido. Pendiente: backend/Firestore (ver spec §4),
sincronización entre dispositivos y gráfico de categorías (araña) del spec.
