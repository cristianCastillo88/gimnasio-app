# Architectural Decision Records (ADRs) - GymApp

Este directorio almacena los registros inmutables de las decisiones arquitectónicas de mayor impacto en GymApp, en cumplimiento estricto con el **ARTÍCULO VIII** de [CONSTITUTION.md](../../CONSTITUTION.md) y la **Sección 9** de [SDD.md](../architecture/SDD.md).

---

## Estructura Canónica de un ADR

Cada decisión sigue el formato estándar:
- **Título:** Número secuencial y nombre descriptivo (`XXXX-nombre-decision.md`).
- **Estado:** `Propuesto` | `Aceptado` | `Reemplazado` (con enlace al nuevo ADR).
- **Fecha:** Fecha de adopción formal.
- **Contexto:** El problema, restricciones y fuerzas técnicas que motivaron la decisión.
- **Decisión Tomada:** La solución seleccionada con justificación técnica detallada.
- **Alternativas Descartadas:** Qué otras opciones se evaluaron y por qué fueron rechazadas.
- **Consecuencias:** Impacto positivo, compromisos (*trade-offs*) y mitigaciones.

---

## Índice de Decisiones Arquitectónicas

| ADR | Título | Estado | Fecha | Dominio Afectado |
| :--- | :--- | :---: | :--- | :--- |
| [ADR-0001](0001-vertical-slice-native-handlers.md) | Vertical Slice Architecture con Handlers Nativos y Result Pattern | **Aceptado** | Octubre 2026 | Backend (.NET 10) |
| [ADR-0002](0002-offline-first-idempotency-dexie.md) | Resiliencia Offline-First en IndexedDB con Sync Idempotente (Client-Wins) | **Aceptado** | Octubre 2026 | PWA / Persistencia |
| [ADR-0003](0003-static-linq-mappers.md) | Mapeos Estáticos Compilados con Expresiones LINQ vs AutoMapper | **Aceptado** | Octubre 2026 | Backend / EF Core 10 |
| [ADR-0004](0004-whatsapp-deeplinks.md) | Comunicación 1 a 1 Alumno-Entrenador mediante WhatsApp Deeplinks | **Aceptado** | Octubre 2026 | Dominio / Integraciones |
| [ADR-0005](0005-frontend-component-architecture-hooks.md) | Arquitectura en 3 Capas, SOLID y Ergonomía One-Handed en Frontend | **Aceptado** | Octubre 2026 | Frontend (React 19 PWA) |
| [ADR-0006](0006-owasp-top-10-2025-security-hardening.md) | Blindaje de Seguridad Integral según OWASP Top 10:2025 | **Aceptado** | Octubre 2026 | Seguridad / Pipeline HTTP |
| [ADR-0007](0007-password-management-and-recovery-flow.md) | Gestión y Recuperación Integral de Contraseñas (OWASP Hardened, Assisted Reset & Email Flow) | **Aceptado** | Octubre 2026 | Seguridad / Auth / WhatsApp |
