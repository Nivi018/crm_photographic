# Spec 002 - Mejora del backend de inventario

## Contexto y objetivo

El backend de inventario funciona con responsabilidades concentradas, contratos HTTP inferidos de objetos internos y documentacion Swagger incompleta. Esto provoca respuestas inconsistentes, errores dificiles de diagnosticar y una base local sin datos de desarrollo. Esta iteracion reorganizara las responsabilidades por funcionalidad, establecera contratos publicos explicitos para API y frontend, incorporara datos ficticios repetibles y distinguira la disponibilidad del proceso de la disponibilidad de PostgreSQL, sin alterar las reglas de negocio del inventario definidas en la spec 001.

## Usuarios / actores

- Administrador unico: usa los flujos existentes de inventario a traves de la aplicacion web.
- Desarrollador: inicia el entorno local, carga datos ficticios y diagnostica la disponibilidad del backend y la base de datos.
- Consumidor de API: usa los contratos HTTP documentados para consultar y modificar el inventario.

## Historias de usuario

- H1: Como consumidor de API quiero recibir respuestas consistentes y documentadas para integrar el inventario sin depender de detalles internos.
- H2: Como administrador quiero conservar los flujos actuales de inventario despues de normalizar los contratos de la API.
- H3: Como desarrollador quiero cargar datos ficticios repetibles para probar el inventario localmente.
- H4: Como desarrollador quiero distinguir si falla la API o PostgreSQL para diagnosticar el entorno local.
- H5: Como equipo quiero responsabilidades de backend separadas por funcionalidad para poder modificar y probar cada caso de uso de forma aislada.

## Requisitos funcionales (criterios de aceptacion en EARS)

