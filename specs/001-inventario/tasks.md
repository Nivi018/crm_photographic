# Tareas - Spec 001 Inventario del estudio fotografico

- [x] T1. Crear la configuracion raiz de npm workspaces y TypeScript. (Soporte RF-1 a RF-110)
      Hecho cuando: `apps/*` y `packages/*` son workspaces reconocidos sin incluir Docker ni secretos.
- [x] T2. Inicializar `apps/api` con NestJS y pruebas basicas. (Soporte RF-1 a RF-110)
      Hecho cuando: la API compila y su prueba inicial pasa.
- [x] T3. Inicializar `apps/web` con React, Vite y pruebas basicas. (Soporte RF-8, RF-12, RF-40 a RF-46, RF-62 a RF-66, RF-92 a RF-94, RF-106 a RF-108)
      Hecho cuando: la aplicacion web compila y su prueba inicial pasa.
- [x] T4. Crear `packages/shared` con contratos realmente consumidos por web y API. (RF-1 a RF-110)
      Hecho cuando: enums, limites, paginacion y errores se importan desde ambas aplicaciones.
- [x] T5. Configurar scripts agregados y documentacion operativa. (Soporte RF-1 a RF-110)
      Hecho cuando: existen `dev`, `test`, `lint`, `format:check` y `build` en la raiz y estan documentados.
- [x] T6. Configurar `ValidationPipe`, error envelope y Swagger. (RF-1 a RF-110)
      Hecho cuando: una prueba demuestra validacion global, error tipado y generacion OpenAPI.
- [x] T7. Escribir pruebas e implementar normalizacion de nombres y motivos. (RF-7, RF-10, RF-42, RF-48, RF-50, RF-60, RF-61, RF-89, RF-90)
      Hecho cuando: mayusculas, acentos y espacios exteriores producen los resultados definidos.
- [x] T8. Escribir pruebas e implementar cantidades y rango de stock. (RF-3 a RF-6, RF-17, RF-20, RF-27, RF-29, RF-35, RF-95 a RF-101)
      Hecho cuando: limites, enteros, cero, negativos y desbordamientos quedan cubiertos.
- [x] T9. Escribir pruebas e implementar la entidad categoria. (RF-47 a RF-52, RF-61, RF-71, RF-74, RF-75, RF-78, RF-85)
      Hecho cuando: sus transiciones e invariantes pasan pruebas unitarias.
- [x] T10. Escribir pruebas e implementar la entidad articulo. (RF-1 a RF-16, RF-46, RF-56, RF-60, RF-72, RF-73, RF-77, RF-84)
      Hecho cuando: clasificacion, edicion, estado, categoria y eliminacion pasan pruebas unitarias.
- [x] T11. Escribir pruebas e implementar entradas, salidas y representacion de movimientos. (RF-17 a RF-26, RF-36 a RF-41, RF-59, RF-79, RF-87, RF-88)
      Hecho cuando: cada movimiento calcula signo y stock anterior/posterior correctamente.
- [x] T12. Escribir pruebas e implementar ajustes y replay del stock inicial. (RF-27 a RF-35, RF-53 a RF-58, RF-69, RF-70, RF-80, RF-81, RF-86, RF-100, RF-109)
      Hecho cuando: el replay usa diferencias historicas y preserva el movimiento inicial visible.
- [x] T13. Definir puertos de repositorio y unidad de trabajo. (Soporte RF-1 a RF-110)
      Hecho cuando: dominio y aplicacion no importan Prisma.
- [x] T14. Definir el esquema Prisma sin crear migraciones. (RF-1 a RF-110)
      Hecho cuando: `prisma validate` acepta entidades, relaciones, indices, versiones y secuencia.
- [x] T15. Crear y aplicar la primera migracion Prisma. (RF-1 a RF-110)
      Hecho cuando: existe aprobacion explicita y la migracion se aplica en PostgreSQL local de pruebas.
- [x] T16. Escribir pruebas e implementar el repositorio Prisma de categorias. (RF-47 a RF-52, RF-61, RF-63, RF-71, RF-74, RF-75)
      Hecho cuando: unicidad, asociaciones, orden y paginacion se verifican contra PostgreSQL.
- [x] T17. Escribir pruebas e implementar el repositorio Prisma de articulos. (RF-7, RF-10, RF-42 a RF-46, RF-60, RF-62, RF-65)
      Hecho cuando: busqueda normalizada, filtros, alertas, orden y paginacion pasan integracion.
