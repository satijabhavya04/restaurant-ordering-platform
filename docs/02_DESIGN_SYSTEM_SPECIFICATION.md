# RESTAURANT DIGITAL ORDERING PLATFORM
## 02. DESIGN SYSTEM SPECIFICATION

---

## 1. DESIGN PRINCIPLES

1. **Glanceability Over Decoration**: In noisy, fast-moving restaurant environments, cognitive fatigue is the enemy. Whether a customer is deciding on a curry in low lighting, a waiter is scanning an urgent service alert across 30 tables, or a kitchen cook is reading a ticket 3 meters away through rising steam, typography, contrast, and layout must convey meaning within 200 milliseconds.
2. **Tactile Ergonomics & The Thumb Zone**: In mobile customer ordering, all high-frequency interactions (Category filters, Add to Cart, Cart Dock, Service Call) live within the natural bottom thumb sweep. Touch targets strictly respect a 44x44px minimum bounding box. On KDS wall mounts, buttons are a minimum of 64x64px to prevent miss-taps by gloved or flour-dusted hands.
3. **Multi-Sensory Feedback with Semantic Color**: Color is never the sole communicator of state. State changes are reinforced with standardized iconography, textual badges, and (in POS/KDS) localized audio feedback chimes.
4. **Resilient Ephemeral State**: The UI maintains optimistic UI updates backed by persistent offline-tolerant local state (IndexedDB). If a phone drops Wi-Fi momentarily in a basement dining room, cart state and placed order history remain perfectly preserved.

---

## 2. COLOR SYSTEM & DESIGN TOKENS

The color palette is derived using WCAG 2.2 AA accessibility standards. It uses a dual-mode foundation:
* **Customer & Reception POS**: Crisp Porcelain & Warm Obsidian (Light-mode default with intentional warmth to stimulate appetite and maintain high contrast in ambient daylight).
* **Kitchen Display System (KDS)**: Deep Low-Glare Slate (Dark-mode high-contrast environment to prevent eye fatigue under harsh industrial kitchen lighting and provide maximum luminance contrast for tickets).

### 2.1 Core Color Tokens & CSS Variables

