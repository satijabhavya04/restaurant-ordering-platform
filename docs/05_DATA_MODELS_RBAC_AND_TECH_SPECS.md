# RESTAURANT DIGITAL ORDERING PLATFORM
## 05. DATA MODELS, RBAC, AND TECHNICAL ARCHITECTURE

---

## 1. ROLE-BASED ACCESS CONTROL (RBAC) MATRIX

The platform enforces strict role boundaries across all five actor personas:

| Operational Capability | OWNER / ADMIN | RESTAURANT MANAGER | WAITER / RECEPTION | KITCHEN (CHEF/COOK) | CUSTOMER (DINE-IN) |
|---|:---:|:---:|:---:|:---:|:---:|
| **Scan Table QR & Bootstrap Session** | Yes | Yes | Yes | No | **Yes** |
| **Browse Menu & Customize Items** | Yes | Yes | Yes | Read Only | **Yes** |
| **Submit Customer Order Batches** | Yes | Yes | **Staff-Assisted** | No | **Yes** |
| **Play Game & Claim Session Discount** | Yes (Test) | No | No | No | **Yes (1x/Session)** |
| **Call Staff (Water, Cutlery, Waiter)** | No | No | No | No | **Yes** |
| **Acknowledge & Resolve Service Calls** | Yes | Yes | **Yes** | No | No |
| **Update Order State (Prep/Ready/Served)**| Yes | Yes | Mark Served | **Full Control** | No |
| **Mark Menu Item 86 (SOLD OUT)** | Yes | Yes | Yes | **Flag for Review** | No |
| **Accept & Confirm Physical Cash Payment**| Yes | Yes | **Yes (With PIN)** | No | No |
| **Initiate Online Payment (UPI/Card)** | No | No | No | No | **Yes** |
| **Clear Table (Reset to Available)** | Yes | Yes | **Yes (Only if Paid)**| No | No |
| **Void / Cancel Placed Order** | **Yes** | **Yes (Requires PIN)**| No | No | No |
| **Modify Menu Items, Prices, Modifiers**| **Yes** | Restricted | No | No | No |
| **Configure Game & Discount Tiers** | **Yes** | Read Only | No | No | No |
| **Generate & Print Table QR Codes** | **Yes** | **Yes** | No | No | No |
| **View Financial Reports & Tax Audits** | **Yes** | **Daily Shift Only** | No | No | No |
| **Manage Staff Accounts & Permissions** | **Yes** | No | No | No | No |

---

## 2. PRODUCTION JSON SCHEMAS & ENTITY RELATIONSHIPS