- RF-1: EL SISTEMA organizara las responsabilidades de articulos, categorias, movimientos y disponibilidad por funcionalidad dentro de sus capas de dominio, aplicacion, infraestructura y presentacion.
- RF-2: EL SISTEMA representara cada una de las operaciones actuales de inventario mediante un caso de uso independiente y comprobable.
- RF-3: EL SISTEMA mantendra los contratos de entrada y salida de cada caso de uso en modulos fisicos distintos de su implementacion ejecutable.
- RF-4: EL SISTEMA agrupara los elementos de presentacion por funcionalidad e incluira con cada funcionalidad sus DTOs de entrada y salida.
- RF-5: EL SISTEMA mantendra las reglas de negocio de inventario aprobadas en la spec 001, excepto por los cambios de contratos HTTP aprobados en esta spec.
- RF-6: EL SISTEMA no expondra entidades de dominio, campos internos de normalizacion ni detalles de persistencia en las respuestas HTTP publicas.
- RF-7: EL SISTEMA definira DTOs tipados y validados para cada body, parametro de ruta y consulta que reciba cualquier endpoint de la API.
- RF-8: EL SISTEMA definira DTOs de respuesta tipados para cada respuesta exitosa de inventario, health y disponibilidad.
- RF-9: CUANDO una operacion individual se complete correctamente, EL SISTEMA devolvera el recurso mediante una respuesta con la propiedad `data`.
- RF-10: CUANDO una consulta paginada se complete correctamente, EL SISTEMA devolvera los recursos mediante `data` y devolvera mediante `meta` las propiedades `page`, `pageSize`, `totalItems` y `totalPages`.
- RF-11: CUANDO no existan resultados y el consumidor solicite la pagina 1, EL SISTEMA respondera HTTP 200 con `data` vacio y `meta.totalPages` igual a cero.
- RF-12: SI el consumidor solicita una pagina mayor que `totalPages` en una coleccion con resultados, ENTONCES EL SISTEMA respondera HTTP 400 con el codigo `VALIDATION_ERROR`.
- RF-13: EL SISTEMA representara un articulo publico mediante `id` y `categoryId` UUID en texto, `name` texto, `type` con valor `SALE` o `INTERNAL_SUPPLY`, `initialStock`, `currentStock` y `minimumStock` enteros, `isActive` y `hasLowStock` booleanos, y `version` entero no negativo.
- RF-14: EL SISTEMA representara una categoria publica mediante `id` UUID en texto, `name` texto, `isActive` booleano y `version` entero no negativo.
- RF-15: EL SISTEMA representara un movimiento publico mediante `id` y `articleId` UUID en texto, `sequence` como texto decimal, `kind` con valor `ENTRY`, `EXIT` o `ADJUSTMENT`, `source` con valor `INITIAL_STOCK` o `MANUAL`, `adjustmentMode` con valor `FINAL_STOCK`, `DELTA` o nulo, `appliedQuantity`, `stockBefore` y `stockAfter` enteros, `reason` texto y `occurredAt` texto ISO 8601.
- RF-16: CUANDO el administrador registre una entrada, salida o ajuste correctamente, EL SISTEMA devolvera mediante `data` las propiedades `article` y `movement` con los contratos publicos definidos.
- RF-17: CUANDO una eliminacion se complete correctamente, EL SISTEMA respondera HTTP 200 con `{ data: { id } }`.
- RF-18: EL SISTEMA representara `occurredAt` mediante una fecha y hora ISO 8601.
- RF-19: EL SISTEMA conservara en las respuestas publicas los valores validos cero, negativos, booleanos `false`, valores nulos permitidos y secuencias de movimiento sin omitirlos por serializacion.
- RF-20: SI el recurso objetivo de una ruta de inventario existente no existe, ENTONCES EL SISTEMA respondera HTTP 404 con el codigo `NOT_FOUND` y no devolvera una respuesta exitosa con valor nulo.
- RF-21: CUANDO ocurra una condicion asignada a HTTP 400 por RF-64 a RF-70, EL SISTEMA respondera con el codigo definido para esa condicion.
- RF-22: CUANDO ocurra una condicion asignada a HTTP 409 por RF-72 a RF-74, EL SISTEMA respondera con el codigo definido para esa condicion.
- RF-23: SI ocurre un error inesperado, ENTONCES EL SISTEMA respondera HTTP 500 con el codigo `INTERNAL_ERROR` sin exponer credenciales, cadenas de conexion, trazas ni detalles internos.
- RF-24: EL SISTEMA representara los errores mediante `code` y `message` como texto, `statusCode` como entero y `details` unicamente cuando aplique.
- RF-25: DONDE el error sea de validacion, EL SISTEMA representara `details` mediante `{ fields: [{ field, message }] }`.
- RF-26: DONDE el error requiera confirmar stock negativo, EL SISTEMA representara `details` mediante `{ stockAfter }`.
- RF-27: EL SISTEMA documentara en Swagger los DTOs de entrada, las respuestas exitosas y las respuestas de error aplicables para todos los endpoints de inventario, health y disponibilidad.
- RF-28: EL SISTEMA hara que el documento OpenAPI generado y las respuestas HTTP reales coincidan en propiedades, tipos, nulabilidad, estados HTTP y codigos de error.
- RF-29: CUANDO cambien los contratos de respuesta de la API, EL SISTEMA adaptara el consumidor web y sus pruebas para usar los contratos normalizados sin perder los flujos actuales de inventario.
- RF-30: CUANDO el desarrollador ejecute el seed local de forma explicita con `NODE_ENV=development`, EL SISTEMA creara datos ficticios de categorias, articulos y movimientos que cumplan las reglas de inventario.
- RF-31: EL SISTEMA incluira en el seed ficticio ambos tipos de articulo, categorias activas e inactivas, articulos activos e inactivos, stock normal y bajo, entradas, salidas, ajustes por existencia final y ajustes por diferencia.
- RF-32: CUANDO el desarrollador ejecute el seed local mas de una vez, EL SISTEMA no creara duplicados ni modificara, eliminara, reactivara, reasignara o versionara registros que ya existian.
- RF-33: CUANDO el seed local encuentre un estado parcial de sus datos ficticios, EL SISTEMA agregara solo los registros ficticios faltantes que no requieran alterar registros existentes.
- RF-34: SI el seed local encuentra un registro ajeno con el mismo nombre normalizado que un dato ficticio, ENTONCES EL SISTEMA omitira el dato ficticio en conflicto y sus articulos o movimientos dependientes, conservara los registros existentes e informara las omisiones.
- RF-35: CUANDO el seed local termine, EL SISTEMA informara los registros ficticios creados y omitidos sin revelar informacion sensible.
- RF-36: SI el seed local falla, ENTONCES EL SISTEMA no dejara datos ficticios creados por esa ejecucion.
- RF-37: SI dos ejecuciones de seed local ocurren simultaneamente, ENTONCES EL SISTEMA garantizara un estado final equivalente a una sola ejecucion y sin duplicados.
- RF-38: SI un articulo ficticio existente carece del movimiento de stock inicial y agregarlo alteraria su stock o version, ENTONCES EL SISTEMA omitira ese movimiento e informara la omision.
- RF-39: SI `NODE_ENV` no es exactamente `development`, ENTONCES EL SISTEMA impedira la ejecucion del seed local sin modificar datos.
- RF-40: EL SISTEMA no incluira datos reales del estudio, credenciales ni cadenas de conexion en los datos ficticios, codigo de seed o salida del seed.
- RF-41: EL SISTEMA conservara en `GET /health` una comprobacion de disponibilidad del proceso que respondera HTTP 200 con `{ data: { status: "ok" } }` aunque PostgreSQL no este disponible.
- RF-42: CUANDO el desarrollador consulte `GET /health/ready` y PostgreSQL acepte una consulta sin escrituras que valide las tablas y columnas del esquema Prisma aprobado al cerrar esta spec, EL SISTEMA respondera HTTP 200 con `{ data: { status: "ready", database: "available" } }`.
- RF-43: SI falta la configuracion de base de datos, PostgreSQL no acepta conexiones, la comprobacion alcanza dos segundos sin completarse o las estructuras de categorias, articulos y movimientos no estan disponibles, ENTONCES EL SISTEMA respondera HTTP 503 con el codigo `SERVICE_UNAVAILABLE` sin exponer informacion sensible.
- RF-44: CUANDO PostgreSQL se recupere despues de una interrupcion temporal, EL SISTEMA permitira que una comprobacion posterior informe disponibilidad sin reiniciar el proceso.
- RF-45: EL SISTEMA cerrara los recursos de acceso a base de datos que posea cuando el proceso se cierre.
- RF-46: SI un identificador de ruta no es un UUID valido, ENTONCES EL SISTEMA respondera HTTP 400 con detalles de validacion para el identificador.
- RF-47: SI un booleano de consulta no es el literal `true` o `false`, ENTONCES EL SISTEMA respondera HTTP 400 con detalles de validacion para ese campo.
- RF-48: EL SISTEMA implementara casos de uso independientes para crear, obtener, listar, listar stock bajo, editar, desactivar, reactivar y eliminar articulos.
- RF-49: EL SISTEMA implementara casos de uso independientes para crear, listar, editar, desactivar, reactivar y eliminar categorias.
- RF-50: EL SISTEMA implementara casos de uso independientes para listar movimientos globales, listar movimientos por articulo, registrar entradas, registrar salidas, ajustar existencia final y ajustar por diferencia.
- RF-51: EL SISTEMA implementara casos de uso independientes para health y disponibilidad de PostgreSQL.
- RF-52: CUANDO el consumidor consulte el historial de un articulo existente sin movimientos, EL SISTEMA respondera HTTP 200 con `data` vacio y los metadatos de paginacion definidos.
- RF-53: CUANDO una creacion o registro de movimiento se complete correctamente, EL SISTEMA devolvera el estado persistido final de los recursos incluidos en la respuesta.
- RF-54: CUANDO el sistema cree un articulo con stock inicial positivo, EL SISTEMA devolvera un `currentStock` igual al stock resultante despues de registrar el movimiento automatico de stock inicial.
- RF-55: CUANDO el sistema devuelva un articulo y un movimiento en la misma respuesta, EL SISTEMA devolvera `article.currentStock` igual a `movement.stockAfter`.
- RF-56: EL SISTEMA mantendra cada entidad de dominio, sus propiedades y sus errores en modulos fisicos distintos.
- RF-57: CUANDO un endpoint HTTP cree un articulo, categoria o movimiento, EL SISTEMA respondera HTTP 201.
- RF-58: CUANDO un endpoint HTTP consulte, edite, desactive, reactive o elimine un recurso, EL SISTEMA respondera HTTP 200.
- RF-59: SI una coleccion no tiene resultados y el consumidor solicita una pagina mayor que 1, ENTONCES EL SISTEMA respondera HTTP 400 con el codigo `VALIDATION_ERROR`.
- RF-60: EL SISTEMA identificara cada categoria, articulo y movimiento ficticio del seed mediante un UUID fijo reservado.
- RF-61: SI un UUID reservado del seed existe con contenido distinto del dato ficticio esperado, ENTONCES EL SISTEMA lo tratara como registro ajeno, lo omitira junto con sus dependientes e informara las omisiones.
- RF-62: CUANDO todas las entradas del seed se omitan por colisiones validas, EL SISTEMA terminara correctamente e informara cero registros creados.
- RF-63: CUANDO el seed termine, EL SISTEMA informara las cantidades creadas y omitidas de categorias, articulos y movimientos, y en cada omision incluira `code` y `message`.
- RF-64: CUANDO una peticion, texto, tipo, cantidad o conteo sea invalido, EL SISTEMA respondera HTTP 400 con el codigo `VALIDATION_ERROR`.
- RF-65: CUANDO un articulo inactivo reciba una operacion no permitida, EL SISTEMA respondera HTTP 400 con el codigo `ARTICLE_INACTIVE`.
- RF-66: CUANDO una categoria inactiva se use en una operacion no permitida o no existan categorias activas disponibles, EL SISTEMA respondera HTTP 400 con el codigo `CATEGORY_INACTIVE`.
- RF-67: CUANDO una operacion requiera confirmar stock negativo, EL SISTEMA respondera HTTP 400 con el codigo `NEGATIVE_STOCK_CONFIRMATION_REQUIRED`.
- RF-68: CUANDO una operacion requiera una nueva confirmacion, EL SISTEMA respondera HTTP 400 con el codigo `RECONFIRMATION_REQUIRED`.
- RF-69: CUANDO una operacion produzca stock fuera de rango, EL SISTEMA respondera HTTP 400 con el codigo `STOCK_OUT_OF_RANGE`.
- RF-70: CUANDO un ajuste no produzca diferencia de stock, EL SISTEMA respondera HTTP 400 con el codigo `NO_STOCK_DIFFERENCE`.
- RF-71: CUANDO un recurso o categoria asociada no exista, EL SISTEMA respondera HTTP 404 con el codigo `NOT_FOUND`.
- RF-72: CUANDO un nombre de articulo o categoria este duplicado, EL SISTEMA respondera HTTP 409 con el codigo `NAME_CONFLICT`.
- RF-73: CUANDO una asociacion o eliminacion este bloqueada por stock o movimientos, EL SISTEMA respondera HTTP 409 con el codigo `DEPENDENCY_CONFLICT`.
- RF-74: CUANDO un conflicto de version agote los reintentos permitidos, EL SISTEMA respondera HTTP 409 con el codigo `CONCURRENT_MODIFICATION`.
- RF-75: EL SISTEMA representara las respuestas paginadas con `data` como lista, `page` y `pageSize` como enteros positivos, y `totalItems` y `totalPages` como enteros no negativos.
- RF-76: CUANDO todos los UUID fijos del seed y sus contenidos coincidan con el catalogo ficticio esperado, EL SISTEMA terminara correctamente, informara cero registros creados y contara los registros existentes como omitidos.
- RF-77: SI la construccion o serializacion de una respuesta publica falla despues de persistir una operacion y antes de iniciar el envio HTTP, ENTONCES EL SISTEMA conservara los datos persistidos y respondera HTTP 500 con el codigo `INTERNAL_ERROR` sin exponer detalles internos.
- RF-78: SI una mutacion HTTP se envio y termina con HTTP 500, tiempo agotado, corte de red o cierre de conexion, ENTONCES EL SISTEMA la tratara como resultado incierto y no la reintentara automaticamente desde el frontend.
- RF-79: SI una mutacion HTTP tiene resultado incierto, ENTONCES EL SISTEMA volvera a consultar el recurso, detalle, historial o listado afectado antes de decidir si puede intentarse otra vez desde el frontend.
- RF-80: SI una mutacion HTTP tiene resultado incierto, ENTONCES EL SISTEMA informara que el resultado debe verificarse mientras se reconcilian los datos.
- RF-81: EL SISTEMA usara UUID validos y distintos entre si para cada dato ficticio reservado del catalogo de seed.
- RF-82: EL SISTEMA usara en cada omision del seed uno de los codigos `ALREADY_EXISTS`, `NAME_CONFLICT`, `RESERVED_ID_CONFLICT`, `DEPENDENCY_SKIPPED` o `EXISTING_RECORD_PRESERVED`.
- RF-83: SI la consulta de reconciliacion confirma que una mutacion con resultado incierto fue aplicada, ENTONCES EL SISTEMA la mostrara como completada y no ofrecera el mismo reintento.
- RF-84: SI la consulta de reconciliacion confirma que una mutacion con resultado incierto no fue aplicada, ENTONCES EL SISTEMA habilitara un reintento manual.
- RF-85: SI la consulta de reconciliacion no permite determinar si una mutacion con resultado incierto fue aplicada, ENTONCES EL SISTEMA mostrara los datos actuales, mantendra bloqueado el reintento y solicitara confirmacion del administrador antes de habilitarlo.
- RF-86: SI falla la consulta de reconciliacion de una mutacion con resultado incierto, ENTONCES EL SISTEMA mantendra bloqueada la mutacion y permitira reintentar unicamente la consulta.
- RF-87: CUANDO un dato ficticio del seed coincida exactamente con un registro existente, EL SISTEMA usara el codigo `ALREADY_EXISTS` para informar la omision.
- RF-88: CUANDO un dato ficticio del seed colisione con un registro existente por nombre normalizado, EL SISTEMA usara el codigo `NAME_CONFLICT` para informar la omision.
- RF-89: CUANDO un UUID reservado del seed coincida con un registro de contenido incompatible, EL SISTEMA usara el codigo `RESERVED_ID_CONFLICT` para informar la omision.
- RF-90: CUANDO un dato ficticio del seed se omita por depender de otro dato omitido, EL SISTEMA usara el codigo `DEPENDENCY_SKIPPED` para informar la omision.
- RF-91: CUANDO un dato ficticio del seed se omita porque completarlo alteraria un registro existente, EL SISTEMA usara el codigo `EXISTING_RECORD_PRESERVED` para informar la omision.