- [x] T18. Escribir pruebas e implementar el repositorio inmutable de movimientos. (RF-36 a RF-41, RF-54, RF-59, RF-64, RF-109)
      Hecho cuando: puede crear y consultar movimientos, pero no editarlos ni eliminarlos.
- [x] T19. Implementar creacion, edicion y listado de categorias con pruebas. (RF-47 a RF-50, RF-61, RF-63, RF-78, RF-85)
      Hecho cuando: los casos de uso devuelven categorias o errores tipados.
- [x] T20. Implementar ciclo de estado y eliminacion de categorias con pruebas. (RF-51, RF-52, RF-71, RF-74, RF-75)
      Hecho cuando: se respetan asociaciones activas e inactivas.
- [x] T21. Implementar creacion atomica de articulos con pruebas. (RF-1 a RF-7, RF-56, RF-69, RF-70, RF-76, RF-82 a RF-85, RF-95)
      Hecho cuando: articulo y entrada inicial se guardan juntos o no se guarda ninguno.
- [x] T22. Implementar consulta, busqueda, filtros y paginacion de articulos. (RF-8, RF-42 a RF-45, RF-62, RF-66, RF-106)
      Hecho cuando: pruebas de 25, 26 y ultima pagina incompleta pasan.
- [x] T23. Implementar edicion y recalculo del stock inicial con pruebas. (RF-9, RF-53 a RF-55, RF-80, RF-81, RF-100, RF-109)
      Hecho cuando: el stock se recalcula y el historial visible permanece inmutable.
- [x] T24. Implementar desactivacion, reactivacion y eliminacion de articulos. (RF-11 a RF-16, RF-72, RF-73)
      Hecho cuando: las transiciones permitidas y bloqueadas pasan pruebas.
- [x] T25. Implementar registro de entradas con pruebas. (RF-17 a RF-19, RF-40, RF-59, RF-79, RF-87, RF-90, RF-96, RF-98, RF-99)
      Hecho cuando: una entrada valida crea movimiento y actualiza stock atomicamente.
- [x] T26. Implementar salidas y confirmacion de stock negativo. (RF-20 a RF-26, RF-40, RF-59, RF-79, RF-88, RF-90, RF-96, RF-98, RF-99, RF-101)
      Hecho cuando: advertencia, confirmacion, rechazo y limites pasan pruebas.
- [x] T27. Implementar ajustes por existencia final y diferencia. (RF-27 a RF-35, RF-39 a RF-41, RF-57, RF-58, RF-79, RF-86 a RF-90, RF-97 a RF-99)
      Hecho cuando: ambos modos producen cantidad, motivo y stock correctos.
- [x] T28. Implementar revalidacion y unico reintento concurrente. (RF-67, RF-68, RF-91, RF-102 a RF-105, RF-110)
      Hecho cuando: pruebas controladas demuestran exito, reconfirmacion y cancelacion en segundo conflicto.
- [x] T29. Implementar historial global y por articulo. (RF-12, RF-36 a RF-41, RF-64)
      Hecho cuando: ambos listados son inmutables, paginados y deterministas.
- [x] T30. Implementar listado de stock bajo. (RF-46, RF-65)
      Hecho cuando: incluye solo articulos activos con stock igual o inferior al minimo.
- [x] T31. Exponer y documentar endpoints de categorias. (RF-47 a RF-52, RF-61, RF-63, RF-71, RF-74, RF-75, RF-78, RF-85)
      Hecho cuando: DTOs, validaciones, errores y Swagger pasan pruebas.
- [x] T32. Exponer y documentar endpoints de articulos. (RF-1 a RF-16, RF-42 a RF-45, RF-56, RF-60, RF-62, RF-69, RF-72, RF-73, RF-76, RF-77, RF-84, RF-95)
      Hecho cuando: alta, consulta, edicion, filtros y estado pasan pruebas HTTP.
- [x] T33. Exponer y documentar movimientos y alertas. (RF-17 a RF-41, RF-46, RF-53 a RF-59, RF-64, RF-65, RF-79 a RF-83, RF-86 a RF-110)
      Hecho cuando: movimientos, confirmaciones, historial y alertas tienen contratos Swagger verificables.
- [x] T34. Agregar pruebas E2E de categorias. (RF-47 a RF-52, RF-61, RF-63, RF-71, RF-74, RF-75)
      Hecho cuando: el flujo completo de categorias pasa contra PostgreSQL.
