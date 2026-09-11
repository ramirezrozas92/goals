# GOALS APP — VITA

Prototipos HTML del sistema de metas, hábitos y gamificación XP.

## Estructura

```
screens/
  goals-page.html          # Lista principal de metas (píldoras + tarjeta principal + XP global)
  goal-detail.html         # Detalle de meta con roadmap de niveles
  daily-focus-habitos.html # Modo Focus diario (tarjetas swipe + timer + confetti)
  tarjetas-metas.html      # Componente tarjeta de meta
docs/
  sistema-xp.md            # Spec del algoritmo XP local/global
```

## Modelo XP canónico

- Tarea nivel n: `round(100 × 1.25^(n-1))` → L1=100, L2=125, L3=156. Bonus +250 por nivel, +1000 al cerrar meta.
- Nivel global cuadrático: `floor(sqrt(XP/500)) + 1` → 2000 XP = Nivel 3.
- Meta "Líder Inmobiliario": **850 XP · Nivel 2** en todas las pantallas.
- `goals-page` = % del nivel (66%); `goal-detail` = % global (38%, 5/13 tareas).

## Cómo verlo

Sin build. Abre cualquier archivo de `screens/` en el navegador, o sirve la carpeta:

```powershell
# opción rápida con Python
python -m http.server 8000
# luego abre http://localhost:8000/screens/goals-page.html
```

## Estado

Prototipos funcionales con datos mock en JS. Sin persistencia (localStorage/API) todavía.
Ver `docs/sistema-xp.md` para la lógica de XP esperada.
