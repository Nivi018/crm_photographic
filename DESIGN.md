---
name: crm-photografy
description: Technical premium CRM interface for a photography studio inventory.
colors:
  navy-deep: '#071a2d'
  navy-panel: '#10263a'
  navy-muted: '#17334d'
  surface-light: '#f7faff'
  surface-card: '#ffffff'
  accent-gold: '#ffc955'
  accent-blue: '#2f64b8'
  success: '#36b37e'
  warning: '#f2a900'
  danger: '#e94b5f'
  text-strong: '#0c1f3a'
  text-muted: '#6f7d91'
rounded:
  sm: '8px'
  md: '14px'
  lg: '22px'
components:
  button-primary:
    backgroundColor: '{colors.accent-gold}'
    textColor: '{colors.text-strong}'
    rounded: '{rounded.md}'
  button-secondary:
    backgroundColor: '{colors.accent-blue}'
    textColor: '{colors.surface-card}'
    rounded: '{rounded.md}'
---

# Design System: crm-photografy

## Overview

**Creative North Star: "Estudio tecnico premium"**

The CRM should feel like a professional studio control room: precise, calm, technical and premium without losing warmth. The mocks establish a polished operating interface with strong navy structure, gold actions, rounded panels, clear tables and status chips.

Use the mocks as the visual authority for identity, hierarchy, navigation, component density, theme behavior and interaction tone. Do not treat mock-only fields or modules as functional requirements; `specs/001-inventario/spec.md` controls behavior and scope.

Key characteristics:

- Dark navy application chrome with crisp separators and selected navigation states.
- Light and dark content surfaces that share the same layout grammar.
- Gold for primary creation and confirmation actions.
- Blue for selected navigation, secondary actions and links.
- Rounded cards, tables and form controls with restrained depth.
- Status chips with semantic color for available, low stock, exhausted, active and inactive states.

## Colors

The palette is a navy-based operating system with gold as the rare primary action color and blue as the navigation/selection color.

### Primary

- **Deep Studio Navy** (`#071a2d`): global header, dark theme background and premium brand frame.
- **Panel Navy** (`#10263a`): dark cards, tables, side panels and grouped sections.
- **Muted Navy** (`#17334d`): hover states, raised dark containers and secondary dark surfaces.

### Secondary

- **Action Gold** (`#ffc955`): primary CTAs, active top-level indicators and important prompts.
- **Control Blue** (`#2f64b8`): selected navigation, edit actions, links and focused controls.

### Semantic

- **Success Green** (`#36b37e`): entries, active states and available stock.
- **Warning Amber** (`#f2a900`): stock-low states and cautions.
- **Danger Red** (`#e94b5f`): exhausted states, destructive warnings and blocked actions.

### Neutral

- **Light Surface** (`#f7faff`): light theme page background.
- **Card White** (`#ffffff`): light theme cards, tables and forms.
- **Strong Ink** (`#0c1f3a`): primary light theme text.
- **Muted Slate** (`#6f7d91`): helper text, metadata and inactive labels.

### Named Rules

**The Spec Wins Rule.** Colors and components from mocks can be reused, but mock-only fields or actions cannot expand scope.

**The Gold Rarity Rule.** Gold is reserved for primary actions, active indicators and key warnings; avoid scattering it across ordinary decoration.

## Typography

Use a clean geometric sans-serif tone similar to the mocks: modern, spacious and highly legible. Exact font files are not confirmed yet; until implementation chooses the web font stack, use system sans-serif as the safe baseline.

### Hierarchy

- **Display**: large page titles with strong weight and tight line height.
- **Title**: card and section titles with clear contrast against body copy.
- **Body**: operational copy, table cells and form content optimized for scanning.
- **Label**: compact table headers, form labels, chips and metadata.

### Named Rules

**The Operating Clarity Rule.** Type must favor scanning and numeric comparison over decorative personality.

## Layout

The layout uses a persistent top navigation bar, wide content containers, card grids, dense tables and right-side panels or detail regions where useful. Screens should preserve the control-room feel on desktop and collapse cleanly for mobile without hiding the primary task.

Light screens use white cards over a pale background. Dark screens use layered navy panels with thin borders, soft glows and subtle tonal contrast. Both themes must feel like the same application.

## Elevation & Depth

Depth is restrained and structural. Light theme uses soft card shadows and pale borders. Dark theme uses tonal layering, borders and subdued glow rather than heavy shadows.

## Shapes

The form language is rounded and precise. Controls, cards, table containers and drawers use medium-to-large radii. Chips are pill-like or compact rounded rectangles. Avoid sharp enterprise defaults unless a table grid requires a crisp divider.

## Components

### Buttons

- **Primary:** gold background, dark text, rounded shape, confident padding and icon support.
- **Secondary:** blue background for edit or navigation actions that are important but not primary creation.
- **Ghost:** transparent or low-contrast outline for cancel, overflow and secondary utilities.
- **Focus:** visible ring or border shift in the current theme.

### Navigation

- Top navigation is the global application anchor.
- Active navigation uses blue filled pills or gold underline depending on the theme treatment.
- Keep logo placement stable and avoid crowding the account area.

### Cards / Containers

- Cards group operational data: summaries, charts, stock alerts, forms and detail panels.
- Use rounded corners, thin borders and consistent internal spacing.
- Preserve dense but readable information hierarchy.

### Tables

- Tables are a core component for inventory, categories and movement history.
- Headers are compact and muted.
- Rows should make names, quantities, status and actions easy to scan.
- Status chips must remain visible in both themes.

### Inputs / Fields

- Inputs use rounded rectangles, clear labels and strong focus states.
- Dark theme inputs sit inside tonal navy panels.
- Validation errors must identify the field and reason.

### Chips / Badges

- Use semantic chips for active, inactive, available, stock low and exhausted states.
- Counts inside filter chips should be compact and high-contrast.

### Brand Assets

- The TONY photography logo and mascot are required identity assets.
- Source files are pending; do not extract production assets from screenshots.
- Until assets are available, UI work may reserve layout space or use clearly marked placeholders.

## Do's and Don'ts

### Do:

- **Do** use `mocks/` as the visual reference set before implementing UI.
- **Do** preserve the navy, gold and blue relationship across both themes.
- **Do** keep tables, filters and movement history highly scannable.
- **Do** adapt composition for the approved inventory spec when mocks show out-of-scope fields.
- **Do** verify desktop and mobile layouts for UI changes.

### Don't:

- **Don't** implement functionality only because it appears in a mock.
- **Don't** add variants, cost, sale price, type "Ambos", multiple users, movement editing/deletion or a separate audit module without an approved spec change.
- **Don't** use screenshot crops of the logo or mascot as production assets.
- **Don't** make dark and light themes feel like unrelated products.
- **Don't** replace reusable components with one-off screen-only controls when the pattern repeats.
