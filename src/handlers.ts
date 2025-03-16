import dotenv from "dotenv";

import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListResourceTemplatesRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { type Server } from "@modelcontextprotocol/sdk/server/index.js";
import { resources } from "./resources.js";
import { resourceTemplates } from "./resource-templates.js";
import { prompts } from "./prompts.js";
import { Octokit } from "octokit";

dotenv.config();

if (!process.env.GITHUB_TOKEN) {
  throw new Error("github key not found");
}
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const {
  data: { login },
} = await octokit.rest.users.getAuthenticated();
console.log("logged in", login);

export const setupHandlers = (server: Server): void => {
  // List available resources
  server.setRequestHandler(ListResourcesRequestSchema, () => {
    return { resources: resources };
  });

  // List resource templates
  server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => {
    return {
      resourceTemplates: resourceTemplates,
    };
  });

  // List available prompts
  server.setRequestHandler(ListPromptsRequestSchema, () => {
    return { prompts: prompts };
  });

  // Get a specific prompt by URI
  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    if (!request.params || !request.params.uri) {
        throw new Error("Missing URI parameter in prompt request");
      }
    const prompt = prompts.find((p) => p.uri === request.params.uri);
    if (!prompt) {
      throw new Error(`Prompt not found: ${request.params.uri}`);
    }
    return { prompt };
  });

  // Handle resource content requests
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    // for resources
    const receivedUri = request.params.uri;
    const requestedResource = resources.find(
      (resource) => resource.uri === receivedUri
    );
    if (requestedResource) {
      return {
        contents: [
          {
            uri: requestedResource.uri,
            text: requestedResource.description,
          },
        ],
      };
    }
    // for resource templates
    // parse github resource uris
    const repoInfoRegex = /^github:\/\/repo\/([^\/]+)\/([^\/]+)$/;
    const issuesRegex = /^github:\/\/issues\/([^\/]+)\/([^\/]+)$/;
    const prRegex = /^github:\/\/pr\/([^\/]+)\/([^\/]+)$/;
    const contentsRegex =
      /^github:\/\/contents\/([^\/]+)\/([^\/]+)(?:\/(.*))?$/;

    try {
      // handle repo info requests
      const repoMatch = request.params.uri.match(repoInfoRegex);
      if (repoMatch) {
        const [_, owner, repo] = repoMatch;
        const { data } = await octokit.rest.repos.get({
          owner,
          repo,
        });
        return {
          contents: [
            {
              uri: request.params.uri,
              text: JSON.stringify({
                name: data.name,
                full_name: data.full_name,
                description: data.description,
                stars: data.stargazers_count,
                forks: data.forks_count,
                open_issues: data.open_issues_count,
                language: data.language,
                created_at: data.created_at,
                updated_at: data.updated_at,
              }),
            },
          ],
        };
      }

      // Handle issues requests
      const issuesMatch = request.params.uri.match(issuesRegex);
      if (issuesMatch) {
        const [_, owner, repo] = issuesMatch;
        const { data } = await octokit.rest.issues.listForRepo({
          owner,
          repo,
          per_page: 10,
          state: "open",
        });

        return {
          contents: [
            {
              uri: request.params.uri,
              text: JSON.stringify(
                data.map((issue) => ({
                  number: issue.number,
                  title: issue.title,
                  state: issue.state,
                  created_at: issue.created_at,
                  updated_at: issue.updated_at,
                  user: issue.user?.login,
                }))
              ),
            },
          ],
        };
      }

      // Handle pull request requests
      const prMatch = request.params.uri.match(prRegex);
      if (prMatch) {
        const [_, owner, repo] = prMatch;
        const { data } = await octokit.rest.pulls.list({
          owner,
          repo,
          per_page: 10,
          state: "open",
        });

        return {
          contents: [
            {
              uri: request.params.uri,
              text: JSON.stringify(
                data.map((pr) => ({
                  number: pr.number,
                  title: pr.title,
                  state: pr.state,
                  created_at: pr.created_at,
                  updated_at: pr.updated_at,
                  user: pr?.user?.login,
                }))
              ),
            },
          ],
        };
      }

      // Handle file/directory contents requests
      const contentsMatch = request.params.uri.match(contentsRegex);
      if (contentsMatch) {
        const [_, owner, repo, path = ""] = contentsMatch;
        try {
          // First, get content info without specifying raw format
          const { data } = await octokit.rest.repos.getContent({
            owner,
            repo,
            path,
          });

          // If it's a directory (array of items)
          if (Array.isArray(data)) {
            return {
              contents: [
                {
                  uri: request.params.uri,
                  text: JSON.stringify(
                    data.map((item) => ({
                      name: item.name,
                      type: item.type,
                      path: item.path,
                      size: item.size,
                      url: item.html_url,
                    }))
                  ),
                },
              ],
            };
          }
          // If it's a file
          else {
            // Make a second request for the raw file content
            if (data.type === "file") {
              const fileResponse = await octokit.rest.repos.getContent({
                owner,
                repo,
                path,
                mediaType: { format: "raw" },
              });

              return {
                contents: [
                  {
                    uri: request.params.uri,
                    text:
                      typeof fileResponse.data === "string"
                        ? fileResponse.data
                        : Buffer.from(data.content, "base64").toString("utf8"),
                  },
                ],
              };
            }
          }
        } catch (error) {
          console.error("GitHub API Error:", error);
          throw new Error(`Failed to fetch GitHub data: 1`);
        }
      }

      throw new Error("Resource not found");
    } catch (error) {
      console.error("GitHub API Error:", error);
      throw new Error(`Failed to fetch GitHub data: 2`);
    }
  });
};
