# Verificacion manual - Spec 003

## Entorno

- Navegador: Chrome de escritorio.
- Cache: desactivada en DevTools.
- API: disponible en `http://127.0.0.1:3002`.
- Web: disponible en `http://127.0.0.1:5175`.
- Datos: catalogo de desarrollo cargado.

## Matriz visual pendiente

| Ruta | Tema | Ancho | Captura | Resultado |
| --- | --- | ---: | --- | --- |
| `/inventory` | Claro | 320 px | Pendiente | Pendiente |
| `/inventory` | Claro | 390 px | Pendiente | Pendiente |
| `/inventory` | Claro | 1440 px | Pendiente | Pendiente |
| `/inventory` | Oscuro | 320 px | Pendiente | Pendiente |
| `/inventory` | Oscuro | 390 px | Pendiente | Pendiente |
| `/inventory` | Oscuro | 1440 px | Pendiente | Pendiente |

## Rendimiento pendiente

1. Con cache desactivada, navegar a `/inventory`.
2. Medir hasta que resultados, estado vacio o error permitan usar busqueda, filtros y Crear articulo.
3. Confirmar interactividad antes de dos segundos.
4. Cambiar busqueda, filtro y pagina; confirmar que carga o resultados aparecen antes de 300 ms sin contar la red.

## Calidad automatizada

Los comandos raiz requeridos son `npm run test`, `npm run lint`, `npm run format:check` y `npm run build`.
