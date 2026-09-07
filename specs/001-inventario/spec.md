# Spec 001 - Inventario del estudio fotografico

## Contexto y objetivo

El estudio fotografico necesita controlar en un mismo inventario los productos destinados a venta y los insumos utilizados internamente. Esta funcionalidad permitira conocer las existencias, registrar sus cambios, detectar niveles bajos y conservar un historial de movimientos; la edicion del stock inicial no tendra auditoria visible hasta una spec futura.

## Usuarios / actores

- Administrador unico: puede realizar todas las operaciones del inventario.
- No existen roles ni diferencias de permisos en esta iteracion.

## Historias de usuario

- H1: Como administrador quiero registrar articulos para conocer los productos e insumos que forman parte del inventario.
- H2: Como administrador quiero consultar y modificar articulos para mantener actualizada su informacion.
- H3: Como administrador quiero registrar entradas y salidas para conocer las existencias actuales.
- H4: Como administrador quiero ajustar existencias para corregir diferencias detectadas mediante un conteo fisico.
- H5: Como administrador quiero buscar y filtrar articulos para localizar informacion especifica.
- H6: Como administrador quiero identificar articulos con stock bajo para decidir cuando reponerlos.
- H7: Como administrador quiero consultar los movimientos registrados y los valores de stock conservados en cada uno.
- H8: Como administrador quiero crear, editar, desactivar, reactivar y eliminar categorias permitidas para clasificar los articulos.

## Requisitos funcionales (criterios de aceptacion en EARS)