## Requisitos no funcionales

- RNF-1: El dominio de inventario no dependera de NestJS, Prisma, Swagger, DTOs HTTP ni detalles de transporte.
- RNF-2: La infraestructura de Prisma permanecera detras de repositorios o adaptadores y no sera importada por dominio ni casos de uso.
- RNF-3: Cada respuesta publica de la API debera validarse mediante pruebas de contrato que rechacen propiedades requeridas ausentes y propiedades no documentadas.
- RNF-4: Las pruebas de Swagger deberan verificar los esquemas y estados de todas las operaciones expuestas, no solo la presencia de rutas.
- RNF-5: El seed local debera ser repetible, no destructivo y transaccional respecto de los datos ficticios que cree en una ejecucion.
- RNF-6: La comprobacion de disponibilidad de PostgreSQL debera terminar en un maximo de dos segundos y no realizara escrituras.
- RNF-7: Tests, lint, formato y build disponibles desde la raiz deberan completarse sin errores antes de cerrar la iteracion.

## Casos limite

- Listados vacios en pagina 1 y solicitud de una pagina mayor que 1 sin resultados.
- Respuesta paginada con `data` vacio, `page` y `pageSize` positivos, y totales en cero.
- Recurso objetivo inexistente en una ruta actual y articulo existente sin movimientos en su historial.
- Identificador de ruta que no es UUID y booleano de consulta distinto de `true` o `false`.
- Eliminacion exitosa con HTTP 200 y `{ data: { id } }`.
- Movimiento con cantidad aplicada positiva o negativa segun las reglas de negocio vigentes.
- Movimiento con modo de ajuste nulo y con secuencia fuera del rango seguro de numeros JSON.
- Error de confirmacion de stock negativo con `stockAfter` para diferenciar una advertencia de una validacion ordinaria.
- Validacion de cantidad decimal, cantidad fuera de rango, diferencia cero, nombre demasiado largo, motivo demasiado largo y propiedad HTTP no permitida.
- Error de conflicto concurrente en articulos y categorias.
- Error inesperado sin exposicion de detalles internos.
- Error de acceso a base de datos sin `DATABASE_URL`, con credenciales invalidas, conexion rechazada, comprobacion que alcanza dos segundos sin completarse, consulta bloqueada o esquema de inventario ausente.
- Recuperacion de PostgreSQL despues de una comprobacion de no disponibilidad.
- Primera ejecucion del seed sobre una base vacia.
- Ejecucion repetida del seed sobre sus propios datos ficticios.
- Ejecucion del seed con categorias ficticias existentes, articulos ficticios ausentes o movimientos ficticios parcialmente presentes.
- Colision por nombre normalizado entre un registro existente y un dato ficticio del seed.
- UUID fijo reservado del seed ocupado por un registro con contenido diferente.
- Articulos y movimientos ficticios dependientes de una categoria omitida por colision.
- Ejecucion del seed con todas sus entradas omitidas por colisiones validas.
- Ejecucion repetida con todo el catalogo ficticio existente y coincidente.
- Ejecuciones simultaneas del seed.
- Fallo durante la creacion de una categoria, articulo o movimiento ficticio.
- Articulo ficticio con movimiento de stock inicial existente antes de otra ejecucion del seed.
- Articulo ficticio sin movimiento de stock inicial cuando agregarlo alteraria stock o version.
- Creacion de articulo con stock inicial positivo y respuesta con estado persistido final.
- Respuesta de movimiento con `article.currentStock` distinto de `movement.stockAfter`.
- Fallo de construccion o serializacion de una respuesta publica despues de persistir una operacion y antes de enviar encabezados o contenido HTTP.
- Reconciliacion del frontend antes de repetir una mutacion con resultado incierto.
- Tiempo agotado, corte de red o cierre de conexion sin respuesta HTTP despues de enviar una mutacion.
- Reconciliacion que confirma la mutacion aplicada, no aplicada o indeterminada.
- Fallo repetido de la consulta de reconciliacion.
- UUID duplicado dentro del catalogo ficticio de seed.
- Respuesta HTTP real que diverge del DTO publicado en Swagger.

