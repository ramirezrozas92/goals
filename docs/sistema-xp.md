# Arquitectura del Sistema de Experiencia (XP) - VITA

> Implementación vigente en `screens/` (2026-09-11):
> - `taskXPForLevel(n) = round(100 × 1.25^(n-1))` → L1=100, L2=125, L3=156.
> - `globalLevelForXP(xp) = floor(sqrt(xp/500)) + 1` → 2000 XP = Nivel 3.
> - Convención de progreso: `goals-page` muestra % del NIVEL (meta 1: 2/3 = 66%);
>   `goal-detail` muestra % GLOBAL (5/13 = 38%). No son el mismo número a propósito.
> - Meta 1 canónica: Nivel 1 (3/3 = 550 XP con bonus) + Nivel 2 (2/3 = 250 XP) + racha 50 = **850 XP**.

---
Arquitectura del Sistema de Experiencia (XP) - VITA

Este documento detalla la lógica matemática y el diseño de experiencia para el sistema de gamificación de VITA, diseñado para adaptarse a rutas de aprendizaje dinámicas y personalizadas.

1. El Algoritmo de XP por Meta (XP Local)

Dado que las metas en VITA son dinámicas y no tienen un número fijo de niveles o tareas, utilizamos un sistema de Esfuerzo Relativo.

A. Cálculo del Valor de Tarea ($XP_t$)

Cada tarea tiene un peso basado en la complejidad del nivel al que pertenece.

Nivel Inicial (Cimientos): 100 XP por tarea.

Factor de Escalamiento ($F_e$): Cada nivel sucesivo aumenta el valor base en un 25% para simular el incremento de dificultad.

Fórmula: $XP_{base\_nivel} = 100 \times (1.25)^{(n-1)}$ (Donde $n$ es el número de nivel).

B. Bonificaciones de Hito (Mastery Bonus)

Al completar el 100% de las tareas de un nivel, el usuario recibe una bonificación:

Nivel completado: +250 XP extra.

Meta finalizada (Todos los niveles): +1000 XP (Gran Logro).

C. Lógica de Desbloqueo

Estado de Tarea: Pendiente | Completada.

Estado de Nivel:

Bloqueado: No interactuable. Requiere que el nivel $n-1$ sea completado.

Actual: El nivel activo donde las tareas suman XP.

Completado: El nivel ha sido superado (Check visual, opacidad reducida).

2. Sistema de XP General (Global)

La XP acumulada de todas las metas del usuario alimenta su Nivel de Perfil Global.

A. Curva de Nivel Global

Para que subir de nivel al inicio sea rápido (gratificación instantánea) y luego más retador, usamos una curva de crecimiento cuadrática:

XP necesaria para el siguiente nivel: $XP_{next} = 500 \times (Nivel_{actual})^2$

Nivel

XP Acumulada Necesaria

Esfuerzo

1

0

-

2

500

Fácil (1 meta pequeña)

3

2,000

Moderado

4

4,500

Constante

5

8,000

Avanzado

B. Categorías de Habilidad

La XP global se divide en categorías (ej: Trabajo, Salud, Finanzas). Esto permite que el usuario vea un gráfico de araña con su evolución:

Si el usuario completa tareas de la meta "Líder Inmobiliario", su XP global sube, pero específicamente aumenta su barra de "Habilidades Profesionales".

3. Comportamiento del Algoritmo ante Ediciones

¿Qué pasa si el usuario añade una tarea a un nivel que ya estaba al 100%?

Retroceso de Estado: El nivel vuelve a estado Actual (pierde el check de completado).

Ajuste de Progreso: La barra de progreso de la cabecera baja proporcionalmente (ej: de 100% a 92%).

XP Remanente: El usuario mantiene la XP ganada anteriormente, pero no recibe el Mastery Bonus de nuevo hasta completar la nueva tarea.

4. Resumen para Desarrolladores (Vibe Coding)

Para implementar esto en código simple:

Iterar niveles: Sumar todas las tareas existentes para obtener el TotalTasks.

Calcular progreso: (TareasCompletadas / TotalTasks) * 100.

Visualización: El % resultante se aplica al ancho de la barra de la cabecera y a la altura de la línea vertical del roadmap.

Auth/Storage: Al guardar el estado en Firestore, solo se guardan los IDs de tareas completadas; el frontend recalcula los valores de XP al vuelo para evitar discrepancias.