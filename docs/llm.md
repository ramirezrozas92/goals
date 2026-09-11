# VITA · Integración con LM (modelo de lenguaje)

VITA es una app personal de metas: **una persona, sus metas, sus niveles**. El LM actúa como
**coach que propone el plan por niveles**; la persona decide, edita y ejecuta. Nada se envía
a ningún servidor de VITA: el navegador habla directo con el proveedor que configures.

## Dónde vive

- `assets/js/llm.js` — cliente + validación + fallback. UMD (navegador y Node).
- Pantalla `screens/goal-detail.html` → botón **✨ Plan con IA** (modal "Estudio IA").
- Tests: `node tests/run.js` (extracción JSON, validación, fallback).

## Proveedores soportados

Cualquier endpoint compatible con **OpenAI Chat Completions** (`POST /chat/completions`):

| Opción | Endpoint | Modelo ej. | Clave |
|---|---|---|---|
| **Ollama local (recomendado)** | `http://localhost:11434/v1` | `llama3.1` | no necesita |
| OpenAI | `https://api.openai.com/v1` | `gpt-4o-mini` | sí |
| OpenRouter / otros | su URL `/v1` | el que elijas | sí |

Ollama corre en tu máquina: privado, gratis y sin red. Arranca con:

```powershell
ollama serve
ollama pull llama3.1
```

## Cómo funciona

1. El modal construye un prompt (`buildPlanPrompt`) que pide **SOLO JSON**:
   `{"levels":[{"title":"...","desc":"...","tasks":["..."]}]}`.
2. `generatePlan` llama al endpoint con timeout de 45 s.
3. `extractJSON` tolera ```json y texto alrededor; `validatePlan` normaliza
   (máx. 8 niveles × 8 tareas) y rechaza planes vacíos o sin título.
4. **Si algo falla** (sin modelo, sin red, clave inválida, JSON roto) se usa el
   **generador local** (`planLocal`): plan heurístico coherente. La app nunca se bloquea.
5. Ves la **vista previa**, y **Aplicar plan** reemplaza los niveles conservando como
   completadas las tareas que ya hiciste con el mismo nombre.

## Privacidad

- La API key se guarda **solo en `localStorage`** (`vita-llm-settings`). Nunca se commitea.
- Revisa que `.gitignore` excluya cualquier archivo con claves si pruebas en Node.

## Esquema del plan

```json
{
  "levels": [
    { "title": "Nivel 1: Cimientos", "desc": "Resultado del nivel", "tasks": ["Tarea 1", "Tarea 2"] }
  ]
}
```

El XP se calcula siempre con `assets/js/xp.js` (100·1.25^(n-1) por tarea, +250 por nivel,
+1000 al cerrar la meta), venga el plan del LM o del generador local.