### 2.1 Entity: Dining Session (`dining_sessions`)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "DiningSession",
  "type": "object",
  "required": [
    "id",
    "restaurantId",
    "tableId",
    "sessionToken",
    "status",
    "startedAt",
    "subtotalAmount",
    "discountAmount",
    "taxAmount",
    "finalAmount",
    "currency"
  ],
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "restaurantId": { "type": "string" },
    "tableId": { "type": "string" },
    "sessionToken": { "type": "string", "description": "High-entropy ephemeral token" },
    "status": {
      "type": "string",
      "enum": ["AVAILABLE", "ACTIVE", "PAYMENT_PENDING", "PAID", "CLOSED"]
    },
    "guestCount": { "type": "integer", "minimum": 1, "default": 2 },
    "leadCustomerName": { "type": "string" },
    "startedAt": { "type": "string", "format": "date-time" },
    "closedAt": { "type": ["string", "null"], "format": "date-time" },
    "gameStatus": {
      "type": "object",
      "properties": {
        "hasPlayed": { "type": "boolean", "default": false },
        "rawScore": { "type": "integer", "default": 0 },
        "discountPercentage": { "type": "number", "minimum": 0, "maximum": 20, "default": 0 },
        "playedAt": { "type": ["string", "null"], "format": "date-time" }
      }
    },
    "subtotalAmount": { "type": "number", "minimum": 0 },
    "discountAmount": { "type": "number", "minimum": 0 },
    "taxAmount": { "type": "number", "minimum": 0 },
    "finalAmount": { "type": "number", "minimum": 0 },
    "currency": { "type": "string", "default": "INR" },
    "paymentMethod": { "type": ["string", "null"], "enum": ["UPI", "CARD", "CASH", null] },
    "paymentReferenceId": { "type": ["string", "null"] },
    "staffAssignedId": { "type": ["string", "null"] }
  }
}
```

### 2.2 Entity: Order Batch & Order Items

```json
{
  "orderBatchId": "ord_batch_9921",
  "sessionId": "ds_8821",
  "tableNumber": "T-04",
  "batchSequence": 1,
  "status": "PREPARING",
  "placedAt": "2026-09-16T20:32:00Z",
  "items": [
    {
      "orderItemId": "item_001",
      "menuItemId": "menu_paneer_tikka",
      "name": "Paneer Tikka Multani",
      "quantity": 1,
      "basePrice": 340.00,
      "selectedModifiers": [
        {
          "groupId": "mod_portion",
          "groupName": "Portion Size",
          "optionId": "opt_full",
          "optionName": "Full Portion (8 Pcs)",
          "priceDelta": 160.00
        },
        {
          "groupId": "mod_spice",
          "groupName": "Spice Level",
          "optionId": "opt_med",
          "optionName": "Medium Chef's Style",
          "priceDelta": 0.00
        },
        {
          "groupId": "mod_addons",
          "groupName": "Add-ons",
          "optionId": "opt_chutney",
          "optionName": "Extra Mint Chutney & Pickled Onions",
          "priceDelta": 30.00
        }
      ],
      "itemSubtotal": 530.00,
      "specialInstructions": "Well-charred edges please",
      "station": "TANDOOR",
      "isCooked": false
    },
    {
      "orderItemId": "item_002",
      "menuItemId": "menu_butter_naan",
      "name": "Butter Naan",
      "quantity": 2,
      "basePrice": 60.00,
      "selectedModifiers": [],
      "itemSubtotal": 120.00,
      "specialInstructions": null,
      "station": "TANDOOR",
      "isCooked": true
    }
  ]
}
```

---

## 3. REALISTIC RESTAURANT FOOD CATALOGUE DATASET

Below is the verified seed catalogue for the production platform, featuring realistic items, descriptions, pricing in INR (₹), modifiers, dietary markers, and bestseller states:

```json
[
  {
    "category": "Starters",
    "items": [
      {
        "id": "item_st_01",
        "name": "Paneer Tikka Multani",
        "description": "Succulent cottage cheese cubes marinated in hung curd, yellow mustard, and secret spices, char-grilled in tandoor.",
        "diet": "VEG",
        "basePrice": 340.00,
        "isBestseller": true,
        "isAvailable": true,
        "station": "TANDOOR",
        "modifierGroups": [
          {
            "id": "mod_st_portion",
            "name": "Portion Size",
            "required": true,
            "minSelection": 1,
            "maxSelection": 1,
            "options": [
              { "id": "p1", "name": "Half Portion (4 pcs)", "price": 0 },
              { "id": "p2", "name": "Full Portion (8 pcs)", "price": 160 }
            ]
          },
          {
            "id": "mod_st_spice",
            "name": "Spice Level",
            "required": false,
            "minSelection": 0,
            "maxSelection": 1,
            "options": [
              { "id": "s1", "name": "Mild Spice", "price": 0 },
              { "id": "s2", "name": "Medium", "price": 0 },
              { "id": "s3", "name": "Extra Hot", "price": 0 }
            ]
          }
        ]
      },
      {
        "id": "item_st_02",
        "name": "Murgh Malai Tikka",
        "description": "Tender chicken morsels marinated in rich clotted cream, green cardamom, roasted cumin, and royal cheese paste.",
        "diet": "NON_VEG",
        "basePrice": 390.00,
        "isBestseller": true,
        "isAvailable": true,
        "station": "TANDOOR",
        "modifierGroups": []
      },
      {
        "id": "item_st_03",
        "name": "Hara Bhara Kebab",
        "description": "Pan-fried patties of spinach, green peas, and mashed potatoes infused with ginger, coriander, and royal herbs.",
        "diet": "VEG",
        "basePrice": 290.00,
        "isBestseller": false,
        "isAvailable": true,
        "station": "PAN_FRY",
        "modifierGroups": []
      },
      {
        "id": "item_st_04",
        "name": "Crispy Corn Pepper Salt",
        "description": "Golden American corn tossed with chopped bell peppers, scallions, roasted black pepper, and Asian seasoning.",
        "diet": "VEG",
        "basePrice": 260.00,
        "isBestseller": false,
        "isAvailable": true,
        "station": "PAN_FRY",
        "modifierGroups": []
      },
      {
        "id": "item_st_05",
        "name": "Tandoori Chicken Wings",
        "description": "Smoky char-grilled chicken wings glazed in spicy Punjabi degi mirch marinade with lime drizzle.",
        "diet": "NON_VEG",
        "basePrice": 360.00,
        "isBestseller": false,
        "isAvailable": true,
        "station": "TANDOOR",
        "modifierGroups": []
      }
    ]
  },
  {
    "category": "Main Course",
    "items": [
      {
        "id": "item_mc_01",
        "name": "Classic Butter Chicken (Murgh Makhani)",
        "description": "Char-smoked pulled tandoori chicken simmered in a velvety satin sauce of vine-ripened tomatoes, butter, and dried fenugreek leaves.",
        "diet": "NON_VEG",
        "basePrice": 420.00,
        "isBestseller": true,
        "isAvailable": true,
        "station": "CURRY",
        "modifierGroups": [
          {
            "id": "mod_bc_cut",
            "name": "Cut Preference",
            "required": true,
            "minSelection": 1,
            "maxSelection": 1,
            "options": [
              { "id": "cut1", "name": "Bone-In Classic", "price": 0 },
              { "id": "cut2", "name": "Boneless Breast & Thigh Pieces", "price": 50 }
            ]
          }
        ]
      },
      {
        "id": "item_mc_02",
        "name": "Dal Makhani 1947",
        "description": "Whole black lentils slow-cooked overnight over charcoal embers, finished with churned butter and fresh organic cream.",
        "diet": "VEG",
        "basePrice": 320.00,
        "isBestseller": true,
        "isAvailable": true,
        "station": "CURRY",
        "modifierGroups": []
      },
      {
        "id": "item_mc_03",
        "name": "Paneer Butter Masala",
        "description": "Fresh soft cottage cheese cubes simmered in an aromatic rich tomato, cashew, and melon seed gravy.",
        "diet": "VEG",
        "basePrice": 360.00,
        "isBestseller": true,
        "isAvailable": true,
        "station": "CURRY",
        "modifierGroups": []
      },
      {
        "id": "item_mc_04",
        "name": "Kadhai Paneer",
        "description": "Cottage cheese and crunchy bell peppers tossed in fresh crushed coriander seeds and dry red chillies in iron kadhai.",
        "diet": "VEG",
        "basePrice": 350.00,
        "isBestseller": false,
        "isAvailable": true,
        "station": "CURRY",
        "modifierGroups": []
      }
    ]
  },
  {
    "category": "Breads",
    "items": [
      {
        "id": "item_br_01",
        "name": "Butter Naan",
        "description": "Traditional leavened flatbread baked against clay tandoor walls and brushed with salted farm butter.",
        "diet": "VEG",
        "basePrice": 60.00,
        "isBestseller": true,
        "isAvailable": true,
        "station": "TANDOOR",
        "modifierGroups": []
      },
      {
        "id": "item_br_02",
        "name": "Garlic Naan",
        "description": "Leavened bread topped with fragrant minced garlic, fresh cilantro, and nigella seeds.",
        "diet": "VEG",
        "basePrice": 80.00,
        "isBestseller": true,
        "isAvailable": true,
        "station": "TANDOOR",
        "modifierGroups": []
      },
      {
        "id": "item_br_03",
        "name": "Tandoori Roti",
        "description": "Whole wheat unleavened bread baked crisp in tandoor.",
        "diet": "VEG",
        "basePrice": 35.00,
        "isBestseller": false,
        "isAvailable": true,
        "station": "TANDOOR",
        "modifierGroups": []
      },
      {
        "id": "item_br_04",
        "name": "Lachha Paratha",
        "description": "Multi-layered flaky whole wheat bread layered with ghee and carom seeds.",
        "diet": "VEG",
        "basePrice": 70.00,
        "isBestseller": false,
        "isAvailable": true,
        "station": "TANDOOR",
        "modifierGroups": []
      }
    ]
  },
  {
    "category": "Rice & Biryani",
    "items": [
      {
        "id": "item_rc_01",
        "name": "Dum Awadhi Chicken Biryani",
        "description": "Long-grain aged basmati rice dum-cooked with tender spiced chicken, saffron, mint, and kewra water. Served with burani raita.",
        "diet": "NON_VEG",
        "basePrice": 460.00,
        "isBestseller": true,
        "isAvailable": true,
        "station": "PAN_FRY",
        "modifierGroups": []
      },
      {
        "id": "item_rc_02",
        "name": "Nawabi Subz Dum Biryani",
        "description": "Assorted garden vegetables and paneer layered with aromatic spiced basmati rice and fried onions.",
        "diet": "VEG",
        "basePrice": 380.00,
        "isBestseller": false,
        "isAvailable": true,
        "station": "PAN_FRY",
        "modifierGroups": []
      }
    ]
  },
  {
    "category": "Beverages",
    "items": [
      {
        "id": "item_bv_01",
        "name": "Alphonso Mango Lassi",
        "description": "Thick churned yoghurt smoothie blended with Ratnagiri Alphonso mango pulp and crushed pistachios.",
        "diet": "VEG",
        "basePrice": 140.00,
        "isBestseller": true,
        "isAvailable": true,
        "station": "BEVERAGE",
        "modifierGroups": []
      },
      {
        "id": "item_bv_02",
        "name": "Fresh Lime Soda",
        "description": "Squeezed Persian lime juice with chilled sparkling soda.",
        "diet": "VEG",
        "basePrice": 90.00,
        "isBestseller": false,
        "isAvailable": true,
        "station": "BEVERAGE",
        "modifierGroups": [
          {
            "id": "mod_fls",
            "name": "Flavour Style",
            "required": true,
            "minSelection": 1,
            "maxSelection": 1,
            "options": [
              { "id": "fls_salt", "name": "Salted", "price": 0 },
              { "id": "fls_sweet", "name": "Sweet", "price": 0 },
              { "id": "fls_mixed", "name": "Sweet & Salted", "price": 0 }
            ]
          }
        ]
      },
      {
        "id": "item_bv_03",
        "name": "Masala Coke",
        "description": "Coca-Cola shaken with roasted cumin, chaat masala, rock salt, and mint leaves over crushed ice.",
        "diet": "VEG",
        "basePrice": 110.00,
        "isBestseller": false,
        "isAvailable": true,
        "station": "BEVERAGE",
        "modifierGroups": []
      },
      {
        "id": "item_bv_04",
        "name": "Signature Cold Coffee",
        "description": "Rich espresso brewed cold and blended with vanilla bean gelato and whole milk.",
        "diet": "VEG",
        "basePrice": 160.00,
        "isBestseller": false,
        "isAvailable": true,
        "station": "BEVERAGE",
        "modifierGroups": []
      }
    ]
  },
  {
    "category": "Desserts",
    "items": [
      {
        "id": "item_ds_01",
        "name": "Warm Gulab Jamun with Rabdi",
        "description": "Golden khoya dumplings steeped in rose-cardamom sugar syrup, served atop chilled saffron lachha rabdi.",
        "diet": "VEG",
        "basePrice": 180.00,
        "isBestseller": true,
        "isAvailable": true,
        "station": "PANTRY",
        "modifierGroups": []
      },
      {
        "id": "item_ds_02",
        "name": "Kesar Pista Rasmalai",
        "description": "Delicate flattened chenna discs soaked in thickened saffron-infused clotted milk and pistachio slivers.",
        "diet": "VEG",
        "basePrice": 190.00,
        "isBestseller": true,
        "isAvailable": true,
        "station": "PANTRY",
        "modifierGroups": []
      },
      {
        "id": "item_ds_03",
        "name": "Sizzling Brownie with Vanilla Gelato",
        "description": "Warm Belgian chocolate brownie served on a sizzling cast-iron platter, topped with vanilla bean gelato and hot dark chocolate fudge.",
        "diet": "VEG",
        "basePrice": 240.00,
        "isBestseller": false,
        "isAvailable": true,
        "station": "PANTRY",
        "modifierGroups": []
      }
    ]
  }
]
```

---

## 4. RECOMMENDED TECHNICAL ARCHITECTURE

### 4.1 Real-Time Pub/Sub Infrastructure
* **WebSocket Gateway**: Node.js/Go with Socket.io or native WebSockets backed by **Redis Pub/Sub**.
* **Channel Architecture**:
  * `resto:{restaurantId}:table:{tableId}`: Scoped to the specific dining table session (Customer phones + Reception drawer sync).
  * `resto:{restaurantId}:kds:{station}`: Scoped to kitchen cook stations (All, Tandoor, Curry, Pantry).
  * `resto:{restaurantId}:pos:events`: Operations dashboard feed (New orders, waiter calls, payment approvals).

### 4.2 ACID Database Transactions
* All order placements and payment confirmations execute inside **PostgreSQL serializable transactions**:
  ```sql
  BEGIN;
  -- 1. Check item availability locks (prevent race condition on last portion)
  SELECT id, is_available FROM menu_items WHERE id = 'item_st_01' FOR UPDATE;
  -- 2. Insert order batch record
  INSERT INTO order_batches (id, session_id, status) VALUES (...);
  -- 3. Update session running subtotal
  UPDATE dining_sessions SET subtotal_amount = subtotal_amount + 530 WHERE id = 'ds_8821';
  COMMIT;
  ```

### 4.3 Offline Tolerance & Client Resilience
* **Service Worker**: Caches menu assets, fonts, icons, and static images.
* **IndexedDB Store**: Holds local cart state and optimistic placed order history. If network is lost, the app remains responsive and queues mutations until network heartbeat recovers.

---

## 5. IMPLEMENTATION ROADMAP & PHASED ROLLOUT

```
PHASE 1: DESIGN TOKENS & ATOMIC FOUNDATIONS
├── 1.1 Establish CSS Variables (Colors, Typography, 4/8pt Spacing Scale)
├── 1.2 Build Atomic Components: Buttons, Inputs, Veg/Non-Veg Badges, Chips
└── 1.3 Implement Responsive Breakpoint Container & Touch Targets (Min 44px)

