# Plan 002 - Mejora del backend de inventario

## Contexto

Este plan implementa `specs/002-mejora-backend-inventario/spec.md` bajo `docs/constitution.md` y `AGENTS.md`. Reorganiza el inventario sin cambiar sus reglas de negocio, normaliza los contratos HTTP, añade seed de desarrollo y separa liveness de readiness de PostgreSQL.

Restricciones:

- Mantener el monorepo npm con React/Vite, NestJS/Prisma/Swagger y PostgreSQL local.
- No crear ni aplicar migraciones Prisma ni cambiar `schema.prisma`.
- No versionar `.env`, credenciales ni datos reales.
- No usar Docker.
- Antes de modificar frontend, cargar la skill `impeccable`.
- Usar los scripts raíz existentes: `test`, `lint`, `format:check` y `build`.

## Módulos y responsabilidades

| Módulo | Responsabilidad | RF cubiertos |
| --- | --- | --- |
| `packages/shared` | Publicar enums, envelopes, paginación, DTOs de respuesta comunes y códigos de error sin importar NestJS. | RF-6, RF-9 a RF-19, RF-21 a RF-28, RF-75 |
| `apps/api/src/inventory/domain/<feature>` | Separar entidades, propiedades y errores de artículos, categorías y stock. | RF-1, RF-3, RF-5, RF-56, RF-64 a RF-74 |
| `apps/api/src/inventory/application/articles` | Implementar ocho casos de uso independientes: crear, obtener, listar, stock bajo, editar, desactivar, reactivar y eliminar. | RF-2, RF-48, RF-53 a RF-55, RF-65, RF-69, RF-73, RF-74 |
| `apps/api/src/inventory/application/categories` | Implementar seis casos de uso independientes de categorías. | RF-2, RF-49, RF-66, RF-72 a RF-74 |
| `apps/api/src/inventory/application/movements` | Implementar seis casos de uso independientes de consulta y registro de movimientos. | RF-2, RF-16, RF-50, RF-52, RF-53, RF-55, RF-67, RF-70 |
| `apps/api/src/inventory/application/contracts` | Mantener los comandos, consultas y resultados de cada caso de uso fuera de su implementación. | RF-3, RF-48 a RF-51 |
| `apps/api/src/inventory/infrastructure/prisma` | Adaptadores Prisma, transacciones, repositorios, verificación de esquema y cierre de recursos. | RF-1, RF-36, RF-37, RF-42 a RF-45 |
| `apps/api/src/inventory/presentation/<feature>` | Agrupar controladores, DTOs de entrada/salida y pruebas HTTP por artículos, categorías y movimientos. | RF-4, RF-7, RF-8, RF-20, RF-27, RF-46, RF-47, RF-57, RF-58 |
| `apps/api/src/api-exception.filter.ts` | Convertir errores conocidos a la matriz HTTP y ocultar fallos inesperados. | RF-21 a RF-26, RF-64 a RF-74, RF-77 |
| `apps/api/src/health` | Exponer liveness en `GET /health` y readiness en `GET /health/ready`. | RF-41 a RF-45, RF-51 |
| `apps/api/prisma/seed.ts` y scripts API | Cargar catálogo ficticio reservado, idempotente, transaccional y restringido a development. | RF-30 a RF-40, RF-60 a RF-63, RF-76, RF-81, RF-82, RF-87 a RF-91 |
| `apps/web/src/inventory` | Adaptar cliente, hooks y pruebas a los nuevos envelopes; reconciliar mutaciones de resultado incierto. | RF-29, RF-78 a RF-80, RF-83 a RF-86 |

## Modelo de datos y contratos

### Datos persistentes

No se modificarán los modelos `Category`, `Article` y `Movement` ni sus restricciones Prisma. El readiness verificará exactamente sus tablas y las columnas existentes en el esquema Prisma actual.

El seed usará UUID válidos, fijos y distintos para cada registro ficticio. Los UUID no se usan como señal suficiente de propiedad: se contrastará el contenido esperado antes de considerar el registro como existente del catálogo.

### API pública

Respuestas exitosas individuales:

```json
{ "data": {} }
```

Respuestas paginadas:

```json
{
  "data": [],
  "meta": { "page": 1, "pageSize": 25, "totalItems": 0, "totalPages": 0 }
}
```

El mapeador de presentación construirá DTOs explícitos, nunca serializará entidades de dominio. Artículos, categorías y movimientos publicarán únicamente los campos, tipos, enums y nulabilidad definidos en RF-13 a RF-15. `Movement.sequence` se serializará como texto decimal y `occurredAt` como ISO 8601.

Los comandos de movimiento devolverán:

```json
{ "data": { "article": {}, "movement": {} } }
```

La eliminación devolverá HTTP 200 con `{ "data": { "id": "uuid" } }`. Creaciones HTTP devuelven 201; consultas y demás mutaciones devuelven 200.

Errores:

```json
{ "code": "VALIDATION_ERROR", "message": "...", "statusCode": 400 }
```

`details` se omite cuando no aplica. Para validación usará `{ "fields": [{ "field": "...", "message": "..." }] }`; para confirmación de stock negativo, `{ "stockAfter": -1 }`.

La matriz será exacta: validación, inactividad, confirmación, reconfirmación, rango y sin diferencia son 400; inexistentes son 404; nombre, dependencia y concurrencia son 409; infraestructura inesperada es 500 `INTERNAL_ERROR`; readiness no disponible es 503 `SERVICE_UNAVAILABLE`.

### Seed y disponibilidad

