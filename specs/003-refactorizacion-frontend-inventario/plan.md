# Plan 003 - Refactorizacion y mejora integral del frontend de inventario

## Contexto

La Spec 003 conserva los contratos HTTP, las reglas de inventario y las rutas actuales mientras reorganiza `apps/web` por responsabilidades. La implementacion usara React, Vite, TypeScript, CSS plano y las dependencias ya instaladas. No se agregaran librerias de router, cache ni estado remoto.

La estructura resultante aplicara los limites de RF-41. `main.tsx` sera el unico composition root autorizado a importar `app` e infraestructura para construir el puerto de inventario e inyectarlo en la aplicacion. Las pantallas no importaran HTTP, clientes ni singletons. Antes de modificar cada unidad se agregaran pruebas de caracterizacion que conserven los flujos de las Specs 001 y 002.

## Módulos y responsabilidades

| Módulo | Responsabilidad | RF cubiertos |
| --- | --- | --- |
| `apps/web/src/main.tsx` | Composition root: crea dependencias de infraestructura, las inyecta en `App` y carga los estilos globales. | RF-6 a RF-9, RF-41 |
| `apps/web/src/app/` | Shell, navegación, router manual, tema y error boundary; recibe dependencias ya construidas. | RF-1, RF-2, RF-24 a RF-25, RF-39, RF-41 |
| `apps/web/src/shared/presentation/` | Controles reutilizables, estado de datos, tablas, paginación y estilos compartidos sin dependencias de inventario. | RF-15 a RF-18, RF-26 a RF-34, RF-37 a RF-38, RF-41 |
| `apps/web/src/features/inventory/domain/` | Tipos internos, validación pura de formularios y decisiones de reconciliación sin React ni HTTP. | RF-4, RF-10 a RF-14, RF-41, RNF-1 |
| `apps/web/src/features/inventory/application/` | Puertos, hooks de consulta, mutación, formularios y reconciliación; coordina estados sin conocer transporte HTTP. | RF-5 a RF-23, RF-36, RF-43, RF-45 a RF-46 |
| `apps/web/src/features/inventory/infrastructure/` | Implementación HTTP del puerto, traducción de errores y fábrica de dependencias. | RF-3, RF-8 a RF-10, RF-41, RNF-2 |
| `apps/web/src/features/inventory/presentation/` | Pantallas y componentes de inventario que renderizan estado y delegan lógica a hooks. | RF-1 a RF-2, RF-11 a RF-44 |
| `apps/web/src/app/styles/` y CSS por componente/pantalla | Tokens, reset, shell, controles y estilos locales; conserva tema claro/oscuro mediante variables. | RF-24 a RF-34, RF-37 a RF-38 |
| Pruebas de arquitectura, dominio, hooks, pantallas y verificación manual | Evidencia de dependencias, comportamiento, accesibilidad, visual y rendimiento. | RNF-4 a RNF-8 y todos los RF aplicables |

## Estructura objetivo

```text
apps/web/src/
  app/
    app.tsx
    app-shell.tsx
    router.tsx
    styles/
      reset.css
      tokens.css
      global.css
      shell.css
  shared/presentation/components/
    controls.tsx
    controls.css
  features/inventory/
    domain/
      inventory.types.ts
      article-form.validation.ts
      reconciliation-policy.ts
    application/
      ports/inventory-api.port.ts
      hooks/
      reconciliation/
    infrastructure/
      http/inventory-api-client.ts
      inventory-dependencies.ts
    presentation/
      components/
      screens/
```

Las carpetas solo se crearan cuando contengan una responsabilidad real. Cada pantalla y componente importara su CSS plano asociado; no se incorporaran CSS Modules.

## Modelo de datos y contratos

### Contrato de aplicación

`InventoryApiPort` reunira las operaciones ya expuestas por el cliente actual para articulos, categorias y movimientos. Sus entradas y salidas reutilizaran los contratos de `@crm-photografy/shared`; los tipos locales solo representaran estado de formulario, filtros o decisiones internas que no pertenezcan al contrato HTTP.

