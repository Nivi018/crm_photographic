# Spec 001 - Inventario del estudio fotografico

## Contexto y objetivo

El estudio fotografico necesita controlar en un mismo inventario los productos destinados a venta y los insumos utilizados internamente. Esta funcionalidad permitira conocer las existencias, registrar sus cambios, detectar niveles bajos y conservar un historial de los movimientos realizados.

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
- H7: Como administrador quiero consultar el historial de movimientos para conocer como cambiaron las existencias.
- H8: Como administrador quiero gestionar categorias para clasificar los articulos.

## Requisitos funcionales (criterios de aceptacion en EARS)

- RF-1: CUANDO el administrador cree un articulo, EL SISTEMA exigira nombre, tipo, categoria, stock inicial y stock minimo.
- RF-2: EL SISTEMA clasificara cada articulo como producto para venta o insumo interno.
- RF-3: EL SISTEMA solo aceptara cantidades enteras para el stock inicial.
- RF-4: EL SISTEMA solo aceptara cantidades enteras para el stock minimo.
- RF-5: EL SISTEMA no aceptara cantidades negativas como stock inicial.
- RF-6: EL SISTEMA no aceptara cantidades negativas como stock minimo.
- RF-7: SI existe otro articulo con el mismo nombre ignorando mayusculas y espacios exteriores, ENTONCES EL SISTEMA rechazara la creacion e informara del conflicto.
- RF-8: CUANDO el administrador consulte un articulo, EL SISTEMA mostrara sus datos y su stock actual.
- RF-9: CUANDO el administrador edite un articulo, EL SISTEMA validara los mismos campos obligatorios exigidos durante su creacion.
- RF-10: SI el nuevo nombre de un articulo coincide con otro nombre existente ignorando mayusculas y espacios exteriores, ENTONCES EL SISTEMA rechazara el cambio e informara del conflicto.
- RF-11: CUANDO el administrador desactive un articulo con historial, EL SISTEMA conservara el articulo y sus movimientos.
- RF-12: MIENTRAS un articulo este desactivado, EL SISTEMA permitira consultar sus datos y su historial.
- RF-13: MIENTRAS un articulo este desactivado, EL SISTEMA no permitira editarlo.
- RF-14: MIENTRAS un articulo este desactivado, EL SISTEMA no permitira registrar entradas, salidas ni ajustes sobre el.
- RF-15: CUANDO el administrador reactive un articulo asociado a una categoria activa, EL SISTEMA permitira la reactivacion.
- RF-16: SI el administrador intenta reactivar un articulo asociado a una categoria inactiva, ENTONCES EL SISTEMA exigira seleccionar una categoria activa.
- RF-17: CUANDO el administrador registre una entrada, EL SISTEMA exigira una cantidad entera mayor que cero.
- RF-18: CUANDO el administrador registre una entrada, EL SISTEMA exigira un motivo.
- RF-19: CUANDO se acepte una entrada, EL SISTEMA incrementara el stock actual por la cantidad registrada.
- RF-20: CUANDO el administrador registre una salida, EL SISTEMA exigira una cantidad entera mayor que cero.
- RF-21: CUANDO el administrador registre una salida, EL SISTEMA exigira un motivo.
- RF-22: CUANDO se acepte una salida que no supere el stock disponible, EL SISTEMA disminuira el stock actual por la cantidad registrada.
- RF-23: SI una salida supera el stock disponible, ENTONCES EL SISTEMA advertira que la operacion producira stock negativo.
- RF-24: CUANDO el administrador confirme una salida que supera el stock disponible, EL SISTEMA registrara la salida.
- RF-25: CUANDO el administrador confirme una salida que supera el stock disponible, EL SISTEMA permitira que el stock resultante sea negativo.
- RF-26: SI el administrador no confirma una salida que supera el stock disponible, ENTONCES EL SISTEMA no registrara el movimiento.
- RF-27: CUANDO el administrador registre un ajuste por existencia final, EL SISTEMA exigira una cantidad entera igual o mayor que cero.
- RF-28: CUANDO se acepte un ajuste por existencia final, EL SISTEMA reemplazara el stock actual por la cantidad indicada.
- RF-29: CUANDO el administrador registre un ajuste por diferencia, EL SISTEMA exigira una cantidad entera distinta de cero.
- RF-30: CUANDO el administrador registre un ajuste por diferencia, EL SISTEMA exigira un motivo.
- RF-31: CUANDO se acepte un ajuste por diferencia que no deje stock negativo, EL SISTEMA sumara o restara la diferencia indicada al stock actual.
- RF-32: SI un ajuste por diferencia deja stock negativo, ENTONCES EL SISTEMA advertira que la operacion producira stock negativo.
- RF-33: CUANDO el administrador confirme un ajuste por diferencia que deja stock negativo, EL SISTEMA registrara el ajuste.
- RF-34: SI el administrador no confirma un ajuste por diferencia que deja stock negativo, ENTONCES EL SISTEMA no registrara el ajuste.
- RF-35: SI el administrador intenta registrar un ajuste por existencia final negativa, ENTONCES EL SISTEMA rechazara el ajuste.
- RF-36: EL SISTEMA conservara un historial de entradas, salidas y ajustes.
- RF-37: EL SISTEMA no permitira editar movimientos registrados.
- RF-38: EL SISTEMA no permitira eliminar movimientos registrados.
- RF-39: CUANDO sea necesario corregir un movimiento, EL SISTEMA permitira registrar un ajuste nuevo.
- RF-40: EL SISTEMA mostrara en cada movimiento el tipo de movimiento, cantidad, motivo, fecha y hora, stock anterior y stock posterior.
- RF-41: DONDE el movimiento sea un ajuste, EL SISTEMA mostrara si el ajuste fue por existencia final o por diferencia.
- RF-42: CUANDO el administrador busque por nombre, EL SISTEMA mostrara los articulos cuyo nombre coincida con el criterio.
- RF-43: CUANDO el administrador filtre por tipo, EL SISTEMA mostrara los articulos del tipo seleccionado.
- RF-44: CUANDO el administrador filtre por categoria, EL SISTEMA mostrara los articulos de la categoria seleccionada.
- RF-45: CUANDO el administrador filtre por estado, EL SISTEMA mostrara los articulos activos o inactivos segun el estado seleccionado.
- RF-46: MIENTRAS el stock actual de un articulo sea igual o menor que su stock minimo, EL SISTEMA identificara el articulo con una alerta de stock bajo.
- RF-47: CUANDO el administrador cree una categoria, EL SISTEMA exigira un nombre.
- RF-48: SI existe otra categoria con el mismo nombre ignorando mayusculas y espacios exteriores, ENTONCES EL SISTEMA rechazara la creacion e informara del conflicto.
- RF-49: CUANDO el administrador edite una categoria, EL SISTEMA validara que el nombre no quede vacio.
- RF-50: SI el nuevo nombre de una categoria coincide con otra categoria ignorando mayusculas y espacios exteriores, ENTONCES EL SISTEMA rechazara el cambio e informara del conflicto.
- RF-51: CUANDO el administrador desactive una categoria sin articulos asociados, EL SISTEMA conservara la categoria como inactiva.
- RF-52: SI el administrador intenta desactivar una categoria con articulos asociados, ENTONCES EL SISTEMA bloqueara la desactivacion e indicara que primero debe reasignar o desactivar los articulos asociados.

