# MASTER DESIGN SYSTEM SPECIFICATION
## RESTAURANT DIGITAL ORDERING PLATFORM
### One Product • One Design Language • Four Specialized Experiences • Mobile + Tablet + Desktop

---

# 01 — PRODUCT VISUAL DIRECTION

The Restaurant Digital Ordering Platform visual direction blends **hospitality warmth** with **high-throughput industrial precision**. It avoids the frivolous decorative trends of Dribbble (excessive glassmorphism, floating neon orbs, pastel low-contrast text) and equally avoids the sterile, dated look of 1990s legacy POS software.

* **Emotional Resonance**: Trust, Speed, Appetite, Hospitality, Operational Authority.
* **Aesthetic Posture**: Clean Scandinavian minimalism infused with rich culinary tones (warm saffron, toasted cumin, cast-iron slate, fresh herb greens).
* **Surface Logic**: Flat, content-first cards with crisp 1px borders, subtle elevation upon user interaction, and generous negative space to reduce cognitive fatigue in rushed restaurant environments.
* **Commercial SaaS Lineage**: Inherits the ergonomic reliability of Toast POS and Square for Restaurants, the consumer polish of high-end food discovery apps, and the glanceability of industrial aviation/medical heads-up displays.

---

# 02 — DESIGN PHILOSOPHY

1. **Glanceability Under Duress**: Every screen must communicate its primary state within 200 milliseconds. Kitchen cooks in steamy environments, rushed waiters juggling five tables, and hungry diners in dim ambient lighting must grasp information without squinting.
2. **Ergonomic Context-Specificity**:
   * *Customer*: Optimized for single-handed mobile thumb sweeps (bottom 40% of viewport).
   * *Reception POS*: Optimized for dual-handed tablet tapping and rapid scanning across a 30-table floor grid.
   * *Kitchen KDS*: Optimized for arm's-length touch targets (minimum 64x64px) and 3-meter distance legibility.
   * *Admin*: Optimized for dense keyboard/mouse data density and deep hierarchical navigation.
3. **Multi-Sensory Feedback with Semantic Color**: Color is never the sole carrier of status. Color is always backed by shape, geometry, icon, text labels, and localized audio feedback.
4. **Resilience & Zero State Ambiguity**: Every UI component natively handles loading, offline queuing, partial item availability, and gateway recovery states without dead ends.

---

# 03 — COLOUR PALETTE (PRIMITIVES)

The foundation is built on mathematically tuned HSL ramps:

```
BRAND PRIMARIES (Appetite-Stimulating Warm Amber & Roasted Saffron)
Amber-50:  #FFFBEB    Amber-100: #FEF3C7    Amber-200: #FDE68A
Amber-300: #FCD34D    Amber-400: #FBBF24    Amber-500: #F59E0B
Amber-600: #D97706    Amber-700: #B45309    Amber-800: #92400E    Amber-900: #78350F

DEEP TANGERINE / ACTION ACCENT (High-Contrast Buttons & Primary CTAs)
Orange-50:  #FFF7ED   Orange-100: #FFEDD5   Orange-200: #FED7AA
Orange-300: #FDBA74   Orange-400: #FB923C   Orange-500: #EA580C
Orange-600: #C2410C   Orange-700: #9A3412   Orange-800: #7C2D12   Orange-900: #431407

NEUTRAL SLATE (Modern, High-Legibility Cold Neutral)
Slate-50:  #F8FAFC    Slate-100: #F1F5F9    Slate-200: #E2E8F0
Slate-300: #CBD5E1    Slate-400: #94A3B8    Slate-500: #64748B
Slate-600: #475569    Slate-700: #334155    Slate-800: #1E293B    Slate-900: #0F172A
Slate-950: #020617

SEMANTIC STATUS PRIMITIVES
Emerald-50:  #ECFDF5   Emerald-500: #10B981   Emerald-700: #047857 (Available / Veg / Paid)
Rose-50:     #FFF1F2   Rose-500:    #F43F5E   Rose-700:    #BE123C (Non-Veg / Urgent Alert)
Red-50:      #FEF2F2   Red-500:     #EF4444   Red-700:     #B91C1C (Sold Out / Error / Void)
Violet-50:   #F5F3FF   Violet-500:  #8B5CF6   Violet-700:  #6D28D9 (Payment Pending)
Sky-50:      #F0F9FF   Sky-500:     #0EA5E9   Sky-700:     #0369A1 (Service Call / Water / Info)
```

---

# 04 — SEMANTIC COLOUR TOKENS

```css
/* Token Architecture */
--color-brand-primary:          var(--color-orange-500);
--color-brand-primary-hover:    var(--color-orange-600);
--color-brand-primary-active:   var(--color-orange-700);
--color-brand-primary-subtle:   var(--color-orange-50);
--color-brand-secondary:        var(--color-amber-600);
--color-brand-secondary-subtle: var(--color-amber-50);

/* Surfaces */
--color-surface-bg:             var(--color-slate-50);
--color-surface-card:           #FFFFFF;
--color-surface-elevated:       #FFFFFF;
--color-surface-strong:         var(--color-slate-100);
--color-surface-overlay:        rgba(15, 23, 42, 0.60);

/* Typography */
--color-text-primary:           var(--color-slate-900); /* 14.5:1 ratio */
--color-text-secondary:         var(--color-slate-600); /* 5.8:1 ratio */
--color-text-tertiary:          var(--color-slate-400); /* 3.2:1 ratio (metadata/hints) */
--color-text-disabled:          var(--color-slate-300);
--color-text-inverse:           #FFFFFF;

/* Borders */
--color-border-subtle:          var(--color-slate-100);
--color-border-default:         var(--color-slate-200);
--color-border-strong:          var(--color-slate-300);
--color-border-focus:           var(--color-orange-500);

/* Restaurant State Tokens */
--color-state-available:        var(--color-emerald-500);
--color-state-available-subtle: var(--color-emerald-50);
--color-state-active:           var(--color-amber-500);
--color-state-active-subtle:    var(--color-amber-50);
--color-state-pay-pending:      var(--color-violet-500);
--color-state-pay-pending-subtle:var(--color-violet-50);
--color-state-paid:             var(--color-emerald-600);
--color-state-paid-subtle:      var(--color-emerald-50);
--color-state-closed:           var(--color-slate-400);
--color-state-closed-subtle:    var(--color-slate-100);

--color-state-order-new:        var(--color-sky-500);
--color-state-order-prep:       var(--color-amber-500);
--color-state-order-ready:      var(--color-emerald-500);
--color-state-order-served:     var(--color-slate-400);
--color-state-sold-out:         var(--color-red-600);
```

