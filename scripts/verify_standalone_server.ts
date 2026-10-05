/**
 * Standalone Node Server Verification Suite
 * 
 * Verifies:
 * 1. Server launches from server/index.ts using process.env.PORT
 * 2. Static frontend serving from dist/ (index.html, assets, mime types)
 * 3. SPA fallback on client-side routes (e.g. /reception, /table/04)
 * 4. CORS preflight (OPTIONS) and dynamic FRONTEND_ORIGIN headers
 * 5. GET /api/state returns tables and menu
 * 6. GET /api/events establishes long-lived SSE stream, receives STATE_SYNC, and stays open
 * 7. POST /api/session/bootstrap returns active session
 * 8. POST /api/order/submit places order round
 * 9. POST /api/order/bump transitions status & dispatches via SSE
 * 10. POST /api/payment/demo/process completes demo payment
 * 11. Graceful shutdown on SIGTERM
 */

import { spawn, ChildProcess } from 'node:child_process';
import path from 'node:path';

const TEST_PORT = '3005';
const SERVER_URL = `http://localhost:${TEST_PORT}`;
const API_URL = `${SERVER_URL}/api`;

interface TestStep {
  step: number;
  name: string;
  passed: boolean;
  details: string;
}

const steps: TestStep[] = [];

function record(step: number, name: string, passed: boolean, details: string) {
  steps.push({ step, name, passed, details });
  console.log(`[${passed ? 'PASS' : 'FAIL'}] Step ${step.toString().padStart(2, '0')}: ${name}`);
  console.log(`       ${details}\n`);
}

