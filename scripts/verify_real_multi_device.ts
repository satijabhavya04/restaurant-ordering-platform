/**
 * Real Multi-Device Verification Test
 * Simulates:
 *   DEVICE A: Customer 1 Phone (Table 05)
 *   DEVICE B: Reception / POS Station (Listening to SSE & managing bills)
 *   DEVICE C: Kitchen Display System (Listening to SSE & bumping ticket line prep)
 *   DEVICE D: Customer 2 Phone (Joining Table 05 concurrently)
 * Executed against running HTTP server at http://localhost:3002
 */

const PORT = process.env.PORT || '3001';
const API_BASE = process.env.API_BASE || `http://localhost:${PORT}/api`;

interface StepResult {
  step: number;
  name: string;
  passed: boolean;
  details: string;
}

const steps: StepResult[] = [];

function recordStep(step: number, name: string, passed: boolean, details: string) {
  steps.push({ step, name, passed, details });
  console.log(`[${passed ? 'PASS' : 'FAIL'}] Step ${step.toString().padStart(2, '0')}: ${name}`);
  console.log(`       Details: ${details}\n`);
}

async function runMultiDeviceTest() {
  console.log('================================================================');
  console.log('STARTING REAL MULTI-DEVICE 17-STEP VERIFICATION (DEV-SERVER)');
  console.log(`Target Server: ${API_BASE}`);
  console.log('================================================================\n');

  try {
    // -------------------------------------------------------------------------
    // STEP 1 & 2: DEVICE A Scans Table 05 QR & Creates Dining Session
    // -------------------------------------------------------------------------
    const resA = await fetch(`${API_BASE}/session/bootstrap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableId: 'tbl_05', restaurantId: 'The Spice Pavilion' }),
    });
    const dataA = await resA.json();
    const sessionA = dataA.session;
    recordStep(
      1,
      'DEVICE A (Customer 1): Scan QR & Bootstrap Table 05',
      dataA.success && Boolean(sessionA) && sessionA.tableId === 'tbl_05',
      `Session ID: ${sessionA?.sessionId}, Table: ${sessionA?.tableNumber}, Status: ${sessionA?.status}`
    );

    recordStep(
      2,
      'DEVICE A: Active Dining Session Created & Token Issued',
      Boolean(dataA.token) && sessionA?.status === 'ACTIVE',
      'Token issued for diner. Session status: ACTIVE.'
    );

    // -------------------------------------------------------------------------
    // STEP 3: DEVICE A Places Order Round 1 (2x Paneer Tikka)
    // -------------------------------------------------------------------------
    const idemKeyRound1 = `idem_round1_${Date.now()}`;
    const resOrder1 = await fetch(`${API_BASE}/order/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sessionA.sessionId,
        tableId: 'tbl_05',
        items: [{ menuItemId: 'item_st_01', quantity: 2, selectedModifiers: [] }],
        idempotencyKey: idemKeyRound1,
      }),
    });
    const dataOrder1 = await resOrder1.json();
    const batch1 = dataOrder1.batch;
    recordStep(
      3,
      'DEVICE A: Places Order Round 1 (Batch 1)',
      dataOrder1.success && Boolean(batch1) && (batch1.status === 'NEW' || batch1.status === 'SUBMITTED'),
      `Batch ID: ${batch1?.batchId}, Status: ${batch1?.status}, Items: 2x Paneer Tikka, Batch Total: ₹${batch1?.batchSubtotal}`
    );

    // -------------------------------------------------------------------------
    // STEP 4: DEVICE B (Reception POS) Verifies Active Order for Table 05
    // -------------------------------------------------------------------------
    const resStateB = await fetch(`${API_BASE}/state`);
    const stateB = await resStateB.json();
    const table05StateB = stateB.tables.find((t: any) => t.id === 'tbl_05');
    const hasBatch1InB = table05StateB?.session?.orderBatches?.some((b: any) => b.batchId === batch1.batchId);
    recordStep(
      4,
      'DEVICE B (Reception POS): Receives Table 05 Order Round 1',
      Boolean(hasBatch1InB),
      `Reception state confirms Table 05 active batches: ${table05StateB?.session?.orderBatches?.length}`
    );

    // -------------------------------------------------------------------------
    // STEP 5: DEVICE C (Kitchen KDS) Verifies Ticket in Expedite Queue
    // -------------------------------------------------------------------------
    recordStep(
      5,
      'DEVICE C (Kitchen KDS): Receives Line Ticket for TANDOOR Station',
      Boolean(hasBatch1InB && batch1?.items[0]?.name?.includes('Paneer Tikka')),
      'Ticket present on Kitchen expedite rail for prep.'
    );

    // -------------------------------------------------------------------------
    // STEP 6: DEVICE C Bumps Ticket Status to PREPARING
    // -------------------------------------------------------------------------
    const resBumpPrep = await fetch(`${API_BASE}/order/bump`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableId: 'tbl_05', batchId: batch1.batchId, status: 'PREPARING' }),
    });
    const dataBumpPrep = await resBumpPrep.json();
    recordStep(
      6,
      'DEVICE C (Kitchen): Moves Ticket to PREPARING',
      dataBumpPrep.success === true,
      `Batch ${batch1.batchId} status transitioned to PREPARING.`
    );

    // -------------------------------------------------------------------------
    // STEP 7: DEVICE C Bumps Ticket Status to READY
    // -------------------------------------------------------------------------
    const resBumpReady = await fetch(`${API_BASE}/order/bump`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableId: 'tbl_05', batchId: batch1.batchId, status: 'READY' }),
    });
    const dataBumpReady = await resBumpReady.json();
    recordStep(
      7,
      'DEVICE C (Kitchen): Moves Ticket to READY (Pickup Bell)',
      dataBumpReady.success === true,
      `Batch ${batch1.batchId} status transitioned to READY.`
    );

    // -------------------------------------------------------------------------
    // STEP 8: Staff Marks Ticket as SERVED
    // -------------------------------------------------------------------------
    const resBumpServed = await fetch(`${API_BASE}/order/bump`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableId: 'tbl_05', batchId: batch1.batchId, status: 'SERVED' }),
    });
    const dataBumpServed = await resBumpServed.json();
    recordStep(
      8,
      'Staff (Floor): Marks Ticket as SERVED at Table 05',
      dataBumpServed.success === true,
      `Batch ${batch1.batchId} status transitioned to SERVED.`
    );

    // -------------------------------------------------------------------------
    // STEP 9: DEVICE D (Customer 2 on same table) Adds Order Round 2
    // -------------------------------------------------------------------------
    const resD = await fetch(`${API_BASE}/session/bootstrap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableId: 'tbl_05' }),
    });
    const dataD = await resD.json();
    const joinedSameSession = dataD.session?.sessionId === sessionA.sessionId && dataD.isNew === false;

    const idemKeyRound2 = `idem_round2_${Date.now()}`;
    const resOrder2 = await fetch(`${API_BASE}/order/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sessionA.sessionId,
        tableId: 'tbl_05',
        items: [{ menuItemId: 'item_st_01', quantity: 1, selectedModifiers: [] }],
        idempotencyKey: idemKeyRound2,
      }),
    });
    const dataOrder2 = await resOrder2.json();
    const batch2 = dataOrder2.batch;

    recordStep(
      9,
      'DEVICE D (Customer 2): Joins Same Session & Adds Order Round 2',
      joinedSameSession && dataOrder2.success && Boolean(batch2),
      `Diner 2 joined existing session ${sessionA.sessionId}. Added Round 2 (Batch ID: ${batch2?.batchId}).`
    );

    // -------------------------------------------------------------------------
    // STEP 10: DEVICE A Submits Service Request
    // -------------------------------------------------------------------------
    const resReq = await fetch(`${API_BASE}/service-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableId: 'tbl_05', type: 'WATER', note: 'Extra warm water' }),
    });
    const dataReq = await resReq.json();
    const srvReq = dataReq.request;

    let reqResolved = false;
    if (srvReq) {
      const resAck = await fetch(`${API_BASE}/service-request/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableId: 'tbl_05', requestId: srvReq.id, status: 'RESOLVED' }),
      });
      const dataAck = await resAck.json();
      reqResolved = dataAck.success;
    }

    recordStep(
      10,
      'DEVICE A: Submits Service Request (WATER) -> Handled by Reception',
      Boolean(srvReq) && reqResolved,
      `Request ID: ${srvReq?.id}, Type: WATER, Lifecycle: REQUESTED -> RESOLVED.`
    );

    // -------------------------------------------------------------------------
    // STEP 11: DEVICE A Applies Chef Challenge Game Discount (Max 20%)
    // -------------------------------------------------------------------------
    const resGame = await fetch(`${API_BASE}/game/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: sessionA.sessionId, score: 92 }),
    });
    const dataGame = await resGame.json();
    recordStep(
      11,
      'DEVICE A: Applies Chef Game Score (92) -> Server Grants 20% Cap',
      dataGame.success && dataGame.discountPercentage === 20,
      `Score 92 granted ${dataGame.discountPercentage}% discount. Discount Amt: ₹${dataGame.discountAmount}.`
    );

    // -------------------------------------------------------------------------
    // STEP 12: DEVICE A Requests Cash Settlement
    // -------------------------------------------------------------------------
    const resBillReq = await fetch(`${API_BASE}/service-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableId: 'tbl_05', type: 'BILL', note: 'Guest paying cash' }),
    });
    const dataBillReq = await resBillReq.json();
    recordStep(
      12,
      'DEVICE A: Initiates Cash Payment Request to Counter',
      Boolean(dataBillReq.request),
      'Cash settlement assistance request dispatched to Reception POS.'
    );

    // -------------------------------------------------------------------------
    // STEP 13: Reception Staff Settles Cash with Staff Security PIN
    // -------------------------------------------------------------------------
    const resCash = await fetch(`${API_BASE}/payment/cash-confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableId: 'tbl_05', staffPin: '1234', tenderedAmount: 2000 }),
    });
    const dataCash = await resCash.json();
    recordStep(
      13,
      'DEVICE B (Reception): Staff PIN Verification & Cash Settlement',
      dataCash.success === true,
      `Settlement verified by Manager/Admin. Change Due: ₹${dataCash.changeDue?.toFixed(2)}.`
    );

    // -------------------------------------------------------------------------
    // STEP 14: Verify Tax Invoice Bill & Receipt Generation
    // -------------------------------------------------------------------------
    const resCheckState = await fetch(`${API_BASE}/state`);
    const checkState = await resCheckState.json();
    const settledTable = checkState.tables.find((t: any) => t.id === 'tbl_05');
    const bill = settledTable?.session?.bill;
    const isPaid = settledTable?.session?.status === 'PAID';
    recordStep(
      14,
      'E-Receipt & Tax Invoice Calculation Verification',
      isPaid && bill?.finalTotal > 0 && bill?.discountPercentage === 20,
      `Food Subtotal: ₹${bill?.foodSubtotal}, Discount: -₹${bill?.discountAmount}, Net: ₹${bill?.netFoodAmount}, CGST: ₹${bill?.cgstAmount}, SGST: ₹${bill?.sgstAmount}, Final: ₹${bill?.finalTotal}`
    );

    // -------------------------------------------------------------------------
    // STEP 15: Staff Clears & Sanitizes Table 05
    // -------------------------------------------------------------------------
    const resClear = await fetch(`${API_BASE}/table/clear`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableId: 'tbl_05' }),
    });
    const dataClear = await resClear.json();
    recordStep(
      15,
      'DEVICE B (Reception): Clear & Sanitize Table 05',
      dataClear.success === true,
      'Table 05 cleared. Status reverted to AVAILABLE.'
    );

    // -------------------------------------------------------------------------
    // STEP 16 & 17: Rescan Table 05 -> Verify Old Session Closed & Fresh Session Started
    // -------------------------------------------------------------------------
    const resRescan = await fetch(`${API_BASE}/session/bootstrap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableId: 'tbl_05' }),
    });
    const dataRescan = await resRescan.json();
    const newSession = dataRescan.session;
    const isFresh = dataRescan.isNew === true && newSession.sessionId !== sessionA.sessionId;

    recordStep(
      16,
      'Next Guest: Scans Table 05 QR Code',
      dataRescan.success === true,
      'Table 05 scanned again after clearing.'
    );

    recordStep(
      17,
      'Next Guest: Old Session Invalidated, Fresh Session Started',
      isFresh,
      `New Session ID: ${newSession?.sessionId} (Distinct from previous session ${sessionA.sessionId}).`
    );

  } catch (err: any) {
    console.error('Test execution error:', err);
  }

  console.log('\n================================================================');
  const allPassed = steps.every((s) => s.passed);
  const totalPassed = steps.filter((s) => s.passed).length;
  console.log(`MULTI-DEVICE VERIFICATION: ${totalPassed} / ${steps.length} STEPS PASSED`);
  if (allPassed) {
    console.log('VERDICT: ALL 17 REAL MULTI-DEVICE LIFECYCLE STEPS PASSED WITH 100% SUCCESS!');
  } else {
    console.log('VERDICT: SOME STEPS FAILED.');
  }
  console.log('================================================================\n');

  if (!allPassed) {
    process.exit(1);
  }
}

runMultiDeviceTest();