- RF-1: CUANDO el administrador cree un articulo, EL SISTEMA exigira nombre, tipo, categoria, stock inicial y stock minimo.
- RF-2: EL SISTEMA clasificara cada articulo como producto para venta o insumo interno.
- RF-3: EL SISTEMA solo aceptara cantidades enteras para el stock inicial.
- RF-4: EL SISTEMA solo aceptara cantidades enteras para el stock minimo.
- RF-5: EL SISTEMA no aceptara cantidades negativas como stock inicial.
- RF-6: EL SISTEMA no aceptara cantidades negativas como stock minimo.
- RF-7: SI existe otro articulo con el mismo nombre ignorando mayusculas, acentos y espacios exteriores, ENTONCES EL SISTEMA rechazara la creacion e informara del conflicto.
- RF-8: CUANDO el administrador consulte un articulo, EL SISTEMA mostrara sus datos y su stock actual.
- RF-9: CUANDO el administrador edite un articulo, EL SISTEMA validara nombre, tipo, categoria activa, stock inicial y stock minimo.
- RF-10: SI el nuevo nombre de un articulo coincide con otro nombre existente ignorando mayusculas, acentos y espacios exteriores, ENTONCES EL SISTEMA rechazara el cambio e informara del conflicto.
- RF-11: CUANDO el administrador desactive cualquier articulo, EL SISTEMA conservara el articulo y sus movimientos existentes.
- RF-12: MIENTRAS un articulo este desactivado, EL SISTEMA permitira consultar sus datos y su historial.
- RF-13: MIENTRAS un articulo este desactivado, EL SISTEMA no permitira editarlo.
- RF-14: MIENTRAS un articulo este desactivado, EL SISTEMA no permitira registrar entradas, salidas ni ajustes sobre el.
- RF-15: CUANDO el administrador reactive un articulo asociado a una categoria activa, EL SISTEMA permitira la reactivacion.
- RF-16: SI el administrador intenta reactivar un articulo asociado a una categoria inactiva, ENTONCES EL SISTEMA permitira cambiar unicamente la categoria como excepcion a la prohibicion de editarlo y exigira seleccionar una categoria activa.
- RF-17: CUANDO el administrador registre una entrada, EL SISTEMA exigira una cantidad entera mayor que cero.
- RF-18: CUANDO el administrador registre una entrada, EL SISTEMA exigira un motivo.
- RF-19: CUANDO se acepte una entrada, EL SISTEMA incrementara el stock actual por la cantidad registrada.
- RF-20: CUANDO el administrador registre una salida, EL SISTEMA exigira una cantidad entera mayor que cero.
- RF-21: CUANDO el administrador registre una salida, EL SISTEMA exigira un motivo.
- RF-22: CUANDO se acepte una salida que no supere el stock disponible, EL SISTEMA disminuira el stock actual por la cantidad registrada.
- RF-23: SI una salida supera el stock disponible, ENTONCES EL SISTEMA advertira que la operacion producira stock negativo.
- RF-24: CUANDO el administrador confirme una salida que supera el stock disponible, EL SISTEMA registrara la salida.
- RF-25: CUANDO el administrador confirme una salida que supera el stock disponible, EL SISTEMA permitira que el stock resultante sea negativo dentro del rango permitido.
- RF-26: SI el administrador no confirma una salida que supera el stock disponible, ENTONCES EL SISTEMA no registrara el movimiento.
- RF-27: CUANDO el administrador registre un ajuste por existencia final, EL SISTEMA exigira una cantidad entera igual o mayor que cero.
- RF-28: CUANDO se acepte un ajuste por existencia final, EL SISTEMA reemplazara el stock actual por la cantidad indicada.
- RF-29: CUANDO el administrador registre un ajuste por diferencia, EL SISTEMA exigira una cantidad entera distinta de cero.
- RF-30: CUANDO el administrador registre un ajuste por diferencia, EL SISTEMA exigira un motivo.
- RF-31: CUANDO se acepte un ajuste por diferencia que no deje stock negativo, EL SISTEMA sumara o restara la diferencia indicada al stock actual.
- RF-32: SI un ajuste por diferencia deja stock negativo, ENTONCES EL SISTEMA advertira que la operacion producira stock negativo.
- RF-33: CUANDO el administrador confirme un ajuste por diferencia que deja stock negativo, EL SISTEMA registrara el ajuste si el resultado queda dentro del rango permitido.
- RF-34: SI el administrador no confirma un ajuste por diferencia que deja stock negativo, ENTONCES EL SISTEMA no registrara el ajuste.
- RF-35: SI el administrador intenta registrar un ajuste por existencia final negativa, ENTONCES EL SISTEMA rechazara el ajuste.
- RF-36: EL SISTEMA conservara un historial de entradas, salidas y ajustes.
- RF-37: EL SISTEMA no permitira editar movimientos registrados.
- RF-38: EL SISTEMA no permitira eliminar movimientos registrados.
- RF-39: CUANDO sea necesario corregir un movimiento, EL SISTEMA permitira registrar un ajuste nuevo.
- RF-40: EL SISTEMA mostrara en cada movimiento el tipo de movimiento, cantidad aplicada, motivo, fecha y hora automatica, stock anterior y stock posterior.
- RF-41: DONDE el movimiento sea un ajuste, EL SISTEMA mostrara si el ajuste fue por existencia final o por diferencia.
- RF-42: CUANDO el administrador busque por nombre, EL SISTEMA mostrara los articulos cuyo nombre tenga coincidencia parcial con el criterio ignorando mayusculas, acentos y espacios exteriores.
- RF-43: CUANDO el administrador filtre por tipo, EL SISTEMA mostrara los articulos del tipo seleccionado.
- RF-44: CUANDO el administrador filtre por una categoria activa o inactiva, EL SISTEMA mostrara los articulos de la categoria seleccionada.
- RF-45: CUANDO el administrador filtre por estado, EL SISTEMA mostrara los articulos activos o inactivos segun el estado seleccionado.
- RF-46: MIENTRAS un articulo activo tenga stock actual igual o menor que su stock minimo, EL SISTEMA identificara el articulo con una alerta de stock bajo.
- RF-47: CUANDO el administrador cree una categoria, EL SISTEMA exigira un nombre.
- RF-48: SI existe otra categoria con el mismo nombre ignorando mayusculas, acentos y espacios exteriores, ENTONCES EL SISTEMA rechazara la creacion e informara del conflicto.
- RF-49: CUANDO el administrador edite una categoria, EL SISTEMA validara que el nombre no quede vacio.
- RF-50: SI el nuevo nombre de una categoria coincide con otra categoria ignorando mayusculas, acentos y espacios exteriores, ENTONCES EL SISTEMA rechazara el cambio e informara del conflicto.
- RF-51: CUANDO el administrador desactive una categoria sin articulos activos asociados, EL SISTEMA permitira la operacion aunque existan articulos inactivos asociados.
- RF-52: SI el administrador intenta desactivar una categoria con articulos activos asociados, ENTONCES EL SISTEMA bloqueara la desactivacion e indicara que primero debe reasignar o desactivar esos articulos.
- RF-53: CUANDO el administrador edite el stock inicial de un articulo, EL SISTEMA recalculara el stock actual sustituyendo internamente la cantidad de la entrada "Stock inicial" por el nuevo valor y aplicando despues cada movimiento posterior por su cantidad aplicada originalmente, incluidos los ajustes por existencia final.
- RF-54: CUANDO el administrador edite el stock inicial de un articulo, EL SISTEMA conservara sin cambios el stock anterior y posterior guardado en los movimientos existentes.
- RF-55: CUANDO el administrador edite el stock inicial de un articulo, EL SISTEMA no creara un movimiento ni evento visible en esta iteracion.
- RF-56: CUANDO el administrador cree o edite un articulo, EL SISTEMA permitira seleccionar solo categorias activas.
- RF-57: CUANDO el administrador registre un ajuste por existencia final, EL SISTEMA registrara automaticamente el motivo "Ajuste de inventario".
- RF-58: DONDE el movimiento sea un ajuste por existencia final, EL SISTEMA mostrara como cantidad la diferencia aplicada entre el stock anterior y la existencia final indicada.
- RF-59: CUANDO el sistema acepte una entrada, salida o ajuste, EL SISTEMA generara automaticamente la fecha y hora del movimiento.
- RF-60: PARA validar RF-7 y RF-10, EL SISTEMA considerara como conflicto tanto los articulos activos como los inactivos.
- RF-61: PARA validar RF-48 y RF-50, EL SISTEMA considerara como conflicto tanto las categorias activas como las inactivas.
- RF-62: EL SISTEMA listara articulos activos e inactivos por nombre ascendente ignorando mayusculas y acentos, 25 por pagina, sin requerir una busqueda previa.
- RF-63: EL SISTEMA listara categorias activas e inactivas por nombre ascendente ignorando mayusculas y acentos, 25 por pagina, sin requerir una busqueda previa.
- RF-64: EL SISTEMA listara entradas, salidas y ajustes por fecha y hora descendente, 25 por pagina, sin requerir una busqueda previa; en empate ordenara por articulo ascendente ignorando mayusculas y acentos, y si persiste el empate mostrara primero el ultimo movimiento registrado.
- RF-65: EL SISTEMA listara por nombre ascendente ignorando mayusculas y acentos, 25 por pagina, los articulos activos cuyo stock actual sea igual o menor que su stock minimo.
- RF-66: CUANDO el administrador combine busqueda por nombre, tipo, categoria y estado, EL SISTEMA aplicara todos los criterios activos al listado resultante.
- RF-67: CUANDO el administrador confirme una entrada, salida, ajuste o edicion de stock inicial, EL SISTEMA revalidara la operacion usando el estado mas reciente del articulo.
- RF-68: SI el estado cambia durante una confirmacion, ENTONCES EL SISTEMA recalculara la operacion y solicitara nueva confirmacion solo cuando cambie el resultado calculado o la advertencia aplicable.
- RF-69: CUANDO el administrador cree un articulo con stock inicial mayor que cero, EL SISTEMA creara el articulo con stock actual cero y generara una entrada automatica que establezca una sola vez la existencia indicada.
- RF-70: CUANDO el sistema genere la entrada automatica de stock inicial, EL SISTEMA registrara el motivo "Stock inicial".
- RF-71: CUANDO el administrador reactive una categoria inactiva, EL SISTEMA conservara la categoria como activa.
- RF-72: CUANDO el administrador elimine un articulo sin movimientos y con stock actual cero, EL SISTEMA retirara permanentemente el articulo del inventario.
- RF-73: SI el administrador intenta eliminar un articulo con movimientos o con stock actual distinto de cero, ENTONCES EL SISTEMA bloqueara la eliminacion e indicara que debe desactivarlo o dejar su stock en cero, segun corresponda.
- RF-74: CUANDO el administrador elimine una categoria sin articulos asociados, EL SISTEMA retirara permanentemente la categoria del inventario.
- RF-75: SI el administrador intenta eliminar una categoria con articulos asociados, ENTONCES EL SISTEMA bloqueara la eliminacion e indicara que primero debe reasignar los articulos asociados.
- RF-76: SI el administrador intenta crear un articulo sin categorias activas disponibles, ENTONCES EL SISTEMA bloqueara el alta e indicara que primero debe crear o reactivar una categoria.
- RF-77: SI el nombre de un articulo supera 150 caracteres, ENTONCES EL SISTEMA rechazara la operacion e informara del limite.
- RF-78: SI el nombre de una categoria supera 150 caracteres, ENTONCES EL SISTEMA rechazara la operacion e informara del limite.
- RF-79: SI el motivo de una entrada, salida o ajuste por diferencia supera 500 caracteres, ENTONCES EL SISTEMA rechazara la operacion e informara del limite.
- RF-80: SI editar el stock inicial produce stock actual negativo, ENTONCES EL SISTEMA advertira el resultado negativo antes de aplicar el cambio.
- RF-81: CUANDO el administrador confirme una edicion de stock inicial que produce stock actual negativo, EL SISTEMA aplicara el cambio si el resultado queda dentro del rango permitido.
- RF-82: CUANDO el sistema cree un articulo con stock inicial mayor que cero, EL SISTEMA guardara el articulo y la entrada automatica como una operacion indivisible.
- RF-83: SI no puede guardarse la entrada automatica de stock inicial, ENTONCES EL SISTEMA no creara el articulo.
- RF-84: CUANDO el administrador cree un articulo, EL SISTEMA lo creara activo.
- RF-85: CUANDO el administrador cree una categoria, EL SISTEMA la creara activa.
- RF-86: SI el administrador registra un ajuste por existencia final igual al stock actual, ENTONCES EL SISTEMA no registrara el ajuste e informara que no existe diferencia.
- RF-87: DONDE un movimiento aumente el stock, EL SISTEMA mostrara la cantidad aplicada con signo positivo.
- RF-88: DONDE un movimiento disminuya el stock, EL SISTEMA mostrara la cantidad aplicada con signo negativo.
- RF-89: CUANDO el administrador capture un nombre de articulo o categoria, EL SISTEMA recortara espacios exteriores antes de validar y rechazara el texto si queda vacio.
- RF-90: CUANDO el administrador capture un motivo, EL SISTEMA recortara espacios exteriores antes de validar y rechazara el texto si queda vacio.
- RF-91: CUANDO dos operaciones sobre el mismo articulo se confirmen simultaneamente, EL SISTEMA registrara una primero y hara que la otra reintente automaticamente una sola vez con el estado actualizado.
- RF-92: EL SISTEMA ofrecera un control visible para cambiar entre tema claro y tema oscuro.
- RF-93: CUANDO el administrador cambie manualmente el tema, EL SISTEMA conservara la seleccion para visitas posteriores.
- RF-94: SI no existe preferencia de tema guardada, ENTONCES EL SISTEMA usara tema claro.
- RF-95: EL SISTEMA aceptara stock inicial y stock minimo solo entre 0 y 999,999,999.
- RF-96: EL SISTEMA aceptara cantidades de entrada y salida solo entre 1 y 999,999,999.
- RF-97: EL SISTEMA aceptara ajustes por diferencia solo con magnitud entre 1 y 999,999,999.
- RF-98: EL SISTEMA mantendra el stock actual dentro del rango -999,999,999 a 999,999,999.
- RF-99: SI una operacion produce un stock actual fuera del rango permitido, ENTONCES EL SISTEMA bloqueara la operacion e informara el limite.
- RF-100: SI el administrador edita el stock inicial de un articulo sin entrada "Stock inicial", ENTONCES EL SISTEMA usara el nuevo stock inicial como base virtual y aplicara los movimientos posteriores sin crear evento visible.
- RF-101: EL SISTEMA no permitira que una confirmacion de stock negativo supere el rango permitido de -999,999,999 a 999,999,999.
- RF-102: CUANDO el administrador confirme el alta o edicion de un articulo, EL SISTEMA revalidara que la categoria seleccionada siga activa.
- RF-103: SI la categoria seleccionada quedo inactiva antes de confirmar el alta o edicion de un articulo, ENTONCES EL SISTEMA bloqueara la operacion e indicara que debe elegirse otra categoria activa.
- RF-104: CUANDO la eliminacion de un articulo y su primer movimiento se confirmen simultaneamente, EL SISTEMA permitira que la primera operacion registrada determine el estado del articulo.
- RF-105: CUANDO la segunda operacion simultanea sobre eliminacion y primer movimiento se revalide, EL SISTEMA la bloqueara si dejo de cumplir sus condiciones.
- RF-106: CUANDO el administrador cambie busqueda o filtros, EL SISTEMA volvera el listado resultante a la primera pagina.
- RF-107: SI la preferencia de tema no puede guardarse, ENTONCES EL SISTEMA mantendra el tema elegido durante la sesion de la pestana actual, incluidas sus recargas, hasta que la pestana se cierre.
- RF-108: SI la preferencia de tema no puede guardarse, ENTONCES EL SISTEMA informara que el tema no se conservara para la proxima visita.
- RF-109: CUANDO el administrador edite el stock inicial de un articulo, EL SISTEMA conservara sin cambios la cantidad visible de la entrada automatica "Stock inicial".
- RF-110: SI el estado vuelve a cambiar durante el unico reintento automatico de una operacion, ENTONCES EL SISTEMA cancelara la operacion e informara que existe un conflicto y debe intentarse nuevamente.

