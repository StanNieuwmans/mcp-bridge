#!/usr/bin/env node
import { EventSource } from "eventsource";

// -- Configuration ----------------------------------

let baseUrl: string =
  process.argv[2] ?? process.env["MCP_URL"] ?? "http://localhost:8808";

if (!baseUrl.startsWith("http")) baseUrl = `http://${baseUrl}`;
baseUrl = baseUrl.replace(/\/$/, "");

const sseUrl = `${baseUrl}/sse`;
let messagePostUrl = `${baseUrl}/message`;

const debug = console.error; // Debug output to stderr
const sendToClaude = console.log; // Output to Claude via stdout

// -- Connect to MCP SSE Server ----------------------

function initializeSSEConnection(): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("❌ SSE connection timeout")), 10_000);
    const source = new EventSource(sseUrl);

    source.onopen = () => {
      clearTimeout(timeout);
      debug("✅ Connected to SSE backend");
      resolve();
    };

    source.addEventListener("endpoint", (e) => {
      const url = new URL(baseUrl);
      messagePostUrl = `${url.protocol}//${url.host}${e.data}`;
      debug(`📡 Updated message POST endpoint → ${messagePostUrl}`);
    });

    source.addEventListener("message", (e) => {
      sendToClaude(e.data); // Forward to Claude
      debug(`<-- ${e.data}`);
    });

    source.onerror = (e) => reject(e);
  });
}

// -- Forward STDIN Messages to Backend --------------

async function forwardStdioMessage(buffer: Buffer) {
  const payload = buffer.toString().trim();
  debug("-->", payload);

  try {
    const response = await fetch(messagePostUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload
    });

    if (!response.ok) {
      debug(`❌ HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (err) {
    debug("❌ Failed to POST message:", err);
  }
}

// -- Start the STDIO Bridge -------------------------

async function startBridge() {
  debug(`🌉 Launching MCP Bridge → ${baseUrl}`);

  try {
    await initializeSSEConnection();

    process.stdin.on("data", forwardStdioMessage);
    process.stdin.on("end", () => {
      debug("⛔ STDIN closed. Exiting...");
      process.exit(0);
    });

    debug("🚀 MCP Bridge running. Listening via STDIO...");
  } catch (err) {
    debug("❌ Bridge initialization failed:", err);
    process.exit(1);
  }
}

startBridge();