```css
:root {
  /* ==========================================================================
     BRAND PRIMARIES (Appetite-Stimulating Warm Amber & Deep Saffron)
     ========================================================================== */
  --color-primary-50:  #FFF7ED; /* Light amber tint for selected pill backgrounds */
  --color-primary-100: #FFEDD5; /* Subtle border for active items */
  --color-primary-200: #FED7AA;
  --color-primary-500: #EA580C; /* Primary interactive brand color (Buttons, active icons) */
  --color-primary-600: #C2410C; /* Hover state for primary buttons */
  --color-primary-700: #9A3412; /* Active/Pressed state */
  --color-primary-900: #7C2D12;

  /* ==========================================================================
     NEUTRAL SURFACES & SHADES (Porcelain Light Mode)
     ========================================================================== */
  --color-surface-bg:        #F8FAFC; /* Window/Canvas background */
  --color-surface-card:      #FFFFFF; /* Primary card background */
  --color-surface-elevated:  #FFFFFF; /* Drawers, Modals, Popovers */
  --color-surface-subtle:    #F1F5F9; /* Inset backgrounds, quantity toggles */
  --color-surface-border:    #E2E8F0; /* Clean structural hairpins */
  --color-surface-border-subtle: #F1F5F9;

  /* ==========================================================================
     TYPOGRAPHY COLORS
     ========================================================================== */
  --color-text-primary:   #0F172A; /* Slate 900: 14.5:1 contrast against white */
  --color-text-secondary: #475569; /* Slate 600: 5.8:1 contrast (Body / descriptions) */
  --color-text-muted:     #94A3B8; /* Slate 400: Timestamps, hints, inactive tabs */
  --color-text-inverse:   #FFFFFF; /* White on primary or dark badges */

  /* ==========================================================================
     SEMANTIC STATUS SYSTEM (Accessible, Multi-Channel)
     ========================================================================== */
  /* Available / Success / Veg / Paid */
  --color-status-success-bg:     #ECFDF5;
  --color-status-success-border: #A7F3D0;
  --color-status-success-text:   #047857; /* Emerald 700: High-contrast green */
  --color-status-success-solid:  #10B981;

  /* Active Table / Preparing / Warning */
  --color-status-warning-bg:     #FFFBEB;
  --color-status-warning-border: #FDE68A;
  --color-status-warning-text:   #B45309; /* Amber 700 */
  --color-status-warning-solid:  #F59E0B;

  /* Payment Pending / Non-Veg / Urgent Alert */
  --color-status-danger-bg:      #FEF2F2;
  --color-status-danger-border:  #FECACA;
  --color-status-danger-text:    #B91C1C; /* Red 700: Non-veg indicator, sold-out badge */
  --color-status-danger-solid:   #EF4444;

  /* Info / Waiter Service Request / Table Seated */
  --color-status-info-bg:        #F0F9FF;
  --color-status-info-border:    #BAE6FD;
  --color-status-info-text:      #0369A1; /* Sky 700 */
  --color-status-info-solid:     #0EA5E9;

  /* Settlement / Payment Pending (POS) */
  --color-status-purple-bg:      #F5F3FF;
  --color-status-purple-border:  #DDD6FE;
  --color-status-purple-text:    #6D28D9;
  --color-status-purple-solid:   #8B5CF6;

  /* ==========================================================================
     KITCHEN DISPLAY SYSTEM (KDS) DARK HIGH-CONTRAST PALETTE
     ========================================================================== */
  --kds-bg-canvas:          #0B0F19; /* Pure deep slate */
  --kds-ticket-bg:          #182234; /* Elevated high-contrast card */
  --kds-ticket-border:      #334155;
  --kds-ticket-header-new:  #1E293B;
  --kds-ticket-header-prep: #78350F; /* Amber 900 */
  --kds-ticket-header-ready:#064E3B; /* Emerald 900 */
  --kds-ticket-header-late: #7F1D1D; /* Red 900 Urgent Alert */
  --kds-text-primary:       #F8FAFC;
  --kds-text-secondary:     #CBD5E1;
  --kds-text-accent:        #38BDF8; /* Cyan 400 */
}
```

---

## 3. TYPOGRAPHY SYSTEM

* **Primary Typeface**: `Plus Jakarta Sans` (Geometric sans-serif with tall x-height, clear apertures, and open counters; outstanding legibility on small phone screens).
* **Tabular / Monospace Figures**: `JetBrains Mono` or `Plus Jakarta Sans` with `font-variant-numeric: tabular-nums`. Used for all currency values, order counters, timestamps, table numbers, and kitchen chronometers.

### 3.1 Typographic Scale

| Token | Font Size | Line Height | Weight | Letter Spacing | Applied To |
|---|---|---|---|---|---|
| `type-display` | 32px (2.0rem) | 40px (1.25) | Bold (700) | -0.02em | Hero headers, Game score reveal, Bill total |
| `type-h1` | 24px (1.5rem) | 32px (1.33) | Bold (700) | -0.015em | Screen titles, Modal headers, KDS Table # |
| `type-h2` | 20px (1.25rem) | 28px (1.40) | SemiBold (600) | -0.01em | Category titles, Table drawer titles |
| `type-h3` | 17px (1.06rem) | 24px (1.41) | SemiBold (600) | -0.005em | Food item names, Ticket header titles |
| `type-body-lg` | 16px (1.0rem) | 24px (1.50) | Regular (400) / Medium (500) | 0.0em | Primary copy, Cart item names, Modifiers |
| `type-body-md` | 14px (0.875rem)| 20px (1.43) | Regular (400) / Medium (500) | 0.0em | Food descriptions, modifier subtitles |
| `type-body-sm` | 12px (0.75rem) | 16px (1.33) | Regular (400) / Medium (500) | +0.01em | Allergen tags, tax breakdown, helper text |
| `type-caption` | 11px (0.687rem)| 14px (1.27) | Medium (500) | +0.02em | Timestamps, badge labels, breadcrumbs |
| `type-price-lg`| 20px (1.25rem) | 24px (1.20) | Bold (700) | -0.01em (tabular) | Final cart total, Bill grand total |
| `type-price-md`| 15px (0.937rem)| 20px (1.33) | SemiBold (600) | 0.0em (tabular) | Food card item price |
| `type-kds-time`| 28px (1.75rem) | 32px (1.14) | ExtraBold (800)| 0.0em (tabular) | KDS elapsed chronometer clock |