## Requisitos no funcionales

- RNF-1: El sistema debe representar las cantidades de inventario mediante numeros enteros.
- RNF-2: Los errores de validacion deben identificar el campo y la condicion que impidieron completar la operacion.
- RNF-3: Las operaciones que produzcan stock negativo deben requerir confirmacion explicita del administrador cuando esta spec lo indique.
- RNF-4: Los movimientos registrados deben permanecer disponibles para consulta despues de desactivar un articulo.
- RNF-5: La autenticacion del administrador debe tratarse como una funcionalidad separada.
- RNF-6: Las cantidades y resultados de stock deben respetar el rango definido por RF-95 a RF-99.
- RNF-7: Hasta incorporar auditoria, editar el stock inicial puede impedir reconstruir el stock actual desde el historial visible.

## Casos limite

- Creacion de un articulo con nombre vacio o compuesto unicamente por espacios.
- Creacion o edicion con un nombre de articulo duplicado usando diferentes mayusculas o espacios exteriores.
- Creacion o edicion con un nombre de articulo duplicado diferenciado unicamente por acentos.
- Creacion de una categoria con nombre vacio o compuesto unicamente por espacios.
- Creacion o edicion con un nombre de categoria duplicado usando diferentes mayusculas o espacios exteriores.
- Creacion o edicion con un nombre de categoria duplicado diferenciado unicamente por acentos.
- Registro de cantidades con decimales.
- Registro de cantidades iguales a cero.
- Movimientos simultaneos sobre el mismo articulo.
- Cambio de stock mientras se confirma un movimiento.
- Segundo cambio concurrente durante el unico reintento automatico, con cancelacion por conflicto.
- Salida superior al stock disponible.
- Stock actual negativo despues de confirmar una salida.
- Edicion de stock inicial despues de existir movimientos.
- Edicion de stock inicial desde cero sin entrada automatica de stock inicial.
- Edicion de stock inicial que produce stock actual negativo.
- Edicion de stock inicial despues de un ajuste por existencia final, reaplicando la diferencia historica.
- Edicion del stock inicial conservando la cantidad original visible en la entrada "Stock inicial".
- Creacion de un articulo con stock inicial positivo.
- Creacion de un articulo con stock inicial cero.
- Fallo al guardar la entrada automatica de stock inicial.
- Ajuste por existencia final con cantidad negativa.
- Ajuste por existencia final igual al stock actual.
- Ajuste por diferencia que deja stock en negativo.
- Ajuste que deja el stock en cero.
- Resultado exacto de stock en 999,999,999.
- Resultado exacto de stock en -999,999,999.
- Resultado de stock en 1,000,000,000.
- Resultado de stock en -1,000,000,000.
- Resultado negativo dentro del rango permitido despues de confirmacion.
- Resultado negativo fuera del rango permitido despues de confirmacion.
- Articulo inactivo con stock igual o menor que el stock minimo.
- Desactivacion de un articulo que tiene movimientos.
- Intento de editar un articulo desactivado.
- Intento de registrar movimientos sobre un articulo desactivado.
- Reactivacion de un articulo asociado a una categoria inactiva.
- Reasignacion de categoria durante la reactivacion de un articulo.
- Desactivacion de una categoria que tiene articulos activos asociados.
- Desactivacion de una categoria que tiene solo articulos inactivos asociados.
- Filtrado de articulos por una categoria inactiva con articulos inactivos asociados.
- Creacion o edicion de un articulo usando una categoria inactiva.
- Categoria seleccionada que queda inactiva antes de confirmar el alta o edicion de un articulo.
- Ausencia de categorias activas al crear un articulo.
- Eliminacion de un articulo sin movimientos.
- Eliminacion de un articulo con movimientos.
- Eliminacion de un articulo simultanea con su primer movimiento.
- Eliminacion de un articulo sin movimientos y con stock distinto de cero.
- Eliminacion de una categoria sin articulos asociados.
- Eliminacion de una categoria con articulos asociados.
- Nombre de articulo con 150 caracteres.
- Nombre de articulo con 151 caracteres.
- Nombre de categoria con 150 caracteres.
- Nombre de categoria con 151 caracteres.
- Motivo con 500 caracteres.
- Motivo con 501 caracteres.
- Combinacion de busqueda por nombre con filtros de tipo, categoria y estado.
- Cambio de busqueda o filtros desde una pagina posterior.
- Listado con exactamente 25 registros.
- Listado con 26 registros.
- Listado con ultima pagina incompleta.
- Movimientos con igual fecha y hora visible.
- Movimientos con igual fecha y hora visible y mismo articulo.
- Cambio concurrente que altera el resultado calculado o la advertencia aplicable y exige nueva confirmacion.
- Cambio concurrente que no altera el resultado calculado ni la advertencia aplicable y continua sin nueva confirmacion.
- Primera visita sin preferencia de tema guardada.
- Persistencia del tema seleccionado entre visitas.
- Fallo al guardar la preferencia de tema seguido de una recarga en la misma pestana.
- Fallo al guardar la preferencia de tema seguido del cierre y reapertura de la pestana.
- Busqueda sin coincidencias.
- Inventario sin articulos.
- Articulo cuyo stock es exactamente igual al stock minimo.