- [x] T35. Agregar pruebas E2E de articulos. (RF-1 a RF-16, RF-42 a RF-45, RF-53 a RF-56, RF-60, RF-62, RF-69, RF-72, RF-73)
      Hecho cuando: CRUD permitido, estados, filtros y recalculo pasan contra PostgreSQL.
- [ ] T36. Agregar pruebas E2E de movimientos y limites. (RF-17 a RF-41, RF-57 a RF-59, RF-64, RF-65, RF-79 a RF-101, RF-109)
      Hecho cuando: entradas, salidas, ajustes e historial pasan contra PostgreSQL.
- [ ] T37. Agregar pruebas E2E de concurrencia. (RF-67, RF-68, RF-82, RF-83, RF-91, RF-102 a RF-105, RF-110)
      Hecho cuando: se reproducen dos conflictos y se verifican reintento, reconfirmacion y cancelacion.
- [ ] T38. Crear router, cliente HTTP tipado y harness de pruebas web. (Soporte RF de UI)
      Hecho cuando: rutas de inventario, categorias y movimientos usan el cliente compartido.
- [ ] T39. Escribir pruebas e implementar gestion de tema. (RF-92 a RF-94, RF-107, RF-108)
      Hecho cuando: tema claro inicial, persistencia, fallback por pestana y mensaje de fallo pasan pruebas.
- [ ] T40. Implementar tokens visuales y shell responsive. (RF-92)
      Hecho cuando: navegacion aprobada y superficies claro/oscuro funcionan sin modulos fuera de alcance.
- [ ] T41. Implementar componentes reutilizables de formularios, tablas, estados y paginacion. (RF-40, RF-62 a RF-65)
      Hecho cuando: componentes tienen pruebas de interaccion y accesibilidad basica.
- [ ] T42. Implementar modelo de pantalla del listado de articulos. (RF-42 a RF-46, RF-62, RF-66, RF-106)
      Hecho cuando: hooks controlan consulta, filtros y reinicio de pagina.
- [ ] T43. Implementar UI del listado de articulos. (RF-42 a RF-46, RF-62, RF-66, RF-106)
      Hecho cuando: busqueda, filtros activos/inactivos, paginacion y stock bajo pasan pruebas.
- [ ] T44. Implementar modelo de formulario de articulos. (RF-1 a RF-10, RF-56, RF-69, RF-76 a RF-85, RF-95)
      Hecho cuando: validacion, envio y errores observables pasan pruebas sin logica en componentes.
- [ ] T45. Implementar UI de alta y edicion de articulos. (RF-1 a RF-10, RF-53 a RF-56, RF-69, RF-76 a RF-85, RF-95, RF-100, RF-109)
      Hecho cuando: formularios muestran validaciones y resultados definidos.
- [ ] T46. Implementar detalle e historial por articulo. (RF-8, RF-12, RF-36 a RF-41, RF-54, RF-109)
      Hecho cuando: datos, stock e historial inmutable se muestran correctamente.
- [ ] T47. Implementar acciones de estado y eliminacion de articulos. (RF-11 a RF-16, RF-72, RF-73)
      Hecho cuando: confirmaciones, bloqueos y reasignacion durante reactivacion pasan pruebas UI.
- [ ] T48. Implementar cliente y hooks de categorias. (RF-47 a RF-52, RF-61, RF-63, RF-71, RF-74, RF-75)
      Hecho cuando: consultas y mutaciones se prueban independientemente de la UI.
- [ ] T49. Implementar UI de gestion de categorias. (RF-47 a RF-52, RF-61, RF-63, RF-71, RF-74, RF-75, RF-78, RF-85)
      Hecho cuando: listado y operaciones muestran estados y errores correctos.
- [ ] T50. Implementar cliente y hooks de movimientos. (RF-17 a RF-41, RF-57 a RF-59, RF-64, RF-67, RF-68, RF-91, RF-110)
      Hecho cuando: preview, confirmacion, reconfirmacion y conflicto se prueban sin componentes.
- [ ] T51. Implementar formulario de movimientos. (RF-17 a RF-35, RF-57 a RF-59, RF-79, RF-86 a RF-101)
      Hecho cuando: entradas, salidas y ajustes muestran impacto y validaciones correctas.
- [ ] T52. Implementar listado global de movimientos. (RF-36 a RF-41, RF-64)
      Hecho cuando: historial paginado, ordenado e inmutable pasa pruebas UI.
- [ ] T53. Implementar vista de alertas de stock bajo. (RF-46, RF-65)
      Hecho cuando: solo muestra articulos activos en condicion de alerta.
