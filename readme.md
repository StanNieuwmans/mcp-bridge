# 🔌 MCP Bridge (STDIO ↔ SSE)

A lightweight bridge that connects [Claude Desktop](https://www.anthropic.com/index/claude-desktop) via **STDIO** to any MCP-compatible backend using **SSE (Server-Sent Events)**.

This enables Claude to talk to modern MCP servers that expose an HTTP API using `/sse` and `/messages`, while Claude only supports STDIO.

---

## 📦 Features

- 🌉 Bridges STDIO and SSE for full protocol compatibility
- 📨 Forwards all JSON-RPC requests to the backend
- 🔁 Relays backend responses and events back to Claude
- 🔧 Fully compatible with the [Model Context Protocol (MCP)](https://modelcontextprotocol.io)

---

## 🗂️ Folder Structure

```plaintext
mcp-bridge/
├── cli.ts               # 🧠 Main entry point (runs the bridge logic)
├── package.json         # 📦 Project metadata and dependencies
├── tsconfig.json        # ⚙️ TypeScript config
└── README.md            # 📖 Project documentation
```

---

## 🚀 Usage

You can run the bridge manually:

```bash
npx mcp-bridge http://localhost:4000
```

Or make the script executable and run it:

```bash
chmod +x cli.ts
./cli.ts http://localhost:4000
```

Alternatively, configure it in your `mcpServers`:

```json
{
    "mcpServers": {
        "mcp-hub": {
            "command": "npx",
            "args": ["mcp-bridge", "http://localhost:4000"]
        }
    }
}
```

---

## ⚙️ Requirements

- **Node.js v18+** (must support `fetch` and top-level `await`)
- **TypeScript / tsx** if using `.ts` directly

Your backend must implement:

- `GET /sse` — SSE endpoint for responses/events
- `POST /messages` — JSON-RPC POST endpoint for requests

---

## 🧠 How It Works

```plaintext
Claude Desktop
            │
            ▼ (STDIO)
[ MCP Bridge (cli.ts) ]
            │ (SSE + POST)
            ▼
Your MCP Backend (McpServer)
```

- Claude talks to the bridge over STDIO.
- The bridge opens an SSE connection to your backend's `/sse`.
- The bridge POSTs Claude's messages to `/messages`.
- SSE responses are streamed back and passed to Claude via STDOUT.

---

## 🧪 Dev & Debugging

Install dependencies:

```bash
npm install
```

Run in dev mode:

```bash
npx tsx cli.ts http://localhost:4000
```

Enable verbose output:

```bash
DEBUG=1 npx tsx cli.ts http://localhost:4000
```

---

## 🧯 Troubleshooting

- ❌ **Permission denied** → Run `chmod +x cli.ts`
- ❌ **Unknown file extension `.ts`** → Make sure you're using `tsx` or `ts-node`
- ❌ **Claude can't connect** → Check `mcpServers` config and stdout/stderr logs


## Credits: 
[boilingdata/mcp-server-and-gw](https://github.com/boilingdata/mcp-server-and-gw/tree/main)
