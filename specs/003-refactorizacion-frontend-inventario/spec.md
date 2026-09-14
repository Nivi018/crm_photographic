# Spec 003 - Refactorizacion y mejora integral del frontend de inventario

## Contexto y objetivo

El frontend de inventario funciona contra la API local, pero concentra responsabilidades de presentacion, consultas HTTP, reconciliacion, validacion y estilos. Esta iteracion reorganizara el frontend para separar responsabilidades, preservar los flujos de inventario aprobados y mejorar la experiencia visual, accesibilidad, adaptacion movil y rendimiento sin modificar endpoints, contratos HTTP, reglas de negocio ni rutas existentes.

## Usuarios / actores

- Administrador unico: consulta y opera el inventario del estudio.
- Desarrollador: mantiene y verifica la calidad del frontend.

## Historias de usuario

- H1: Como administrador quiero usar todas las pantallas de inventario con acciones y estados claros.
- H2: Como administrador quiero consultar, crear, editar y operar articulos, categorias y movimientos sin cambios inesperados en las reglas existentes.
- H3: Como administrador quiero usar el inventario desde escritorio y movil.
- H4: Como desarrollador quiero que el frontend tenga limites claros entre presentacion, logica de aplicacion, reglas puras e integracion HTTP.

## Requisitos funcionales (criterios de aceptacion en EARS)

