# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Monorepo with npm workspaces. Frontend: React with Vite. Backend: NestJS with Prisma and Swagger. Database: local PostgreSQL managed with pgAdmin. Docker is out of scope.

## Users

The first confirmed user is a single administrator who manages the studio inventory.

## Product Purpose

crm-photografy is a CRM for a photography studio. The first approved scope is inventory: products for sale and internal studio supplies managed as inventory items differentiated by type or category.

## Operating Context

The inventory must support article and category management, stock movements, adjustments, search, filters, stock-low alerts and immutable movement history. The approved functional contract is `specs/001-inventario/spec.md`.

## Capabilities and Constraints

Specs define behavior, fields, validation, data and scope. Visual mocks define identity, layout direction, component patterns, hierarchy, themes and interaction tone only.

If a mock contradicts an approved spec, the spec wins. Do not implement mock-only features unless a spec change approves them, including variants, cost, sale price, type "Ambos", multiple users, movement editing or deletion, and a separate audit module.

The application must support consistent light and dark themes across the CRM. The visual system from `mocks/` is global for future CRM modules, not only inventory.

## Brand Commitments

The product uses the TONY photography identity shown in the mocks. The logo and mascot are required brand assets, but their source files are pending; do not extract them from screenshots for production use.

## Evidence on Hand

Visual references are available in `mocks/`:

- `mocks/inicio.png`
- `mocks/inventario-dark.png`
- `mocks/detalles-producto.png`
- `mocks/nuevo-producto.png`
- `mocks/categoria.png`
- `mocks/movimientos.png`
- `mocks/registro-movimiento-dark.png`
- `mocks/auditoria-dark.png`

These files are mock references, not implementation requirements.

## Product Principles

- Preserve the approved spec as the source of truth for functionality.
- Keep inventory operations clear, auditable and reversible through adjustments rather than history edits.
- Treat the interface as an operating surface for studio work: dense enough for administration and polished enough for a premium photography brand.
- Do not fabricate brand assets, real business data, credentials, customers, sales or operational claims.

## Accessibility & Inclusion

Future UI work must verify desktop and mobile behavior. Theme work must preserve readable contrast in both light and dark modes.
