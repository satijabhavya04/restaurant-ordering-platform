# RESTAURANT DIGITAL ORDERING PLATFORM
## 03. STATE MACHINES, OPERATIONAL LOGIC & EDGE CASES

---

## 1. DINING SESSION STATE MACHINE

The dining session is the authoritative root container for all guest activity at a physical table. A QR code alone **never** authorizes ordering; it only points to the table entity. The backend session engine enforces strict state transitions.

```
                  ┌────────────────────────────────────────────────────────┐
                  ▼                                                        │
         ┌─────────────────┐                                               │
         │    AVAILABLE    │  (Table empty, sanitized, ready for seating)   │
         └────────┬────────┘                                               │
                  │ [Trigger: Valid QR Scan or Waiter Open Table]          │
                  ▼                                                        │
         ┌─────────────────┐                                               │
   ┌────►│     ACTIVE      │◄────┐ (Guests ordering, eating, calling staff)│
   │     └────────┬────────┘     │                                         │
   │              │              │ [Trigger: Payment Failed/Cancelled]     │
   │              │ [Trigger: Guest or Staff Requests Bill / Pay]          │
   │              ▼              │                                         │
   │     ┌─────────────────┐     │                                         │
   │     │ PAYMENT PENDING ├─────┘ (Bill locked, ordering paused/settling) │
   │     └────────┬────────┘                                               │
   │              │ [Trigger: Gateway Webhook Verified OR Cash Confirmed]  │
   │              ▼                                                        │
   │     ┌─────────────────┐                                               │
   │     │      PAID       │ (Balance = ₹0.00; Table awaiting turnaround)  │
   │     └────────┬────────┘                                               │
   │              │ [Trigger: Waiter/Staff taps "Clear Table"]             │
   │              ▼                                                        │
   │     ┌─────────────────┐                                               │
   └─────┤     CLOSED      ├───────────────────────────────────────────────┘
         └─────────────────┘ (Session archived, token revoked, Table -> AVAILABLE)
```

### 1.1 State Definitions & Transition Guardrails

| State Name | Table Status | Customer App State | Kitchen / POS Capabilities | Allowed Next Transitions |
|---|---|---|---|---|
| `AVAILABLE` | Unoccupied | QR scan initiates bootstrap, creates new `SessionID`, issues ephemeral JWT. | Staff can assign walk-in guests or open table manually. | `ACTIVE` |
| `ACTIVE` | Occupied | Full catalog browsing, cart additions, multi-batch orders, service requests, game play. | KDS receives order batches; POS tracks running table balance. | `PAYMENT_PENDING`, `CLOSED` (Manager void only) |
| `PAYMENT_PENDING` | Occupied / Settling | Ordering suspended; shows verified bill summary & payment gateway selector or cash prompt. | Staff can view unsettled bill, accept cash, or review payment terminal callback. | `PAID`, `ACTIVE` (if payment cancelled/rejected) |
| `PAID` | Occupied / Settled | Displays Payment Success, E-Receipt download, and feedback rating. | Staff sees table highlighted in green. "Clear Table" button becomes enabled. | `CLOSED` |
| `CLOSED` | Sanitized | Ephemeral session token revoked. Any old browser open renders `SCR-CUST-25-SESSION-CLOSED`. | System archives financial logs. Table resets to `AVAILABLE`. | `AVAILABLE` |

### 1.2 Anti-Fraud QR Invariant: The "Old QR Photo" Protection
* **Vulnerability**: A malicious customer takes a photo of Table 04's QR code, leaves the restaurant, and later tries to order food remotely, charging it to new guests sitting at Table 04.
* **Architecture Solution**:
  1. Each dining session generates a high-entropy cryptographic `session_token` signed with a backend secret (`HMAC-SHA256`).
  2. When the table is cleared by staff (`CLOSED`), the `session_token` is permanently invalidated in Redis.
  3. If a user scans an old photo or reloads an old URL after closure, the server checks the active session for Table 04. Because the old token does not match the newly spawned session, the backend immediately responds with `HTTP 410 Gone` and renders `SCR-CUST-25-SESSION-CLOSED` ("This dining session has concluded").

