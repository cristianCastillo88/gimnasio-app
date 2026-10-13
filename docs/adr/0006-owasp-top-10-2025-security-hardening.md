# ADR 0006: Blindaje de Seguridad Integral según OWASP Top 10:2025

## Estado
Aceptado

## Contexto
GymApp se prepara para su despliegue en producción con arquitectura desacoplada (Frontend en Vercel, Backend y PostgreSQL en Oracle Cloud Infrastructure). Con el advenimiento del estándar oficial **OWASP Top 10:2025**, es imperativo blindar la aplicación contra vectores críticos de ataque, tales como fuerza bruta a endpoints de autenticación, suplantación o fuga de tokens, ataques de inyección, mala configuración de seguridad (MIME-sniffing, Clickjacking, fuga de versiones), fallos en generación pseudoaleatoria y manipulación de peticiones.

## Decisiones Arquitectónicas

1. **A01 & A06 - Rate Limiting Particionado (.NET 10 Nativo):**
   - Se implementa `System.Threading.RateLimiting` en el pipeline de Minimal APIs.
   - **`AuthPolicy`:** Ventana fija de 5 peticiones por minuto por IP para `/api/auth/login`, `/api/auth/verify-activation-token` y `/api/auth/activate-account`.
   - **`GlobalLimiter`:** Ventana deslizante de 100 peticiones por minuto por IP para todos los endpoints restantes del sistema.
   - En caso de exceder la cuota, se responde con RFC 9457 `ProblemDetails` con código de estado HTTP `429 Too Many Requests`.

2. **A02 - Hardening de Configuración y Cabeceras de Seguridad:**
   - Middleware `UseSecurityHeaders()` que inyecta en cada respuesta:
     - `X-Content-Type-Options: nosniff`
     - `X-Frame-Options: DENY`
     - `Referrer-Policy: strict-origin-when-cross-origin`
     - `Permissions-Policy: accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()`
     - `Content-Security-Policy: default-src 'self'; frame-ancestors 'none';`
     - `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` (en conexiones seguras HTTPS).
   - Supresión de cabeceras de huella digital (`KestrelServerOptions.AddServerHeader = false`).
   - CORS parametrizado por configuración (`Cors:AllowedOrigins`), permitiendo orígenes seguros de producción (Vercel).

3. **A04 & A07 - Entropía Criptográfica (CSPRNG) y Complejidad de Contraseñas:**
   - Los tokens de activación ya no emplean `Guid.NewGuid()`; se generan mediante `RandomNumberGenerator.GetBytes(32)` (256 bits de entropía criptográfica real, 64 caracteres hexadecimales).
   - En producción, el arranque del servicio falla catastróficamente si `Jwt:SecretKey` no está configurada o posee menos de 32 caracteres.
   - Política estricta de contraseñas: mínimo 8 caracteres, al menos 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial, validada tanto en backend (FluentValidation) como en frontend.

4. **A09 & A10 - Auditoría de Seguridad y Errores RFC 9457 Sanitizados:**
   - Servicio `ISecurityAuditLogger` para registrar eventos críticos (`FailedLogin`, `InvalidActivationToken`, `AccountActivated`, `AccessDenied`) con `TraceId` y ofuscación estricta de datos personales y sensibles (PII).
   - Manejo centralizado de excepciones que previene la fuga de nombres de esquemas o trazas de base de datos.

## Consecuencias

### Positivas
- Resistencia demostrable frente a ataques de fuerza bruta, escaneo de credenciales y sondeo automatizado de tokens.
- Eliminación de advertencias de seguridad en navegadores modernos (MIME-sniffing, clickjacking, HSTS).
- Conformidad estricta con las categorías del estándar OWASP Top 10:2025.
- Logs estructurados listos para alertas de seguridad o monitoreo SIEM.

### Mitigaciones
- Clientes legítimos con ráfagas excesivas podrían recibir 429; la ventana de 100 peticiones/min para la API general y 5 req/min para autenticación es adecuada para uso humano y entrenamientos en tiempo real.
