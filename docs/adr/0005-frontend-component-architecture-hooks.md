# ADR-0005: Arquitectura de Componentes en 3 Capas, SOLID y Ergonomía One-Handed en Frontend (React 19)

- **Estado:** Aceptado
- **Fecha:** Octubre 2026
- **Dominio:** Frontend PWA (React 19 + TypeScript)
- **Skills Vinculantes:** `vercel-react-best-practices`, `pwa-development`, `architecture-patterns`

---

## 1. Contexto

La PWA de GymApp debe operar en entornos físicamente exigentes: alumnos con fatiga muscular en el gimnasio, manos sudorosas, operando el móvil con una sola mano y en zonas con microcortes de red.

Si los componentes de React 19 se construyen de forma no estructurada, surgen tres graves problemas de ingeniería:
1. **Fat Components (Monolitos UI):** Componentes que mezclan renderizado JSX con temporizadores `setInterval`, consultas directas a `Dexie.js`, peticiones HTTP y estados de modales, violando el Principio de Responsabilidad Única (SRP) y tornando la interfaz imposible de testear de forma aislada.
2. **Degradación de Rendimiento por Re-renders en Cascada:** Si el temporizador de descanso (`secondsRemaining`) se almacena en el estado raíz de la sesión, cada segundo que transcurre provoca el re-renderizado de toda la lista de ejercicios y series, provocando tirones y consumo excesivo de batería en dispositivos móviles.
3. **Fricción Ergonómica:** Interfaces con botones pequeños (<40px) o situados en la parte superior de la pantalla fuerzan el uso de dos manos y propician toques accidentales durante el entrenamiento.

---

## 2. Decisión Tomada

Se adopta una **Arquitectura de 3 Capas Desacopladas** en el Frontend, con aplicación estricta de principios **SOLID**, directrices de **Vercel React Best Practices** y diseño ergonómico **One-Handed Gym Mode**:

### 2.1 Las Tres Capas del Frontend:
1. **Capa 1: UI Presentacional (Dumb Components):**
   - Componentes funcionales puros que solo reciben props y emiten eventos (`onClick`, `onChange`).
   - Cero acceso a APIs externas, cero llamadas directas a `Dexie.js` y cero timers de ciclo de vida.
2. **Capa 2: Orquestación de Casos de Uso (Custom Hooks):**
   - Hooks dedicados (`useActiveWorkoutSession`, `useRestTimer`, `useOfflineSync`) que gestionan estado local, efectos (`useEffect` con cleanup obligatorio), Web Audio y delegación a infraestructura.
3. **Capa 3: Infraestructura y Persistencia (Módulos TypeScript Puros):**
   - `gymDatabase.ts` (`Dexie.js`) y `apiClient.ts` (Fetch fuertemente tipado desde `api-spec.yaml`), agnósticos a React.

### 2.2 Principios SOLID en React 19:
- **SRP:** Componentes renderizan; hooks orquestan lógica; módulos de datos manejan I/O.
- **OCP:** Composición de componentes mediante slots y `children` en lugar de condicionales masivos.
- **LSP:** Firmas de props y callbacks uniformes y sustituibles en tests de UI.
- **ISP:** Props atómicas; se prohíbe pasar estructuras complejas completas cuando solo se requieren campos primitivos.
- **DIP:** La UI depende de contratos de hooks y props, nunca de singletons directos de base de datos o llamadas HTTP en línea.

### 2.3 Aislamiento del Ciclo de Vida y Re-renders:
- El estado de cuenta regresiva del descanso se encapsula en `<RestTimerSheet />`, evitando re-renderizar la lista de ejercicios cada segundo (`rerender-split-combined-hooks`).
- Todo `setInterval`, listener o `AudioContext` incluye su función de desuscripción/cleanup.
- Los cálculos derivados (porcentaje completado, volumen total) se ejecutan de forma síncrona en render o memoizados (`rerender-derived-state-no-effect`).

### 2.4 Ergonomía One-Handed Gym Mode:
- Acciones primarias ancladas al tercio inferior de la pantalla (Thumb Zone).
- Hit targets táctiles mínimos de 48x48 píxeles.
- Steppers numéricos ágiles (`+2.5 kg`, `-2.5 kg`, `+1 rep`, `-1 rep`) con `inputMode="decimal"`.
- Retroalimentación háptica (`navigator.vibrate`) y sonoro (Web Audio).

---

## 3. Alternativas Descartadas

1. **Estado Global Centralizado Monolítico (Redux / Zustand con timer global):**
   - *Descarte:* Poner el estado del timer en un store global induce re-renderizados innecesarios o requiere selectores complejos en cada subcomponente. Los custom hooks con estado encapsulado y contextos focalizados son más livianos y nativos en React 19.
2. **Lógica de Persistencia directa en Componentes (`gymDb.put()` en `onClick`):**
   - *Descarte:* Acopla el componente visual a la tecnología de base de datos (Dexie), imposibilitando pruebas unitarias de UI y violando SRP y DIP.

---

## 4. Consecuencias

### Positivas:
- **Alta Testeabilidad:** Los componentes Dumb se pueden probar visualmente o en pruebas unitarias de React sin necesidad de mockear IndexedDB ni timers.
- **Rendimiento Fluido:** La lista de ejercicios permanece inmóvil y sin re-renders mientras el temporizador corre en primer plano.
- **Operación Cómoda en el Gimnasio:** El alumno puede registrar series y descansos con el pulgar de una sola mano sin equivocarse de botón.

### Compromisos y Mitigaciones:
- **Mayor número de archivos:** Se separan componentes visuales y hooks orquestadores.
  - *Mitigación:* Se agrupan por slice o funcionalidad en `client/src/components/workout/` y `client/src/hooks/`.