---

## 2. ORDER STATE MACHINE

Orders are placed in discrete batches (e.g., Round 1 Appetizers, Round 2 Mains, Round 3 Breads/Dessert). Each order batch follows a deterministic lifecycle:

```
[DRAFT CART] ──► [SUBMITTED] ──► [NEW] ──► [PREPARING] ──► [READY] ──► [SERVED]
                      │            ▲
                      ▼            │
                [CONFLICT 86] ─────┘ (Item unavailable: Prompt replacement)
```

```mermaid
stateDiagram-v2
    [*] --> DRAFT : Customer adds items to cart
    DRAFT --> SUBMITTED : Customer taps "Send Order to Kitchen"
    SUBMITTED --> NEW : Atomic inventory check passes; KDS chime triggers
    SUBMITTED --> CONFLICT_86 : Item sold out during checkout
    CONFLICT_86 --> DRAFT : User swaps item or removes
    NEW --> PREPARING : Cook taps "Start Preparing"
    PREPARING --> READY : Cook taps "Mark Ready" (Staff runner alerted)
    READY --> SERVED : Runner delivers dish; taps "Mark Served"
    SERVED --> [*]
    
    NEW --> CANCELLED : Manager cancels (with audit reason)
    PREPARING --> CANCELLED : Kitchen rejects (equipment failure / spoil)
```

### 2.1 Order State Rules
* **Idempotency**: Every order placement request includes a client-generated UUID `idempotency_key`. Rapid double-tapping of "Send Order" cannot result in duplicate kitchen tickets.
* **Batch Isolation**: Placing Round 2 does not reset or alter the preparation progress of Round 1. Each batch generates an independent KDS ticket card referencing the parent `table_id` and `dining_session_id`.

---

## 3. PAYMENT STATE MACHINE

The payment engine ensures zero discrepancies between the guest's mobile device, the physical cash drawer, and the cloud database.

```
                        ┌──────────────────────────────┐
                        │      PAYMENT_INITIATED       │
                        └──────────────┬───────────────┘
                                       │
                    ┌──────────────────┴──────────────────┐
                    ▼                                     ▼
        ┌───────────────────────┐             ┌───────────────────────┐
        │     ONLINE (UPI/CARD) │             │    CASH AT COUNTER    │
        └───────────┬───────────┘             └───────────┬───────────┘
                    │                                     │
                    ▼                                     ▼
        ┌───────────────────────┐             ┌───────────────────────┐
        │  GATEWAY_PROCESSING   │             │   STAFF_CONFIRMATION  │
        └─────┬───────────┬─────┘             └─────┬───────────┬─────┘
              │           │                         │           │
     [Webhook Success] [Failure]            [PIN Approved]  [Rejected]
              │           │                         │           │
              ▼           ▼                         ▼           ▼
        ┌───────────┐ ┌───────────┐           ┌───────────┐ ┌───────────┐
        │   PAID    │ │  FAILED   │           │   PAID    │ │ CANCELLED │
        └───────────┘ └───────────┘           └───────────┘ └───────────┘
```

### 3.1 Strict Payment Invariants
1. **Zero Client Authority**: The customer frontend can **never** self-certify a transaction as successful. A payment is strictly marked `PAID` upon receipt and validation of a cryptographically signed HMAC webhook from the payment gateway (Razorpay/Paytm/Stripe), or upon explicit entry of a staff authorization PIN at the POS terminal.
2. **Cash Settlement Workflow**:
   - Customer taps "Pay Cash at Restaurant".
   - App enters `CASH_PENDING` with the message: *"Please hand cash to your server or at the reception counter."*
   - POS terminal emits an alert chime and displays: *"Table 04 requested cash payment of ₹840.00"*.
   - Cashier collects notes, calculates change, and taps **[CONFIRM CASH PAYMENT]** entering their staff security PIN.
   - Database atomically flags session as `PAID`.
   - Customer's phone screen instantly turns green and renders the E-Receipt.

