/**
 * Customer <-> Kitchen Realtime Sync Verification Test
 * 
 * Verifies:
 * 1. Device A (Customer) connects to SSE and bootstraps Table 03
 * 2. Device A places Order Round 1 (Batch 1: Paneer Tikka + Butter Naan) -> Status: NEW
 * 3. Device B (Kitchen) transitions Batch 1: NEW -> PREPARING -> READY -> SERVED
 * 4. Device A Customer receives every transition via SSE in real time
 * 5. Device A places Order Round 2 (Batch 2) -> Status: NEW while Round 1 remains SERVED
 * 6. Kitchen transitions Batch 2: NEW -> PREPARING -> READY
 * 7. Verification that Round 1 is SERVED and Round 2 is READY (No cross-round overwrite)
 * 8. Cross-Table Isolation: Table 06 order bumped, Table 03 session ignores it completely
 * 9. Reconnect / Refresh Recovery: Table 03 bootstraps and verifies authoritative state match
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
  const badge = passed ? 'PASS' : 'FAIL';
  console.log(`[${badge}] Step ${step.toString().padStart(2, '0')}: ${name}`);
  console.log(`       ${details}\n`);
}

async function runKitchenCustomerSyncTest() {
  console.log('================================================================');
  console.log('STARTING CUSTOMER <-> KITCHEN REALTIME SYNC ACCEPTANCE TEST');
  console.log(`Target Server: ${API_BASE}`);
  console.log('================================================================\n');

  let sseResponse: any = null;
  const receivedCustomerEvents: any[] = [];

  try {
    // 0. Connect SSE Client to simulate Customer Phone listening to stream
    sseResponse = await fetch(`${API_BASE}/events`);
    if (!sseResponse.ok || !sseResponse.body) {
      throw new Error(`Failed to connect to SSE stream: ${sseResponse.statusText}`);
    }

    const reader = sseResponse.body.getReader();
    const decoder = new TextDecoder();
    let sseBuffer = '';

    (async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          sseBuffer += decoder.decode(value, { stream: true });
          const lines = sseBuffer.split('\n');
          sseBuffer = lines.pop() || '';
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const parsed = JSON.parse(line.slice(6));
                receivedCustomerEvents.push(parsed);
              } catch {}
            }
          }
        }
      } catch {}
    })();

    const waitForEvent = async (
      predicate: (evt: any) => boolean,
      timeoutMs = 4000
    ): Promise<any | null> => {
      const start = Date.now();
      while (Date.now() - start < timeoutMs) {
        const found = receivedCustomerEvents.find(predicate);
        if (found) return found;
        await new Promise((r) => setTimeout(r, 50));
      }
      return null;
    };

    // Step 1: Customer Scans Table 03 QR & Bootstraps Session
    const resBootstrap = await fetch(`${API_BASE}/session/bootstrap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableId: 'tbl_03', restaurantId: 'The Spice Pavilion' }),
    });
    const dataBootstrap = await resBootstrap.json();
    const session = dataBootstrap.session;

    recordStep(
      1,
      'Customer Scans Table 03 QR Code',
      dataBootstrap.success && session?.tableId === 'tbl_03' && session?.status === 'ACTIVE',
      `Session ID: ${session?.sessionId}, Table: ${session?.tableNumber}, Status: ${session?.status}`
    );

    // Step 2: Customer Places Order Round 1 (Batch 1)
    const resOrder1 = await fetch(`${API_BASE}/order/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: session.sessionId,
        tableId: 'tbl_03',
        items: [
          { menuItemId: 'item_st_01', quantity: 2, selectedModifiers: [] },
          { menuItemId: 'item_mc_01', quantity: 1, selectedModifiers: [] },
        ],
        idempotencyKey: `sync_order1_${Date.now()}`,
      }),
    });
    const dataOrder1 = await resOrder1.json();
    const batch1 = dataOrder1.batch;

    recordStep(
      2,
      'Customer Places Order Round 1 -> Kitchen Receives Batch',
      dataOrder1.success && Boolean(batch1) && batch1.status === 'NEW',
      `Batch ID: ${batch1?.batchId}, Initial Status: ${batch1?.status}, Total: ₹${batch1?.batchSubtotal}`
    );

    // Step 3: Kitchen Bumps Status: NEW -> PREPARING
    const resBumpPrep = await fetch(`${API_BASE}/order/bump`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableId: 'tbl_03',
        batchId: batch1.batchId,
        status: 'PREPARING',
      }),
    });
    const dataBumpPrep = await resBumpPrep.json();

    const evtPrep = await waitForEvent(
      (e) =>
        (e.type === 'ORDER_BUMPED' || e.type === 'ORDER_STATUS_UPDATED') &&
        (e.tableId === 'tbl_03' || e.sessionId === session.sessionId) &&
        (e.payload?.batchId === batch1.batchId || e.payload?.orderBatchId === batch1.batchId) &&
        e.payload?.status === 'PREPARING'
    );

    recordStep(
      3,
      'Kitchen Bumps to PREPARING -> Customer Receives Realtime Event',
      dataBumpPrep.success && Boolean(evtPrep),
      `Event received via SSE. Target Batch: ${batch1.batchId}, New Status: ${evtPrep?.payload?.status}`
    );

    // Step 4: Kitchen Bumps Status: PREPARING -> READY
    const resBumpReady = await fetch(`${API_BASE}/order/bump`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableId: 'tbl_03',
        batchId: batch1.batchId,
        status: 'READY',
      }),
    });
    const dataBumpReady = await resBumpReady.json();

    const evtReady = await waitForEvent(
      (e) =>
        (e.type === 'ORDER_BUMPED' || e.type === 'ORDER_STATUS_UPDATED') &&
        (e.tableId === 'tbl_03' || e.sessionId === session.sessionId) &&
        (e.payload?.batchId === batch1.batchId || e.payload?.orderBatchId === batch1.batchId) &&
        e.payload?.status === 'READY'
    );

    recordStep(
      4,
      'Kitchen Bumps to READY -> Customer Receives Realtime Event',
      dataBumpReady.success && Boolean(evtReady),
      `Event received via SSE. Target Batch: ${batch1.batchId}, New Status: ${evtReady?.payload?.status}`
    );

    // Step 5: Waiter Delivers Order: READY -> SERVED
    const resBumpServed = await fetch(`${API_BASE}/order/bump`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableId: 'tbl_03',
        batchId: batch1.batchId,
        status: 'SERVED',
      }),
    });
    const dataBumpServed = await resBumpServed.json();

    const evtServed = await waitForEvent(
      (e) =>
        (e.type === 'ORDER_BUMPED' || e.type === 'ORDER_STATUS_UPDATED') &&
        (e.tableId === 'tbl_03' || e.sessionId === session.sessionId) &&
        (e.payload?.batchId === batch1.batchId || e.payload?.orderBatchId === batch1.batchId) &&
        e.payload?.status === 'SERVED'
    );

    recordStep(
      5,
      'Order Delivered to Table: SERVED -> Customer Receives Realtime Event',
      dataBumpServed.success && Boolean(evtServed),
      `Event received via SSE. Target Batch: ${batch1.batchId}, New Status: ${evtServed?.payload?.status}`
    );

    // Step 6: Customer Places Order Round 2 (Batch 2)
    const resOrder2 = await fetch(`${API_BASE}/order/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: session.sessionId,
        tableId: 'tbl_03',
        items: [{ menuItemId: 'item_ds_01', quantity: 2, selectedModifiers: [] }],
        idempotencyKey: `sync_order2_${Date.now()}`,
      }),
    });
    const dataOrder2 = await resOrder2.json();
    const batch2 = dataOrder2.batch;

    recordStep(
      6,
      'Customer Places Order Round 2 (Batch 2)',
      dataOrder2.success && Boolean(batch2) && batch2.status === 'NEW',
      `Round 2 Batch ID: ${batch2?.batchId}, Initial Status: ${batch2?.status}`
    );

    // Step 7: Kitchen Bumps Batch 2: NEW -> PREPARING -> READY
    await fetch(`${API_BASE}/order/bump`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableId: 'tbl_03', batchId: batch2.batchId, status: 'PREPARING' }),
    });

    const resBump2Ready = await fetch(`${API_BASE}/order/bump`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableId: 'tbl_03', batchId: batch2.batchId, status: 'READY' }),
    });
    const dataBump2Ready = await resBump2Ready.json();

    const evt2Ready = await waitForEvent(
      (e) =>
        (e.type === 'ORDER_BUMPED' || e.type === 'ORDER_STATUS_UPDATED') &&
        (e.payload?.batchId === batch2.batchId || e.payload?.orderBatchId === batch2.batchId) &&
        e.payload?.status === 'READY'
    );

    recordStep(
      7,
      'Kitchen Bumps Round 2 to READY -> Realtime Sync Verified',
      dataBump2Ready.success && Boolean(evt2Ready),
      `Round 2 Batch ${batch2?.batchId} transitioned to READY via SSE`
    );

    // Step 8: Multi-Round Status Coexistence Verification
    const resState = await fetch(`${API_BASE}/state`);
    const state = await resState.json();
    const table03 = state.tables.find((t: any) => t.id === 'tbl_03');
    const table03Batches = table03?.session?.orderBatches || [];

    const serverBatch1 = table03Batches.find((b: any) => b.batchId === batch1.batchId);
    const serverBatch2 = table03Batches.find((b: any) => b.batchId === batch2.batchId);

    const roundsIndependent =
      table03Batches.length === 2 &&
      serverBatch1?.status === 'SERVED' &&
      serverBatch2?.status === 'READY';

    recordStep(
      8,
      'Multi-Round Independence: Round 1 (SERVED) & Round 2 (READY) Coexist',
      roundsIndependent,
      `Rounds count: ${table03Batches.length}. Round 1 Status: ${serverBatch1?.status}, Round 2 Status: ${serverBatch2?.status}`
    );

    // Step 9: Cross-Table Isolation Check (Table 06 vs Table 03)
    const resTbl06 = await fetch(`${API_BASE}/session/bootstrap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableId: 'tbl_06', restaurantId: 'The Spice Pavilion' }),
    });
    const dataTbl06 = await resTbl06.json();
    const resOrder06 = await fetch(`${API_BASE}/order/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: dataTbl06.session.sessionId,
        tableId: 'tbl_06',
        items: [{ menuItemId: 'item_st_02', quantity: 1, selectedModifiers: [] }],
        idempotencyKey: `tbl06_order_${Date.now()}`,
      }),
    });
    const dataOrder06 = await resOrder06.json();
    await fetch(`${API_BASE}/order/bump`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableId: 'tbl_06', batchId: dataOrder06.batch.batchId, status: 'PREPARING' }),
    });

    const resStateAfter06 = await fetch(`${API_BASE}/state`);
    const stateAfter06 = await resStateAfter06.json();
    const currentTable03 = stateAfter06.tables.find((t: any) => t.id === 'tbl_03');
    const b1After = currentTable03?.session?.orderBatches.find((b: any) => b.batchId === batch1.batchId);
    const b2After = currentTable03?.session?.orderBatches.find((b: any) => b.batchId === batch2.batchId);

    const isolationPassed =
      b1After?.status === 'SERVED' &&
      b2After?.status === 'READY' &&
      currentTable03?.session?.orderBatches.length === 2;

    recordStep(
      9,
      'Cross-Table Isolation: Table 06 Bump Does Not Affect Table 03',
      isolationPassed,
      'Table 03 batches preserved intact: Round 1 SERVED, Round 2 READY.'
    );

    // Step 10: Refresh & Reconnect Recovery Check
    const resReconnect = await fetch(`${API_BASE}/session/bootstrap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableId: 'tbl_03' }),
    });
    const dataReconnect = await resReconnect.json();
    const reconnectedSession = dataReconnect.session;
    const recB1 = reconnectedSession?.orderBatches.find((b: any) => b.batchId === batch1.batchId);
    const recB2 = reconnectedSession?.orderBatches.find((b: any) => b.batchId === batch2.batchId);

    const reconnectValid =
      dataReconnect.success &&
      !dataReconnect.isNew &&
      reconnectedSession?.sessionId === session.sessionId &&
      recB1?.status === 'SERVED' &&
      recB2?.status === 'READY';

    recordStep(
      10,
      'Customer Refresh / Reconnect Recovery Verification',
      reconnectValid,
      `Reconnected session ${reconnectedSession?.sessionId}. Authoritative state re-established: Round 1 = ${recB1?.status}, Round 2 = ${recB2?.status}`
    );

    // Cleanup: Clear Table 03 and Table 06
    await fetch(`${API_BASE}/table/clear`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableId: 'tbl_03' }),
    });
    await fetch(`${API_BASE}/table/clear`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableId: 'tbl_06' }),
    });

  } catch (err: any) {
    console.error('Test execution error:', err);
    recordStep(99, 'Test Execution Failure', false, err.message || String(err));
  } finally {
    const passedCount = steps.filter((s) => s.passed).length;
    console.log('================================================================');
    console.log(`KITCHEN <-> CUSTOMER SYNC TEST: ${passedCount} / ${steps.length} STEPS PASSED`);
    if (passedCount === steps.length && steps.length >= 10) {
      console.log('VERDICT: ALL ACCEPTANCE CRITERIA MET (100% REALTIME SYNC)');
      process.exit(0);
    } else {
      console.log('VERDICT: SOME ACCEPTANCE STEPS FAILED');
      process.exit(1);
    }
  }
}

runKitchenCustomerSyncTest();