---

## 4. SPACING & ELEVATION SYSTEM

### 4.1 Spacing Scale (Strict 4px / 8px Base Grid)

```css
:root {
  --space-1:  4px;   /* Micro offsets, icon gaps */
  --space-2:  8px;   /* Compact padding, badge internal padding */
  --space-3:  12px;  /* Input internal padding, chip padding */
  --space-4:  16px;  /* Standard mobile screen gutter, card interior padding */
  --space-5:  20px;  /* Medium card padding */
  --space-6:  24px;  /* Section vertical rhythm */
  --space-8:  32px;  /* Modal header spacing, table grid gaps */
  --space-10: 40px;  /* Major section separation */
  --space-12: 48px;  /* Touch target anchor height */
  --space-16: 64px;  /* Floating dock clearance, KDS button height */
}
```

### 4.2 Elevation Tokens

```css
:root {
  --elevation-card:    0px 1px 3px 0px rgba(15, 23, 42, 0.06), 0px 1px 2px -1px rgba(15, 23, 42, 0.04);
  --elevation-hover:   0px 4px 6px -1px rgba(15, 23, 42, 0.08), 0px 2px 4px -2px rgba(15, 23, 42, 0.04);
  --elevation-dock:    0px -4px 16px 0px rgba(15, 23, 42, 0.08); /* Bottom cart bar */
  --elevation-drawer:  0px 20px 25px -5px rgba(15, 23, 42, 0.12), 0px 8px 10px -6px rgba(15, 23, 42, 0.08);
  --elevation-modal:   0px 25px 50px -12px rgba(15, 23, 42, 0.25);
  
  --radius-sm:  6px;   /* Tags, badges, quantity buttons */
  --radius-md:  10px;  /* Form inputs, small cards */
  --radius-lg:  16px;  /* Food cards, modals, table cards */
  --radius-xl:  24px;  /* Bottom sheet top corners */
  --radius-full: 9999px; /* Pill buttons, status indicators */
}
```

---

## 5. RESPONSIVE BREAKPOINTS & VIEWPORT ARCHITECTURE

