namespace GymApp.Api.Common.Security;

public static class SecurityHeadersExtensions
{
    public static IApplicationBuilder UseSecurityHeaders(this IApplicationBuilder app)
    {
        return app.Use(async (context, next) =>
        {
            var headers = context.Response.Headers;

            // Previene que el navegador infiera tipos de contenido distintos al declarado (MIME-sniffing)
            headers.Append("X-Content-Type-Options", "nosniff");

            // Previene ataques de Clickjacking prohibiendo embeber la API en frames/iframes
            headers.Append("X-Frame-Options", "DENY");

            // Control estricto de envío de encabezado Referer
            headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");

            // Restringe el acceso a APIs del dispositivo y sensores del navegador
            headers.Append("Permissions-Policy", "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()");

            // Content Security Policy básica y estricta para respuestas de la API
            headers.Append("Content-Security-Policy", "default-src 'self'; frame-ancestors 'none';");

            // Si la conexión es HTTPS, aplicar Strict-Transport-Security (HSTS)
            if (context.Request.IsHttps)
            {
                headers.Append("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
            }

            // Eliminar cabecera Server si estuviera presente
            headers.Remove("Server");
            headers.Remove("X-Powered-By");

            await next();
        });
    }
}
