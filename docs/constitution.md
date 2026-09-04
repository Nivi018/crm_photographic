# Constitucion del proyecto

Principios no negociables. Toda spec, plan, tarea y cambio debe cumplirlos.

1. **SDD obligatorio**: Todo cambio funcional debe partir de una spec aprobada, continuar con plan y tasks, y solo implementar una tarea concreta; se verifica por la existencia de esos documentos antes de tocar codigo.
2. **Alcance inicial de inventario**: El primer alcance solo cubre articulos de inventario para venta e insumos internos del estudio fotografico, diferenciados por tipo o categoria; cualquier modulo de ventas, clientes, citas o facturacion requiere una nueva spec aprobada.
3. **Arquitectura confirmada**: El proyecto debe organizarse como monorepo con npm workspaces, `apps/web` para React con Vite, `apps/api` para NestJS con Prisma y Swagger, y PostgreSQL local administrado con pgAdmin; se verifica revisando estructura, dependencias, configuracion y scripts del repositorio.
4. **Diseno guiado por dominio**: La organizacion debe seguir DDD hibrido: dominio primero y, dentro de cada dominio, capas `domain`, `application`, `infrastructure` y `presentation` cuando haga falta; se verifica revisando que el dominio de inventario no dependa de detalles de UI, NestJS, Prisma o transporte HTTP.
5. **Frontend reutilizable y sin logica de negocio**: Los componentes React deben renderizar UI, recibir props, manejar eventos simples y delegar logica; las reglas de negocio, estado, efectos, consultas, mutaciones y adaptacion de datos deben vivir en hooks, servicios, clientes tipados o utilidades del dominio; antes de implementar o modificar UI se debe cargar y aplicar la skill `impeccable`; se verifica revisando componentes, hooks, servicios y el resultado en escritorio y movil antes de cerrar una tarea.
6. **Backend con infraestructura aislada**: En NestJS, Prisma solo debe usarse en infraestructura detras de repositorios o adaptadores; dominio y casos de uso no deben importar Prisma directamente; se verifica revisando imports y dependencias entre capas.
7. **Contratos tipados y documentados**: Frontend y backend deben escribirse en TypeScript evitando tipos ambiguos cuando afecten contratos, datos de inventario o respuestas de API; cada endpoint debe tener DTOs tipados, validacion explicita y Swagger actualizado; se verifica con lint, build, revision de tipos y documentacion generada.
8. **Seguridad, base de datos y verificacion**: No se deben crear ni aplicar migraciones Prisma sin confirmacion explicita, guardar `.env`, credenciales, cadenas de conexion reales o datos reales del estudio, ni agregar Docker o `docker-compose`; antes de cerrar una tarea deben ejecutarse tests, lint/formato y build disponibles desde la raiz, reportando scripts faltantes. `packages/shared` solo debe existir cuando haya tipos, contratos o utilidades compartidas con uso real entre frontend y backend.

## Dudas abiertas

- [NECESITA ACLARACION] Comandos raiz definitivos para ejecutar, probar, formatear, lint y construir con npm workspaces cuando exista `package.json`.