- [ ] T54. Integrar estados vacios, carga y errores observables. (RF-76, RF-99, RF-103, RF-108, RF-110)
      Hecho cuando: inventario vacio, resultados vacios y errores recuperables tienen salida visible.
- [ ] T55. Verificar y corregir todos los flujos a 390 px. (RF de UI)
      Hecho cuando: alta, edicion, movimientos, categorias, filtros y alertas funcionan en ambos temas.
- [ ] T56. Verificar y corregir todos los flujos a 1440 px. (RF de UI)
      Hecho cuando: los mismos flujos cumplen `DESIGN.md` en ambos temas.
- [ ] T57. Verificar sincronizacion entre contratos compartidos, DTOs y Swagger. (RF-1 a RF-110)
      Hecho cuando: OpenAPI representa entradas, respuestas y errores implementados.
- [ ] T58. Ejecutar verificacion completa desde la raiz. (RF-1 a RF-110)
      Hecho cuando: `npm run test`, `npm run lint`, `npm run format:check` y `npm run build` terminan sin errores y se documenta la validacion manual.

## Orden y dependencias

| Tarea   | Depende de                 | Motivo                                             |
| ------- | -------------------------- | -------------------------------------------------- |
| T1      | Ninguna                    | Define el monorepo base.                           |
| T2      | T1                         | Necesita workspace raiz.                           |
| T3      | T1                         | Necesita workspace raiz.                           |
| T4      | T2, T3                     | Los contratos deben consumirse desde API y web.    |
| T5      | T1, T2, T3                 | Agrega scripts sobre workspaces existentes.        |
| T6      | T2, T4                     | Requiere API y contratos de errores.               |
| T7-T12  | T2, T4                     | Requieren base de dominio y contratos compartidos. |
| T13     | T9, T10, T11, T12          | Los puertos salen de las necesidades del dominio.  |
| T14     | T4, T13                    | El esquema debe reflejar contratos y puertos.      |
| T15     | T14 y aprobacion explicita | Las migraciones requieren autorizacion previa.     |
| T16-T18 | T13, T15                   | Requieren puertos y base de datos migrada.         |
| T19-T30 | T7-T18                     | Casos de uso dependen de dominio y repositorios.   |
| T31-T33 | T6, T19-T30                | Los endpoints exponen casos de uso.                |
| T34-T37 | T31-T33                    | Las pruebas E2E requieren endpoints.               |
| T38     | T3, T4, T31-T33            | La web consume contratos y API.                    |
| T39-T41 | T3, T38                    | Requieren base web y harness.                      |
| T42-T54 | T38-T41, T31-T33           | Requieren cliente, componentes y endpoints.        |
| T55-T56 | T39-T54                    | Validan flujos UI completos.                       |
| T57     | T31-T37                    | Valida contratos de API ya expuestos.              |
| T58     | T1-T57                     | Cierra la verificacion integral.                   |

## Cobertura de requisitos

| RF             | Tarea                                                  | Evidencia                                                                   |
| -------------- | ------------------------------------------------------ | --------------------------------------------------------------------------- |
| RF-1 a RF-16   | T7-T10, T21-T24, T32, T35, T44-T47                     | Pruebas unitarias, API, E2E y UI de articulos.                              |
| RF-17 a RF-41  | T8, T11, T12, T18, T25-T29, T33, T36, T50-T52          | Pruebas unitarias, integracion, E2E y UI de movimientos.                    |
| RF-42 a RF-66  | T7, T9, T16, T17, T19, T22, T29-T35, T42-T43, T48-T53  | Pruebas de busqueda, filtros, orden, paginacion y alertas.                  |
| RF-67 a RF-91  | T8-T12, T20-T28, T31-T37, T44-T51                      | Pruebas de concurrencia, revalidacion, stock, categorias y formularios.     |
| RF-92 a RF-110 | T8, T12, T21, T23, T25-T28, T33, T36-T39, T45, T50-T58 | Pruebas de tema, limites, confirmaciones, recalculo, concurrencia y cierre. |

## Notas de ejecucion

- Antes de implementar T3 o T38-T56 se debe cargar `impeccable` y consultar `PRODUCT.md`, `DESIGN.md` y `mocks/`.
- T15 esta bloqueada hasta recibir confirmacion explicita para crear y aplicar la primera migracion Prisma.
- Ninguna tarea debe implementar ventas, clientes, citas, facturacion, auditoria visible, variantes, precios, costos, usuarios multiples, edicion de movimientos ni eliminacion de movimientos.