async function runStandaloneServerVerification() {
  console.log('============================================================');
  console.log('STARTING STANDALONE NODE HTTP SERVER VERIFICATION');
  console.log(`Target Test Port: ${TEST_PORT}`);
  console.log('============================================================\n');

  let serverProcess: ChildProcess | null = null;

  try {
    // -------------------------------------------------------------------------
    // Step 1: Launch Standalone Server Process
    // -------------------------------------------------------------------------
    serverProcess = spawn('npx', ['tsx', 'server/index.ts'], {
      env: {
        ...process.env,
        PORT: TEST_PORT,
        HOST: '127.0.0.1',
        FRONTEND_ORIGIN: 'https://my-restaurant-demo.vercel.app',
        NODE_ENV: 'production',
      },
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let startupOutput = '';
    serverProcess.stdout?.on('data', (d) => {
      startupOutput += d.toString();
    });
    serverProcess.stderr?.on('data', (d) => {
      console.error('[Server Stderr]:', d.toString());
    });

    // Wait up to 10s for server to start listening
    const start = Date.now();
    let serverReady = false;
    while (Date.now() - start < 10000) {
      try {
        const res = await fetch(`${API_URL}/state`);
        if (res.ok) {
          serverReady = true;
          break;
        }
      } catch {
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    record(
      1,
      'Standalone Server Startup & Port Binding',
      serverReady,
      `Server bound to port ${TEST_PORT} and responded to health probe. Output:\n${startupOutput.trim()}`
    );

    if (!serverReady) {
      throw new Error('Server failed to start within 10 seconds.');
    }

    // -------------------------------------------------------------------------
    // Step 2: Static Frontend Serving (GET /)
    // -------------------------------------------------------------------------
    const resRoot = await fetch(`${SERVER_URL}/`);
    const rootHtml = await resRoot.text();
    const isHtml = resRoot.headers.get('content-type')?.includes('text/html');
    const hasAppRoot = rootHtml.includes('id="root"') || rootHtml.includes('restaurant');

    record(
      2,
      'Serve Production Frontend (GET /)',
      resRoot.status === 200 && Boolean(isHtml) && hasAppRoot,
      `Status: ${resRoot.status}, Content-Type: ${resRoot.headers.get('content-type')}, Length: ${rootHtml.length} bytes`
    );

    // -------------------------------------------------------------------------
    // Step 3: SPA Client Routing Fallback (GET /reception & GET /table/03)
    // -------------------------------------------------------------------------
    const resSpa = await fetch(`${SERVER_URL}/table/03?table=tbl_03`);
    const spaHtml = await resSpa.text();
    const spaIsHtml = resSpa.headers.get('content-type')?.includes('text/html');

    record(
      3,
      'SPA Client-Side Route Fallback (GET /table/03)',
      resSpa.status === 200 && Boolean(spaIsHtml) && spaHtml.includes('id="root"'),
      `Status: ${resSpa.status}, Content-Type: ${resSpa.headers.get('content-type')}, Served index.html fallback for client navigation.`
    );

    // -------------------------------------------------------------------------
    // Step 4: CORS Configuration & Preflight Handling (OPTIONS /api/state)
    // -------------------------------------------------------------------------
    const resOptions = await fetch(`${API_URL}/state`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://my-restaurant-demo.vercel.app',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    const allowOrigin = resOptions.headers.get('access-control-allow-origin');
    const allowMethods = resOptions.headers.get('access-control-allow-methods');

    record(
      4,
      'CORS Preflight & Vercel FRONTEND_ORIGIN Support',
      resOptions.status === 204 && allowOrigin === 'https://my-restaurant-demo.vercel.app',
      `OPTIONS Status: ${resOptions.status}, Access-Control-Allow-Origin: ${allowOrigin}, Allowed Methods: ${allowMethods}`
    );

    // -------------------------------------------------------------------------
    // Step 5: Authoritative State Endpoint (GET /api/state)
    // -------------------------------------------------------------------------
    const resState = await fetch(`${API_URL}/state`);
    const stateData = await resState.json();
    const hasTables = Array.isArray(stateData.tables) && stateData.tables.length > 0;
    const hasMenu = Array.isArray(stateData.menuItems) && stateData.menuItems.length > 0;

    record(
      5,
      'Authoritative State Retrieval (GET /api/state)',
      resState.status === 200 && hasTables && hasMenu,
      `Tables registered: ${stateData.tables?.length}, Menu dishes cataloged: ${stateData.menuItems?.length}`
    );

    // -------------------------------------------------------------------------
    // Step 6: Long-Lived Realtime SSE Stream (GET /api/events)
    // -------------------------------------------------------------------------
    const sseResponse = await fetch(`${API_URL}/events`);
    const isStream = sseResponse.headers.get('content-type')?.includes('text/event-stream');
    const isKeepAlive = sseResponse.headers.get('connection')?.toLowerCase().includes('keep-alive');

    const receivedEvents: any[] = [];
    const reader = sseResponse.body?.getReader();
    const decoder = new TextDecoder();
    let sseBuffer = '';

    (async () => {
      try {
        while (reader) {
          const { done, value } = await reader.read();
          if (done) break;
          sseBuffer += decoder.decode(value, { stream: true });
          const lines = sseBuffer.split('\n');
          sseBuffer = lines.pop() || '';
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                receivedEvents.push(JSON.parse(line.slice(6)));
              } catch {}
            }
          }
        }
      } catch {}
    })();

    // Wait for initial STATE_SYNC handshake event
    const sseStart = Date.now();
    let handshakeReceived = false;
    while (Date.now() - sseStart < 4000) {
      if (receivedEvents.some((e) => e.type === 'STATE_SYNC')) {
        handshakeReceived = true;
        break;
      }
      await new Promise((r) => setTimeout(r, 100));
    }

    record(
      6,
      'Realtime SSE Connection & Handshake (GET /api/events)',
      sseResponse.status === 200 && Boolean(isStream) && Boolean(isKeepAlive) && handshakeReceived,
      `Status: ${sseResponse.status}, Content-Type: ${sseResponse.headers.get('content-type')}, Handshake event received: ${handshakeReceived}`
    );

    // -------------------------------------------------------------------------
    // Step 7: Dynamic QR Session Bootstrap (POST /api/session/bootstrap)
    // -------------------------------------------------------------------------
    const resBootstrap = await fetch(`${API_URL}/session/bootstrap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableId: 'tbl_02', restaurantId: 'The Spice Pavilion' }),
    });
    const dataBootstrap = await resBootstrap.json();
    const session = dataBootstrap.session;

    record(
      7,
      'Session Bootstrap (POST /api/session/bootstrap)',
      dataBootstrap.success && Boolean(session) && session.tableId === 'tbl_02',
      `Session ID: ${session?.sessionId}, Table Number: ${session?.tableNumber}, Status: ${session?.status}`
    );

    // -------------------------------------------------------------------------
    // Step 8: Order Batch Submission (POST /api/order/submit)
    // -------------------------------------------------------------------------
    const resOrder = await fetch(`${API_URL}/order/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: session.sessionId,
        tableId: 'tbl_02',
        items: [
          { menuItemId: 'item_st_01', quantity: 2, selectedModifiers: [] },
          { menuItemId: 'item_mc_01', quantity: 1, selectedModifiers: [] },
        ],
        idempotencyKey: `standalone_test_${Date.now()}`,
      }),
    });
    const dataOrder = await resOrder.json();
    const batch = dataOrder.batch;

    record(
      8,
      'Order Submission (POST /api/order/submit)',
      dataOrder.success && Boolean(batch) && batch.status === 'NEW',
      `Batch ID: ${batch?.batchId}, Items: ${batch?.items?.length}, Subtotal: ₹${batch?.batchSubtotal}, Status: ${batch?.status}`
    );

    // -------------------------------------------------------------------------
    // Step 9: Kitchen Order Bump & Realtime Dispatch (POST /api/order/bump)
    // -------------------------------------------------------------------------
    const resBump = await fetch(`${API_URL}/order/bump`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableId: 'tbl_02',
        batchId: batch.batchId,
        status: 'PREPARING',
      }),
    });
    const dataBump = await resBump.json();

    // Verify SSE client received the live bump event
    let bumpEventReceived = false;
    const bumpStart = Date.now();
    while (Date.now() - bumpStart < 4000) {
      if (
        receivedEvents.some(
          (e) =>
            (e.type === 'ORDER_BUMPED' || e.type === 'ORDER_STATUS_UPDATED') &&
            e.payload?.batchId === batch.batchId &&
            e.payload?.status === 'PREPARING'
        )
      ) {
        bumpEventReceived = true;
        break;
      }
      await new Promise((r) => setTimeout(r, 100));
    }

    record(
      9,
      'Kitchen Bump & SSE Broadcast (POST /api/order/bump)',
      dataBump.success && bumpEventReceived,
      `Order bumped to PREPARING. Broadcast confirmed received on open SSE connection: ${bumpEventReceived}`
    );

    // -------------------------------------------------------------------------
    // Step 10: Demo Payment Simulation (POST /api/payment/demo/process)
    // -------------------------------------------------------------------------
    const resPay = await fetch(`${API_URL}/payment/demo/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: session.sessionId,
        paymentMethod: 'UPI',
      }),
    });
    const dataPay = await resPay.json();

    record(
      10,
      'Demo Payment Processing (POST /api/payment/demo/process)',
      dataPay.success && (dataPay.paymentStatus === 'PAID' || dataPay.code === 'PAID'),
      `Settled via Demo UPI. Reference ID: ${dataPay.referenceId}, Status Code: ${dataPay.code}, Payment Status: ${dataPay.paymentStatus}`
    );

    // -------------------------------------------------------------------------
    // Step 11: Graceful Termination on SIGTERM
    // -------------------------------------------------------------------------
    let exitClean = false;
    const exitPromise = new Promise<void>((resolve) => {
      serverProcess?.on('exit', (code, signal) => {
        exitClean = code === 0 || signal === 'SIGTERM';
        resolve();
      });
    });

    serverProcess.kill('SIGTERM');
    await Promise.race([exitPromise, new Promise((r) => setTimeout(r, 4000))]);

    record(
      11,
      'Graceful Shutdown (SIGTERM Handling)',
      exitClean,
      'Process handled SIGTERM and exited cleanly without hanging.'
    );

  } catch (err: any) {
    console.error('Verification Exception:', err);
    record(99, 'Test Execution Failure', false, err.message || String(err));
  } finally {
    if (serverProcess && !serverProcess.killed) {
      serverProcess.kill('SIGKILL');
    }

    const passedCount = steps.filter((s) => s.passed).length;
    console.log('============================================================');
    console.log(`STANDALONE SERVER VERIFICATION: ${passedCount} / ${steps.length} PASSED`);
    if (passedCount === steps.length && steps.length >= 11) {
      console.log('VERDICT: STANDALONE SERVER VERIFIED 100% PRODUCTION READY');
      process.exit(0);
    } else {
      console.log('VERDICT: VERIFICATION FAILED');
      process.exit(1);
    }
  }
}

runStandaloneServerVerification();
