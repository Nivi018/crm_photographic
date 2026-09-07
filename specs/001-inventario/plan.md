# Plan 001 - Inventario del estudio fotografico

## Contexto

Este plan implementa la spec aprobada `specs/001-inventario/spec.md` respetando `docs/constitution.md`, `AGENTS.md`, `PRODUCT.md` y `DESIGN.md`.

Restricciones relevantes:

- Monorepo con npm workspaces.
- Frontend en `apps/web` con React y Vite.
- Backend en `apps/api` con NestJS, Prisma y Swagger.
- Base de datos PostgreSQL local administrada con pgAdmin.
- No usar Docker ni `docker-compose`.
- No crear ni aplicar migraciones Prisma sin confirmacion explicita.
- `packages/shared` solo existira para contratos, enums, limites y errores usados por frontend y backend.
- La spec define comportamiento y alcance; los mocks solo guian identidad, jerarquia visual, componentes, temas e interaccion.
- Antes de implementar UI se debe cargar y aplicar la skill `impeccable`.

Scripts raiz planificados:

- `npm run dev`: levanta web y API desde la raiz.
- `npm run test`: ejecuta pruebas disponibles.
- `npm run lint`: ejecuta lint disponible.
- `npm run format:check`: valida formato sin escribir cambios.
- `npm run build`: compila los workspaces disponibles.

## Modulos y responsabilidades

| Modulo                                 | Responsabilidad                                                                                            | RF cubiertos                                                                                     |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `workspace`                            | Configurar npm workspaces, TypeScript compartido y scripts raiz.                                           | Criterios de finalizacion                                                                        |
| `packages/shared`                      | Publicar enums, limites numericos, tipos de paginacion, codigos de error y contratos usados por web y API. | RF-1 a RF-110                                                                                    |
| `apps/api/inventory/domain/articles`   | Modelar articulos, tipo, estado, nombre normalizado, stock minimo e invariantes de edicion.                | RF-1 a RF-16, RF-46, RF-72, RF-73, RF-77, RF-84, RF-89, RF-95                                    |
| `apps/api/inventory/domain/categories` | Modelar categorias, estado, unicidad y reglas de asociacion.                                               | RF-47 a RF-52, RF-61, RF-71, RF-74 a RF-76, RF-78, RF-85                                         |
| `apps/api/inventory/domain/stock`      | Modelar entradas, salidas, ajustes, rangos, stock negativo, stock bajo y recalculo de stock inicial.       | RF-17 a RF-35, RF-53 a RF-59, RF-69, RF-70, RF-80 a RF-83, RF-86 a RF-90, RF-95 a RF-101, RF-109 |
| `apps/api/inventory/application`       | Orquestar casos de uso, confirmaciones, transacciones, concurrencia y revalidaciones.                      | RF-67, RF-68, RF-82, RF-83, RF-91, RF-102 a RF-105, RF-110                                       |
| `apps/api/inventory/infrastructure`    | Implementar repositorios Prisma y consultas PostgreSQL detras de interfaces del dominio/aplicacion.        | Persistencia de RF-1 a RF-110                                                                    |
| `apps/api/inventory/presentation`      | Exponer endpoints REST, DTOs validados, errores observables y Swagger.                                     | RF-1 a RF-110                                                                                    |
| `apps/web/inventory`                   | Implementar listados, detalle, formularios, filtros, paginacion, alertas y confirmaciones.                 | RF-8, RF-12, RF-40 a RF-46, RF-62 a RF-66, RF-80, RF-92 a RF-94, RF-106 a RF-108                 |
| `apps/web/theme`                       | Implementar tema claro/oscuro, persistencia y respaldo por pestana.                                        | RF-92 a RF-94, RF-107, RF-108                                                                    |

## Modelo de datos y contratos

### Entidades persistentes

`Category`:

- `id: UUID`
- `name: string`
- `normalizedName: string`
- `isActive: boolean`
- `version: integer`
- `createdAt: Date`
- `updatedAt: Date`

Restricciones:

- `normalizedName` es unico entre categorias activas e inactivas.
- Una categoria puede desactivarse si no tiene articulos activos asociados.
- Una categoria puede eliminarse solo si no tiene articulos asociados.

`Article`:

- `id: UUID`
- `name: string`
- `normalizedName: string`
- `type: SALE | INTERNAL_SUPPLY`
- `categoryId: UUID`
- `initialStock: integer`
- `currentStock: integer`
- `minimumStock: integer`
- `isActive: boolean`
- `version: integer`
- `createdAt: Date`
- `updatedAt: Date`