---

## 4. GAMIFICATION & SESSION DISCOUNT LOGIC

### 4.1 Architecture & Experience Design
* **Game Concept**: *"Chef's Precision Catch"* — A minimalist, premium micro-challenge. The diner catches falling gourmet ingredients (truffles, herbs, saffron) in a copper saute pan over 15 seconds.
* **Tone**: Crisp, elegant, responsive physics. Zero cartoonish or arcade aesthetics. Designed to delight guests while they await their initial food round.

### 4.2 Mathematical Rules & Calculation Pipeline

1. **Session-Level Scope**:
   * The discount belongs to the **entire dining session**, not an individual batch.
   * If a table orders ₹500 in Batch 1, unlocks a 20% game discount, and later orders ₹300 in Batch 2:
     $$\text{Food Subtotal} = ₹500 + ₹300 = ₹800$$
     $$\text{Session Discount (20\%)} = 0.20 \times ₹800 = ₹160$$
     $$\text{Net Food Amount} = ₹800 - ₹160 = ₹640$$
     $$\text{GST (5\% on Net)} = 0.05 \times ₹640 = ₹32$$
     $$\text{Final Grand Total} = ₹640 + ₹32 = ₹672$$
2. **Scoring Tiers**:
   * Score 0 – 19: 0% Discount
   * Score 20 – 39: 5% Discount
   * Score 40 – 59: 10% Discount
   * Score 60 – 79: 15% Discount
   * Score 80 – 100: 20% Discount (System Maximum Cap)
3. **Anti-Exploit Safeguards**:
   * **Single Attempt Per Table**: Once any guest at Table 04 starts the game, the server sets `game_played = true` in Redis. If another phone at the same table attempts to launch the game, it receives `{ "already_played": true, "discount": 20 }` and displays the team's already unlocked discount voucher.
   * **Cryptographic Telemetry**: The client submits a timestamped game telemetry hash alongside the score to prevent client-side script tampering.

---

## 5. COMPREHENSIVE EDGE-CASE MATRIX & RESOLUTION BLUEPRINTS