---

# 05 — LIGHT / DARK THEME SPECIFICATIONS

### Light Mode (Default for Customer, POS, Admin)
* **Background Canvas**: `#F8FAFC` (Slate-50)
* **Card Surface**: `#FFFFFF`
* **Elevated Drawers/Modals**: `#FFFFFF`
* **Hairline Borders**: `#E2E8F0` (Slate-200)
* **Text Primary**: `#0F172A` (Slate-900)
* **Text Secondary**: `#475569` (Slate-600)
* **Primary Interactive**: `#EA580C` (Orange-500)

### Dark Mode (Dedicated for Kitchen KDS & Night Ambience)
* **Background Canvas**: `#0B0F19` (Low-glare Obsidian Slate)
* **Card Surface / Active Ticket**: `#182234` (Elevated contrast)
* **Ticket Header Normal**: `#1E293B`
* **Ticket Header Warning (10-15m)**: `#78350F` (Dark Amber)
* **Ticket Header Overdue (>15m)**: `#7F1D1D` (Crimson Alert)
* **Hairline Borders**: `#334155` (Slate-700)
* **Text Primary**: `#F8FAFC` (Slate-50)
* **Text Secondary**: `#CBD5E1` (Slate-300)
* **High-Vis Allergy Callout**: `#DC2626` (Bright Solid Red)

---

# 06 — TYPOGRAPHY SELECTION

* **Primary Typeface**: `Plus Jakarta Sans` (Google Fonts / Open Source).
  * *Rationale*: Exceptional geometric clarity, wide open counters, tall x-height, and robust legibility across small mobile displays.
* **Secondary / Tabular Figures**: `JetBrains Mono` or `Plus Jakarta Sans` with OpenType feature `font-variant-numeric: tabular-nums`.
  * *Rationale*: Guarantees that numerical values (prices in ₹, elapsed timers, order numbers, quantities) do not cause horizontal layout jitter during live updates.

---

# 07 — COMPLETE TYPE SCALE