Restricciones:

- `normalizedName` es unico entre articulos activos e inactivos.
- `initialStock` y `minimumStock` aceptan valores de `0` a `999999999`.
- `currentStock` debe quedar entre `-999999999` y `999999999`.
- Un articulo puede eliminarse solo si no tiene movimientos y su stock actual es `0`.

`Movement`:

- `id: UUID`
- `sequence: bigint`
- `articleId: UUID`
- `kind: ENTRY | EXIT | ADJUSTMENT`
- `adjustmentMode: FINAL_STOCK | DELTA | null`
- `source: INITIAL_STOCK | MANUAL`
- `appliedQuantity: integer`
- `reason: string`
- `occurredAt: Date`
- `stockBefore: integer`
- `stockAfter: integer`

Restricciones:

- Los movimientos no se editan ni eliminan.
- `occurredAt` se genera automaticamente en UTC.
- `sequence` desempata movimientos con misma fecha/hora visible y mismo articulo.
- La entrada inicial automatica conserva su cantidad visible original aunque cambie `Article.initialStock`.

### Normalizacion

La normalizacion para busquedas y duplicados debe:

1. Recortar espacios exteriores.
2. Normalizar Unicode.
3. Eliminar marcas diacriticas.
4. Convertir a minusculas.

La busqueda parcial por nombre usara la misma normalizacion. La ordenacion alfabetica ignorara mayusculas y acentos.

### API REST

Rutas principales:

- `GET /api/inventory/articles`
- `POST /api/inventory/articles`
- `GET /api/inventory/articles/:id`
- `PATCH /api/inventory/articles/:id`
- `POST /api/inventory/articles/:id/deactivate`
- `POST /api/inventory/articles/:id/reactivate`
- `DELETE /api/inventory/articles/:id`
- `GET /api/inventory/articles/:id/movements`
- `GET /api/inventory/categories`
- `POST /api/inventory/categories`
- `PATCH /api/inventory/categories/:id`
- `POST /api/inventory/categories/:id/deactivate`
- `POST /api/inventory/categories/:id/reactivate`
- `DELETE /api/inventory/categories/:id`
- `GET /api/inventory/movements`
- `POST /api/inventory/articles/:id/movements`
- `GET /api/inventory/alerts/low-stock`

Los listados devuelven:

- `items`
- `page`
- `pageSize: 25`
- `totalItems`
- `totalPages`

Los comandos mutables reciben `expectedVersion` cuando dependen del estado vigente del articulo o categoria.

Las operaciones que requieran confirmacion devuelven un error recuperable con:

- `code`
- `message`
- `articleId`
- `expectedVersion`
- `stockBefore`
- `stockAfter`
- `warning`

### Errores observables

- `VALIDATION_ERROR`: campo invalido, vacio, fuera de rango o con tipo incorrecto.
- `NAME_CONFLICT`: nombre duplicado tras normalizacion.
- `NOT_FOUND`: recurso inexistente.
- `ARTICLE_INACTIVE`: operacion no permitida sobre articulo inactivo.
- `CATEGORY_INACTIVE`: categoria inactiva no seleccionable para alta o edicion.
- `DEPENDENCY_CONFLICT`: existen articulos asociados que impiden eliminar o desactivar.
- `NEGATIVE_STOCK_CONFIRMATION_REQUIRED`: la operacion produce stock negativo y requiere confirmacion.
- `RECONFIRMATION_REQUIRED`: el resultado o advertencia cambio durante la confirmacion.
- `CONCURRENT_MODIFICATION`: el unico reintento automatico tambien encontro cambios concurrentes.
- `STOCK_OUT_OF_RANGE`: resultado fuera del rango permitido.
- `NO_STOCK_DIFFERENCE`: ajuste por existencia final igual al stock actual.

## Decisiones tecnicas

### Stock actual persistido

- Elegida: persistir `currentStock` en `Article` y actualizarlo dentro de transacciones.
- Descartada: calcular stock actual siempre desde el historial, porque encarece listados, alertas y paginacion, y complica concurrencia.
- RF cubiertos: RF-19, RF-22, RF-28, RF-31, RF-46, RF-98.

### Recalculo de stock inicial

