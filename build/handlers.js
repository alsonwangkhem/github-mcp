import { ListResourcesRequestSchema, ReadResourceRequestSchema, ListResourceTemplatesRequestSchema, ListPromptsRequestSchema, GetPromptRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { resources } from "./resources.js";
import { resourceTemplates } from "./resource-templates.js";
import { prompts } from "./prompts.js";
import { Octokit } from "octokit";
const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
});
export const setupHandlers = (server) => {
    // List available resources
    server.setRequestHandler(ListResourcesRequestSchema, () => {
        return { resources };
    });
    // List resource templates
    server.setRequestHandler(ListResourceTemplatesRequestSchema, () => ({
        resourceTemplates,
    }));
    // List available prompts
    server.setRequestHandler(ListPromptsRequestSchema, () => {
        return { prompts };
    });
    // Get a specific prompt by URI
    server.setRequestHandler(GetPromptRequestSchema, (request) => {
        const prompt = prompts.find(p => p.uri === request.params.uri);
        if (!prompt) {
            throw new Error(`Prompt not found: ${request.params.uri}`);
        }
        return { prompt };
    });
    // Handle resource content requests
    server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
        // Your existing GitHub resource handling code...
        // parse github resource uris
        const repoInfoRegex = /^github:\/\/repo\/([^\/]+)\/([^\/]+)$/;
        const issuesRegex = /^github:\/\/issues\/([^\/]+)\/([^\/]+)$/;
        const prRegex = /^github:\/\/pr\/([^\/]+)\/([^\/]+)$/;
        const contentsRegex = /^github:\/\/contents\/([^\/]+)\/([^\/]+)\/(.+)$/;
        try {
            // handle repo info requests
            const repoMatch = request.params.uri.match(repoInfoRegex);
            console.log("repo match, ", repoMatch);
            if (repoMatch) {
                const [, owner, repo] = repoMatch;
                const { data } = await octokit.rest.repos.get({
                    owner,
                    repo
                });
                return {
                    contents: [
                        {
                            uri: request.params.uri,
                            json: {
                                name: data.name,
                                full_name: data.full_name,
                                description: data.description,
                                stars: data.stargazers_count,
                                forks: data.forks_count,
                                open_issues: data.open_issues_count,
                                language: data.language,
                                created_at: data.created_at,
                                updated_at: data.updated_at
                            }
                        }
                    ]
                };
            }
            // Handle issues requests
            const issuesMatch = request.params.uri.match(issuesRegex);
            if (issuesMatch) {
                const [, owner, repo] = issuesMatch;
                const { data } = await octokit.rest.issues.listForRepo({
                    owner,
                    repo,
                    per_page: 10,
                    state: 'open'
                });
                return {
                    contents: [
                        {
                            uri: request.params.uri,
                            json: data.map(issue => ({
                                number: issue.number,
                                title: issue.title,
                                state: issue.state,
                                created_at: issue.created_at,
                                updated_at: issue.updated_at,
                                user: issue.user?.login
                            }))
                        }
                    ]
                };
            }
            // Handle pull request requests
            const prMatch = request.params.uri.match(prRegex);
            if (prMatch) {
                const [, owner, repo] = prMatch;
                const { data } = await octokit.rest.pulls.list({
                    owner,
                    repo,
                    per_page: 10,
                    state: 'open'
                });
                return {
                    contents: [
                        {
                            uri: request.params.uri,
                            json: data.map(pr => ({
                                number: pr.number,
                                title: pr.title,
                                state: pr.state,
                                created_at: pr.created_at,
                                updated_at: pr.updated_at,
                                user: pr?.user?.login
                            }))
                        }
                    ]
                };
            }
            // Handle file/directory contents requests
            const contentsMatch = request.params.uri.match(contentsRegex);
            if (contentsMatch) {
                const [, owner, repo, path] = contentsMatch;
                const { data } = await octokit.rest.repos.getContent({
                    owner,
                    repo,
                    path
                });
                // If it's a file
                if (!Array.isArray(data)) {
                    const fileData = data;
                    const content = Buffer.from(fileData.content, 'base64').toString('utf8');
                    return {
                        contents: [
                            {
                                uri: request.params.uri,
                                text: content
                            }
                        ]
                    };
                }
                // If it's a directory
                return {
                    contents: [
                        {
                            uri: request.params.uri,
                            json: data.map(item => ({
                                name: item.name,
                                path: item.path,
                                type: item.type,
                                size: item.size,
                                url: item.html_url
                            }))
                        }
                    ]
                };
            }
            throw new Error("Resource not found");
        }
        catch (error) {
            console.error("GitHub API Error:", error);
            throw new Error(`Failed to fetch GitHub data:`);
        }
    });
};