El puerto incluira consultas paginadas, detalle de articulo, categorias activas, listado de stock bajo y las mutaciones existentes. Las mutaciones seguiran propagando `InventoryApiError` y `UncertainMutationError` para que la aplicacion active la reconciliacion sin reintentos automáticos.

### Reconciliación

Las decisiones de articulos, categorias y movimientos se separaran por agregado. Cada una recibira el puerto inyectado y devolvera una decision independiente de React: aplicada, no aplicada, indeterminada o consulta fallida. La reconciliacion de categorias consultara todas las paginas antes de decidir; un fallo en cualquier pagina se tratara como consulta fallida.

`useMutationReconciliation` conservara el estado React transversal y las reglas de bloqueo. Hooks de formulario, detalle, categorias y movimientos entregaran la misma instancia del puerto tanto a la mutacion como a su reconciliacion.

### Estado de consulta y presentación

Los hooks de listado, detalle, categorias, movimientos, stock bajo y categorias activas expondran estado tipado de carga, error, resultado y `reload`. `reload` repetira la consulta con sus criterios vigentes. Cada consulta mantendra una identidad de solicitud para ignorar respuestas atrasadas que no correspondan a búsqueda, filtros o página actuales.

La presentación recibira datos, estados y callbacks. No importara `fetch`, `InventoryApiClient`, `inventoryApi` ni módulos de infraestructura.

## Decisiones técnicas

### Límites de dependencias y composition root

- Elegida: aplicar la lista cerrada de RF-41 y usar `main.tsx` como excepción de bootstrap para construir `InventoryApiClient` y entregar `InventoryApiPort` a `App`.
- Descartada: conservar el singleton `inventoryApi` accesible desde pantallas y hooks. Mantiene acoplamiento de presentación con infraestructura y rompe RF-6, RF-7 y RF-9.
- Descartada: permitir que `app` construya infraestructura. Contradice RF-41.
- RF cubiertos: RF-5 a RF-9, RF-41, RNF-1 a RNF-4.

### Migración por subfuncionalidad

- Elegida: primero establecer puerto, dependencias y pruebas de caracterización; después migrar artículos, categorías, movimientos y stock bajo sin cambiar comportamiento HTTP.
- Descartada: mover archivos por extensión o reescribir todas las pantallas en una sola etapa. Impediría aislar regresiones de los flujos existentes.
- RF cubiertos: RF-1 a RF-23, RF-43, RF-45 a RF-46, RNF-5 a RNF-6.

### Reconciliación pura e inyectada

- Elegida: dividir las decisiones por agregado y hacer que cada una use el mismo puerto recibido por el hook que ejecutó la mutación.
- Descartada: conservar un módulo de reconciliación central conectado al singleton. Provoca divergencias entre pruebas, mutaciones y consultas de verificación.
- RF cubiertos: RF-9 a RF-14, RF-18 a RF-19, RF-44, RF-46.

### Router manual y navegación de stock bajo

- Elegida: conservar el router manual existente, completar el tipo de rutas y enlazar de forma visible la ruta existente `/inventory/low-stock`.
- Descartada: adoptar un router declarativo. Añade una dependencia y amplía el alcance sin ser necesario para las rutas actuales.
- RF cubiertos: RF-1 a RF-2, RF-22, RF-39.

### CSS plano por responsabilidad

- Elegida: dividir `styles.css` en tokens, reset, estilos globales, shell, controles, componente de reconciliación y estilos por pantalla; conservar selectores por pantalla/componente y variables de tema.
- Descartada: CSS Modules. Añade cambios de nombres y migración visual que no contribuyen al objetivo de la iteración.
- RF cubiertos: RF-24 a RF-34, RF-37 a RF-38, RNF-7.

### Estados, notificaciones y accesibilidad

- Elegida: estandarizar estados de carga, vacío, error, reintento y éxito según la matriz de RF-43; añadir notificación accesible de cinco segundos que sustituya la anterior; usar formularios y confirmaciones accesibles en lugar de `prompt` y `confirm` nativos.
- Descartada: mensajes locales persistentes y cuadros de diálogo nativos. No satisfacen los requisitos de foco, anuncio y reemplazo de RF-28 a RF-30 y RF-44.
- RF cubiertos: RF-15 a RF-19, RF-26 a RF-32, RF-43 a RF-45.