- Elegida: recalcular desde `Article.initialStock`, ignorar la entrada inicial como operacion de replay y aplicar cada movimiento posterior por su `appliedQuantity` original, incluidos ajustes por existencia final.
- Descartada: convertir ajustes por existencia final en nuevos puntos absolutos durante el replay, porque contradice RF-53 y la decision aprobada de reaplicar la diferencia historica.
- RF cubiertos: RF-53 a RF-55, RF-58, RF-69, RF-70, RF-80, RF-81, RF-100, RF-109.

### Movimiento inicial visible inmutable

- Elegida: conservar sin cambios cantidad visible, stock anterior y stock posterior del movimiento `INITIAL_STOCK`.
- Descartada: actualizar la cantidad visible del movimiento inicial, porque haria que el historial pareciera editado aunque no exista auditoria visible.
- RF cubiertos: RF-40, RF-54, RF-55, RF-109.

### Concurrencia

- Elegida: combinar transacciones serializables de Prisma/PostgreSQL, campo `version` por agregado y un unico reintento automatico en la capa de aplicacion.
- Descartada: reintentos ilimitados, porque RF-110 exige cancelar si el estado cambia nuevamente durante el unico reintento.
- RF cubiertos: RF-67, RF-68, RF-82, RF-83, RF-91, RF-102 a RF-105, RF-110.

### Confirmaciones de stock negativo

- Elegida: modelar la confirmacion como una segunda solicitud con `expectedVersion` y datos calculados por el servidor.
- Descartada: confiar solo en el calculo del cliente, porque podria confirmar sobre datos desactualizados.
- RF cubiertos: RF-23 a RF-26, RF-32 a RF-34, RF-80, RF-81, RF-99, RF-101.

### Categorias activas e inactivas

- Elegida: permitir categorias inactivas en filtros y listados, pero solo categorias activas en alta, edicion y reactivacion de articulos.
- Descartada: ocultar categorias inactivas del filtro, porque impediria localizar articulos inactivos asociados a ellas.
- RF cubiertos: RF-16, RF-44, RF-51, RF-52, RF-56, RF-63, RF-71, RF-102, RF-103.

### Endpoints de estado explicitos

- Elegida: usar rutas explicitas para desactivar y reactivar articulos/categorias.
- Descartada: un `PATCH status` generico, porque puede saltarse invariantes diferentes para articulos y categorias.
- RF cubiertos: RF-11 a RF-16, RF-51, RF-52, RF-71.

### Contratos compartidos

- Elegida: `packages/shared` contiene enums, limites, codigos de error, tipos de paginacion y DTOs de respuesta comunes usados por web y API.
- Descartada: compartir entidades de dominio o DTOs decorados de NestJS, porque acoplaria frontend con infraestructura/presentacion.
- RF cubiertos: RF-1 a RF-110.

### Validacion y Swagger

- Elegida: DTOs de clase en NestJS con `ValidationPipe` global, decoradores de validacion y documentacion Swagger explicita.
- Descartada: validar solo en dominio, porque la spec exige errores observables por campo y documentacion de endpoints.
- RF cubiertos: RF-1 a RF-110 y criterios de finalizacion.

### Frontend sin logica de negocio en componentes

- Elegida: componentes presentacionales reutilizables, hooks de feature, cliente HTTP tipado y mutaciones en handlers de usuario.
- Descartada: hacer fetch y reglas de negocio directamente dentro de componentes, porque contradice `docs/constitution.md` y `AGENTS.md`.
- RF cubiertos: RF-8, RF-12, RF-40 a RF-46, RF-62 a RF-66, RF-80, RF-92 a RF-94, RF-106 a RF-108.

### Tema claro/oscuro

- Elegida: `localStorage` para preferencia persistente y `sessionStorage` como respaldo por pestana cuando falle el guardado persistente.
- Descartada: estado solo en memoria, porque no sobreviviria recargas de la misma pestana.
- RF cubiertos: RF-92 a RF-94, RF-107, RF-108.

### Alcance visual

- Elegida: implementar solo inventario, movimientos y categorias con el lenguaje visual de los mocks, adaptando campos y acciones a la spec.
- Descartada: implementar Inicio, Auditoria, variantes, precios, costos, ventas, usuarios multiples o edicion/eliminacion de movimientos por aparecer en mocks.
- RF cubiertos: alcance completo de la spec y criterios visuales.

## Estrategia de pruebas

