import * as vscode from 'vscode';
import { Octokit } from "@octokit/rest";

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('extension.openPRFiles', async () => {
        // Get PR URL from the user
        let PRUrl = await vscode.window.showInputBox({ prompt: 'Enter PR URL' });

        if (!PRUrl) {
            vscode.window.showErrorMessage('PR URL is required!');
            return;
        }

        // Assume that the PR URL is in the form of https://github.com/user/repo/pull/number
        let [_, user, repo, __, number] = PRUrl.split('/');

        const octokit = new Octokit({
            auth: process.env.GITHUB_TOKEN
        });

        // Fetch PR details using GitHub API
        try {
            let { data: files } = await octokit.rest.pulls.listFiles({
                owner: user,
                repo: repo,
                pull_number: parseInt(number),
            });

            // Open each file in a new editor tab
            for (let file of files) {
                if (file.status !== 'removed') {
                    let doc = await vscode.workspace.openTextDocument(file.filename);
                    await vscode.window.showTextDocument(doc);
                }
            }
        } catch (error) {
            vscode.window.showErrorMessage('Failed to fetch PR details!');
        }
    });

    context.subscriptions.push(disposable);
}
