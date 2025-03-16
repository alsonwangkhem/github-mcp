import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { setupHandlers } from "./handlers.js";
// initialize mcp server with resource capabilities
const server = new Server({
    name: "github-mcp",
    version: "1.0.0",
}, {
    capabilities: {
        prompts: {}, // enable prompts
        resources: {}, // enable resources
    }
});
setupHandlers(server);
// start server using stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);
console.info('{"jsonrpc": "2.0", "method": "log", "params": { "message": "Server running..." }}');
