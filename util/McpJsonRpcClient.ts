import type { JSONRPCMessage } from "@modelcontextprotocol/sdk/types.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { v4 as uuidv4 } from "uuid"; // or use Date.now() if you prefer

export class McpJsonRpcClient {
  private transport: SSEClientTransport;
  private pending = new Map<string | number, (response: any) => void>();

  constructor(transport: SSEClientTransport) {
    this.transport = transport;

    this.transport.onmessage = (message) => {
      const { id } = message as { id: string | number };
      if (id && this.pending.has(id)) {
        const resolve = this.pending.get(id)!;
        this.pending.delete(id);
        resolve(message);
      }
    };
  }

  async connect() {
    await this.transport.start();
  }

  async request(method: string, params: any): Promise<any> {
    const id = uuidv4(); // could also use a simple incrementing number
    const message: JSONRPCMessage = {
      jsonrpc: "2.0",
      id,
      method,
      params
    };

    const result = new Promise<any>((resolve) => {
      this.pending.set(id, resolve);
    });

    await this.transport.send(message);

    return result;
  }
}
