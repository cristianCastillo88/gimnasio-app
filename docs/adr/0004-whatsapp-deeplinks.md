# ADR-0004: Comunicación 1 a 1 Alumno-Entrenador mediante WhatsApp Deeplinks

- **Estado:** Aceptado
- **Fecha:** Octubre 2026
- **Autores:** Lead Product & Solution Architect
- **Referencias:** [CONSTITUTION.md](../../CONSTITUTION.md) (Art. II), [docs/architecture/SDD.md](../architecture/SDD.md) (Sec. 1.1)

---

## 1. Contexto y Problema

El modelo de servicio de un Personal Trainer independiente se basa en la atención personalizada y cercana con sus alumnos (consultas sobre técnica, cambios de horarios, aviso de pagos o ajustes de cargas).

Implementar un sistema de mensajería dentro de la aplicación plantea serios inconvenientes:
1. **Fricción para el Alumno y Entrenador:** Ningún usuario desea revisar otra bandeja de entrada cuando ya utiliza WhatsApp como canal principal diario.
2. **Complejidad de Infraestructura:** Obligaría a mantener servidores de WebSockets o SignalR, gestión de estado de presencia, almacenamiento de millones de mensajes en base de datos y push notifications complejas para background delivery en iOS y Android.
3. **Mantenimiento y Costos Operativos:** Un chat interno no aporta valor diferencial frente a la herramienta de mensajería que el entrenador y sus alumnos ya utilizan de forma universal.

---

## 2. Decisión Tomada

Se decide formalizar como **Límite Taxativo del Alcance (*Out of Scope*)** el desarrollo de cualquier chat o WebSocket interno, canalizando toda comunicación exclusivamente mediante **Deeplinks a la API oficial de WhatsApp (`https://wa.me/...`)**:

1. **Botón Flotante Contextual en la PWA:**
   - En la vista del alumno, un botón flotante accesible con una sola mano permite abrir WhatsApp directamente con el número verificado del entrenador.
   - Los mensajes se preformatean con contexto útil (ej. *"Hola Profe, te consulto por el ejercicio Sentadilla Búlgara del Día A"*).
2. **Acceso Rápido del Entrenador:**
   - En el panel del entrenador, cada tarjeta de alumno dispone de un acceso directo para contactarlo por WhatsApp con un solo toque (ej. avisar vencimiento de cuota o compartir feedback).
3. **Cero Almacenamiento de Chats en el Servidor:**
   - La base de datos únicamente almacena el número de teléfono con código de país en formato E.164 (`PhoneWhatsapp`), sin retener conversaciones ni comprometer la privacidad.

---

## 3. Alternativas Descartadas

- **Chat Interno con SignalR / WebSockets:**
  - *Motivo de descarte:* Viola el principio de alcance estricto de [CONSTITUTION.md](../../CONSTITUTION.md), aumenta exponencialmente la superficie de bugs y desconexiones en entornos de gimnasio con mala señal, y genera sobrecostos de hosting sin beneficio para el usuario.
- **Integración con SDKs de WhatsApp Business Cloud API (Chatbots / Bots de Pago):**
  - *Motivo de descarte:* Costos por conversación de Meta, complejidad de verificación de empresa de Facebook y pérdida de la relación humana y personalizada directa que el entrenador ofrece a sus alumnos.

---

## 4. Consecuencias

### Positivas:
- **Cero Complejidad de Infraestructura:** Sin servidores de sockets, sin tablas pesadas de mensajes ni tareas en background para retransmisión.
- **Familiaridad Total:** El 100% de los usuarios ya sabe usar WhatsApp y recibe notificaciones nativas en su sistema operativo.
- **Enfoque en el Core:** Todo el esfuerzo de desarrollo se concentra en la experiencia de entrenamiento en el gimnasio (timer, checklist, offline, cargas).

### Negativas / Trade-offs:
- La aplicación no tiene trazabilidad ni registro auditado de los mensajes conversacionales que se intercambian fuera de ella.