El seed ejecutará solo con `NODE_ENV=development`, mediante un script explícito. Creará categorías, artículos y movimientos ficticios representativos dentro de una transacción. Detectará coincidencia exacta, conflicto por nombre, UUID reservado incompatible, dependencias omitidas y estados parciales preservados; cada omisión tendrá el código estable definido en RF-87 a RF-91 y un mensaje. Fallará sin cambios parciales ante errores no clasificables.

`GET /health` es liveness y no consulta PostgreSQL. `GET /health/ready` realiza consultas de solo lectura sobre el catálogo de tablas y columnas del esquema actual, con plazo inclusivo de dos segundos.

## Decisiones técnicas

### Casos de uso por operación

- Elegida: un módulo ejecutable y uno de contratos por cada una de las 22 operaciones enumeradas en RF-48 a RF-51.
- Descartada: conservar servicios por agregado, porque deja consultas, comandos, reintentos y errores concentrados y no cumple RF-2 ni RF-3.
- RF cubiertos: RF-1 a RF-4, RF-48 a RF-51, RF-56.

### DTOs y mapeo de transporte

- Elegida: DTOs de entrada y salida por funcionalidad, más mapeadores de presentación para envelopes y recursos públicos.
- Descartada: devolver entidades o `Versioned<T>` directamente, porque filtra `normalizedName`, detalles internos y campos con serialización inestable.
- RF cubiertos: RF-6 a RF-20, RF-24 a RF-29, RF-57 a RF-59, RF-75.

### Errores por tipo, no por nombre de clase

- Elegida: errores de dominio e infraestructura identificables con una clasificación explícita antes del filtro HTTP.
- Descartada: decidir el estado mediante comparaciones de `error.name`, porque omite errores y clasifica fallos internos como validación.
- RF cubiertos: RF-21 a RF-26, RF-64 a RF-74, RF-77.

### Readiness aislado

- Elegida: liveness sin dependencias y readiness con consulta de metadatos PostgreSQL, timeout de dos segundos y cierre controlado de recursos.
- Descartada: usar `/health` para ambos estados, porque impide distinguir un proceso vivo de una base inaccesible.
- RF cubiertos: RF-41 a RF-45.

### Seed no destructivo

- Elegida: catálogo con UUID reservados, validación de contenido y transacción por ejecución; los registros existentes nunca se modifican.
- Descartada: limpiar tablas o actualizar registros del catálogo, porque viola la protección de datos existentes y requeriría decisiones de migración.
- RF cubiertos: RF-30 a RF-40, RF-60 a RF-63, RF-76, RF-81, RF-82, RF-87 a RF-91.

### Reconciliación de mutaciones inciertas

- Elegida: tras 500, timeout o desconexión posterior al envío, bloquear el reintento, refrescar datos y resolver el estado según evidencia; solo habilitar el reintento manual cuando se confirme que no se aplicó.
- Descartada: reintento automático o directo, porque puede duplicar movimientos ya persistidos.
- RF cubiertos: RF-77 a RF-80, RF-83 a RF-86.

## Estrategia de pruebas

| RF | Prueba | Nivel | Evidencia esperada |
| --- | --- | --- | --- |
| RF-1 a RF-5, RF-48 a RF-56 | Imports y pruebas de cada caso de uso, entidad y contrato aislados. | Unitario, arquitectura | 22 operaciones independientes; dominio sin NestJS/Prisma. |
| RF-6 a RF-19, RF-52 a RF-59, RF-75 | Contratos completos de recursos, envelopes, paginación, deletes y movimientos. | API, contrato | JSON sin campos internos, tipos exactos y estados 200/201. |
| RF-20 a RF-28, RF-64 a RF-74, RF-77 | Matriz de errores, detalles y Swagger para cada estado aplicable. | API, OpenAPI | Estado, código, cuerpo y esquema coinciden. |
| RF-29, RF-78 a RF-80, RF-83 a RF-86 | Cliente web ante contrato nuevo, 500, timeout y desconexión; reconciliación aplicada/no aplicada/indeterminada/fallida. | UI, cliente | Sin reintento automático; refresco y mensaje correctos. |
| RF-30 a RF-40, RF-60 a RF-63, RF-76, RF-81, RF-82, RF-87 a RF-91 | Seed vacío, repetido, parcial, concurrente, conflicto de nombre/UUID y entorno no development. | Integración PostgreSQL | Sin duplicados ni modificaciones; resumen y códigos correctos; rollback ante fallo. |
| RF-41 a RF-45 | Liveness, readiness, configuración ausente, timeout, esquema incompleto, recuperación y cierre. | API, integración PostgreSQL | `/health` 200 independiente; `/health/ready` 200 o 503 correcto. |
| RF-46 a RF-47 | UUID de ruta y booleanos de query válidos e inválidos. | API | Validación 400 con detalles de campo. |
| RNF-3 a RNF-7 | Suite raíz y revisión de formatos, contratos y documentación. | Automatizada | `test`, `lint`, `format:check` y `build` en verde. |
| RF-29, RF-78 a RF-86 | Revisión visual de la recuperación en 1440 px y 390 px. | Manual UI | Mensajes, bloqueo y reintentos manuales comprensibles. |

## Riesgos y dudas abiertas

- No hay dudas abiertas de producto ni arquitectura.
- El plan no autoriza migraciones ni cambios de esquema; cualquier necesidad descubierta se eleva a una nueva confirmación.
- Las pruebas de seed, readiness y concurrencia requieren PostgreSQL local configurado con variables no versionadas.
- El plan de UI de reconciliación debe cargar `impeccable` antes de ser implementado.