| RF                                                       | Prueba                                                                                       | Nivel                          | Evidencia esperada                                                             |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------ |
| RF-1 a RF-6, RF-77, RF-84, RF-89, RF-95                  | Crear articulo con campos obligatorios, enteros, limites, espacios y estado inicial activo.  | Unitario, API                  | Articulo valido creado; errores por campo para datos invalidos.                |
| RF-7, RF-10, RF-60                                       | Crear o renombrar articulos duplicados ignorando mayusculas, acentos y espacios exteriores.  | Unitario, integracion, API     | `NAME_CONFLICT` para activos e inactivos.                                      |
| RF-8, RF-12                                              | Consultar articulo activo e inactivo con stock actual e historial.                           | API, UI                        | Detalle visible y lectura permitida.                                           |
| RF-9, RF-13, RF-14, RF-56                                | Editar articulos, bloquear edicion/movimientos en inactivos y bloquear categorias inactivas. | Unitario, API                  | Operaciones permitidas o rechazadas segun estado.                              |
| RF-11, RF-15, RF-16                                      | Desactivar y reactivar articulos, incluyendo excepcion de categoria durante reactivacion.    | Integracion, UI                | Estado actualizado y categoria activa exigida.                                 |
| RF-17 a RF-26, RF-96, RF-98, RF-99, RF-101               | Registrar entradas y salidas con validacion, advertencia, confirmacion negativa y rango.     | Unitario, integracion, API     | Stock actualizado o error recuperable/bloqueante correcto.                     |
| RF-27 a RF-35, RF-57, RF-58, RF-86 a RF-88, RF-97        | Registrar ajustes por existencia final y diferencia.                                         | Unitario, integracion, API     | Stock, motivo, signo y rechazo por sin diferencia correctos.                   |
| RF-36 a RF-41, RF-54, RF-55, RF-109                      | Consultar movimientos inmutables con cantidad, motivo, fecha, stock anterior y posterior.    | Integracion, API, UI           | Historial sin edicion/eliminacion y movimiento inicial visible inmutable.      |
| RF-42 a RF-46, RF-62 a RF-66, RF-106                     | Buscar, filtrar, ordenar, paginar y listar alertas de stock bajo.                            | Integracion, UI                | Resultados correctos, 25 por pagina y reset a primera pagina.                  |
| RF-47 a RF-52, RF-61, RF-71, RF-74 a RF-76, RF-78, RF-85 | Crear, editar, desactivar, reactivar y eliminar categorias.                                  | Unitario, integracion, API, UI | Reglas de asociacion, unicidad y limites cumplidas.                            |
| RF-53, RF-69, RF-70, RF-80 a RF-83, RF-100               | Crear stock inicial atomico y recalcular tras editar stock inicial.                          | Integracion                    | Replay correcto, entrada inicial atomica y rollback si falla.                  |
| RF-67, RF-68, RF-91, RF-102 a RF-105, RF-110             | Ejecutar operaciones concurrentes sobre articulos y categorias.                              | Integracion concurrente        | Un unico reintento automatico; reconfirmacion o conflicto segun corresponda.   |
| RF-92 a RF-94, RF-107, RF-108                            | Cambiar tema, persistir preferencia y usar respaldo por pestana ante fallo.                  | UI                             | Tema claro por defecto, persistencia y mensaje de fallo correctos.             |
| Todos                                                    | Recorrer flujos principales en 1440 px claro/oscuro y 390 px claro/oscuro.                   | Manual                         | Evidencia manual de alta, edicion, movimientos, categorias, filtros y alertas. |

Pruebas tecnicas previstas:

- Unitarias de dominio para normalizacion, rangos, stock y estados.
- Integracion de aplicacion con repositorios Prisma y PostgreSQL local de pruebas.
- Pruebas API para DTOs, codigos de error y Swagger generado.
- Pruebas UI para formularios, listados, confirmaciones, tema y estados vacios.
- Pruebas manuales visuales contra `PRODUCT.md`, `DESIGN.md` y `mocks/`.

## Riesgos y dudas abiertas

- No existe todavia `package.json`, estructura de workspaces ni scripts; deben crearse antes de poder ejecutar verificaciones.
- La primera migracion Prisma queda pendiente de confirmacion explicita antes de crearla o aplicarla.
- Las pruebas de persistencia requieren PostgreSQL local configurado con variables no versionadas.
- Logo y mascota originales estan pendientes; la UI solo debe reservar espacio o usar placeholders identificados hasta recibir assets.
- La edicion del stock inicial mantiene la discontinuidad aceptada por RNF-7 hasta una spec futura de auditoria.
- Sin Docker, cada entorno local debe configurar PostgreSQL manualmente.
