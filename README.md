# CRM Photography

Monorepo del inventario para el estudio fotografico. Incluye la API NestJS, la
aplicacion web React y contratos TypeScript compartidos.

## Requisitos

- Node.js 22 o superior.
- npm 11 o superior.

Instala las dependencias desde la raiz:

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

El comando compila los contratos compartidos e inicia:

- API: `http://127.0.0.1:3002` (`GET /health`).
- Web: `http://127.0.0.1:5175`.

## Verificacion

```bash
npm run test
npm run lint
npm run format:check
npm run build
```

Para aplicar formato automaticamente:

```bash
npm run format
```

No se requieren Docker ni archivos `.env` para las verificaciones actuales.