| Breakpoint Name | Viewport Width | Target Devices | Grid Layout & UX Adaptation |
|---|---|---|---|
| `xs` (Compact Mobile) | 320px – 374px | iPhone SE, small Androids | Single column. Condensed food card (image 72x72px right-aligned). Bottom fixed single CTA. 12px screen padding. |
| `sm` (Standard Mobile) | 375px – 429px | iPhone 13/14/15, Pixel | Single column. Standard food card (image 96x96px right). Sticky category tab rail. 16px screen padding. Floating cart bar (56px). |
| `md` (Pro Mobile / Phablet) | 430px – 767px | iPhone Pro Max, small folding phones | Single column with max content constraint (480px centered). Generous card padding (16px). |
| `lg` (Tablet Portrait / POS Handheld) | 768px – 1023px | iPad 10.2", Waiter terminal | 2-column food grid or 3-column table management view. Bottom navigation switches to persistent top/side bar. |
| `xl` (Tablet Landscape / Desktop POS) | 1024px – 1279px | POS Counter Station | Split view: 65% Floor Plan / Menu catalog, 35% Persistent Table Detail & Cart register. |
| `2xl` (Desktop HD / KDS Display) | 1280px – 1439px | Manager Office, 15" KDS | 4-column KDS ticket rail or full dashboard with persistent sidebar (240px) + data tables. |
| `3xl` (Large Display / 24" KDS) | 1440px – 1920px | 21"-24" Kitchen Wall Rail | 5-6 column active KDS ticket rail. Instant glanceability up to 4 meters away. |

---

## 6. COMPONENT LIBRARY SPECIFICATIONS

### 6.1 Button System

| Button Variant | Min Height | Padding | Background / Border | Text / Icon Style | State Specs |
|---|---|---|---|---|---|
| `btn-primary` | 48px (Mobile) / 44px (POS) | 0 20px | Solid `--color-primary-500` | White, SemiBold 16px | Hover: `--color-primary-600`<br>Pressed: Scale 0.98 + `--color-primary-700`<br>Disabled: `#CBD5E1` / opacity 0.5 |
| `btn-secondary` | 48px / 44px | 0 18px | `--color-surface-card` / 1px `--color-surface-border` | Slate 900, Medium 15px | Hover: `--color-surface-subtle`<br>Pressed: `#E2E8F0` |
| `btn-ghost` | 44px | 0 12px | Transparent / None | Slate 600, Medium 14px | Hover: `--color-surface-subtle` |
| `btn-destructive` | 44px | 0 18px | `--color-status-danger-bg` / 1px `--color-status-danger-border` | Red 700, SemiBold 15px | Hover: Solid Red 600, White text |
| `btn-kds-touch` | 64px (Large touch) | 0 24px | Dynamic by state (Green/Amber) | White, ExtraBold 18px | Massive tactile target for kitchen bumps |

### 6.2 Food Item Card Component (`c-food-card`)

```
┌─────────────────────────────────────────────────────────────┐
│ [●] VEG   ★ BESTSELLER                                      │
│                                                             │
│ Paneer Tikka Multani                          ┌───────────┐ │
│ Succulent cottage cheese cubes marinated in   │           │ │
│ hung curd, yellow mustard, and secret spices, │   IMAGE   │ │
│ char-grilled in tandoor.                      │  96x96px  │ │
│                                               │           │ │
│ ₹340.00                                       └───────────┘ │
│ Customizable                             ┌────────────────┐ │
│                                          │  ADD  +  [BTN] │ │
│                                          └────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

* **Dietary Iconography**:
  * **Veg**: Green square (14x14px) with solid green dot (6x6px) centered.
  * **Non-Veg**: Red square (14x14px) with solid red triangle pointing up.
  * **Egg**: Yellow square with solid yellow circle.
* **Sold Out State**: Image grayscale filter 80%, Card opacity 65%, "ADD" button replaced with a disabled pill: "SOLD OUT".

### 6.3 Customization Bottom Sheet (`c-customization-sheet`)

* **Header**: Item name, base price, close button ("X"), short subtext ("Choice of portion & preparation").
* **Section 1: Mandatory Radio Group (Portion Size)**:
  * "Select 1" badge (Required).
  * Radio Item: "Half Portion (4 pcs)" — Included.
  * Radio Item: "Full Portion (8 pcs)" — +₹160.00.
* **Section 2: Optional Multi-Select Checkboxes (Add-ons)**:
  * Checkbox: "Extra Mint Chutney & Pickled Onions" — +₹30.00.
  * Checkbox: "Double Cheese Crust" — +₹60.00.
* **Section 3: Special Cooking Instructions**:
  * Single-line input expanding to textarea with character limit (120 chars max).
  * Helper pills: "Less Spicy", "No Onion/Garlic", "Extra Crispy".
* **Sticky Footer Bar**:
  * Left: Running total calculation (e.g., "₹500.00").
  * Right: Prominent primary CTA "Add to Order (1 Item)".

### 6.4 Table Status Card (Reception POS Grid)

```
┌───────────────────────────────────────────────┐
│ T-04                        [ ACTIVE ● 45m ]  │
│ 4 Guests  •  Server: Ramesh                   │
├───────────────────────────────────────────────┤
│ Orders: 2 Batches (6 items)                   │
│ Unpaid Balance: ₹1,240.00                     │
│ Requests: [ Water (1m ago) ]                  │
├───────────────────────────────────────────────┤
│ [ + Add Item ]   [ View Bill ]   [ Settle ]   │
└───────────────────────────────────────────────┘
```

* **State Indicators**:
  * `AVAILABLE`: Border `#10B981` (Green), Background `#F0FDF4`, Subtitle "Ready for guests".
  * `ACTIVE`: Border `#F59E0B` (Amber), Background `#FFFFFF`, Shows live duration timer & orders count.
  * `PAYMENT PENDING`: Border `#8B5CF6` (Purple), Background `#F5F3FF`, Flashing alert "Payment Requested".
  * `PAID`: Border `#059669` (Emerald), Background `#ECFDF5`, Badge "PAID - Awaiting Table Clear".

### 6.5 Kitchen Display System (KDS) Order Ticket Card

```
┌───────────────────────────────────────────────┐
│ TABLE 04             TICKET #1042-B1          │
│ DINE-IN             [ 08:42 ] (NORMAL)        │
├───────────────────────────────────────────────┤
│ 2x  PANEER TIKKA                              │
│     • Spicy Level: Medium                     │
│     • Extra Mint Chutney                      │
│                                               │
│ 1x  BUTTER CHICKEN                            │
│     • Boneless                                │
│     ⚠ [SPECIAL: ALLERGY - NO CASHEW NUT]      │
│                                               │
│ 4x  BUTTER NAAN                               │
├───────────────────────────────────────────────┤
│ [ ▶ START PREPARING ]                         │
└───────────────────────────────────────────────┘
```

* **Urgency Color Transitions**:
  * **00:00 – 09:59 (Normal)**: Header dark gray `#1E293B`, Timer text White.
  * **10:00 – 14:59 (Warning)**: Header deep amber `#78350F`, Timer text `#FBBF24`.
  * **15:00+ (Critical/Overdue)**: Header deep red `#7F1D1D`, Border flashing 1Hz red `#EF4444`, Timer text `#F87171`.
* **Allergy Highlight**: Inverted high-visibility badge (Bright Red background `#DC2626`, White text, bold).

---

## 7. COMPONENT STATE MATRIX

Every interactive component across all 4 applications strictly implements the 9 standard states:

| State | Visual Manifestation | Trigger / Conditions |
|---|---|---|
| **Default** | Resting elevation, neutral border, default color tokens. | Initial idle state. |
| **Hover** | 4-8% darker background, subtle elevation bump (`--elevation-hover`). | Cursor pointer hover (Desktop / Tablet). |
| **Pressed / Active** | Scale transform `scale(0.98)`, 12% darker tint, shadow reduction. | Mouse down or touch active tap. |
| **Focus** | 2px solid offset ring (`--color-primary-500`, offset 2px). | Keyboard tab focus (Accessibility WCAG 2.4.7). |
| **Disabled** | Opacity 45%, grayscale 30%, cursor `not-allowed`, no pointer events. | Invalid form, sold-out item, unpaid clearing. |
| **Loading** | Label hidden; centered spinner or shimmering skeleton animation. | In-flight network mutation / payment check. |
| **Error** | Red border `#EF4444`, red validation helper text below input. | Required modifier unselected, payment declined. |
| **Success** | Green border `#10B981`, checkmark icon, subtle green fill. | Promo discount unlocked, order acknowledged. |
| **Selected** | Primary background tint (`--color-primary-50`), bold text, checkmark. | Active category chip, selected portion radio. |
