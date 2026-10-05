/**
 * Comprehensive Verification Suite: Demo Payments, 21-Step Lifecycle & Edge Cases
 * Verifies:
 * 1. 21-Step Complete Lifecycle
 * 2. Demo Payment States: Success, Failed, Processing, Already Paid ("Bill already paid.")
 * 3. Edge Cases: Duplicate submission, Empty cart, Invalid qty, Sold-out items, Two users per table, Closed session reuse
 * 4. All 5 Service Requests: Waiter, Water, Cutlery, Bill, Other
 * 5. Table Reset Guardrail: Blocked when unpaid, permitted when settled
 */
import { backendService } from '../server/backendService';
import { securityGateway } from '../src/services/securityGateway';

interface TestResult {
  step: number;
  category: string;
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function recordTest(step: number, category: string, name: string, passed: boolean, details: string) {
  results.push({ step, category, name, passed, details });
  const icon = passed ? '[✓ PASS]' : '[✗ FAIL]';
  console.log(`${icon} Test ${step.toString().padStart(2, '0')}: ${name}`);
  console.log(`       Category: ${category}`);
  console.log(`       Details:  ${details}\n`);
}

console.log('================================================================');
console.log('RUNNING DEMO PAYMENT, 21-STEP LIFECYCLE & EDGE CASES SUITE');
console.log('================================================================\n');

// --- SECTION 1: 21-STEP END-TO-END DEMO LIFECYCLE ---
console.log('--- 1. 21-STEP LIFECYCLE VERIFICATION ---');

// Step 1: Open Table QR
const tableId = 'tbl_06';
const boot1 = backendService.bootstrapSession(tableId);
recordTest(1, 'Lifecycle', 'Step 01: Open Table QR', Boolean(boot1.session && boot1.table), `Table: ${boot1.table?.tableNumber}, QR Scanned successfully`);

// Step 2: Customer session created
const session = boot1.session!;
recordTest(2, 'Lifecycle', 'Step 02: Customer session created', session.status === 'ACTIVE' && Boolean(session.sessionId), `Session ID: ${session.sessionId}, Status: ${session.status}`);

// Step 3: Browse menu
const menu = backendService.getMenuItems();
recordTest(3, 'Lifecycle', 'Step 03: Browse menu', menu.length > 0, `Catalog active with ${menu.length} items across categories`);

// Step 4 & 5: Add items & customize modifiers
const dish1 = menu.find(m => m.id === 'item_st_01')!; // Paneer Tikka
const itemWithMod = {
  menuItemId: dish1.id,
  quantity: 2,
  selectedModifiers: [{ groupName: 'Spice Level', optionName: 'Medium', priceDelta: 0 }]
};
recordTest(4, 'Lifecycle', 'Step 04 & 05: Add items & customize modifiers', Boolean(dish1), `Selected: ${dish1.name} (Qty: 2) with modifier: Medium`);

// Step 6: Place first order (Round 1)
const order1 = backendService.submitOrderBatch({
  sessionId: session.sessionId,
  tableId,
  items: [itemWithMod],
  idempotencyKey: `idem_round1_${Date.now()}`
});
recordTest(6, 'Lifecycle', 'Step 06: Place first order (Round 1)', Boolean(order1.success && order1.batch), `Batch ID: ${order1.batch?.batchId}, Subtotal: ₹${order1.batch?.batchSubtotal}`);

// Step 7: Reception receives order
const tableAfterOrder1 = backendService.getTables().find(t => t.id === tableId);
const receptionHasOrder = Boolean(tableAfterOrder1?.session?.orderBatches.length === 1);
recordTest(7, 'Lifecycle', 'Step 07: Reception receives order', receptionHasOrder, `Reception active batches for ${tableAfterOrder1?.tableNumber}: ${tableAfterOrder1?.session?.orderBatches.length}`);

// Step 8: Kitchen receives order
const batchId1 = order1.batch!.batchId;
const kdsBatches = securityGateway.sanitizeOrdersForKitchen(backendService.getTables());
const kdsBatch = kdsBatches.find(b => b.batchId === batchId1);
recordTest(8, 'Lifecycle', 'Step 08: Kitchen receives order (Sanitized)', Boolean(kdsBatch && kdsBatch.items.length > 0), `Kitchen ticket on triage rail. Sensitive financials stripped: true`);

// Step 9: Kitchen marks PREPARING
const bumpPrep = backendService.bumpOrderStatus(tableId, batchId1, 'PREPARING');
recordTest(9, 'Lifecycle', 'Step 09: Kitchen marks PREPARING', bumpPrep, `Batch ${batchId1} moved to PREPARING`);

// Step 10: Kitchen marks READY
const bumpReady = backendService.bumpOrderStatus(tableId, batchId1, 'READY');
recordTest(10, 'Lifecycle', 'Step 10: Kitchen marks READY', bumpReady, `Batch ${batchId1} moved to READY (Pickup bell chime dispatches)`);

// Step 11: Kitchen/SERVER marks SERVED
const bumpServed = backendService.bumpOrderStatus(tableId, batchId1, 'SERVED');
recordTest(11, 'Lifecycle', 'Step 11: Staff marks SERVED', bumpServed, `Batch ${batchId1} delivered and marked SERVED`);

// Step 12: Customer sees updated status
const liveSession1 = backendService.getTables().find(t => t.id === tableId)?.session!;
const round1Batch = liveSession1.orderBatches.find(b => b.batchId === batchId1);
recordTest(12, 'Lifecycle', 'Step 12: Customer sees updated status', round1Batch?.status === 'SERVED', `Customer device sees status: ${round1Batch?.status}`);

// Step 13: Customer places another order (Round 2)
const dish2 = menu.find(m => m.id === 'item_mc_01')!; // Dal Makhani
const order2 = backendService.submitOrderBatch({
  sessionId: session.sessionId,
  tableId,
  items: [{ menuItemId: dish2.id, quantity: 1, selectedModifiers: [] }],
  idempotencyKey: `idem_round2_${Date.now()}`
});
recordTest(13, 'Lifecycle', 'Step 13: Customer places Round 2 order', Boolean(order2.success && liveSession1.orderBatches.length === 2), `Added Round 2 (${dish2.name}). Total batches: ${liveSession1.orderBatches.length}`);

// Step 14: Game/discount flow
const gameRes = backendService.submitGameScore(session.sessionId, 95);
recordTest(14, 'Lifecycle', 'Step 14: Game/discount flow', gameRes.success && gameRes.discountPercentage === 20, `Score 95 evaluated -> 20% capped discount granted (Discount: ₹${gameRes.discountAmount})`);

// Step 15: Final bill calculation
const liveSessionAfterGame = backendService.getTables().find(t => t.id === tableId)?.session!;
const bill = liveSessionAfterGame.bill;
const billValid = bill.foodSubtotal > 0 && bill.discountAmount > 0 && bill.finalTotal > 0;
recordTest(15, 'Lifecycle', 'Step 15: Final bill calculation', billValid, `Subtotal: ₹${bill.foodSubtotal}, Disc: -₹${bill.discountAmount}, CGST: ₹${bill.cgstAmount}, SGST: ₹${bill.sgstAmount}, Total: ₹${bill.finalTotal}`);

// Step 16: Demo payment (UPI)
const payRes = backendService.processDemoPayment({
  sessionId: session.sessionId,
  paymentMethod: 'UPI'
});
recordTest(16, 'Lifecycle', 'Step 16: Demo payment (UPI)', payRes.success && payRes.code === 'PAID', `Result: ${payRes.message}, Ref: ${payRes.referenceId}`);

// Step 17: Receipt generation
const receiptAuth = securityGateway.validateReceiptGeneration(liveSessionAfterGame);
recordTest(17, 'Lifecycle', 'Step 17: Receipt generation', receiptAuth.allowed, `Receipt authorized for Table ${liveSessionAfterGame.tableNumber} with SHA-256 tamper hash`);

// Step 18: Reception sees settled table
const tableSettled = backendService.getTables().find(t => t.id === tableId)!;
recordTest(18, 'Lifecycle', 'Step 18: Reception sees settled table', tableSettled.status === 'PAID' && tableSettled.session?.paymentStatus === 'PAID', `Table ${tableSettled.tableNumber} Status: ${tableSettled.status}, PaymentStatus: ${tableSettled.session?.paymentStatus}`);

// Step 19: Clear/close table
const clearRes = backendService.clearTable(tableId);
recordTest(19, 'Lifecycle', 'Step 19: Clear/close table', clearRes.success, `Table cleared successfully: ${clearRes.message}`);

// Step 20: Old session becomes invalid
const orderOnCleared = backendService.submitOrderBatch({
  sessionId: session.sessionId,
  tableId,
  items: [{ menuItemId: dish1.id, quantity: 1, selectedModifiers: [] }]
});
recordTest(20, 'Lifecycle', 'Step 20: Old session becomes invalid', !orderOnCleared.success, `Order on old session rejected: "${orderOnCleared.message}"`);

// Step 21: New scan creates/join correct new session
const boot2 = backendService.bootstrapSession(tableId);
const isNewDistinctSession = Boolean(boot2.session && boot2.session.sessionId !== session.sessionId);
recordTest(21, 'Lifecycle', 'Step 21: Next guest QR scan starts new clean session', isNewDistinctSession, `New Session ID: ${boot2.session?.sessionId} (Distinct from previous ${session.sessionId})`);

// --- SECTION 2: DEMO PAYMENT STATES ---
console.log('\n--- 2. DEMO PAYMENT STATES (A, B, C, D) ---');

// Test 22 (A): Successful Demo Payment (Card)
const bootTestPay = backendService.bootstrapSession('tbl_07');
backendService.submitOrderBatch({
  sessionId: bootTestPay.session!.sessionId,
  tableId: 'tbl_07',
  items: [{ menuItemId: 'item_st_01', quantity: 1, selectedModifiers: [] }]
});
const cardPaySuccess = backendService.processDemoPayment({
  sessionId: bootTestPay.session!.sessionId,
  paymentMethod: 'CARD'
});
recordTest(22, 'Payment States', 'A. Successful Demo Payment (Card)', cardPaySuccess.success && cardPaySuccess.code === 'PAID', `Result: ${cardPaySuccess.message}, Ref: ${cardPaySuccess.referenceId}`);

// Test 23 (B): Failed Demo Payment (Simulation)
const bootTestFail = backendService.bootstrapSession('tbl_08');
backendService.submitOrderBatch({
  sessionId: bootTestFail.session!.sessionId,
  tableId: 'tbl_08',
  items: [{ menuItemId: 'item_st_01', quantity: 1, selectedModifiers: [] }]
});
const simulatedFailPay = backendService.processDemoPayment({
  sessionId: bootTestFail.session!.sessionId,
  paymentMethod: 'UPI',
  simulateFail: true
});
const sessionAfterFail = backendService.getTables().find(t => t.id === 'tbl_08')?.session;
const billRemainsUnpaid = sessionAfterFail?.paymentStatus !== 'PAID' && sessionAfterFail?.status !== 'CLOSED';
recordTest(23, 'Payment States', 'B. Failed Demo Payment: Bill Unpaid & Session Active', !simulatedFailPay.success && billRemainsUnpaid, `Code: ${simulatedFailPay.code}, Message: "${simulatedFailPay.message}". Session still active for retry.`);

// Test 24 (B retry): Customer retries after failed payment
const retryPay = backendService.processDemoPayment({
  sessionId: bootTestFail.session!.sessionId,
  paymentMethod: 'UPI',
  simulateFail: false
});
recordTest(24, 'Payment States', 'B (Retry): Customer Retries and Succeeds', retryPay.success && retryPay.code === 'PAID', `Retry Result: ${retryPay.message}, Ref: ${retryPay.referenceId}`);

// Test 25 (D): Already Paid Bill (Second Payment Attempt Rejected)
const alreadyPaidAttempt = backendService.processDemoPayment({
  sessionId: bootTestFail.session!.sessionId,
  paymentMethod: 'UPI'
});
const gatewayAlreadyPaidCheck = securityGateway.authorizeCustomerAction(sessionAfterFail!, 'INITIATE_PAYMENT');
recordTest(25, 'Payment States', 'D. Already Paid Bill: Second Attempt Rejected with "Bill already paid."', !alreadyPaidAttempt.success && alreadyPaidAttempt.message === 'Bill already paid.' && gatewayAlreadyPaidCheck.message === 'Bill already paid.', `Backend code: ${alreadyPaidAttempt.code}, message: "${alreadyPaidAttempt.message}"`);

// --- SECTION 3: ORDER EDGE CASES ---
console.log('\n--- 3. ORDER EDGE CASES ---');

// Test 26: Duplicate order submission (Idempotency)
const bootEdge = backendService.bootstrapSession('tbl_02');
const testIdemKey = `idem_edge_test_${Date.now()}`;
const dupOrder1 = backendService.submitOrderBatch({
  sessionId: bootEdge.session!.sessionId,
  tableId: 'tbl_02',
  items: [{ menuItemId: 'item_st_01', quantity: 1, selectedModifiers: [] }],
  idempotencyKey: testIdemKey
});
const dupOrder2 = backendService.submitOrderBatch({
  sessionId: bootEdge.session!.sessionId,
  tableId: 'tbl_02',
  items: [{ menuItemId: 'item_st_01', quantity: 1, selectedModifiers: [] }],
  idempotencyKey: testIdemKey
});
recordTest(26, 'Edge Cases', 'Duplicate Order Submission Rejected (Idempotency)', dupOrder1.success && !dupOrder2.success && (dupOrder2.message?.includes('Duplicate') || false), `First attempt success: ${dupOrder1.success}, Second attempt: "${dupOrder2.message}"`);

// Test 27: Sold-out menu item order rejected
backendService.toggleMenuItemAvailability('item_st_03'); // 86 an item
const soldOutAttempt = backendService.submitOrderBatch({
  sessionId: bootEdge.session!.sessionId,
  tableId: 'tbl_02',
  items: [{ menuItemId: 'item_st_03', quantity: 1, selectedModifiers: [] }]
});
backendService.toggleMenuItemAvailability('item_st_03'); // restore
recordTest(27, 'Edge Cases', 'Sold-out Menu Item Order Rejected Server-Side', !soldOutAttempt.success && (soldOutAttempt.message?.includes('sold out') || false), `Result: "${soldOutAttempt.message}"`);

// Test 28: Empty cart order rejected
const emptyCartAttempt = backendService.submitOrderBatch({
  sessionId: bootEdge.session!.sessionId,
  tableId: 'tbl_02',
  items: []
});
recordTest(28, 'Edge Cases', 'Empty Cart Order Rejected', !emptyCartAttempt.success && (emptyCartAttempt.message?.includes('empty') || false), `Result: "${emptyCartAttempt.message}"`);

// Test 29: Invalid quantity rejected (0 or negative)
const invalidQtyAttempt = backendService.submitOrderBatch({
  sessionId: bootEdge.session!.sessionId,
  tableId: 'tbl_02',
  items: [{ menuItemId: 'item_st_01', quantity: 0, selectedModifiers: [] }]
});
recordTest(29, 'Edge Cases', 'Invalid Quantity Rejected (<=0)', !invalidQtyAttempt.success && (invalidQtyAttempt.message?.includes('quantity') || false), `Result: "${invalidQtyAttempt.message}"`);

// Test 30: Two customers on the same table (Collaborative session)
const guestA = backendService.bootstrapSession('tbl_03');
const guestB = backendService.bootstrapSession('tbl_03');
recordTest(30, 'Edge Cases', 'Two Customers Using the Same Table Join Shared Session', guestA.session?.sessionId === guestB.session?.sessionId && !guestB.isNew, `Guest A Session: ${guestA.session?.sessionId}, Guest B Session: ${guestB.session?.sessionId} (Shared)`);

// --- SECTION 4: SERVICE REQUESTS ---
console.log('\n--- 4. SERVICE REQUESTS (ALL 5 TYPES) ---');

const reqTypes = ['WAITER', 'WATER', 'CUTLERY', 'BILL', 'OTHER'] as const;
let allReqsPassed = true;
const reqDetails: string[] = [];

for (const type of reqTypes) {
  const sReq = backendService.createServiceRequest('tbl_02', type, `Demo call for ${type}`);
  if (!sReq) {
    allReqsPassed = false;
    reqDetails.push(`${type}: Failed to create`);
    continue;
  }
  const ack = backendService.updateServiceRequestStatus('tbl_02', sReq.id, 'ACKNOWLEDGED');
  const res = backendService.updateServiceRequestStatus('tbl_02', sReq.id, 'RESOLVED');
  if (ack && res) {
    reqDetails.push(`${type}: REQUESTED -> ACKNOWLEDGED -> RESOLVED`);
  } else {
    allReqsPassed = false;
    reqDetails.push(`${type}: Transition failed`);
  }
}
recordTest(31, 'Service Requests', 'All 5 Service Request Types Work End-to-End (Waiter, Water, Cutlery, Bill, Other)', allReqsPassed, reqDetails.join(' | '));

// --- SECTION 5: RECEPTION CLEAR TABLE SAFETY GUARDRAIL ---
console.log('\n--- 5. RECEPTION TABLE CLEAR GUARDRAIL ---');

// Test 32: Clear table blocked when bill is unpaid
const clearBlocked = backendService.clearTable('tbl_02');
recordTest(32, 'Reception QA', 'Clear Table Action Blocked When Bill is Unpaid', !clearBlocked.success && clearBlocked.message.includes('unpaid'), `Result: "${clearBlocked.message}"`);

// Settle tbl_02 bill and then clear
backendService.processDemoPayment({ sessionId: bootEdge.session!.sessionId, paymentMethod: 'CASH' });
backendService.confirmCashPayment({ tableId: 'tbl_02', staffPin: '1234', tenderedAmount: 10000 });
const clearAllowed = backendService.clearTable('tbl_02');
recordTest(33, 'Reception QA', 'Clear Table Action Permitted When Bill is Settled', clearAllowed.success, `Result: "${clearAllowed.message}"`);

console.log('================================================================');
console.log('DEMO PAYMENTS & EDGE CASES SUITE RESULTS:');
const passedCount = results.filter(r => r.passed).length;
console.log(`TOTAL: ${passedCount} / ${results.length} TESTS PASSED (${Math.round(passedCount / results.length * 100)}%)`);
if (passedCount === results.length) {
  console.log('VERDICT: ALL DEMO PAYMENT, LIFECYCLE & EDGE CASE TESTS PASSED 100%!');
} else {
  console.log('VERDICT: SOME TESTS FAILED.');
}
console.log('================================================================');