- RF-1: EL SISTEMA conservara los flujos aprobados de articulos, categorias, movimientos, historial y stock bajo.
- RF-2: EL SISTEMA conservara las rutas existentes de inventario.
- RF-3: EL SISTEMA no modificara endpoints ni contratos HTTP existentes.
- RF-4: EL SISTEMA no modificara reglas de negocio de inventario.
- RF-5: EL SISTEMA separara la presentacion de las consultas, mutaciones, validaciones y reconciliaciones.
- RF-6: EL SISTEMA evitara que las pantallas realicen solicitudes HTTP directamente.
- RF-7: EL SISTEMA evitara que la presentacion dependa de clientes HTTP o de instancias globales de integracion.
- RF-8: EL SISTEMA mantendra una unica definicion para cada contrato HTTP compartido.
- RF-9: EL SISTEMA permitira que las consultas, mutaciones y reconciliaciones usen la misma dependencia de integracion inyectada.
- RF-10: EL SISTEMA conservara la prohibicion de reintentar automaticamente mutaciones con resultado incierto.
- RF-11: MIENTRAS una mutacion tenga resultado incierto, EL SISTEMA bloqueara acciones no permitidas y mostrara el estado de reconciliacion.
- RF-12: CUANDO la reconciliacion confirme una mutacion aplicada, EL SISTEMA mostrara los datos actualizados sin ofrecer el mismo reintento.
- RF-13: CUANDO la reconciliacion confirme una mutacion no aplicada, EL SISTEMA habilitara unicamente el reintento manual aprobado.
- RF-14: SI la reconciliacion no determina el resultado o falla, ENTONCES EL SISTEMA mantendra bloqueada la mutacion y ofrecera solo las acciones aprobadas para verificarla.
- RF-15: CUANDO el administrador consulte datos remotos, EL SISTEMA mostrara un estado de carga.
- RF-16: SI una consulta remota falla, ENTONCES EL SISTEMA mostrara el problema y una accion para repetir la misma consulta con su busqueda, filtros y pagina actuales.
- RF-17: CUANDO una consulta no devuelva resultados, EL SISTEMA mostrara un estado vacio con una accion o indicacion pertinente.
- RF-18: MIENTRAS una accion este en curso, EL SISTEMA evitara su duplicacion mediante sus controles.
- RF-19: CUANDO una accion finalice correctamente, EL SISTEMA mostrara el resultado actualizado.
- RF-20: EL SISTEMA conservara busqueda, filtros, paginacion y alertas de stock bajo en los listados aplicables.
- RF-21: EL SISTEMA permitira seleccionar categorias mediante controles utilizables en los flujos existentes.
- RF-22: EL SISTEMA mostrara acciones de crear, editar, desactivar, reactivar, eliminar y registrar movimientos cuando esten permitidas.
- RF-23: EL SISTEMA distinguira visualmente articulos inactivos y articulos con stock bajo.
- RF-24: EL SISTEMA conservara la identidad TONY photography sin crear una identidad nueva.
- RF-25: EL SISTEMA mantendra una experiencia coherente entre tema claro y oscuro.
- RF-26: CUANDO la pantalla se visualice entre 320 px y 767 px, EL SISTEMA mantendra disponibles las acciones principales sin desplazamiento horizontal de pagina.
- RF-27: CUANDO la pantalla se visualice desde 768 px, EL SISTEMA presentara tablas, filtros y acciones con jerarquia apta para consultar el inventario.
- RF-28: EL SISTEMA permitira recorrer los controles interactivos mediante teclado en un orden coherente.
- RF-29: EL SISTEMA mostrara foco visible en los controles interactivos.
- RF-30: EL SISTEMA asociara etiquetas y errores de validacion con sus campos.
- RF-31: EL SISTEMA mantendra contraste minimo de 4.5:1 para texto normal y 3:1 para texto grande en ambos temas; los requisitos de teclado, foco, etiquetas, errores y reduccion de movimiento se limitaran a los definidos expresamente en esta spec.
- RF-32: DONDE el sistema operativo solicite reduccion de movimiento, EL SISTEMA reducira las animaciones no esenciales.
- RF-33: EL SISTEMA separara los estilos globales, compartidos y especificos de cada pantalla segun su responsabilidad.
- RF-34: EL SISTEMA mantendra estilos de tema mediante variables reutilizables sin duplicar bloques completos para cada tema.
- RF-35: CUANDO se verifique el rendimiento local, EL SISTEMA se evaluara en Chrome de escritorio, con cache desactivada, API local disponible y el catalogo de desarrollo cargado.
- RF-36: CUANDO el administrador cambie busqueda, filtros o pagina, EL SISTEMA reflejara el criterio nuevo mediante estado de carga o resultados antes de 300 ms desde el evento, excluida la espera de red.
- RF-37: EL SISTEMA aplicara patrones visuales consistentes para encabezados, acciones principales, filtros, tablas, formularios, estados y acciones secundarias.
- RF-38: EL SISTEMA priorizara visualmente nombres, existencias, estados y acciones mediante tipografia, espaciado y chips consistentes.
- RF-39: EL SISTEMA incluira un acceso visible a la ruta existente de stock bajo dentro de la navegacion de inventario.
- RF-41: EL SISTEMA permitira unicamente que presentacion dependa de aplicacion y dominio; que aplicacion dependa de dominio; que infraestructura dependa de aplicacion y dominio; que app dependa de presentacion; y que los componentes compartidos usen solo dependencias compartidas necesarias. `main.tsx` actuara como composition root y podra depender de app e infraestructura exclusivamente para construir e inyectar dependencias; toda otra direccion de dependencia quedara prohibida.
- RF-42: CUANDO el administrador navegue a `/inventory`, EL SISTEMA considerara interactiva la pantalla cuando muestre resultados, estado vacio o error y permita usar busqueda, filtros y Crear articulo antes de dos segundos.
- RF-43: EL SISTEMA demostrara en listados los estados de carga, vacio, error, reintento y exito; en detalle, carga, error, reintento y exito; y en formularios, carga de datos cuando aplique, validacion o error, envio en curso y exito.
- RF-44: CUANDO una accion finalice correctamente, EL SISTEMA mostrara una notificacion transitoria durante cinco segundos, la anunciara como estado accesible y la reemplazara con la confirmacion de la siguiente operacion.
- RF-45: SI una respuesta de consulta no corresponde a la busqueda, filtros o pagina vigentes, ENTONCES EL SISTEMA la ignorara.
- RF-46: CUANDO la reconciliacion de una categoria requiera consultar varias paginas, EL SISTEMA obtendra todas las paginas antes de decidir el resultado; si falla alguna pagina, mantendra bloqueada la mutacion y permitira reintentar la reconciliacion.

## Requisitos no funcionales

