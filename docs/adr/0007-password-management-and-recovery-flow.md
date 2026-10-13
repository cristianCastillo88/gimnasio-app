# ADR 0007: Gestión y Recuperación Integral de Contraseñas (OWASP Hardened, Assisted Reset & Email Flow)

## Estado
Aceptado

## Contexto
Tanto alumnos como profesores necesitan mecanismos seguros para gestionar su ciclo de vida de contraseñas:
1. **Cambio de clave en sesión activa:** Permitir a cualquier usuario autenticado actualizar su contraseña de forma voluntaria dentro de la aplicación.
2. **Restablecimiento para Alumnos:** Por diseño y límites de alcance de GymApp (sin costo de pasarelas de SMS pagas ni dependencias complejas), los alumnos no deben interactuar con reseteo autónomo por correo. En su lugar, el profesor es el administrador de su gimnasio y asiste a su alumno generando un enlace criptográfico único de 256 bits y despachándolo directamente vía WhatsApp.
3. **Recuperación autónoma para Entrenadores:** Como no hay un "superadmin" físico para el entrenador, este debe poder recuperar el acceso a su cuenta mediante correo electrónico con tokens de corta duración (1 hora) y mitigación estricta de enumeración de usuarios (OWASP A07).

## Decisiones Arquitectónicas

1. **Anti-User Enumeration (OWASP Top 10:2025 - A07):**
   - El endpoint `POST /api/auth/forgot-password` siempre devuelve código de estado HTTP `200 OK` con un mensaje neutro e idéntico tanto si el correo existe como si no existe en la base de datos:
     `"Si el correo electrónico está registrado en GymApp, se han enviado las instrucciones para restablecer la contraseña."`
   - Previene el escaneo automatizado para descubrir qué direcciones de correo están registradas en la plataforma.

2. **CSPRNG Tokens y Almacenamiento Seguro:**
   - Tanto los tokens de activación de alumnos como los tokens de reseteo del entrenador se generan con `RandomNumberGenerator.GetBytes(32)` (256 bits de entropía, 64 caracteres hex minúsculas).
   - Se indexan en PostgreSQL y expiran de forma estricta (1 hora para restablecimiento por correo, 7 días para activación asistida).
   - Tras el reseteo exitoso o cambio de contraseña, el token queda invalidado de forma inmediata (`null`).

3. **Flujo Asistido para Alumnos vía WhatsApp Deeplinks:**
   - El entrenador dispone de un botón directo `"🔑 Clave"` en la tarjeta del alumno (`StudentCard`).
   - Al confirmarlo, el backend regenera el token criptográfico y el frontend construye el mensaje formateado para WhatsApp (`https://wa.me/{phoneClean}?text=...`) y una opción para copiar el enlace al portapapeles.
   - El alumno accede al enlace, ingresa su nueva contraseña y queda activado/actualizado sin fricción.

4. **Abstracción Desacoplada de Correo (`IEmailSender`):**
   - Se crea la interfaz `IEmailSender` y la implementación `EmailSender` en `GymApp.Api/Common/Email`.
   - Soporta plantillas HTML responsivas con diseño de marca GymApp y configuración de servidor SMTP (o mock en desarrollo local con logs estructurados).

5. **Complejidad Unificada de Contraseñas:**
   - Se exige un mínimo de 8 caracteres con al menos: 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial (`!@#$%^&*...`).
   - Validado tanto en el cliente con checklist reactivo en tiempo real como en el backend mediante `FluentValidation`.

## Consecuencias

### Positivas
- Cobertura completa del ciclo de vida de credenciales para alumnos y entrenadores.
- Máxima seguridad contra suplantación, fuga de usuarios y ataques de fuerza bruta (protegido por `AuthPolicy` rate limiter).
- Experiencia de usuario ágil, sin coste de infraestructura de mensajería para los alumnos y con soporte mobile-first táctil (touch targets $\ge 44$px).

### Mitigaciones
- En desarrollo local sin SMTP configurado, el enlace de recuperación se imprime en los logs estructurados con nivel `Information`, permitiendo pruebas manuales y automatizadas instantáneas.
