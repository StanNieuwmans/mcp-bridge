#!/usr/bin/env node
import { EventSource } from "eventsource";

// 1. Parse the base URL
let baseUrl = process.argv[2] ?? process.env["MCP_URL"] ?? "http://localhost:8808";
if (!baseUrl.startsWith("http")) baseUrl = `http://${baseUrl}`;
baseUrl = baseUrl.replace(/\/$/, "");

const backendUrlSse = `${baseUrl}/sse`;
let backendUrlMsg = `${baseUrl}/message`;

const debug = console.error;
const respond = console.log;

// 2. Connect to the SSE backend
function connectSSEBackend() {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("SSE Backend timeout")), 10_000);
    const source = new EventSource(backendUrlSse);

    source.onopen = () => resolve(clearTimeout(timer));
    source.addEventListener("endpoint", (e) => {
      const url = new URL(baseUrl);
      backendUrlMsg = `${url.protocol}//${url.host}${e.data}`;
      debug(`📡 New message endpoint: ${backendUrlMsg}`);
    });
    source.addEventListener("message", (e) => respond(e.data));
    source.addEventListener("message", (e) => debug(`<-- ${e.data}`));
    source.addEventListener("error", (e) => reject(e));
  });
}

// 3. Pipe stdin → HTTP POST to the backend
async function processMessage(inp) {
  const msg = inp.toString();
  debug("-->", msg.trim());
  try {
    const res = await fetch(backendUrlMsg, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: msg
    });
    if (!res.ok) debug(`❌ HTTP error: ${res.status} ${res.statusText}`);
  } catch (e) {
    debug("❌ Failed to POST to backend:", e);
  }
}

// 4. Boot the bridge
async function runBridge() {
  debug(`🌉 Starting mcp-bridge → ${baseUrl}`);
  await connectSSEBackend();
  process.stdin.on("data", processMessage);
  process.stdin.on("end", () => {
    debug("⛔ stdin closed. Exiting...");
    process.exit(0);
  });
  debug("✅ Bridge running. Listening on STDIO.");
}

runBridge().catch((err) => {
  debug("❌ Fatal error:", err);
  process.exit(1);
});
