# Tareas - Spec 002 Mejora del backend de inventario

- [x] T1. Definir contratos públicos compartidos para envelopes, paginación, recursos, errores y códigos nuevos. (RF-6 a RF-19, RF-21 a RF-28, RF-64 a RF-75)
      Hecho cuando: pruebas de contratos verifican tipos, enums, nulabilidad, `data`, `meta`, errores y ausencia de campos internos.

- [x] T2. Separar propiedades y errores de las entidades de dominio en módulos físicos. (RF-1, RF-3, RF-5, RF-56, RF-64 a RF-74)
      Hecho cuando: pruebas de dominio permanecen en verde y el dominio no importa NestJS, Prisma ni DTOs HTTP.

- [x] T3. Extraer contratos e implementar los ocho casos de uso de artículos por operación. (RF-2, RF-3, RF-48, RF-53 a RF-55, RF-65, RF-69, RF-73, RF-74)
      Hecho cuando: crear, obtener, listar, stock bajo, editar, desactivar, reactivar y eliminar se prueban de forma independiente.

- [x] T4. Extraer contratos e implementar los seis casos de uso de categorías por operación. (RF-2, RF-3, RF-49, RF-66, RF-72 a RF-74)
      Hecho cuando: cada operación de categoría tiene pruebas aisladas y conserva las reglas aprobadas.

- [x] T5. Extraer contratos e implementar los seis casos de uso de movimientos por operación. (RF-2, RF-3, RF-16, RF-50, RF-52, RF-53, RF-55, RF-67, RF-70)
      Hecho cuando: los listados y registros de movimiento se prueban de forma aislada y devuelven estado final coherente.

- [x] T6. Reorganizar repositorios, unidad de trabajo y adaptadores Prisma sin cambiar el esquema. (RF-1, RF-3, RF-36, RF-37, RNF-1, RNF-2)
      Hecho cuando: los casos de uso usan puertos y la infraestructura Prisma queda fuera de dominio y aplicación.

- [ ] T7. Implementar DTOs de entrada/salida, mapeadores y controladores organizados por funcionalidad. (RF-4, RF-7 a RF-20, RF-46, RF-47, RF-52 a RF-59, RF-75)
      Hecho cuando: todas las rutas actuales entregan envelopes, recursos públicos, paginación, UUID y booleanos con los estados HTTP definidos.

- [ ] T8. Implementar la clasificación explícita de errores y actualizar Swagger de toda la API. (RF-20 a RF-28, RF-57, RF-58, RF-64 a RF-74, RNF-3, RNF-4)
      Hecho cuando: pruebas HTTP y OpenAPI verifican cada estado, código, `details` y esquema de éxito/error aplicable.

- [ ] T9. Implementar liveness, readiness de PostgreSQL y cierre de recursos. (RF-41 a RF-45, RF-51, RNF-6)
      Hecho cuando: `/health` responde sin PostgreSQL y `/health/ready` verifica tablas/columnas, timeout inclusivo, 503 y recuperación.

- [ ] T10. Crear el seed de desarrollo idempotente, transaccional y no destructivo. (RF-30 a RF-40, RF-60 a RF-63, RF-76, RF-81, RF-82, RF-87 a RF-91, RNF-5)
      Hecho cuando: el seed requiere `NODE_ENV=development`, preserva registros, usa UUID reservados y produce el resumen codificado definido.

- [ ] T11. Adaptar el cliente API, tipos y pruebas web a los contratos normalizados. (RF-29, RF-57, RF-58, RF-75)
      Hecho cuando: los hooks y pantallas consumen `data`/`meta`, eliminaciones JSON y recursos públicos sin discrepancias de tipos.

- [ ] T12. Diseñar e implementar la reconciliación de mutaciones con resultado incierto. (RF-77 a RF-80, RF-83 a RF-86)
      Hecho cuando: pruebas de cliente cubren 500, timeout, corte de red y los resultados aplicado, no aplicado, indeterminado y consulta fallida.

- [ ] T13. Verificar visualmente la recuperación de mutaciones inciertas en escritorio y móvil. (RF-29, RF-78 a RF-86)
      Hecho cuando: tras cargar `impeccable`, la UI comunica el estado, bloquea reintentos y permite las acciones aprobadas a 1440 px y 390 px.

- [ ] T14. Ejecutar la verificación integral y revisar contratos finales. (RNF-3 a RNF-7, Criterios de finalización)
      Hecho cuando: `npm run test`, `npm run lint`, `npm run format:check` y `npm run build` pasan, y se reportan las verificaciones manuales o bloqueos de PostgreSQL.

## Orden y dependencias

| Tarea | Depende de | Motivo |
| --- | --- | --- |
| T1 | Ninguna | Fija el contrato usado por API y web. |
| T2 | Ninguna | Limpia el dominio sin depender del transporte. |
| T3 | T1, T2 | Los casos de uso usan contratos y entidades separadas. |
| T4 | T1, T2 | Las categorías usan los mismos límites arquitectónicos. |
| T5 | T1, T2 | Movimientos requieren contratos y entidades separadas. |
| T6 | T2-T5 | Los adaptadores reflejan los puertos de los casos de uso. |
| T7 | T1, T3-T6 | Presentación expone casos de uso y DTOs terminados. |
| T8 | T1, T7 | Swagger y errores validan contratos HTTP finales. |
| T9 | T6 | Readiness usa infraestructura Prisma reorganizada. |
| T10 | T4-T6 | Seed usa reglas, repositorios y transacciones finales. |
| T11 | T1, T7-T8 | Web depende del contrato HTTP documentado. |
| T12 | T11 | Reconciliación extiende el cliente y los hooks adaptados. |
| T13 | T12 | La revisión visual depende del flujo implementado. |
| T14 | T1-T13 | Cierra todas las verificaciones automáticas y manuales. |

## Cobertura de requisitos

| RF | Tareas |
| --- | --- |
| RF-1 a RF-5, RF-48 a RF-51, RF-56 | T2-T6 |
| RF-6 a RF-19, RF-46, RF-47, RF-52 a RF-59, RF-75 | T1, T7, T11 |
| RF-20 a RF-28, RF-64 a RF-74 | T1, T8 |
| RF-29, RF-77 a RF-80, RF-83 a RF-86 | T11-T13 |
| RF-30 a RF-40, RF-60 a RF-63, RF-76, RF-81, RF-82, RF-87 a RF-91 | T10 |
| RF-41 a RF-45 | T9 |
| RNF-1 a RNF-7 y criterios de finalización | T1-T14 |

## Notas de ejecución

- T10 no crea ni aplica migraciones ni modifica `schema.prisma`.
- T11-T13 requieren cargar `impeccable` antes de cambios de interfaz.
- Cada tarea se implementará de forma aislada mediante `task-implementer`; ninguna se marca completada al generarse este archivo.