## Fuera de alcance

- Nuevas reglas de negocio de inventario distintas de las aprobadas en la spec 001.
- Modulos de ventas, clientes, citas, facturacion, compras, proveedores o reservas de stock.
- Autenticacion, autorizacion, roles o administracion de usuarios.
- Migraciones Prisma, cambios de esquema de base de datos o borrado de datos sin aprobacion explicita posterior.
- Seed destructivo, truncado de tablas o reemplazo de datos existentes.
- Datos reales del estudio, credenciales, archivos `.env` o cadenas de conexion reales.
- Docker, `docker-compose`, infraestructura cloud o despliegue productivo.
- Plataformas externas de monitoreo, trazabilidad distribuida o metricas de infraestructura.
- Rediseño visual, rutas nuevas o cambios de experiencia en frontend no necesarios para adaptar los contratos HTTP.
- Consultas individuales nuevas de categorias o movimientos.
- Garantias de health o disponibilidad despues de que el proceso inicie su cierre.
- Garantizar un nuevo estado HTTP despues de comenzar a enviar encabezados o contenido de una respuesta.
- Edicion o eliminacion de movimientos, importacion/exportacion masiva y auditoria visible del stock inicial.

## Criterios de finalizacion

- Todos los requisitos funcionales tienen pruebas en verde.
- Los contratos de entrada, salida y error de cada endpoint de la API cuentan con pruebas de respuesta HTTP y de OpenAPI.
- El frontend consume los envelopes normalizados y sus flujos existentes de articulos, categorias, movimientos, historial y alertas continuan funcionando.
- Una mutacion con resultado incierto se reconcilia en el frontend sin reintento automatico.
- El flujo de reconciliacion demuestra los resultados aplicado, no aplicado, indeterminado y consulta fallida.
- El seed se demuestra sobre una base local vacia, en ejecucion repetida, concurrente y ante datos existentes no relacionados, en conflicto o parciales que no pueden alterarse.
- La comprobacion de proceso y la comprobacion de PostgreSQL se demuestran de forma independiente, incluyendo configuracion ausente, base no disponible, tiempo agotado, esquema ausente y recuperacion.
- Tests, lint, formato y build disponibles se ejecutan desde la raiz sin errores.
- Cualquier script de verificacion inexistente se reporta explicitamente.

## Dudas abiertas

- Ninguna.
