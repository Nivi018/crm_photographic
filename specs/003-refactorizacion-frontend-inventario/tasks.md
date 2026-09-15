# Tareas - Spec 003 Refactorizacion y mejora integral del frontend de inventario

- [x] T1. Añadir pruebas de caracterizacion para rutas, consultas, mutaciones y reconciliacion actualmente sin cobertura. (RF-1 a RF-4, RF-10 a RF-19, RF-20 a RF-23, RF-43, RF-46, RNF-5)
  Hecho cuando: las pruebas cubren categorias, movimientos, stock bajo, detalle, rutas y decisiones de reconciliacion existentes antes de reubicar su codigo.

- [x] T2. Definir tipos de dominio, validacion pura y decisiones de reconciliacion por agregado sin dependencias de React ni HTTP. (RF-4, RF-10 a RF-14, RF-41, RNF-1)
  Hecho cuando: las validaciones y decisiones de articulo, categoria y movimiento tienen pruebas unitarias puras.

- [x] T3. Crear `InventoryApiPort`, migrar el cliente HTTP a infraestructura y configurar `main.tsx` como composition root. (RF-3, RF-5 a RF-9, RF-41, RNF-2)
  Hecho cuando: la aplicacion recibe un puerto inyectado, el cliente conserva endpoints y errores actuales, y la infraestructura no se filtra a presentacion.

- [x] T4. Crear una base reutilizable de estado de consulta inyectado con `reload` y proteccion ante respuestas atrasadas. (RF-15 a RF-17, RF-36, RF-45)
  Hecho cuando: pruebas de hook demuestran carga, error, reintento que conserva criterios y descarte de respuestas obsoletas.

- [x] T5. Migrar listados, formulario y reconciliacion de articulos al puerto inyectado y a las capas objetivo. (RF-1, RF-5 a RF-19, RF-20, RF-22 a RF-23, RF-43 a RF-45)
  Hecho cuando: listado y formulario de articulos no importan infraestructura, conservan sus flujos y prueban estados, mutacion y reconciliacion con el mismo puerto.

- [x] T6. Migrar detalle de articulo, historial, acciones de estado y eliminacion a hooks y reconciliacion inyectada. (RF-1, RF-5 a RF-19, RF-22 a RF-23, RF-43 a RF-45)
  Hecho cuando: la pantalla de detalle solo renderiza estado y callbacks, y sus pruebas cubren carga, error, reintento, exito y mutaciones inciertas.

- [x] T7. Extraer gestion de categorias a hooks de consulta y mutacion con confirmaciones accesibles. (RF-1, RF-5 a RF-19, RF-21 a RF-22, RF-28 a RF-30, RF-43 a RF-46)
  Hecho cuando: categorias no usan clientes globales ni cuadros nativos, recorren todas las paginas durante reconciliacion y bloquean correctamente tras resultados inciertos.

- [x] T8. Migrar listados, formulario y operaciones de movimientos a puertos y hooks inyectados. (RF-1, RF-5 a RF-19, RF-22, RF-43 a RF-45)
  Hecho cuando: pantallas de movimientos no importan infraestructura y las pruebas conservan entradas, salidas, ajustes y sus reconciliaciones.

- [x] T9. Extraer stock bajo a un hook de aplicacion y completar el router manual y la navegacion existente. (RF-1 a RF-2, RF-15 a RF-17, RF-20, RF-23, RF-39, RF-43, RF-45)
  Hecho cuando: stock bajo usa consulta inyectada con estados y reintento, y la navegacion muestra el enlace a `/inventory/low-stock` sin crear rutas nuevas.

- [x] T10. Reubicar shell, router, tema y controles compartidos respetando los limites de dependencia. (RF-2, RF-24 a RF-25, RF-28 a RF-30, RF-41, RNF-3)
  Hecho cuando: `app`, componentes compartidos y pantallas compilan desde sus nuevas ubicaciones sin importar dependencias prohibidas.

- [x] T11. Separar tokens, reset, estilos globales, shell y controles compartidos desde la hoja global actual. (RF-24 a RF-25, RF-31 a RF-34, RF-37 a RF-38)
  Hecho cuando: los temas usan variables, los estilos globales no contienen reglas de pantallas y los controles cargan su CSS asociado.

- [x] T12. Separar estilos por pantalla y refinar jerarquia, acciones, tablas, formularios y estados de inventario. (RF-23 a RF-27, RF-31 a RF-32, RF-37 a RF-38)
  Hecho cuando: cada pantalla importa CSS propio, mantiene la identidad TONY y conserva acciones principales sin desbordamiento horizontal entre 320 px y 767 px.

