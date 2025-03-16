import { Resource } from "@modelcontextprotocol/sdk/types.js";

// Define the resources your MCP server provides
export const resources: Resource[] = [
  {
    uri: "github://repo/info",
    name: "GitHub Repository Info",
    description: "Get information about a GitHub repository",
    mimeType: "application/json",
  },
  {
    uri: "github://issues/list",
    name: "GitHub Issues List",
    description: "List issues from a GitHub repository",
    mimeType: "application/json",
  },
  {
    uri: "github://pr/list",
    name: "GitHub Pull Requests",
    description: "List pull requests from a GitHub repository",
    mimeType: "application/json",
  },
  {
    uri: "github://contents/files",
    name: "GitHub Repository Contents",
    description: "Access file contents from a GitHub repository",
    mimeType: "text/plain",
  }
];

// Resource handlers (empty because these are handled in handlers.ts)
export const resourceHandlers = {};