## Fuera de alcance

- Ventas y cobros.
- Clientes.
- Citas y sesiones fotograficas.
- Facturacion.
- Compras y gestion de proveedores.
- Reservas de stock.
- Variantes de productos.
- Control por lotes o numeros de serie.
- Multiples almacenes o ubicaciones.
- Roles y permisos diferenciados.
- Autenticacion e inicio de sesion del administrador.
- Notificaciones externas por correo, SMS o mensajeria.
- Importacion o exportacion masiva de inventario.
- Eliminacion del historial de movimientos.
- Auditoria visible de cambios al stock inicial.
- Eliminacion de articulos con movimientos.
- Eliminacion de categorias con articulos asociados.

## Criterios de finalizacion

- Todos los requisitos funcionales tienen pruebas en verde.
- Las validaciones y casos de error definidos tienen pruebas en verde.
- El flujo principal de creacion, movimiento, ajuste, busqueda y alerta se demuestra manualmente.
- Los flujos de articulos, categorias, movimientos, busqueda y alertas se validan manualmente en las cuatro combinaciones: escritorio de 1440 px en tema claro, escritorio de 1440 px en tema oscuro, movil de 390 px en tema claro y movil de 390 px en tema oscuro.
- Cada endpoint de inventario expuesto cuenta con DTO tipado, validacion explicita y documentacion Swagger actualizada.
- Tests, lint/formato y build disponibles se ejecutan desde la raiz sin errores.
- Cualquier script de verificacion todavia inexistente se reporta explicitamente.

## Dudas abiertas

- Ninguna.