### Rendimiento y respuestas atrasadas

- Elegida: registrar la identidad de cada consulta en el hook y publicar carga o resultado del criterio vigente antes de 300 ms, sin medir la espera HTTP. Verificar manualmente la interactividad inicial en Chrome de escritorio con cache desactivada.
- Descartada: permitir que la última respuesta recibida actualice el estado. Puede mostrar resultados de filtros o páginas ya abandonados.
- RF cubiertos: RF-35 a RF-36, RF-42, RF-45.

## Estrategia de pruebas

| RF | Prueba | Nivel | Evidencia esperada |
| --- | --- | --- | --- |
| RF-1 a RF-4 | Pruebas de caracterización de rutas, formularios, artículos, categorías y movimientos antes y después de cada migración. | Integración de pantalla | Mismos requests, resultados y reglas de negocio. |
| RF-5 a RF-9, RF-41 | Prueba de puerto inyectado y prueba arquitectónica de imports permitidos/prohibidos. | Unitario | Pantallas sin infraestructura; `main.tsx` como única excepción. |
| RF-10 a RF-14, RF-44, RF-46 | Pruebas unitarias de decisiones de reconciliación y de `useMutationReconciliation`. | Unitario/hook | Sin reintento automático; bloqueo, decisión y reintento manual correctos; categorías recorren todas las páginas. |
| RF-15 a RF-19, RF-43 | Matriz de estados para listados, detalle y formularios; reintento conserva consulta; éxito actualiza datos y notificación. | Hook/pantalla | Estados y acciones definidos por RF-43. |
| RF-20 a RF-23, RF-39 | Pruebas de filtros, paginación, categorías, alertas de stock bajo y enlaces de navegación. | Pantalla/router | Criterios conservados y acceso visible a stock bajo. |
| RF-24 a RF-34, RF-37 a RF-38 | Inspección visual y pruebas de accesibilidad de etiquetas, foco, teclado, reducción de movimiento y contraste. | Manual/pantalla | Identidad y tema coherentes; umbrales de contraste y controles accesibles. |
| RF-35 a RF-36, RF-42, RF-45 | Pruebas de identidad de solicitud y medición manual con DevTools Performance. | Hook/manual | Respuestas obsoletas ignoradas; 300 ms de feedback y 2 s de interactividad en el entorno definido. |
| RNF-5 a RNF-8 | Suite raíz y revisión de arquitectura, escritorio y móvil. | Automatizado/manual | `test`, `lint`, formato y build en verde; capturas a 320, 390 y 1440 px en ambos temas. |

## Orden de implementación

1. Añadir pruebas de caracterización para pantallas, hooks, reconciliación, rutas y límites de importación.
2. Crear tipos de dominio, puerto de aplicación, cliente de infraestructura y composition root sin migrar la presentación.
3. Migrar las consultas y formularios de artículos, incluida la reconciliación con puerto inyectado y protección contra respuestas atrasadas.
4. Migrar la gestión de categorías, incluidas sus mutaciones, confirmaciones accesibles y reconciliación paginada completa.
5. Migrar listados y registro de movimientos, detalle de artículo y sus reconciliaciones.
6. Extraer el listado de stock bajo a aplicación y completar ruta/enlace de navegación.
7. Reubicar shell, router y controles compartidos bajo sus límites de dependencia.
8. Dividir estilos por responsabilidad y aplicar los refinamientos visuales y de accesibilidad sin cambiar la identidad TONY.
9. Implementar notificaciones transitorias, matriz de estados, verificaciones visuales, accesibilidad y rendimiento.
10. Eliminar archivos obsoletos y ejecutar la verificación integral.

## Riesgos y dudas abiertas

- La consulta de todas las páginas de categorías puede crecer linealmente con el catálogo; se conserva porque RF-46 prohíbe decidir sin el catálogo completo. Una optimización requerirá una spec posterior y no un cambio de API en esta iteración.
- La medición de rendimiento se verificará manualmente en el entorno definido por RF-35 y RF-42, porque el repositorio no incluye una suite de navegador ni una herramienta de rendimiento instalada.
- No hay dudas abiertas que bloqueen la planificación.