| Token | Size (px / rem) | Weight | Line Height | Letter Spacing | Target Usage |
|---|---|---|---|---|---|
| `type-display-lg` | 32px / 2.0rem | Bold (700) | 40px (1.25) | -0.02em | Hero Game Score Reveal, Total Bill Celebration |
| `type-display-md` | 28px / 1.75rem | Bold (700) | 36px (1.28) | -0.015em | Screen Welcome Titles, Landing Hero |
| `type-h1` | 24px / 1.5rem | Bold (700) | 32px (1.33) | -0.015em | Top Screen Header, Modal Title, KDS Table # |
| `type-h2` | 20px / 1.25rem | SemiBold (600) | 28px (1.40) | -0.01em | Category Group Titles, Table Drawer Headers |
| `type-h3` | 17px / 1.06rem | SemiBold (600) | 24px (1.41) | -0.005em | Food Item Card Titles, Section Headers |
| `type-h4` | 15px / 0.93rem | SemiBold (600) | 20px (1.33) | 0.0em | Modifier Group Headings, Sub-sections |
| `type-body-lg` | 16px / 1.0rem | Regular (400) | 24px (1.50) | 0.0em | Primary Body Copy, Cart Item Descriptions |
| `type-body` | 14px / 0.875rem| Regular (400) | 20px (1.43) | 0.0em | Food Descriptions, Form Helper Text |
| `type-body-sm` | 12px / 0.75rem | Regular (400) | 16px (1.33) | +0.01em | Tax Breakdown Lines, Allergen Tag Labels |
| `type-label-lg` | 16px / 1.0rem | SemiBold (600) | 20px (1.25) | 0.0em | Primary Button Text, Major Action Labels |
| `type-label` | 14px / 0.875rem| SemiBold (600) | 18px (1.28) | +0.005em | Secondary Button Text, Segmented Tabs |
| `type-label-sm` | 12px / 0.75rem | Medium (500) | 16px (1.33) | +0.01em | Dietary Indicators, Table Status Badges |
| `type-caption` | 11px / 0.687rem| Medium (500) | 14px (1.27) | +0.02em | Order Timestamps, Table Capacity Subtitle |
| `type-food-price` | 16px / 1.0rem | SemiBold (600) | 20px (1.25) | Tabular | Food Card Price Tag (₹340.00) |
| `type-discount-price`| 18px / 1.125rem| Bold (700) | 24px (1.33) | Tabular | Discount Deduction (-₹160.00) |
| `type-table-num` | 22px / 1.375rem| ExtraBold (800)| 26px (1.18) | Tabular | POS Table Card ("T-04"), KDS Header |
| `type-order-num` | 13px / 0.812rem| Medium (500) | 16px (1.23) | Tabular | Ticket Identifier (#1042-B1) |
| `type-kds-timer` | 26px / 1.625rem| ExtraBold (800)| 30px (1.15) | Tabular | Elapsed Kitchen Chronometer (12:45) |
| `type-kds-qty` | 20px / 1.25rem | ExtraBold (800)| 24px (1.20) | Tabular | KDS Item Quantity Indicator ("2x") |

---

# 08 — SPACING SYSTEM (4px / 8px MODULAR RHYTHM)

```css
--space-0-5: 2px;   /* Micro offsets, borders */
--space-1:   4px;   /* Tag internal padding, icon spacing */
--space-1-5: 6px;   /* Compact chip vertical padding */
--space-2:   8px;   /* Badge internal padding, list item gaps */
--space-3:   12px;  /* Input internal padding, chip horizontal padding */
--space-4:   16px;  /* Standard mobile screen gutter, card interior padding */
--space-5:   20px;  /* Medium card padding, tablet gutters */
--space-6:   24px;  /* Section vertical rhythm, desktop grid gaps */
--space-8:   32px;  /* Modal header spacing, table grid gaps */
--space-10:  40px;  /* Major section separation */
--space-12:  48px;  /* Touch target anchor height, dock clearance */
--space-16:  64px;  /* Floating dock clearance, KDS bump button height */
--space-20:  80px;  /* Empty state top padding */
```

---

# 09 — GRID SYSTEM & CONTAINER RULES

| Viewport Category | Breakpoint Range | Columns | Gutter | Screen Margin | Max Container Width |
|---|---|:---:|:---:|:---:|:---:|
| **Mobile Compact** | 320px – 374px | 4 | 12px | 12px | 100% |
| **Mobile Standard** | 375px – 429px | 4 | 16px | 16px | 100% |
| **Mobile Pro / Phablet** | 430px – 767px | 4 | 16px | 20px | 480px (Centered) |
| **Tablet Portrait** | 768px – 1023px | 8 | 20px | 24px | 720px |
| **Tablet Landscape / POS** | 1024px – 1279px | 12 | 20px | 24px | 100% Full-bleed |
| **Desktop Operations** | 1280px – 1439px | 12 | 24px | 32px | 1240px (or Full Split) |
| **Large Admin / 1080p KDS**| 1440px – 1920px | 12 | 24px | 32px | 1440px / 100% KDS |

---

# 10 — RESPONSIVE ADAPTATION MATRIX

* **Customer Web Ordering**:
  * *Mobile (320-430px)*: 1-Column food list with 96x96px right-aligned thumbnails. Fixed floating cart dock (56px) at thumb base.
  * *Tablet (768-1023px)*: 2-Column food grid. Category navigation transforms into sticky left sidebar. Cart dock persists at right corner.
  * *Desktop (1280px+)*: 3-Column food grid + persistent 380px right-hand Cart & Order Timeline panel.
* **Reception / POS Terminal**:
  * *Mobile*: Single-column stacked cards for floor status with bottom bar navigation.
  * *Tablet (iPad 10.2")*: Split-view: 65% Floorplan Table Grid + 35% Flyout Drawer for selected table order details and billing.
  * *Desktop (1280px+)*: Fixed 220px navigation sidebar + 8-column table grid + persistent 420px billing register.
* **Kitchen Display System (KDS)**:
  * *Tablet (834-1024px)*: 2-Column ticket rail.
  * *Desktop / 1080p Touch (1920px)*: 5 to 6-Column ticket board with auto-wrap, fixed top station selector, and right-hand "All Day" item aggregator.

---

# 11 — BORDER RADIUS SCALE

* `--radius-none`: `0px` (KDS ticket borders for maximum screen space utilization).
* `--radius-xs`: `4px` (Micro-tags, dietary veg/non-veg square icons).
* `--radius-sm`: `6px` (Status badges, quantity stepper buttons, table status flags).
* `--radius-md`: `10px` (Form text inputs, search bar, secondary buttons, food thumbnails).
* `--radius-lg`: `16px` (Food cards, POS table cards, KDS ticket cards, modal windows).
* `--radius-xl`: `24px` (Mobile bottom sheet top corners, floating cart tray).
* `--radius-full`: `9999px` (Pill chips, dietary filters, category tabs, circular icon buttons).

---

# 12 — SHADOW & ELEVATION SYSTEM

* `--shadow-none`: `none` (Default cards on white surface; borders provide separation).
* `--shadow-subtle`: `0px 1px 3px 0px rgba(15, 23, 42, 0.06), 0px 1px 2px -1px rgba(15, 23, 42, 0.04)` (Resting cards).
* `--shadow-medium`: `0px 4px 6px -1px rgba(15, 23, 42, 0.08), 0px 2px 4px -2px rgba(15, 23, 42, 0.04)` (Card hover, dropdowns).
* `--shadow-elevated`: `0px -4px 16px 0px rgba(15, 23, 42, 0.08)` (Customer floating cart dock, bottom sheet header).
* `--shadow-overlay`: `0px 25px 50px -12px rgba(15, 23, 42, 0.25)` (Full-screen modals, cash confirmation dialog).
* *Dark Mode Rule*: Shadows are visually replaced by **surface luminosity steps** (`#0B0F19` canvas ➔ `#182234` card ➔ `#212E44` drawer) with 1px hairline borders (`#334155`).

---

# 13 — ICON SYSTEM

* **Family**: Clean line icon set (Phosphor / Lucide Icons).
* **Stroke Weight**: Consistent 1.75px stroke; rounded corners and terminals.
* **Size Scale**:
  * Micro (14x14px): Dietary markers, inline status indicators.
  * Standard (18x18px): Button icons, input leading icons (Search, Chevron).
  * Navigation (22x22px): Bottom bar icons, POS sidebar icons.
  * Hero / Feedback (36x36px to 48x48px): Empty states, Payment success checkmarks.
* **Invariant**: Never use ambiguous icons without text labels for operational actions (e.g. "Settle Bill", "86 Item", "Call Waiter").

---

# 14 — BUTTON SYSTEM

| Variant | Height | Padding | Background / Border | Text / Icon | States Specs |
|---|:---:|:---:|---|---|---|
| **Primary** | 48px (Mobile)<br>44px (POS) | 0 20px | Solid `--color-brand-primary` (`#EA580C`) | White / Bold 16px | Hover: `#C2410C`<br>Pressed: `#9A3412` + scale(0.98)<br>Disabled: `#CBD5E1` / no pointer |
| **Secondary** | 48px / 44px | 0 18px | Surface Card / 1px Border `#E2E8F0` | Slate 900 / SemiBold 15px | Hover: Surface Subtle `#F1F5F9`<br>Pressed: `#E2E8F0` |
| **Tertiary** | 44px | 0 14px | Surface Subtle `#F1F5F9` / None | Slate 700 / Medium 14px | Hover: Slate 200 `#E2E8F0` |
| **Ghost** | 44px | 0 12px | Transparent / None | Slate 600 / Medium 14px | Hover: `#F1F5F9` |
| **Destructive**| 44px | 0 18px | Red-50 `#FEF2F2` / 1px Red-200 `#FECACA` | Red-700 / SemiBold 15px | Hover: Solid Red-600, White text |
| **Success** | 44px | 0 18px | Emerald-50 `#ECFDF5` / 1px `#A7F3D0` | Emerald-700 / SemiBold 15px | Hover: Solid Emerald-600, White text |
| **Icon Button**| 44x44px | None | Transparent or Subtle Border | Slate 600 | Focus ring 2px offset |
| **KDS Bump** | 64px (Tactile) | 0 24px | State Color (Emerald-600 or Amber-600) | White / ExtraBold 18px | Massive touch zone for line cooks |

---

# 15 — FORM INPUT SYSTEM

* **Height**: 48px (Mobile & POS touch-friendly).
* **Resting Style**: Background `#FFFFFF`, Border 1px `#CBD5E1`, Radius 10px, Text `#0F172A`, Placeholder `#94A3B8`.
* **Focus State**: Border 1.5px `#EA580C`, Outer Focus Ring `0 0 0 3px rgba(234, 88, 12, 0.15)`.
* **Error State**: Border 1.5px `#EF4444`, Helper text Red-700 with leading `AlertCircle` icon.
* **Search Input**: Left-aligned magnifying glass icon (18px), right-aligned instant "Clear (X)" button when populated.
* **Quantity Stepper (`c-quantity-stepper`)**:
  * 36px height, compact pill container `#F1F5F9`.
  * `[-]` button (36x36px target), tabular quantity counter (15px SemiBold), `[+]` button (36x36px target).
* **Segmented Control**: 40px height container `#F1F5F9`, 4px padding. Selected segment `#FFFFFF` with `--shadow-subtle` and bold label.

---

# 16 — FOOD COMPONENT SYSTEM

### Standard Food Card (`c-food-card`)
* **Layout**: Horizontal card layout (390px mobile) or Vertical grid card (Desktop).
* **Anatomy**:
  1. Top Left: Dietary Badge (Veg green circle / Non-veg red triangle) + Bestseller Gold Ribbon.
  2. Main Body: Food Title (`type-h3`, 17px SemiBold), Short appetizing description (`type-body`, 14px Slate-600, max 2 lines truncated).
  3. Price & Meta: Price (`type-food-price`, ₹340.00), "Customizable" tag if modifiers exist.
  4. Right Thumbnail: 96x96px high-res food image, 10px radius, object-fit cover.
  5. Action CTA: Overlaid at bottom right of image: `[ ADD + ]` button (40px height, solid white background, green/orange bold text, shadow). When added, transforms into inline quantity stepper.
* **Sold Out State**: Image grayscale 80%, card opacity 60%, CTA replaced with solid gray badge `[ SOLD OUT ]`.

### Compact Food Card (`c-food-card-compact`)
* Used for cart recommendations and replacement suggestions.
* 64x64px thumbnail, 1-line title, price, and miniature `+ ADD` icon button.

### Product Detail Bottom Sheet (`c-product-detail-sheet`)
* Slides up to 85vh maximum height.
* Hero image 200px height with gradient scrim.
* Nutritional & allergen tags: `[ Gluten-Free ]` `[ Contains Dairy ]` `[ 480 kcal ]`.
* Mandatory modifier radio groups & optional checkbox add-on lists.
* Special instructions input with quick pill chips ("Less Spicy", "No Garlic").
* Sticky bottom bar with computed live price total and `[ ADD TO ORDER ]` CTA.

---

# 17 — CART COMPONENT SYSTEM

* **Floating Cart Tray (`c-cart-dock`)**:
  * Appears smoothly when `cartItems.length > 0`.
  * Height: 60px, Radius 16px, Background Solid Slate-900 (`#0F172A`), Text White.
  * Left: Item count badge ("2 Items") + Total ("₹730.00").
  * Right: "View Cart" label with `ArrowRight` icon.
  * Position: Sticky bottom, 16px from screen edge, elevated above content (`z-index: 50`).
* **Cart Drawer (`c-cart-drawer`)**:
  * Itemized rows with item name, chosen modifiers in small slate tags, price delta, and inline `[-] [qty] [+]` controls.
  * Special Cooking Instructions summary.
  * Financial Breakdown:
    * Food Subtotal: ₹1,340.00
    * Game Discount (20%): -₹268.00 (Highlighted in Green-600)
    * Taxes (5% GST): +₹53.60
    * **Grand Total**: ₹1,125.60 (`type-display-md`, 24px Bold)
  * Primary Button: 52px height `[ SEND ORDER TO KITCHEN ➔ ]`.

---

# 18 — ORDER COMPONENT SYSTEM

* **Order Status Stepper**:
  * 4-Stage Horizontal Pipeline: `Submitted` ➔ `Preparing` ➔ `Ready` ➔ `Served`.
  * Completed stages: Solid Emerald-500 checkmark circles.
  * In-progress stage: Pulsing Amber-500 ring with live chronometer ("Cooking: 8 mins").
  * Future stages: Muted Slate-300 hollow circles.
* **Order Batch Card**:
  * Groups items ordered together (e.g. "Round 1 — 08:32 PM").
  * Displays kitchen status badge, item list, and subtotal for that specific batch.

---

# 19 — TABLE COMPONENT SYSTEM (POS / RECEPTION)

* **Table Card Anatomy**:
  * Table Identifier: `T-04` (22px ExtraBold).
  * Status Badge: Color-coded pill top right (`AVAILABLE`, `ACTIVE`, `PAYMENT PENDING`, `PAID`, `CLOSED`).
  * Occupancy Duration: Live counter ("Seated: 42m ago").
  * Capacity / Guests: Icon + "4 Guests • Server: Ramesh".
  * Financial State: Active Unpaid Total (`₹1,125.60`).
  * Quick Actions Bar: `[ + Add Order ]` `[ View Bill ]` `[ Settle ]`.
* **State Border Encoding**:
  * `AVAILABLE`: 1.5px solid Emerald-500, Card background `#F0FDF4`.
  * `ACTIVE`: 1.5px solid Amber-500, Card background `#FFFFFF`.
  * `PAYMENT PENDING`: 2px pulsating Violet-500 border, Card background `#F5F3FF`.
  * `PAID`: 1.5px solid Emerald-600, Card background `#ECFDF5`, "CLEAR TABLE" enabled.

---

# 20 — KDS COMPONENT SYSTEM

* **Ticket Dimensions**: Minimum width 300px, flexible height, max 6 per 1080p screen row.
* **Ticket Header**:
  * Table Number (28px ExtraBold): Legible from 3 meters.
  * Ticket # (`#1042-B1`) & Order Time (`08:40 PM`).
  * Elapsed Chronometer:
    * `00:00 - 09:59`: Slate Header (`#1E293B`), White text.
    * `10:00 - 14:59`: Amber Header (`#78350F`), Yellow text (`#FDE68A`).
    * `15:00+`: Flashing Red Header (`#7F1D1D`), Bright Red text (`#F87171`).
* **Ticket Body**:
  * Quantity: `type-kds-qty` (20px ExtraBold Amber-400, e.g. "2x").
  * Item Name: 17px Bold White.
  * Modifiers: Indented, 13px Slate-300 text.
  * Special Instructions / Allergy: Bright Red background (`#DC2626`), Bold White text, `AlertTriangle` icon.
  * Tap-to-Strike: Cook taps item ➔ strikes out in green line, indicating prep complete.
* **Ticket Footer Action**:
  * 64px height full-width touch button:
  * `NEW` ➔ `[ ▶ START PREPARING ]` (Amber)
  * `PREPARING` ➔ `[ ✓ MARK READY ]` (Emerald)
  * `READY` ➔ `[ ➔ MARK SERVED / BUMP ]` (Slate)

---

# 21 — STATUS BADGE SYSTEM

| Status Token | Visual Style (Light Mode) | Visual Style (Dark / KDS) | Icon | Text Label | Usage Rule |
|---|---|---|:---:|---|---|
| `state-available` | Bg `#ECFDF5`, Border `#A7F3D0`, Text `#047857` | Bg `#064E3B`, Text `#6EE7B7` | `CheckCircle` | Available | Vacant, sanitized table |
| `state-active` | Bg `#FFFBEB`, Border `#FDE68A`, Text `#B45309` | Bg `#78350F`, Text `#FDE68A` | `Clock` | Active Dining | Table seated, orders active |
| `state-pay-pending`| Bg `#F5F3FF`, Border `#DDD6FE`, Text `#6D28D9` | Bg `#4C1D95`, Text `#DDD6FE` | `CreditCard` | Payment Pending | Bill requested, settling |
| `state-paid` | Bg `#ECFDF5`, Border `#A7F3D0`, Text `#047857` | Bg `#065F46`, Text `#A7F3D0` | `CheckCheck` | Settled / Paid | Balance = ₹0.00, ready to clear |
| `state-order-new` | Bg `#F0F9FF`, Border `#BAE6FD`, Text `#0369A1` | Bg `#0C4A6E`, Text `#BAE6FD` | `Bell` | New Ticket | Kitchen unacknowledged |
| `state-order-prep`| Bg `#FFFBEB`, Border `#FDE68A`, Text `#B45309` | Bg `#78350F`, Text `#FDE68A` | `Flame` | Preparing | Cook on line |
| `state-order-ready`| Bg `#ECFDF5`, Border `#A7F3D0`, Text `#047857` | Bg `#064E3B`, Text `#6EE7B7` | `Check` | Ready for Pickup| Runner dispatched |
| `state-order-served`| Bg `#F1F5F9`, Border `#E2E8F0`, Text `#475569` | Bg `#1E293B`, Text `#94A3B8` | `Utensils` | Served | Food on guest table |
| `state-sold-out` | Bg `#FEF2F2`, Border `#FECACA`, Text `#B91C1C` | Bg `#7F1D1D`, Text `#FCA5A5` | `Slash` | Sold Out (86) | Depleted inventory |

---

# 22 — SERVICE REQUEST SYSTEM

* **Customer Request Action Sheet (`SCR-CUST-21`)**:
  * 4 Quick Tile Buttons (80x80px):
    * `[ Water Bottle ]` (`Droplet` icon)
    * `[ Extra Cutlery ]` (`UtensilsCrossed` icon)
    * `[ Call Waiter ]` (`Bell` icon)
    * `[ Request Bill ]` (`Receipt` icon)
  * Custom Text Input: *"Any other request for our staff..."*
  * Instant feedback banner: *"Staff notified. Ramesh will assist Table 04 shortly."*
* **Reception Priority Queue Card**:
  * High-visibility card in Requests Drawer.
  * Shows Table Number (`T-04`), Request Type (`WATER`), and live elapsed waiting timer (`02:15`).
  * Escalation: Timer turns amber after 2 mins, flashing red after 4 mins.
  * Actions: `[ Acknowledge ]` and `[ Mark Resolved ]`.

---

# 23 — PAYMENT UI SYSTEM

* **Itemized Bill Summary (`SCR-CUST-15`)**:
  * Legal Restaurant Header, GSTIN, FSSAI License, Table Number, Session ID.
  * Batch-by-batch item breakdown.
  * Cumulative Food Subtotal: ₹1,340.00.
  * Game Discount Deduction (20%): -₹268.00 (Bold Green).
  * Net Taxable Food Amount: ₹1,072.00.
  * CGST (2.5%): ₹26.80 | SGST (2.5%): ₹26.80.
  * **Final Payable Amount**: ₹1,125.60.
* **Payment Selector**:
  * Instant UPI: Native intent deep-links (Google Pay, PhonePe, Paytm) + dynamic fallback QR.
  * Card: Clean hosted fields (Card number, Expiry, CVV).
  * Pay at Restaurant (Cash/Card): Displays explicit notice: *"Please pay at the reception counter. Staff will verify your payment to complete your session."*
* **Verification Guardrail**: The customer screen never displays "PAID" until the backend receives a verified payment gateway webhook or staff PIN certification.

---

# 24 — GAMIFICATION UI SYSTEM (CHEF'S PRECISION CATCH)

* **Design Aesthetic**: Minimalist culinary elegance (warm copper saute pan, charcoal canvas, beautifully illustrated falling ingredients). No childish arcade sounds or pixelated graphics.
* **Micro-Interactions**:
  * **Intro Modal**: Explains 15-second time limit, single-attempt rule, and discount tiers (0% to 20% max).
  * **Canvas Playfield**: Responsive 60fps canvas. Touch drag or mouse movement guides the copper pan left/right. Catching golden saffron/herbs awards points; catching burnt embers deducts points.
  * **Result Modal**:
    * Score reveal: 85 Points.
    * Tier Badge: `20% DISCOUNT UNLOCKED` (Emerald & Gold accents).
    * Clear message: *"This 20% discount has been applied to the cumulative food subtotal of Table 04's dining session."*
    * Lock state: Once completed, the game button turns into a locked voucher badge showing the earned discount.

---

# 25 — MODAL, DRAWER & BOTTOM SHEET ARCHITECTURE

* **Mobile Viewport (<768px)**:
  * All secondary interactions use **Bottom Sheets**.
  * Max height: 85vh. Drag handle at top (36x4px pill `#CBD5E1`).
  * Fixed bottom footer containing primary CTA.
  * Dismissible via drag down or top-right `[X]` button.
* **Tablet / Desktop Viewport (768px+)**:
  * Contextual deep-dives (Table Details, Cart) render as **Right Slide Drawers** (420px width).
  * Confirmations, alerts, and cash verifications render as **Centered Modals** (max width 520px).
* **Keyboard & Accessibility**:
  * Focus trapped within modal while open.
  * Escape key immediately dismisses non-destructive modals.
  * Background backdrop: `rgba(15, 23, 42, 0.60)` with `backdrop-filter: blur(4px)`.

---

# 26 — NAVIGATION ARCHITECTURE

* **Customer Web App**:
  * Mobile: Minimal header (Logo, Table #, Service Bell) + sticky bottom dock when cart has items. Top horizontal scrolling category chips with active tab auto-scroll.
  * Desktop: Sticky top navigation bar + left category rail.
* **Reception POS Terminal**:
  * Desktop / Tablet: Persistent 220px Left Sidebar:
    * `[ Floor Plan ]` (Active badge)
    * `[ Live Orders ]` (Pending count)
    * `[ Requests ]` (Flashing alert count)
    * `[ Billing / Cash ]`
    * `[ Menu 86-ing ]`
    * `[ QR Manager ]`
* **Kitchen KDS**:
  * Zero unnecessary navigation. Top station bar allows switching: `[ ALL STATIONS ]` `[ TANDOOR ]` `[ CURRY ]` `[ PANTRY ]`.
* **Admin Portal**:
  * Collapsible 240px sidebar with nested management trees (Menu, Modifiers, Tables, Staff RBAC, Gamification, Reports).

---

# 27 — EMPTY, LOADING & ERROR STATES

* **Skeleton Loading**: Light gray pulsating rectangles (`#F1F5F9` ➔ `#E2E8F0`) matching exact card dimensions. Avoids jarring content layout shifts (CLS).
* **Empty States**:
  * Empty Cart: Illustration of empty dining plate + *"Your cart is empty. Explore our chef's specials to start ordering!"* + CTA `[ Browse Menu ]`.
  * No Active Table Orders: *"No orders placed yet. Add dishes from the menu to send to the kitchen."*
* **Network Disconnection Banner (`SCR-CUST-27`)**:
  * Amber banner fixed at screen top: `WifiOff` icon + *"Connection lost. Reconnecting to table session..."*
  * Placed order history and cart are preserved in IndexedDB.
* **Sold-Out Recovery Sheet (`SCR-CUST-23`)**:
  * *"Paneer Tikka just sold out in the kitchen."*
  * Curated list of 2 similar dishes (e.g. Hara Bhara Kebab) with 1-tap `[ Swap Item ]` button.

---

# 28 — ACCESSIBILITY RULES (WCAG 2.2 AA)

1. **Color Contrast**:
   * Text Primary `#0F172A` on `#FFFFFF` = 14.5:1 (Passes AAA).
   * Text Secondary `#475569` on `#FFFFFF` = 5.8:1 (Passes AA).
   * Status Badges: Dark text on tinted backgrounds strictly maintains minimum 4.5:1 ratio.
2. **Touch Targets**:
   * Mobile: Minimum interactive bounding box is 44x44px.
   * Kitchen KDS: Minimum interactive bounding box is 64x64px.
3. **Focus States**:
   * All interactive elements support `:focus-visible` with a 2px offset solid outline in `--color-brand-primary`.
4. **Screen Reader Semantics**:
   * Dynamic order updates use `aria-live="polite"`.
   * Urgent kitchen alerts and sold-out notifications use `aria-live="assertive"`.
   * Dietary badges include explicit `aria-label="Vegetarian dish"` or `aria-label="Non-vegetarian dish"`.

---

# 29 — MOTION & ANIMATION SYSTEM

* **Principles**: Purposeful, snappy, non-distracting. Zero decorative physics or infinite floating loops.
* **Timing Scales**:
  * Micro-interactions (Button tap, checkbox toggle): `100ms – 150ms ease-out`.
  * Drawers & Bottom Sheets: `250ms cubic-bezier(0.16, 1, 0.3, 1)` (Swift deceleration).
  * Modal Fade / Backdrop: `200ms ease-out`.
  * Order Progress Pulse: `2000ms infinite cubic-bezier(0.4, 0, 0.6, 1)`.
* **Reduced Motion**: Respects `prefers-reduced-motion: reduce` by replacing slide and scale animations with instantaneous opacity crossfades.

---

# 30 — CONTENT DESIGN & RESTAURANT SEED CATALOGUE

A production dataset featuring authentic Indian culinary terminology, dietary indicators, spice levels, and modifier structures:

* **Starters**:
  * *Paneer Tikka Multani* (₹340.00 | Veg | Bestseller) — Succulent cottage cheese cubes marinated in hung curd, yellow mustard, and royal spices, char-grilled in tandoor. [Portions: Half / Full; Spice: Mild / Med / Hot].
  * *Murgh Malai Tikka* (₹390.00 | Non-Veg | Bestseller) — Tender chicken morsels in rich clotted cream, green cardamom, and royal cheese paste.
  * *Hara Bhara Kebab* (₹290.00 | Veg) — Pan-fried patties of spinach, green peas, and potatoes infused with fresh mint.
  * *Crispy Corn Pepper Salt* (₹260.00 | Veg) — Golden American corn tossed with bell peppers and roasted black pepper.
  * *Tandoori Chicken Wings* (₹360.00 | Non-Veg) — Char-grilled chicken wings glazed in spicy Punjabi degi mirch marinade.
* **Mains**:
  * *Classic Butter Chicken* (₹420.00 | Non-Veg | Bestseller) — Char-smoked pulled tandoori chicken simmered in a velvety satin sauce of vine tomatoes and butter. [Boneless / Bone-In].
  * *Dal Makhani 1947* (₹320.00 | Veg | Bestseller) — Whole black lentils slow-cooked overnight over charcoal embers, finished with organic churned butter.
  * *Paneer Butter Masala* (₹360.00 | Veg) — Fresh cottage cheese cubes simmered in an aromatic rich tomato and cashew gravy.
  * *Kadhai Paneer* (₹350.00 | Veg) — Cottage cheese and bell peppers tossed in fresh crushed coriander seeds in iron kadhai.
* **Breads, Biryanis, Beverages & Desserts**:
  * *Butter Naan* (₹60.00), *Garlic Naan* (₹80.00), *Tandoori Roti* (₹35.00), *Lachha Paratha* (₹70.00).
  * *Dum Awadhi Chicken Biryani* (₹460.00), *Nawabi Subz Dum Biryani* (₹380.00).
  * *Alphonso Mango Lassi* (₹140.00), *Fresh Lime Soda* (₹90.00), *Masala Coke* (₹110.00), *Cold Coffee* (₹160.00).
  * *Warm Gulab Jamun with Rabdi* (₹180.00), *Kesar Pista Rasmalai* (₹190.00), *Sizzling Brownie with Gelato* (₹240.00).

---

# 31 — COMPLETE DESIGN TOKEN HIERARCHY

```json
{
  "color": {
    "brand": {
      "primary": "#EA580C",
      "primaryHover": "#C2410C",
      "primaryActive": "#9A3412",
      "primarySubtle": "#FFF7ED"
    },
    "surface": {
      "bg": "#F8FAFC",
      "card": "#FFFFFF",
      "elevated": "#FFFFFF",
      "subtle": "#F1F5F9",
      "overlay": "rgba(15, 23, 42, 0.60)"
    },
    "text": {
      "primary": "#0F172A",
      "secondary": "#475569",
      "tertiary": "#94A3B8",
      "inverse": "#FFFFFF"
    },
    "border": {
      "default": "#E2E8F0",
      "strong": "#CBD5E1",
      "focus": "#EA580C"
    },
    "state": {
      "available": "#10B981",
      "active": "#F59E0B",
      "payPending": "#8B5CF6",
      "paid": "#059669",
      "closed": "#94A3B8",
      "orderNew": "#0EA5E9",
      "orderPrep": "#F59E0B",
      "orderReady": "#10B981",
      "orderServed": "#64748B",
      "soldOut": "#EF4444"
    }
  },
  "spacing": {
    "0": "0px",
    "1": "4px",
    "2": "8px",
    "3": "12px",
    "4": "16px",
    "5": "20px",
    "6": "24px",
    "8": "32px",
    "12": "48px",
    "16": "64px"
  },
  "radius": {
    "xs": "4px",
    "sm": "6px",
    "md": "10px",
    "lg": "16px",
    "xl": "24px",
    "full": "9999px"
  },
  "motion": {
    "fast": "150ms ease-out",
    "normal": "250ms cubic-bezier(0.16, 1, 0.3, 1)",
    "pulse": "2000ms infinite ease-in-out"
  }
}
```

---

# 32 — COMPONENT HIERARCHY & COMPOSITION

```
FOUNDATIONS
└── Color Tokens • Typography Scale • 4/8pt Spacing • Elevation • Radii
    │
    ▼
PRIMITIVES
└── Button • IconButton • TextInput • Badge • DietaryIcon • Stepper • Divider
    │
    ▼
COMPOSITES
└── FoodCard • CustomizationRow • CartItem • TableGridCard • KDSTicketCard • RequestTile
    │
    ▼
PATTERNS
└── FloatingCartDock • BottomSheetDrawer • LiveOrderTimeline • SettleBillModal • FloorPlanGrid
    │
    ▼
EXPERIENCE SHELLS
├── 1. Customer Ordering PWA (Mobile Single Column)
├── 2. Reception / POS Terminal (Tablet/Desktop Split View)
├── 3. Kitchen Display System (1080p Dark Multi-Column Board)
└── 4. Owner / Admin Portal (Desktop Data Table & Tree View)
```

---

# 33 — RESPONSIVE DESIGN RULES

1. **Fluid Fluidity Over Media Query Chaos**: Layouts rely on CSS Grid `minmax()` and Flexbox wrap before hard breakpoint switches occur.
2. **Thumb Zone Discipline on Mobile**: Primary actions (Cart dock, Send order, Confirm customizations) never sit at the unreachable top corners of mobile viewports.
3. **Split Screen Evolution on Tablets**:
   * Under 768px: Detail views push onto full screen or slide as bottom sheets.
   * 768px to 1279px: Screen divides into master-detail side-by-side sheets.
   * 1280px+: Full tripartite workstation (Nav Sidebar + Master Grid + Persistent Workspace Drawer).

---

# 34 — CUSTOMER-SPECIFIC UI RULES

* **Zero Login Obstacle**: The customer is identified strictly via the ephemeral QR session. No mandatory SMS OTP or account creation before adding dishes to the cart.
* **Visual Appetite Reinforcement**: Food images maintain a minimum 1:1 aspect ratio and vibrant natural coloration.
* **Bill Transparency**: Discounts are always prominently distinguished from taxes. The 20% game discount deduction is explicitly credited as *"Chef's Challenge Discount"*.
* **Persistent Help Tether**: The service call bell (`Need Help`) is permanently pinned to the header across every screen.

---

# 35 — RECEPTION-SPECIFIC UI RULES

* **Table State Scannability**: Table numbers are rendered in 22px Bold. Table borders clearly project the state across the room.
* **Unpaid Table Clearing Lockout**: The POS software disables the "Clear Table" button whenever `balanceDue > 0`.
* **Cash Verification Accountability**: Accepting cash triggers a modal displaying the exact amount due, a tendered cash calculator, and requires the staff member's 4-digit PIN for audit logs.

---

# 36 — KITCHEN-SPECIFIC UI RULES (KDS)

* **Distance Glanceability**: Key data points (Table number, elapsed timer, quantities) must be legible from 3 meters.
* **Zero Cognitive Distraction**: Kitchen personnel are shielded from all financial totals, customer names, phone numbers, discounts, and payment methods.
* **Allergy Highlight Primacy**: Special cooking instructions and allergy alerts use bright solid red callouts that cannot be overlooked.
* **Accidental Tap Safety**: Any bumped/served ticket remains in a 10-second recall queue with an instant "Undo Bump" action.

---

# 37 — ADMIN-SPECIFIC UI RULES

* **Hierarchical Tree Management**: Menu items, categories, and modifier groups are organized in expandable tree views for rapid bulk adjustments.
* **Audit Trail Integrity**: Any voided order, manual discount override, or cash reconciliation log records the employee timestamp and role ID.
* **Print-Ready QR Code Generation**: Table QR generator exports vector SVG and print-ready PDF files formatted for standard table tent stands (4x6 inches).

---

# 38 — EXAMPLE SCREEN COMPOSITIONS (ASCII BLUEPRINTS)

### A. Customer Mobile Menu & Customization Sheet
```
┌──────────────────────────────────────────────┐
│ [Logo] THE SPICE PAVILION  [T-04]  [Bell 🔔] │
├──────────────────────────────────────────────┤
│ 🔍 Search dishes, ingredients...             │
├──────────────────────────────────────────────┤
│ [● Veg] [ Non-Veg ] [ ★ Bestsellers ]        │
├──────────────────────────────────────────────┤
│ STARTERS                                     │
│ ┌──────────────────────────────────────────┐ │
│ │ [●] VEG   ★ BESTSELLER                   │ │
│ │ Paneer Tikka Multani         ┌─────────┐ │ │
│ │ Succulent cottage cheese     │  IMAGE  │ │ │
│ │ cubes marinated in curd.     │ 96x96px │ │ │
│ │ ₹340.00                      └─────────┘ │ │
│ │ Customizable            ┌──────────────┐ │ │
│ │                         │ ADD + [BTN]  │ │ │
│ └─────────────────────────┴──────────────┘ │ │
├──────────────────────────────────────────────┤
│ FLOATING DOCK (When cart > 0):               │
│ ┌──────────────────────────────────────────┐ │
│ │ 2 Items • ₹730.00        VIEW CART ➔ [ ] │ │
│ └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

### B. Kitchen Display System (KDS 1080p Ticket Board)
```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ 🍳 KDS   [ ALL STATIONS ▾ ]   ACTIVE: 4   AVG: 11m   [ 🔊 Audio: ON ]          09:12 PM │
├──────────────────┬──────────────────┬──────────────────┬────────────────────────────────┤
│ TABLE 04 #1042-B1│ TABLE 01 #1040-B2│ TABLE 06 #1039-B1│ ALL DAY AGGREGATOR (Prep Queue)│
│ [ 08:40 ] NORMAL │ [ 12:15 ] WARNING│ [ 18:30 ] CRITICAL                              │
├──────────────────┼──────────────────┼──────────────────┤ • Butter Chicken: 3            │
│ 1x PANEER TIKKA  │ 2x BUTTER CHICKEN│ 1x CHICKEN BIRYANI • Paneer Tikka:   2            │
│    • Full Portion│    • Boneless    │ ⚠ [ALLERGY: NO   │ • Butter Naan:    8            │
│ 2x BUTTER NAAN   │ 4x BUTTER NAAN   │    PEANUTS/NUTS] │                                │
├──────────────────┼──────────────────┼──────────────────┤                                │
│ [ PREPARING... ] │ [ PREPARING... ] │ [ PREPARING... ] │                                │
│ [ MARK READY ➔ ] │ [ MARK READY ➔ ] │ [ MARK READY ➔ ] │                                │
└──────────────────┴──────────────────┴──────────────────┴────────────────────────────────┘
```

---

# 39 — FINAL DESIGN QA CHECKLIST

Before any screen is implemented, it must pass this 12-point audit:

* [x] **1. Visual Hierarchy**: Does the primary action or primary information dominate the screen within 200ms?
* [x] **2. Alignment & Grid**: Are all margins and gutters aligned strictly to the 4px/8px modular rhythm?
* [x] **3. Consistency**: Do identical states (e.g. `PAYMENT PENDING`) use identical colors, icons, and labels across Customer, POS, and Admin?
* [x] **4. Contrast (WCAG 2.2 AA)**: Do all text elements meet or exceed the 4.5:1 contrast ratio?
* [x] **5. Gestalt Grouping**: Are related modifier items grouped inside clear common regions with proper padding?
* [x] **6. Cognitive Load**: Is the kitchen view 100% free of customer names, billing amounts, and marketing clutter?
* [x] **7. Fitts's Law**: Are primary mobile touch targets (Add to Cart, View Cart) anchored in the bottom thumb zone with 44px+ height? Are KDS bump buttons 64px+?
* [x] **8. Hick's Law**: Are menu customizations broken into progressive disclosure sheets rather than overwhelming form walls?
* [x] **9. Jakob's Law**: Does the cart and checkout process follow standard, predictable mental models?
* [x] **10. Recognition Over Recall**: Are food items accompanied by dietary tags, spice indicators, and clear modifier summaries?
* [x] **11. Multi-Sensory State Communication**: Is color accompanied by iconography and text labels across all 10 restaurant states?
* [x] **12. Responsive Integrity**: Does the interface adapt its composition across 320px, 768px, 1024px, and 1920px without basic desktop shrink-scaling?
