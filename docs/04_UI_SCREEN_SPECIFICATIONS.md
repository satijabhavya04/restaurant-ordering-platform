# RESTAURANT DIGITAL ORDERING PLATFORM
## 04. UI SCREEN SPECIFICATIONS & WIREFRAME BLUEPRINTS

---

## 1. CUSTOMER MOBILE UI SPECIFICATIONS

### 1.1 Screen: Menu Home (`SCR-CUST-03-MENU-HOME`)

* **Viewport**: 390px x 844px (Standard Mobile).
* **Grid**: 1-column fluid, 16px horizontal screen padding.

```
┌─────────────────────────────────────────────────────────────┐
│ [Logo] THE SPICE PAVILION        [ Table 04 ]  [ Bell (1) ] │
├─────────────────────────────────────────────────────────────┤
│ 🔍 Search dishes, ingredients, drinks...                   │
├─────────────────────────────────────────────────────────────┤
│ [● Veg Only]  [ Non-Veg ]  [ ★ Bestsellers ]  [ 🌶 Spicy ]  │
├─────────────────────────────────────────────────────────────┤
│  [ STARTERS ]  [ MAIN COURSE ]  [ BREADS ]  [ RICE ]  ...   │ (Sticky Category Rail)
├─────────────────────────────────────────────────────────────┤
│ STARTERS (8 items)                                          │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [●] VEG   ★ BESTSELLER                                  │ │
│ │ Paneer Tikka Multani                      ┌───────────┐ │ │
│ │ Succulent cottage cheese cubes marinated  │   IMAGE   │ │ │
│ │ in hung curd & secret spices, grilled in  │  96x96px  │ │ │
│ │ clay tandoor.                             │           │ │ │
│ │ ₹340.00                                   └───────────┘ │ │
│ │ Customizable                         ┌────────────────┐ │ │
│ │                                      │  ADD  +  [BTN] │ │ │
│ │                                      └────────────────┘ │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [▲] NON-VEG                                             │ │
│ │ Murgh Malai Tikka                         ┌───────────┐ │ │
│ │ Tender chicken chunks marinated in cream, │   IMAGE   │ │ │
│ │ cardamom, green chilli, and cheese.       │  96x96px  │ │ │
│ │ ₹390.00                                   └───────────┘ │ │
│ │ Customizable                         ┌────────────────┐ │ │
│ │                                      │  ADD  +  [BTN] │ │ │
│ │                                      └────────────────┘ │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ FLOATING DOCK (When cart > 0 items):                         │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 2 Items  •  ₹730.00                     VIEW CART  ➔ [ ]│ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

#### Key Interaction Specs:
* **Sticky Header**: Sticks to top with `backdrop-filter: blur(12px)`. Shows Table Number badge ("Table 04") and Service Call Bell.
* **Sticky Category Bar**: Horizontal scroll with active state tracking via `IntersectionObserver`. Clicking a chip smoothly scrolls to the target category header.
* **Add Button State**: Tapping "ADD" on customizable items slides up the Customization Sheet (`SCR-CUST-07`). On non-customizable items, instantly converts to quantity stepper `[- 1 +]` with haptic feedback.

---

### 1.2 Screen: Customization Bottom Sheet (`SCR-CUST-07-CUSTOMIZATION`)

* **Viewport**: 390px width; slides up from bottom (max-height: 85vh).

```
┌─────────────────────────────────────────────────────────────┐
│ ─── (Drag Handle)                                      [X]  │
│ Paneer Tikka Multani                                        │
│ Base: ₹340.00                                               │
├─────────────────────────────────────────────────────────────┤
│ PORTION SIZE (Required - Choose 1)             [ REQUIRED ] │
│                                                             │
│ (●) Half Portion (4 Pcs)                          Included  │
│ ( ) Full Portion (8 Pcs)                          +₹160.00  │
├─────────────────────────────────────────────────────────────┤
│ SPICE LEVEL (Optional - Choose 1)                           │
│                                                             │
│ ( ) Mild Spice                                    Included  │
│ (●) Medium Chef's Style (Recommended)             Included  │
│ ( ) Extra Hot & Spicy                             Included  │
├─────────────────────────────────────────────────────────────┤
│ ADD-ONS (Optional - Select multiple)                        │
│                                                             │
│ [✓] Extra Mint Chutney & Pickled Onions            +₹30.00  │
│ [ ] Grated Amul Cheese Topping                     +₹50.00  │
│ [ ] Extra Roomali Roti (1 Pc)                      +₹45.00  │
├─────────────────────────────────────────────────────────────┤
│ SPECIAL INSTRUCTIONS                                        │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ e.g. Less oil, well-charred edges... (Max 120 chars)    │ │
│ └─────────────────────────────────────────────────────────┘ │
│ [ Less Spicy ]  [ No Onion/Garlic ]  [ Extra Crispy ]       │
├─────────────────────────────────────────────────────────────┤
│ STICKY FOOTER:                                              │
│ Total: ₹530.00                      [ ADD TO ORDER (1) ]    │
└─────────────────────────────────────────────────────────────┘
```

---

### 1.3 Screen: Live Order Tracking Hub (`SCR-CUST-10-ORDER-TRACKING`)

```
┌─────────────────────────────────────────────────────────────┐
│ [Back to Menu]               TABLE 04             [ Help 🔔]│
├─────────────────────────────────────────────────────────────┤
│ 🟢 ORDER SENT TO KITCHEN                     EST: 15-20 MINS│
│                                                             │
│   ●───────────────◎───────────────○───────────────○         │
│ Received      Preparing        Ready           Served       │
│ 08:32 PM     In Progress     Estimated       Pending        │
├─────────────────────────────────────────────────────────────┤
│ 🎮 CHEF'S CHALLENGE MINI-GAME                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🌟 Win up to 20% OFF your entire meal!                  │ │
│ │ Play our 15-second skill game while your food is being  │ │
│ │ prepared. Discount applies to your final bill!          │ │
│ │                                    [ PLAY CHALLENGE ➔ ] │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ CURRENT ROUND (BATCH #1 - 08:32 PM)                         │
│ • 1x Paneer Tikka Multani (Full, Med Spice)         ₹500.00 │
│ • 2x Butter Naan                                    ₹120.00 │
│ • 1x Mango Lassi                                    ₹140.00 │
├─────────────────────────────────────────────────────────────┤
│ TABLE ACTIONS:                                              │
│ ┌───────────────────────────┐ ┌───────────────────────────┐ │
│ │    + ADD MORE DISHES      │ │   REQUEST BILL & PAY      │ │
│ └───────────────────────────┘ └───────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

### 1.4 Screen: Gamification & Result (`SCR-CUST-13` & `14`)

```
┌─────────────────────────────────────────────────────────────┐
│ CHEF'S FLAVOUR CATCH                      TIME REMAINING: 04│
├─────────────────────────────────────────────────────────────┤
│ SCORE: 85 PTS                          CURRENT TIER: 20% OFF│
│                                                             │
│                   🌿 (Fresh Herb)                           │
│                                                             │
│        🌶 (Chilli)                                          │
│                                                             │
│                                       🧀 (Cheese)           │
│                                                             │
│                   ┌──────────────┐                          │
│                   │  [PAN DOCK]  │ (Swipe Left/Right)       │
│                   └──────────────┘                          │
├─────────────────────────────────────────────────────────────┤
│ [Result Sheet Pops Up at 00s]:                              │
│                                                             │
│                🎉 OUTSTANDING CHEF! 🎉                      │
│                  YOU SCORED: 85 POINTS                      │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │           ★ 20% DISCOUNT UNLOCKED! ★                │   │
│   │  This 20% discount has been permanently applied to  │   │
│   │  the cumulative food total of Table 04's bill.      │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                             │
│                     [ CONTINUE DINING ]                     │
└─────────────────────────────────────────────────────────────┘
```

---

### 1.5 Screen: Itemized Bill & Settlement (`SCR-CUST-15-BILL-VIEW`)

```
┌─────────────────────────────────────────────────────────────┐
│ [Back]                     TABLE 04 BILL          [ Help 🔔]│
├─────────────────────────────────────────────────────────────┤
│ THE SPICE PAVILION • GSTIN: 27AABCT1332L1ZV                 │
│ Session #DS-8821  •  Date: 16 Sept 2026, 09:15 PM           │
├─────────────────────────────────────────────────────────────┤
│ ORDER BATCH #1 (08:32 PM)                                   │
│   1x Paneer Tikka Multani (Full Portion)            ₹500.00 │
│   2x Butter Naan                                    ₹120.00 │
│   1x Mango Lassi                                    ₹140.00 │
│                                                             │
│ ORDER BATCH #2 (08:55 PM)                                   │
│   1x Butter Chicken (Boneless)                      ₹420.00 │
│   2x Garlic Naan                                    ₹160.00 │
├─────────────────────────────────────────────────────────────┤
│ SUB-TOTAL (5 Items):                              ₹1,340.00 │
│                                                             │
│ 🎮 GAME DISCOUNT (20% OFF FOOD):                   -₹268.00 │
│ NET FOOD AMOUNT:                                  ₹1,072.00 │
│                                                             │
│ CGST (2.5%):                                         ₹26.80 │
│ SGST (2.5%):                                         ₹26.80 │
├─────────────────────────────────────────────────────────────┤
│ GRAND TOTAL DUE:                                  ₹1,125.60 │
├─────────────────────────────────────────────────────────────┤
│ CHOOSE PAYMENT METHOD:                                      │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ (●) Instant UPI (GPay / PhonePe / Paytm / QR)           │ │
│ │     Zero convenience fee • Instant receipt              │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ( ) Credit / Debit Card (Visa, Mastercard, RuPay)       │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ( ) Pay Cash at Restaurant (Staff Verification)         │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ [ PAY ₹1,125.60 NOW ➔ ]                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. RECEPTION / POS DASHBOARD SPECIFICATIONS

* **Target Viewport**: 1280px x 800px (POS Tablet / Desktop Station).
* **Layout**: Fixed Left Navigation Rail (72px collapsed or 220px expanded) + Fluid Operational Canvas + Contextual Right Flyout Drawer (420px).

```
┌──────┬───────────────────────────────────────────────────────────────────┬──────────────────────────────────────┐
│ LOGO │ FLOOR PLAN: MAIN DINING (18 Tables)            [ + Manual Order ] │ TABLE 04 DETAILS                     │
├──────┼───────────────────────────────────────────────────────────────────┼──────────────────────────────────────┤
│ 🪑   │ [ All (18) ]  [ Active (8) ]  [ Available (7) ]  [ Pay Pending(3)]│ Session: #DS-8821 (Seated: 48m ago)  │
│Tables│                                                                   │ Guests: 4  •  Server: Ramesh         │
│      │ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐             ├──────────────────────────────────────┤
│ 🧾   │ │ T-01  [● 12m] │ │ T-02   [FREE] │ │ T-03  [● 34m] │             │ ACTIVE ORDERS:                       │
│Orders│ │ 2 Guests      │ │ 4 Seater      │ │ 3 Guests      │             │ • Batch 1 (08:32 PM) - SERVED        │
│      │ │ ₹480.00       │ │ Available     │ │ ₹920.00       │             │    1x Paneer Tikka (Full)    ₹500.00 │
│ 🔔 2 │ └───────────────┘ └───────────────┘ └───────────────┘             │    2x Butter Naan            ₹120.00 │
│Calls │                                                                   │    1x Mango Lassi            ₹140.00 │
│      │ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐             │ • Batch 2 (08:55 PM) - READY         │
│ 💳   │ │ T-04 [PAY 🔔] │ │ T-05  [● 08m] │ │ T-06  [● 52m] │             │    1x Butter Chicken         ₹420.00 │
│Billing││ 4 Guests      │ │ 6 Guests      │ │ 2 Guests      │             │    2x Garlic Naan            ₹160.00 │
│      │ │ ₹1,125.60     │ │ ₹1,450.00     │ │ ₹680.00       │             ├──────────────────────────────────────┤
│ 🍲   │ └───────────────┘ └───────────────┘ └───────────────┘             │ Subtotal:                  ₹1,340.00 │
│ 86-ed│                                                                   │ Game Discount (20%):        -₹268.00 │
│      │ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐             │ GST (5%):                     ₹53.60 │
│ ⚙️   │ │ T-07   [PAID] │ │ T-08  [● 25m] │ │ T-09   [FREE] │             │ Total Due:                 ₹1,125.60 │
│Admin │ │ 0 Balance     │ │ 2 Guests      │ │ 4 Seater      │             ├──────────────────────────────────────┤
│      │ │ [CLEAR TABLE] │ │ ₹310.00       │ │ Available     │             │ Status: [ PAYMENT PENDING - CASH ]   │
│      │ └───────────────┘ └───────────────┘ └───────────────┘             │                                      │
│      │                                                                   │ [ CONFIRM CASH PAYMENT (₹1,125.60) ] │
│      │                                                                   │ [ + Add Item ]   [ Print Bill ]      │
└──────┴───────────────────────────────────────────────────────────────────┴──────────────────────────────────────┘
```

#### Key Operational Behaviors:
* **Real-time Color Badges**:
  * Gray/White with Green border: `AVAILABLE`.
  * White with Amber border: `ACTIVE`.
  * Violet/Purple flashing banner: `PAYMENT PENDING` (Staff needs to collect cash or approve card).
  * Emerald Solid fill: `PAID` (Guests have settled bill; table is waiting to be cleared).
* **Table Clearing Rule**: The `[CLEAR TABLE]` button is disabled and grayed out if table balance > 0. Only when `PAID` is certified does the button turn red/destructive and active.

---

## 3. KITCHEN DISPLAY SYSTEM (KDS) SPECIFICATIONS

* **Target Viewport**: 1920px x 1080px (21"-24" Industrial Touchscreen / Wall Mount).
* **Color Scheme**: High-contrast dark mode (`#0B0F19` background).
* **Audience**: Line cooks and expeditors standing 2 to 4 meters away.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 🍳 KITCHEN DISPLAY   [ ALL STATIONS ▾ ]    ACTIVE TICKETS: 4    AVG TIME: 11m    [ 🔊 Chime: ON ]  09:12 PM  │
├───────────────────┬───────────────────┬───────────────────┬───────────────────┬─────────────────────────────┤
│ TABLE 04  #1042-B1│ TABLE 01  #1040-B2│ TABLE 06  #1039-B1│ TABLE 05  #1041-B1│ ALL DAY SUMMARY (Prep Queue)│
│ [ 08:40 ] NORMAL  │ [ 12:15 ] WARNING │ [ 18:30 ] OVERDUE │ [ 03:10 ] NEW     │                             │
├───────────────────┼───────────────────┼───────────────────┼───────────────────┤ • Butter Chicken:     3     │
│ 1x PANEER TIKKA   │ 2x BUTTER CHICKEN │ 1x CHICKEN BIRYANI│ 1x CRISPY CORN    │ • Paneer Tikka:       2     │
│    • Full Portion │    • Boneless     │    • Mirchi Ka    │    • Extra Spicy  │ • Butter Naan:        8     │
│    • Med Spice    │                   │      Salan        │                   │ • Garlic Naan:        4     │
│                   │ 4x BUTTER NAAN    │                   │ 2x FRESH LIME     │ • Chicken Biryani:    1     │
│ 2x BUTTER NAAN    │                   │ ⚠ [ALLERGY: NO    │    • Soda / Sweet │                             │
│                   │                   │    NUTS / DAIRY]  │                   │                             │
│ 1x MANGO LASSI    │                   │                   │                   │                             │
├───────────────────┼───────────────────┼───────────────────┼───────────────────┤                             │
│ [ PREPARING... ]  │ [ PREPARING... ]  │ [ PREPARING... ]  │ [ ▶ START PREP ]  │                             │
│ [ MARK READY ➔ ]  │ [ MARK READY ➔ ]  │ [ MARK READY ➔ ]  │                   │                             │
└───────────────────┴───────────────────┴───────────────────┴───────────────────┴─────────────────────────────┘
```

#### Ticket Typography & Interaction Rules:
* **Table Identification**: 28px ExtraBold tabular font. Instantly legible across the line.
* **Chronometer Alert Colors**:
  * `< 10 mins`: Charcoal `#1E293B` header, White text.
  * `10 - 15 mins`: Amber `#78350F` header, Bright Yellow text.
  * `> 15 mins`: Flashing Red `#7F1D1D` header with 2px solid crimson border.
* **Item Strikethrough**: Line cook can tap individual item rows (e.g. tapping "1x Paneer Tikka" strikes through the item in green, signaling the tandoor station has finished that component).
* **Bump Action**: Tapping `[ MARK READY ➔ ]` alerts floor runners on POS. Tapping `[ MARK SERVED ]` removes the ticket from the active queue with an undo grace period (10-second recall toast).

---

## 4. OWNER / ADMIN PORTAL SPECIFICATIONS

* **Target Viewport**: 1440px x 900px Desktop browser.
* **Key Modules**:
  1. **Analytics Hub**: Live revenue charts, gross sales, game discount totals, tax liabilities (GST breakdown), average table turnaround time.
  2. **Menu Builder**: Tree structure of categories, food items, spice levels, calorie tags, and complex nested modifier groups (Single-choice mandatory vs. Multi-choice add-ons).
  3. **Table & QR Engine**: Visual room mapper; cryptographic QR token generator; one-click export of print-ready high-resolution SVGs/PDFs with custom restaurant logo frames.
  4. **Staff & RBAC Matrix**: Employee accounts with pin code management and granular permission toggles.
  5. **Gamification Configurator**: Toggle game availability on/off; configure score-to-discount conversion table; adjust maximum discount limit (e.g. 10%, 15%, or 20%).
