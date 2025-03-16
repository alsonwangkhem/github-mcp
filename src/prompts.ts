import { Prompt } from "@modelcontextprotocol/sdk/types.js";

// Define prompts to help Claude interact with GitHub
export const prompts: Prompt[] = [
  {
    uri: "github://prompts/repo-analysis",
    name: "Repository Analysis",
    description: "Analyze a GitHub repository",
    template: `
      You have access to information about the GitHub repository {owner}/{repo}.
      
      Here are some potential analyses you can provide:
      - Overview of the repository: stars, forks, main language, etc.
      - Open issues and pull requests summary
      - Activity level and maintenance status
      - Key contributors and their contributions
      
      Please analyze the repository based on the information available.
    `
  },
  {
    uri: "github://prompts/issue-summary",
    name: "Issue Summary",
    description: "Summarize issues in a repository",
    template: `
      Here is a list of open issues from the GitHub repository {owner}/{repo}.
      
      Please provide:
      - A summary of the most common themes or categories of issues
      - Any critical issues that should be prioritized
      - How long issues have been open on average
      - Suggestions for the repository maintainers
    `
  },
  {
    uri: "github://prompts/code-review",
    name: "Code Review",
    description: "Review code from a file in a repository",
    template: `
      You're examining the following code from {path} in the {owner}/{repo} repository:
      
      {file_content}
      
      Please provide:
      - A summary of what this code does
      - Any potential issues, bugs, or improvements
      - Suggestions for better practices or optimizations
      - Comments on code style and organization
    `
  }
];

// Define prompt handlers
export const promptHandlers = {
  // You can add custom logic for handling specific prompts here
};