## Requisitos no funcionales

- RNF-1: El sistema debe representar las cantidades de inventario mediante numeros enteros.
- RNF-2: Los errores de validacion deben identificar el campo y la condicion que impidieron completar la operacion.
- RNF-3: Las operaciones que produzcan stock negativo deben requerir confirmacion explicita del administrador cuando esta spec lo indique.
- RNF-4: Los movimientos registrados deben permanecer disponibles para consulta despues de desactivar un articulo.
- RNF-5: La autenticacion del administrador debe tratarse como una funcionalidad separada.

## Casos limite

- Creacion de un articulo con nombre vacio o compuesto unicamente por espacios.
- Creacion o edicion con un nombre de articulo duplicado usando diferentes mayusculas o espacios exteriores.
- Creacion de una categoria con nombre vacio o compuesto unicamente por espacios.
- Creacion o edicion con un nombre de categoria duplicado usando diferentes mayusculas o espacios exteriores.
- Registro de cantidades con decimales.
- Registro de cantidades iguales a cero.
- Salida superior al stock disponible.
- Stock actual negativo despues de confirmar una salida.
- Ajuste por existencia final con cantidad negativa.
- Ajuste por diferencia que deja stock en negativo.
- Ajuste que deja el stock en cero.
- Desactivacion de un articulo que tiene movimientos.
- Intento de editar un articulo desactivado.
- Intento de registrar movimientos sobre un articulo desactivado.
- Reactivacion de un articulo asociado a una categoria inactiva.
- Desactivacion de una categoria que tiene articulos asociados.
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

## Criterios de finalizacion

- Todos los requisitos funcionales tienen pruebas en verde.
- Las validaciones y casos de error definidos tienen pruebas en verde.
- El flujo principal de creacion, movimiento, ajuste, busqueda y alerta se demuestra manualmente.
- Tests, lint/formato y build disponibles se ejecutan desde la raiz sin errores.
- Cualquier script de verificacion todavia inexistente se reporta explicitamente.

## Dudas abiertas

- Ninguna.
