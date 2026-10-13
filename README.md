# 🏋️ GymApp — Progressive Web App para Personal Trainer y Alumnos

> **GymApp** es una solución móvil de alto rendimiento diseñada específicamente para digitalizar el seguimiento presencial y a distancia entre un **Personal Trainer (PT)** independiente y sus **alumnos**. Operada bajo los principios de **Spec-Driven Development (SDD)**, **Vertical Slice Architecture (VSA)** y **Resiliencia Offline-First**.

---

## 🏛️ Gobernanza y Documentación Viva

Este repositorio se rige por un marco de ingeniería estricto y versionado:

- 📜 **[CONSTITUTION.md](CONSTITUTION.md):** Norma vinculante del proyecto, límites de alcance (*out of scope*), VSA y principios SOLID.
- 📐 **[docs/architecture/SDD.md](docs/architecture/SDD.md):** Software Design Document con diagramas de flujo, arquitectura y diseño de persistencia.
- 📋 **[docs/specs/api-spec.yaml](docs/specs/api-spec.yaml):** Fuente única de verdad de la API en OpenAPI 3.1.
- 🗄️ **[docs/specs/data-dictionary.md](docs/specs/data-dictionary.md):** Diccionario de base de datos relacional y restricciones.
- 🏛️ **[docs/adr/](docs/adr/README.md):** Architectural Decision Records con el razonamiento histórico de cada decisión clave.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías Clave |
| :--- | :--- |
| **Backend API** | .NET 10 Web API, C# 13, Minimal APIs, Scalar OpenAPI UI |
| **Arquitectura** | Vertical Slice Architecture (VSA), Scoped Handlers, Result Pattern |
| **Persistencia** | PostgreSQL 16 Alpine, Entity Framework Core 10, Npgsql |
| **Seguridad & Auth** | JWT Bearer Tokens, BCrypt password hashing, RBAC (Trainer / Student) |
| **Frontend PWA** | React 19, TypeScript, Vite, `vite-plugin-pwa`, Workbox, Tailwind/Vanilla CSS |
| **Offline Storage** | IndexedDB via `Dexie.js`, claves de idempotencia UUIDv4 |
| **Validaciones** | FluentValidation 12, RFC 9457 `ProblemDetails` |

---

## 📋 Prerrequisitos de Software

Asegúrate de contar con las siguientes herramientas instaladas en tu sistema:
- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0) (versión 10.0.100 o superior).
- [Node.js](https://nodejs.org/) v20.x o v22.x LTS y `npm`.
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (con Docker Compose v2).

---

## 🚀 Guía de Inicio Rápido (Quickstart en 3 Pasos)

### 1. Iniciar la Base de Datos PostgreSQL
En la raíz del proyecto, levanta el contenedor de PostgreSQL 16:
```bash
docker compose up -d
```
> La base de datos estará disponible en `localhost:5432` con usuario `gymapp_user` y base de datos `gymapp_db`.

### 2. Ejecutar el Backend (.NET 10 API)
Compila y arranca la Minimal API:
```bash
dotnet run --project backend/src/GymApp.Api
```
- **API Base URL:** `http://localhost:5000`
- **Scalar OpenAPI UI:** [`http://localhost:5000/scalar/v1`](http://localhost:5000/scalar/v1)
- **Healthcheck:** [`http://localhost:5000/health`](http://localhost:5000/health)

*(En el primer arranque en desarrollo, el `DatabaseSeeder` creará automáticamente el esquema de tablas y sembrará los usuarios y rutinas iniciales).*

### 3. Ejecutar el Frontend PWA (React 19)
En una nueva terminal, inicia el servidor de desarrollo de Vite:
```bash
cd client
npm install
npm run dev
```
- **Cliente PWA:** [`http://localhost:5173`](http://localhost:5173)

---

## 🔑 Credenciales de Prueba Sembradas (Development Seeder)

| Rol | Correo Electrónico | Contraseña | Capacidades |
| :--- | :--- | :--- | :--- |
| **Trainer (Entrenador)** | `trainer@gymapp.com` | `Trainer123!` | Biblioteca de ejercicios, creación y asignación de rutinas, gestión de cuotas. |
| **Student (Alumno)** | `alumno@gymapp.com` | `Alumno123!` | Ver rutina activa, registrar series en modo offline, sincronizar sesiones. |

---

## 🧪 Ejecución de Pruebas y Validación de Calidad

### Pruebas Automatizadas de Integración (Backend):
Ejecuta la suite completa de pruebas construida con `WebApplicationFactory` y bases de datos en memoria:
```bash
dotnet test backend/GymApp.slnx
```

### Compilación y Verificación de Tipos del Cliente:
```bash
cd client
npm run build
```

### Regenerar Tipos TypeScript desde OpenAPI:
Si actualizas el contrato en `docs/specs/api-spec.yaml`, sincroniza los tipos de cliente ejecutando:
```bash
cd client
npm run generate:api
```

---

## 🚫 Alcance Estricto (*Out of Scope*)
Conforme a la [Constitución del Proyecto](CONSTITUTION.md), quedan taxativamente prohibidas:
- Pasarelas de pago automáticas (las cuotas se gestionan manualmente por el PT).
- Chat interno o WebSockets (la comunicación se realiza exclusivamente vía deeplinks a WhatsApp `https://wa.me/...`).
- Redes sociales, muros públicos o interacción comunitaria entre alumnos.
