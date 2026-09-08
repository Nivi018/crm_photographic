# AGENTS.md - crm-photografy

## Proyecto

CRM para un estudio fotografico. El primer alcance es el inventario del estudio: articulos para venta y articulos usados como insumos internos, diferenciados por tipo o categoria.

La arquitectura prevista usa un monorepo con npm workspaces, TypeScript bien tipado, React con Vite para el frontend, NestJS con Prisma y Swagger para el backend, y PostgreSQL como base de datos local administrada con pgAdmin. No usar Docker.

## Comandos

- Ejecutar: `npm run dev` inicia API en `http://127.0.0.1:3002` y web en `http://127.0.0.1:5175`.
- Tests: `npm run test`.
- Lint: `npm run lint`.
- Formato: `npm run format:check`; para aplicar formato, `npm run format`.
- Build: `npm run build`.

## Estilo y convenciones

Usar TypeScript con tipos explicitos cuando ayuden a evitar ambiguedad. Mantener un monorepo con npm workspaces, `apps/web` para React con Vite y `apps/api` para NestJS. Ejecutar comandos desde la raiz del proyecto.

Crear `packages/shared` solo cuando haya tipos, contratos o utilidades compartidas con uso real entre frontend y backend; no ubicar logica de infraestructura en paquetes compartidos.

Seguir DDD hibrido: dominio primero y capas `domain`, `application`, `infrastructure` y `presentation` dentro de cada dominio cuando haga falta. En frontend, usar componentes genericos y reutilizables; los componentes renderizan UI, reciben props, manejan eventos simples y delegan logica a hooks, servicios, clientes tipados o utilidades del dominio.

Documentar la API del backend con DTOs tipados, validacion explicita y Swagger cuando se agreguen endpoints. Gestionar el acceso a datos mediante Prisma y PostgreSQL local; Prisma solo debe usarse en infraestructura detras de repositorios o adaptadores. No agregar Docker ni `docker-compose`.

## Reglas

- Leer `docs/constitution.md` antes de crear specs, planes, tareas o codigo.
- Seguir SDD para cambios funcionales: spec, plan, tasks e implementacion de una tarea concreta.
- Cargar y aplicar la skill `impeccable` antes de implementar o modificar cualquier interfaz frontend, componente, estilo o flujo de experiencia de usuario.
- Para cambios de UI, consultar `PRODUCT.md`, `DESIGN.md` y los mocks de `mocks/`; las specs aprobadas mandan sobre comportamiento y alcance cuando contradigan los mocks.
- Mantener el alcance inicial en inventario; no implementar ventas, clientes, citas, facturacion ni otros modulos CRM sin nueva spec aprobada.
- No crear ni aplicar migraciones Prisma sin confirmacion explicita.
- No incluir secretos, archivos `.env`, credenciales, cadenas de conexion reales ni datos reales del estudio.
- No agregar Docker, `docker-compose` ni configuracion equivalente.

## Al terminar cualquier tarea

- Ejecutar tests, lint/formato y build disponibles desde la raiz.
- Si falta algun script de verificacion, reportarlo explicitamente en el resultado final.
