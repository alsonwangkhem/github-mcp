// Define the resource templates
export const resourceTemplates = [
    {
        uriTemplate: 'github://repo/{owner}/{repo}',
        name: 'Repository Information',
        description: 'Get detailed information about a specific GitHub repository',
        mimeType: 'application/json'
    },
    {
        uriTemplate: 'github://issues/{owner}/{repo}',
        name: 'Repository Issues',
        description: 'List issues for a specific GitHub repository',
        mimeType: 'application/json'
    },
    {
        uriTemplate: 'github://pr/{owner}/{repo}',
        name: 'Repository Pull Requests',
        description: 'List pull requests for a specific GitHub repository',
        mimeType: 'application/json'
    },
    {
        uriTemplate: 'github://contents/{owner}/{repo}/{path}',
        name: 'Repository Contents',
        description: 'Get contents of a file or directory in a GitHub repository',
        mimeType: 'text/plain'
    }
];
export function getResourceTemplate(uri) {
    // This function can be used to programmatically find a template that matches a URI
    // Implement if needed
    return undefined;
}
