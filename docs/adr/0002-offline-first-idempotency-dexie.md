# ADR-0002: Resiliencia Offline-First en IndexedDB con Sync Idempotente (Client-Wins)

- **Estado:** Aceptado
- **Fecha:** Octubre 2026
- **Autores:** Lead Mobile & Backend Architect
- **Referencias:** [CONSTITUTION.md](../../CONSTITUTION.md) (Art. III), [docs/architecture/SDD.md](../architecture/SDD.md) (Sec. 5)

---

## 1. Contexto y Problema

GymApp está orientada al uso real dentro de gimnasios. Estos entornos presentan con frecuencia:
- Sótanos o galpones con estructura de hormigón armado donde la señal celular (4G/5G) y WiFi sufren microcortes continuos o pérdida total de conectividad.
- Alumnos que necesitan registrar series, cambiar pesos y utilizar el temporizador de descanso de forma fluida e inmediata sin sufrir congelamiento de la interfaz (*spinner* de carga bloqueante).

Si la aplicación dependiera de conectividad activa para cada interacción o para finalizar el entrenamiento, la experiencia de usuario sería frustrante y propensa a pérdida de datos.

---

## 2. Decisión Tomada

Se decide implementar una arquitectura **Offline-First estricta** combinada con un protocolo de **Sincronización por Lotes Idempotente**:

1. **Almacenamiento Local Reactivo en IndexedDB (`Dexie.js`):**
   - La rutina activa y el historial previo de ejercicios se pre-cargan en IndexedDB al disponer de red.
   - Durante el entrenamiento, toda acción (marcar serie completada, registrar peso/reps reales, temporizador) se persiste de forma local e instantánea en `IndexedDB`.
2. **Generación de Claves de Idempotencia en el Cliente (UUIDv4):**
   - Al iniciar o finalizar un entrenamiento, el cliente genera un `IdempotencyKey` único (UUIDv4).
   - La sesión finalizada se encola en la tabla local `PendingSyncSessions`.
3. **Resolución Idempotente Client-Wins (`POST /api/workouts/sync`):**
   - Al recuperar conectividad (evento `online` o Service Worker background sync), el cliente despacha las sesiones pendientes al endpoint de sync.
   - El backend en .NET 10 consulta las claves de idempotencia recibidas contra PostgreSQL en un solo viaje a la base de datos:
     - Si la clave no existe: Se inserta la sesión completa y sus series (`CREATED`).
     - Si la clave ya existe (reintento por timeout o microcorte): El backend responde HTTP 200 con estado `ALREADY_EXISTS`, preservando la integridad sin duplicar registros ni emitir error 500.

---

## 3. Alternativas Descartadas

- **WebSockets / SignalR en Tiempo Real:**
  - *Motivo de descarte:* Ineficiente y frágil en sótanos con caídas constantes de paquetes. Mantiene conexiones socket abiertas consumiendo batería móvil innecesariamente.
- **Sincronización Serie por Serie Online (REST inmediato):**
  - *Motivo de descarte:* Bloquea la UI con spinners en cada serie si no hay señal, impidiendo el uso natural en el gimnasio.
- **CouchDB / PouchDB:**
  - *Motivo de descarte:* Requiere una base de datos documental compleja adicional en el backend. PostgreSQL 16 con EF Core 10 maneja perfectamente el modelo relacional e índices únicos de idempotencia.

---

## 4. Consecuencias

### Positivas:
- **Resiliencia 100% Offline:** El alumno puede completar todo su entrenamiento sin un solo byte de señal celular.
- **Cero Duplicación de Datos:** Los microcortes de red y reintentos automáticos son totalmente transparentes gracias a la idempotencia.
- **Velocidad Extrema en UI:** Tiempo de respuesta local inmediato (< 5 ms) en cada interacción.

### Negativas / Trade-offs:
- Requiere gestionar colas de sincronización y estado de red en el cliente React 19.
- El cliente debe almacenar temporalmente el historial en IndexedDB, ocupando almacenamiento local (alrededor de 1 a 2 MB).
