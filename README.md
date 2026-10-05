# RESTAURANT DIGITAL ORDERING PLATFORM
## Master Product Architecture, Design System & Operational Specification

This repository contains the complete commercial SaaS product design direction, information architecture, user flows, design system, component specifications, state machines, data schemas, and technical architecture for an enterprise-grade restaurant digital ordering and operations platform.

---

## 📚 Specification Index

The platform specifications are structured into five comprehensive technical documents:

| Document | Description | Key Modules Covered |
|---|---|---|
| [**01. Product & Information Architecture**](file:///c:/Users/satij/OneDrive/Desktop/restaurant%20project/docs/01_PRODUCT_AND_INFORMATION_ARCHITECTURE.md) | High-level system topology, IA across all 4 apps, end-to-end user flows, and screen inventory. | 4 Subsystems, Sequence Diagrams (QR Scan, Ordering, Service Calls, Gamification, Cash/UPI Settlement), 27 Customer States Inventory. |
| [**02. Design System Specification**](file:///c:/Users/satij/OneDrive/Desktop/restaurant%20project/docs/02_DESIGN_SYSTEM_SPECIFICATION.md) | Design principles, design tokens, color palette (WCAG 2.2 AA), typography scale, 4/8pt spacing, responsive breakpoints, and component state matrix. | CSS variables, `Plus Jakarta Sans` scale, 44px+ touch targets, KDS dark high-contrast mode, Component State Matrix (9 states). |
| [**03. State Machines & Logic**](file:///c:/Users/satij/OneDrive/Desktop/restaurant%20project/docs/03_STATE_MACHINES_AND_LOGIC.md) | Deterministic state machine diagrams, transition rules, session discount mathematics, anti-fraud QR protection, and comprehensive edge-case matrix. | Dining Session Lifecycle (`AVAILABLE` ➔ `ACTIVE` ➔ `PAYMENT_PENDING` ➔ `PAID` ➔ `CLOSED`), Order Batching, Payment Verification, 18+ Edge Cases. |
| [**04. UI Screen Specifications**](file:///c:/Users/satij/OneDrive/Desktop/restaurant%20project/docs/04_UI_SCREEN_SPECIFICATIONS.md) | ASCII wireframe blueprints, layout geometry, typography, component composition, and interaction specs for all 4 subsystems. | Customer Mobile Web, Reception & POS Terminal, Kitchen Display System (KDS), and Owner Admin Portal. |
| [**05. Data Models, RBAC & Tech Specs**](file:///c:/Users/satij/OneDrive/Desktop/restaurant%20project/docs/05_DATA_MODELS_RBAC_AND_TECH_SPECS.md) | Role-Based Access Control matrix, production JSON schemas, seed food catalog, real-time WebSocket architecture, and phased implementation order. | 5-Role RBAC Matrix, Entity JSON Schemas, Realistic Indian Dining Seed Dataset, Redis Pub/Sub, 6-Phase Engineering Roadmap. |
| [**Master Design System**](file:///c:/Users/satij/OneDrive/Desktop/restaurant%20project/docs/MASTER_DESIGN_SYSTEM.md) | The authoritative 40-section design system specification governing all visual and interaction design. | Tokens, Typography Scale, 4/8pt Grid, Component Library, States, QA Matrix. |

---

## 🚀 Customer Interface (Production-Ready)

The customer-facing mobile web / PWA application has been built in `src/` according to the Master Design System.

### Run Development Server
```bash
npm run dev
# Server starts at http://localhost:3000
```

### Production Build & Verification
```bash
npm run build
# Compiles TypeScript and builds optimized production bundles to dist/
```

---

## 🏛️ System Overview

The platform connects four distinct operational surfaces into a single real-time reactive ecosystem:

```
[ Customer Mobile Web (PWA) ]   ◄──┐
[ Reception / POS Dashboard ]   ◄──┼──► [ Real-Time Event Hub (WebSocket + Redis) ] ◄──► [ Central Ledger / DB ]
[ Kitchen Display System (KDS)] ◄──┤
[ Owner / Admin Management ]    ◄──┘
```

1. **Customer Mobile Web (PWA)**: Zero-install, QR-bootstrapped web app. Ephemeral session tokens prevent old-photo ordering fraud. Supports multi-batch ordering, service calls, interactive micro-game with session-level discounts, and multi-channel checkout (UPI, Card, Cash).
2. **Reception / Operations Dashboard**: Dense, scan-friendly tablet/desktop interface. Visual floorplan with live table state borders, order tracking, waiter call dispatcher, and cash payment audit with staff PIN verification. Enforces that tables cannot be cleared while unpaid balances exist.
3. **Kitchen Display System (KDS)**: High-contrast dark mode display for distance glanceability (2–4m). Displays only operational data (Table #, Ticket #, Elapsed time, items, modifiers, allergy warnings). Completely isolated from customer identities, payments, discounts, and revenue data.
4. **Owner / Admin Portal**: Complete catalog builder, dynamic modifier groups, table QR batch generator, staff RBAC management, gamification rule settings, and financial/tax compliance reporting.

---

## 🎨 Core Design Tokens At-A-Glance

* **Brand Primary**: Amber / Warm Saffron (`#EA580C` / `#C2410C`)
* **Backgrounds**: Porcelain Light (`#F8FAFC`, `#FFFFFF`) for Customer/POS; Deep Obsidian Slate (`#0B0F19`, `#182234`) for Kitchen KDS.
* **Semantic Status**: Available (`#10B981`), Active/Prep (`#F59E0B`), Payment Pending (`#8B5CF6`), Critical/Sold-Out (`#EF4444`).
* **Typography**: Primary `Plus Jakarta Sans`, Tabular/Monospace figures `JetBrains Mono` with `font-variant-numeric: tabular-nums`.
* **Touch Target Standard**: Minimum 44x44px bounding box for mobile; minimum 64x64px for KDS tactile bumps.