PHASE 2: CORE BACKEND & STATE ENGINES
├── 2.1 Database Schemas (Sessions, Tables, Orders, Items, Transactions)
├── 2.2 Dining Session State Machine & Cryptographic QR Verification
├── 2.3 Order Batching & Idempotent Submission API
└── 2.4 WebSocket Real-time Event Hub (Redis Pub/Sub)

PHASE 3: KITCHEN DISPLAY SYSTEM (KDS)
├── 3.1 Dark Mode High-Contrast Canvas Layout (1080p Touch)
├── 3.2 Chronometer Timers & Urgency Color Thresholds (<10m, 10-15m, >15m)
├── 3.3 Station Filter Routing & Item Aggregator View
└── 3.4 Tactile Bump Bar / Big Touch Action Workflows

PHASE 4: CUSTOMER ORDERING PWA
├── 4.1 QR Scan Bootstrapping & Shared Session Joining
├── 4.2 Interactive Categorized Menu, Dietary Filters & Sticky Navigation
├── 4.3 Customization Drawer (Portion Radios, Add-on Checkboxes, Notes)
├── 4.4 Floating Dock, Cart Drawer & In-Flight Sold-Out Recovery
├── 4.5 Live Order Tracking Timeline & Multi-Batch Addition
├── 4.6 Chef's Challenge Mini-Game & Session Discount Engine
└── 4.7 Bill View, Multi-Channel Checkout (UPI/Card/Cash) & E-Receipt

PHASE 5: RECEPTION / POS OPERATIONS DASHBOARD
├── 5.1 Interactive Floorplan Grid with Color-Coded Table Lifecycles
├── 5.2 Contextual Table Detail Drawer (Orders, Totals, Settle Bill)
├── 5.3 Live Waiter Service Call Queue & Audio Chimes
├── 5.4 Cash Payment Settlement Modal with Staff PIN Verification
├── 5.5 One-Tap Menu 86-ing (Inventory Depletion Sync)
└── 5.6 Table Clearing Guardrail (Unpaid Balance Lockout)

PHASE 6: ADMIN PORTAL & END-TO-END VERIFICATION
├── 6.1 RBAC Enforcement Across Endpoints & Screens
├── 6.2 Menu Builder & Modifier Group Configurator
├── 6.3 Table QR Generation & Batch Print Export
├── 6.4 Comprehensive Edge-Case Testing (Stale QR, Network Dropouts, Walkout)
└── 6.5 Production Deployment & Load Testing
```
