# ADR-0001: Vertical Slice Architecture con Handlers Nativos y Result Pattern

- **Estado:** Aceptado
- **Fecha:** Octubre 2026
- **Autores:** Lead Backend Architect
- **Referencias:** [CONSTITUTION.md](../../CONSTITUTION.md) (Art. V), [docs/architecture/SDD.md](../architecture/SDD.md) (Sec. 3.1)

---

## 1. Contexto y Problema

En aplicaciones backend construidas con arquitecturas en capas tradicionales (*N-Tier* o *Clean Architecture dogmática*), el código suele organizarse horizontalmente (`Controllers`, `Services`, `Repositories`). Esto genera varios problemas a mediano y largo plazo:
1. **God Services:** Clases monolíticas como `StudentService` acumulan cientos de líneas y métodos para múltiples casos de uso distintos, violando el Single Responsibility Principle (SRP).
2. **Fat Endpoints:** Lambdas de Minimal APIs que asumen múltiples responsabilidades mezclando extracción de claims HTTP, consultas LINQ directas a `DbContext`, mapeos manuales y lógica de negocio.
3. **Acoplamiento de Transporte:** Lógica de negocio que depende directamente de tipos de `Microsoft.AspNetCore.Http`, impidiendo su reutilización en jobs, tests o workers.

---

## 2. Decisión Tomada

Se decide adoptar **Vertical Slice Architecture (VSA)** canónica para todo el backend .NET 10:

1. **Organización por Feature:** Cada funcionalidad se agrupa en su propia carpeta bajo `Features/{Dominio}/{Feature}/` conteniendo sus DTOs, Endpoint, Handler, Validador y Mapper.
2. **Handlers Nativos Scoped por Interfaz:** Cada slice define una interfaz atómica `I{Feature}Handler` con un único método:
   ```csharp
   Task<Result<TResponse>> HandleAsync(TRequest request, Guid userId, CancellationToken ct);
   ```
   registrada en el contenedor de dependencias nativo de .NET 10 (`AddScoped`), sin recurrir a paquetes externos de mediación.
3. **Desacoplamiento con Result Pattern (`Result<T>`):** El Handler retorna un monad agnóstico a HTTP (`Result<T>`). El Endpoint es responsable exclusivo del transporte HTTP puro, traduciendo `Result<T>` a `TypedResults.Ok`, `Created` o RFC 9457 `ProblemHttpResult`.
4. **Prohibición de `DbContext` en Endpoints:** Queda taxativamente prohibido inyectar `GymAppDbContext` o ejecutar lógica de base de datos en las lambdas de los endpoints.

---

## 3. Alternativas Descartadas

- **MediatR / Wolverine:**
  - *Motivo de descarte:* Introducen dependencias externas de terceros, sobrecarga de despacho dinámico por reflection y hacen la navegación de código indirecta ("Find Implementations" requiere buscar consumers). Las interfaces atómicas de C# nativas ofrecen mayor rendimiento, cero dependencias y navegación directa en el IDE.
- **Arquitectura en Capas Tradicional (Controllers -> Services -> Repositories):**
  - *Motivo de descarte:* Alta fricción para añadir funcionalidades (modificar 4 proyectos o capas distintas), baja cohesión y creación innecesaria de abstracciones genéricas como `IRepository<T>` sobre EF Core (que ya es un repositorio y unit-of-work).

---

## 4. Consecuencias

### Positivas:
- **Alta Cohesión:** Todo lo relacionado a una funcionalidad está en un solo lugar.
- **Testeabilidad Pura:** Los Handlers pueden probarse unitariamente aislando la persistencia, y los Endpoints solo prueban el pipeline HTTP.
- **Rendimiento Máximo:** Cero overhead de reflection o librerías intermedias en .NET 10.
- **Alineación SOLID:** Cumplimiento natural de SRP (1 Handler = 1 caso de uso) e ISP (interfaces de un solo método).

### Negativas / Trade-offs:
- Mayor cantidad de archivos pequeños en el árbol de carpetas (un handler por slice).
- Requiere disciplina para registrar cada handler en el contenedor de DI (`Program.cs`).
