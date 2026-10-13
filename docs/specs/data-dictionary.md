# Diccionario de Datos y Reglas de Negocio - GymApp

Este documento forma parte del conjunto de especificaciones **Spec-Driven Development (SDD)** de GymApp. Define con rigor los tipos de datos, restricciones, valores permitidos y reglas de negocio para .NET 10 (EF Core) y la PWA (React 19).

---

## 1. Enumeraciones del Dominio

### 1.1 `UserRole`
- `TRAINER` (0): Personal Trainer con privilegios administrativos sobre sus alumnos y rutinas.
- `STUDENT` (1): Alumno con acceso exclusivamente a sus rutinas y registro de entrenamientos.

### 1.2 `SubscriptionStatus`
- `ACTIVE` (0): Alumno al día, acceso completo.
- `PENDING` (1): Pago pendiente de acreditación o nuevo mes iniciado.
- `EXPIRED` (2): Cuota vencida o sin clases restantes.

---

## 2. Entidades y Esquemas de Atributos

### 2.1 `Users`
| Atributo | Tipo BD (PostgreSQL) | Tipo C# / TS | Restricciones / Reglas |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `Guid` / `string` | PK, generado automáticamente por el servidor. |
| `email` | `VARCHAR(255)` | `string` | Unique, validación formato RFC 5322. |
| `password_hash` | `VARCHAR(255)` | `string` | Argon2id o BCrypt con salt. |
| `role` | `VARCHAR(20)` | `UserRole` | Valores: `TRAINER`, `STUDENT`. Default: `STUDENT`. |
| `full_name` | `VARCHAR(150)` | `string` | Min: 3, Max: 150 caracteres. |
| `phone_whatsapp` | `VARCHAR(30)` | `string` | Formato internacional E.164 (ej. `+5491112345678`). |
| `created_at` | `TIMESTAMPTZ` | `DateTimeOffset` | UTC timestamp de creación. |

### 2.2 `Students`
| Atributo | Tipo BD (PostgreSQL) | Tipo C# / TS | Restricciones / Reglas |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `Guid` / `string` | PK. |
| `user_id` | `UUID` | `Guid` / `string` | FK a `Users.id` (1 a 1). On Delete Cascade. |
| `trainer_id` | `UUID` | `Guid` / `string` | FK a `Users.id` (Trainer propietario). |
| `medical_notes` | `TEXT` | `string?` | Historial médico, lesiones previas, alergias. Opcional. |
| `fitness_goals` | `TEXT` | `string?` | Objetivos deportivos/estéticos. |
| `subscription_status` | `VARCHAR(20)`| `SubscriptionStatus` | `ACTIVE`, `PENDING`, `EXPIRED`. |
| `sessions_remaining` | `INT` | `int` | Default `0`. >= 0. Disminuye opcionalmente al completar sesión. |
| `next_billing_date` | `DATE` | `DateOnly?` | Fecha sugerida para el recordatorio manual de pago. |

### 2.3 `Exercises`
| Atributo | Tipo BD (PostgreSQL) | Tipo C# / TS | Restricciones / Reglas |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `Guid` / `string` | PK. |
| `trainer_id` | `UUID` | `Guid` / `string` | FK a `Users.id`. Solo el trainer creador puede editarlo. |
| `name` | `VARCHAR(120)` | `string` | Nombre del ejercicio (ej. "Sentadilla con Barra"). |
| `muscle_group` | `VARCHAR(60)` | `string` | Ej: "Cuádriceps", "Pectoral", "Espalda", "Core". |
| `movement_pattern` | `VARCHAR(60)` | `string?` | Ej: "Empuje horizontal", "Bisagra de cadera". |
| `video_url` | `TEXT` | `string?` | URL válida (YouTube Shorts, Vimeo o Cloudflare Stream). |
| `execution_tips` | `TEXT` | `string?` | Consejos clave: "Mantener escápulas retraídas", etc. |

### 2.4 `RoutineTemplates` & `RoutineDays`
- **`RoutineTemplates`**: Agrupa el programa (ej. "Hipertrofia Fase 1").
- **`RoutineDays`**:
  - `name`: Etiqueta del día (ej. "Día A - Pierna", "Día B - Torso").
  - `order_index`: Orden visual en la UI.
- **`RoutineExercises`**:
  - `target_sets`: Cantidad de series objetivo (ej. `4`).
  - `target_reps`: Rango o anotación (ej. `"8-10"`, `"12-15"`, `"Al fallo"`).
  - `suggested_weight_kg`: Peso orientativo asignado por el trainer (ej. `60.0`).
  - `suggested_rest_seconds`: Tiempo de descanso por defecto para el timer (ej. `90`).

### 2.5 `WorkoutSessions` (Sesión Ejecutada)
| Atributo | Tipo BD | Tipo C# / TS | Restricciones / Reglas |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `Guid` / `string` | PK en base de datos. |
| `idempotency_key`| `UUID` | `Guid` / `string` | **Unique**. Generado por el cliente en IndexedDB al crear la sesión. Evita duplicaciones al sincronizar. |
| `student_id` | `UUID` | `Guid` / `string` | FK a `Students.id`. |
| `routine_day_id` | `UUID` | `Guid` / `string` | FK a `RoutineDays.id`. |
| `started_at` | `TIMESTAMPTZ` | `DateTimeOffset` | Momento exacto de inicio del entrenamiento. |
| `completed_at` | `TIMESTAMPTZ` | `DateTimeOffset` | Momento de finalización. `completed_at >= started_at`. |
| `rpe_score` | `SMALLINT` | `int` | Escala RPE del `1` (mínimo esfuerzo) al `10` (máximo esfuerzo). |
| `student_notes` | `TEXT` | `string?` | Observaciones: molestias, nivel de fatiga, etc. |

### 2.6 `WorkoutLogs` (Detalle de cada serie)
| Atributo | Tipo BD | Tipo C# / TS | Restricciones / Reglas |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `Guid` / `string` | PK. |
| `session_id` | `UUID` | `Guid` / `string` | FK a `WorkoutSessions.id`. On Delete Cascade. |
| `exercise_id` | `UUID` | `Guid` / `string` | FK a `Exercises.id`. |
| `set_number` | `INT` | `int` | Índice de serie (1, 2, 3...). |
| `actual_reps` | `INT` | `int` | Repeticiones efectivamente completadas. >= 0. |
| `actual_weight_kg`| `NUMERIC(6,2)`| `decimal` / `number` | Peso levantado en kg. Permite decimales (ej. 22.5 kg). |
| `is_completed` | `BOOLEAN` | `bool` | `true` si la serie fue tachada/completada. |

---

## 3. Reglas de Validación y Sincronización

1. **Idempotencia:** En el endpoint `POST /api/workouts/sync`, si llega un `idempotency_key` ya persistido, el backend responde con HTTP 200 y status `ALREADY_EXISTS` sin duplicar filas ni lanzar error 500.
2. **Historial Inline del Alumno:** La consulta de historial busca la sesión más reciente completada para ese alumno y ese ejercicio en particular:
   ```sql
   SELECT actual_reps, actual_weight_kg, set_number
   FROM workout_logs wl
   JOIN workout_sessions ws ON wl.session_id = ws.id
   WHERE ws.student_id = @studentId AND wl.exercise_id = @exerciseId
   ORDER BY ws.completed_at DESC, wl.set_number ASC;
   ```
3. **Deeplink de WhatsApp:** El número del Trainer o del Alumno se genera con la URL estándar:
   `https://wa.me/{phone_without_plus}?text={urlencoded_message}`