- [ ] T13. Implementar la matriz de estados, notificaciones accesibles y prevencion de acciones duplicadas en la presentacion. (RF-15 a RF-19, RF-28 a RF-30, RF-43 a RF-44)
  Hecho cuando: listados, detalle y formularios demuestran sus estados definidos, y las confirmaciones de exito se anuncian durante cinco segundos y se reemplazan correctamente.

- [ ] T14. Añadir pruebas arquitectonicas y de accesibilidad para los limites cerrados, foco, teclado, etiquetas, errores, movimiento reducido y contraste. (RF-28 a RF-32, RF-41, RNF-4, RNF-6)
  Hecho cuando: la suite rechaza imports no permitidos y verifica los requisitos accesibles definidos por la spec.

- [ ] T15. Ejecutar la verificacion visual, de rendimiento y de calidad integral de la iteracion. (RF-35 a RF-36, RF-42, RF-45, RNF-7 a RNF-8)
  Hecho cuando: se documentan capturas a 320 px, 390 px y 1440 px en ambos temas, las mediciones locales cumplen los umbrales y los comandos raiz terminan correctamente.

## Orden y dependencias

| Tarea | Depende de | Motivo |
| --- | --- | --- |
| T1 | Ninguna | Fija el comportamiento que la refactorizacion debe preservar. |
| T2 | T1 | Las pruebas caracterizan los resultados antes de extraer reglas puras. |
| T3 | T2 | El puerto usa los tipos y decisiones de dominio ya separados. |
| T4 | T3 | El estado de consulta requiere el puerto inyectado. |
| T5 | T4 | Articulos usa la base de consulta y la inyeccion de dependencias. |
| T6 | T5 | Detalle reutiliza contratos y reconciliacion de articulos. |
| T7 | T4 | Categorias usa el puerto y patron de consulta comunes. |
| T8 | T4 | Movimientos usa el puerto y patron de consulta comunes. |
| T9 | T4 | Stock bajo usa el patron de consulta inyectado. |
| T10 | T5-T9 | Shell y router deben apuntar a pantallas ya migradas. |
| T11 | T10 | La separacion de estilos compartidos sigue la estructura final. |
| T12 | T11 | Los estilos por pantalla dependen de tokens y controles separados. |
| T13 | T5-T12 | Los estados y notificaciones se integran sobre las pantallas finales. |
| T14 | T10-T13 | Las pruebas de limites y accesibilidad validan la estructura final. |
| T15 | T14 | La verificacion integral se realiza sobre la iteracion completa. |

## Cobertura de requisitos

| RF | Tarea | Evidencia |
| --- | --- | --- |
| RF-1 a RF-4 | T1, T5-T9 | Pruebas de caracterizacion y pantallas conservan flujos, rutas, API y reglas. |
| RF-5 a RF-9 | T2-T5 | Puerto inyectado, infraestructura aislada y pantallas sin HTTP. |
| RF-10 a RF-14, RF-46 | T1-T2, T5-T8 | Decisiones puras y reconciliacion inyectada, incluida paginacion de categorias. |
| RF-15 a RF-19 | T4-T9, T13 | Estados remotos, reintento, bloqueo, resultados y confirmaciones. |
| RF-20 a RF-23 | T5-T9, T12 | Filtros, categorias, acciones y alertas conservados. |
| RF-24 a RF-25, RF-37 a RF-38 | T10-T12 | Shell, tokens y estilos consistentes con identidad TONY. |
| RF-26 a RF-32 | T10-T14 | Responsive, foco, teclado, etiquetas, errores, contraste y movimiento reducido. |
| RF-33 a RF-34 | T11-T12 | CSS separado por responsabilidad y tema mediante variables. |
| RF-35 a RF-36, RF-42 | T4, T15 | Respuestas vigentes, feedback antes de 300 ms e interactividad antes de 2 s. |
| RF-39 | T9 | Enlace visible a la ruta existente de stock bajo. |
| RF-41 | T3, T10, T14 | Composition root permitido y prueba de dependencias cerradas. |
| RF-43 a RF-45 | T4-T9, T13 | Matriz de estados, notificaciones y respuestas atrasadas ignoradas. |
| RNF-1 a RNF-4 | T2-T3, T10, T14 | Capas, puertos e imports verificados. |
| RNF-5 a RNF-8 | T1, T14-T15 | Caracterizacion, pruebas, inspeccion visual y comandos raiz. |