| # | Edge-Case Scenario | Trigger Condition | UX Resolution & System Behavior |
|---|---|---|---|
| 01 | **Old QR Photo Scanned** | Customer photographed QR code yesterday and attempts to order from home. | Backend validates `session_token`. The old token is expired; returns `410 Gone`. Displays `SCR-CUST-25-SESSION-CLOSED`: *"This dining session has ended. If you are seated at this table, please ask your server to activate the table."* |
| 02 | **Closed Session Re-Scanned** | Table was just cleared and marked `AVAILABLE` by staff. Customer scans before staff reseats. | QR opens fresh landing page; prompts waiter to officially seat the table or auto-creates a clean fresh session with zero prior orders. |
| 03 | **Customer Scans Again During Active Session** | Customer accidentally closes browser or re-scans table QR mid-meal. | System recognizes Table 04 has an `ACTIVE` session. Validates browser session cookie or re-attaches to the active session. Displays current order status and live bill without creating a duplicate session. |
| 04 | **Multiple Phones at Same Table** | 4 guests at Table 04 scan the same QR code on their individual phones. | All 4 devices join the same `dining_session_id`. Each can browse and add items. WebSocket pushes cart updates and live order additions across all 4 screens in real time. All orders aggregate into one unified bill. |
| 05 | **Customer Closes Browser Mid-Meal** | Guest closes Safari/Chrome or phone battery dies. | State is preserved on the server. When phone turns back on and reopens URL (or re-scans QR), the session resumes at the exact same screen (Tracking / Bill). |
| 06 | **Guest Has No Smartphone / Low Battery** | Elderly guest or guest with dead battery wants to order. | Reception / Waiter opens POS terminal, selects Table 04, and uses **Staff-Assisted Order Mode** to input food items. The order routes to KDS and aggregates into the exact same table bill. |
| 07 | **Customer Drops Internet (Offline State)** | Cell service drops in basement dining room. | PWA enters offline tolerance mode (`SCR-CUST-27`). An amber banner informs: *"Connection lost. Reconnecting..."* Cart is stored in IndexedDB. "Place Order" button displays a spinner and queues until network ping succeeds. |
| 08 | **Item Sold Out (Prior to Adding to Cart)** | Cook 86-es Butter Chicken while guest is reading menu. | WebSocket broadcast `catalog.item_unavailable` immediately flips the Butter Chicken card to grayscale, disables the "ADD" button, and renders a "SOLD OUT" badge. |
| 09 | **Item Becomes Unavailable In-Flight** | Guest has Paneer Tikka in cart; another table takes the last portion before checkout. | Checkout returns `409 Conflict`. App renders `SCR-CUST-23-ITEM-UNAVAILABLE` bottom sheet offering 3 explicit paths: **1. Choose Replacement** (suggests Hara Bhara Kebab), **2. Remove Item**, or **3. Call Waiter**. |
| 10 | **Payment Gateway Fails** | Bank OTP fails or network drops during UPI authorization. | App transitions to `SCR-CUST-18-PAYMENT-FAILED`. Explains the failure reason clearly. Provides two primary CTAs: **[Retry Payment]** or **[Switch to Pay Cash at Counter]**. Table remains in `PAYMENT_PENDING`. |
| 11 | **Duplicate Order Submission** | Diner taps "Send Order" rapidly 5 times due to impatient fingers. | First request locks order pipeline with client-side `idempotency_key`. Subsequent 4 requests are debounced on client and rejected by backend with `409 Duplicate`. Only one ticket arrives at KDS. |
| 12 | **Duplicate Webhook Callbacks** | Payment Gateway retries webhook 3 times. | Webhook handler checks `transactions` table. If `txn_id` is already marked `SUCCESS`, webhook returns `200 OK` immediately without double-crediting or re-triggering receipt emails. |
| 13 | **Customer Leaves Without Paying** | Walk-out scenario. | Table remains in `ACTIVE` or `PAYMENT_PENDING`. Waiter notices unoccupied table. Manager opens Table 04 on POS, taps **[Report Unpaid Walkout]**, which requires Manager PIN. Session is flagged for audit with security camera timestamp. Table is then cleared. |
| 14 | **Staff Attempts to Clear Table with Unpaid Bill** | Waiter mistakenly taps "Clear Table" while balance is ₹1,240. | Action is strictly disabled in UI. If forced via API, server responds with `400 Bad Request: Cannot clear table with outstanding balance of ₹1,240.00`. |
| 15 | **Game Already Played in Session** | Guest refreshes browser to try to replay the game for a higher discount. | Server checks `session.game_played == true`. Blocks game launch; displays result screen with the previously earned discount. |
| 16 | **Discount Already Applied to Table** | Table orders a 3rd round of Naans after getting a 20% discount. | System automatically applies the existing 20% discount to the new items when generating the updated bill. |
| 17 | **Kitchen Terminal Drops Network** | KDS loses Wi-Fi connection. | KDS sounds an audible disconnect warning. Local service worker caches offline tickets. Screen flashes an alert bar: *"KDS Offline - 2 orders pending sync"*. Automatically syncs upon reconnection. |
| 18 | **Kitchen Item Unavailable (Mid-Cook Spoilage)** | Chef drops last portion of Biryani. | Chef taps ticket item ➔ "Mark Unavailable". Instant alert sent to Reception POS and Customer phone. Customer is prompted for replacement or instant bill deduction. |