- RNF-1: Las reglas de dominio no dependeran de React ni de HTTP.
- RNF-2: La integracion HTTP no dependera de las pantallas.
- RNF-3: Los componentes compartidos no dependeran de funcionalidades de inventario.
- RNF-4: Las pruebas impediran dependencias no permitidas entre presentacion, aplicacion, dominio e infraestructura.
- RNF-5: Las pruebas caracterizaran los comportamientos actuales antes de reubicarlos.
- RNF-6: Las pantallas, hooks, reconciliaciones y limites arquitectonicos refactorizados contaran con pruebas automatizadas.
- RNF-7: La verificacion visual cubrira escritorio y movil.
- RNF-8: Tests, lint, formato y build disponibles desde la raiz finalizaran sin errores.

## Casos limite

- Listado vacio con y sin filtros activos.
- Error de red al cargar datos.
- Error de validacion de formulario.
- Doble activacion de una accion.
- Mutacion con resultado incierto.
- Reconciliacion aplicada, no aplicada, indeterminada o fallida.
- Articulo inactivo, con stock bajo, agotado o negativo.
- Ausencia de categorias activas.
- Catalogo de categorias con varias paginas durante una reconciliacion.
- Tabla extensa en movil.
- Cambio de tema durante carga, error o formulario.
- Navegacion solo con teclado.
- Preferencia de reduccion de movimiento.
- Catalogo de desarrollo con datos del seed.
- Reintento de una consulta preservando busqueda, filtros y pagina.
- Notificacion transitoria despues de una operacion exitosa.
- Navegacion visible hacia stock bajo.
- Verificacion a 320 px, 390 px y 1440 px, en tema claro y oscuro.
- Respuesta tardia de una consulta anterior despues de cambiar busqueda, filtros o pagina.
- Notificacion de exito reemplazada por una operacion posterior.
- Verificacion de estados segun el tipo de pantalla.
- Contraste de texto normal inferior a 4.5:1 o de texto grande inferior a 3:1 en cualquiera de los temas.
- Carga completada sin que Crear articulo sea utilizable.
- Cambio de busqueda, filtro o pagina que debe mostrar carga o resultados antes de 300 ms.
- Fallo al consultar una pagina posterior durante la reconciliacion de categorias.
- Reconciliacion de categoria completada despues de consultar todas sus paginas.

## Fuera de alcance

- Cambios de API, contratos HTTP, reglas de negocio o esquema de base de datos.
- Nuevas rutas o modulos funcionales.
- Librerias nuevas de router, cache o estado remoto.
- Rediseno que sustituya la identidad TONY photography.
- Cambios de autenticacion, roles, permisos o usuarios.
- Migraciones Prisma, Docker, secretos o despliegue.
- Mejoras backend para resolver la paginacion de categorias; se documentaran en una spec posterior si dejan de ser suficientes.
- Criterios WCAG 2.2 no definidos expresamente en esta spec.

## Criterios de finalizacion

- Todas las pantallas actuales de inventario funcionan contra la API local.
- Se preservan los flujos y reglas de la Spec 001 y la reconciliacion de la Spec 002.
- No existen dependencias prohibidas entre las capas del frontend.
- Los estilos estan separados por responsabilidad sin alterar la identidad visual.
- La interfaz se verifica a 320 px, 390 px y 1440 px en tema claro y oscuro.
- Se verifica en Chrome de escritorio, con cache desactivada, API local disponible y catalogo de desarrollo cargado que la pantalla inicial sea interactiva antes de dos segundos.
- Se verifica que busqueda, filtros y paginacion actualicen el estado visible antes de 300 ms, sin contar red.
- Listados, detalle y formularios demuestran la matriz de estados definida por RF-43.
- Las pruebas arquitectonicas verifican los limites de dependencia definidos.
- La medicion de carga comienza al navegar a `/inventory` y termina cuando se cumplen los controles y estados definidos por RF-42.
- Las pruebas de pantalla cubren la matriz de estados definida por RF-43.
- Las respuestas tardias no reemplazan datos correspondientes a criterios vigentes.
- La interfaz cumple los umbrales de contraste y requisitos de accesibilidad definidos expresamente en esta spec.
- El entorno de rendimiento usa Chrome de escritorio, cache desactivada, API local disponible y catalogo de desarrollo cargado.
- La reconciliacion de categorias verifica la consulta completa del catalogo y el fallo de una pagina posterior.
- `npm run test`, `npm run lint`, `npm run format:check` y `npm run build` finalizan correctamente.

## Dudas abiertas

- Ninguna.
