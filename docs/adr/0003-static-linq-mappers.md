# ADR-0003: Mapeos Estáticos Compilados con Expresiones LINQ vs AutoMapper

- **Estado:** Aceptado
- **Fecha:** Octubre 2026
- **Autores:** Lead Backend Architect
- **Referencias:** [CONSTITUTION.md](../../CONSTITUTION.md) (Art. V), [docs/architecture/SDD.md](../architecture/SDD.md) (Sec. 3.3)

---

## 1. Contexto y Problema

En Vertical Slice Architecture es indispensable transformar modelos entre las diferentes capas:
1. Peticiones HTTP entrantes (`Request DTOs`) a Entidades de Dominio.
2. Entidades de Dominio a Respuestas HTTP (`Response DTOs`).
3. Consultas en base de datos PostgreSQL mediante EF Core 10 a DTOs proyectados (`Summary DTOs`).

El uso inadecuado de librerías de mapeo o la dispersión de proyecciones inline puede provocar:
- Consultas SQL ineficientes que traen tablas enteras a memoria para luego mapear solo 3 campos.
- Fallos en tiempo de ejecución no detectables durante la compilación.
- Dificultades para trazar referencias en el código ("Find all references").

---

## 2. Decisión Tomada

Se decide estandarizar el mapeo mediante **Mappers Estáticos dedicados por Slice con Expresiones LINQ** (`{Feature}Mappers.cs`):

1. **Expresiones Reusables para EF Core (`Expression<Func<TEntity, TDto>>`):**
   - Para consultas de lectura en base de datos, cada mapper expone una expresión estática compilada:
     ```csharp
     public static readonly Expression<Func<Student, StudentSummaryDto>> ProjectToSummary = s => ...;
     ```
   - Al pasar esta expresión a `.Select(TrainerStudentMappers.ProjectToSummary)`, EF Core 10 traduce la proyección directamente a sentencias SQL `SELECT col1, col2 FROM ...` en PostgreSQL, transfiriendo **únicamente las columnas necesarias**.
2. **Métodos de Extensión en Memoria (`this TEntity entity`):**
   - Para transformar entidades recién creadas o actualizadas tras mutaciones, se emplean métodos de extensión puros (ej. `student.ToSummaryDto()`, `exercise.ToDto()`).
3. **Fábricas de Dominio para Mutaciones:**
   - La conversión de requests entrantes hacia entidades nunca se hace con setters automáticos anémicos; se canaliza a través de métodos de fábrica (`Exercise.Create(...)`, `Student.Create(...)`, `WorkoutSession.CreateCompleted(...)`), protegiendo las invariantes del negocio.

---

## 3. Alternativas Descartadas

- **AutoMapper:**
  - *Motivo de descarte:* Utiliza reflection en tiempo de ejecución, genera overhead de memoria, no detecta errores de tipado o cambios de propiedades hasta que se ejecuta el código en producción o tests, y dificulta la depuración.
- **Riok.Mapperly:**
  - *Motivo de descarte:* Aunque utiliza Source Generators en tiempo de compilación, agrega una dependencia externa innecesaria para un proyecto donde las expresiones estáticas nativas de C# resuelven el 100% de los casos con máxima claridad y cero dependencias.
- **Proyecciones Inline Dispersas en Handlers:**
  - *Motivo de descarte:* Provocaban duplicación de código en consultas repetidas y mezclaban la orquestación del caso de uso con la definición de la estructura del DTO.

---

## 4. Consecuencias

### Positivas:
- **100% Type-Safe:** Cualquier cambio en una propiedad de la entidad o del DTO es detectado inmediatamente por el compilador de C# (`dotnet build`).
- **Eficiencia SQL Óptima:** Cumplimiento automático de la directriz de la skill `optimizing-ef-core-queries` al no materializar columnas superfluas.
- **Cero Dependencias Externas:** No se requieren paquetes NuGet de terceros ni configuración mágica en runtime.

### Negativas / Trade-offs:
- Requiere escribir explícitamente las asignaciones propiedad por propiedad en los archivos `*Mappers.cs`.
