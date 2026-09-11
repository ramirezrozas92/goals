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
