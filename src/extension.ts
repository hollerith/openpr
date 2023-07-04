import * as vscode from 'vscode';
import { Octokit } from "@octokit/rest";
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {

    let disposable = vscode.commands.registerCommand('extension.openPRFiles', async () => {
        // Get the GitHub token from the settings
        let config = vscode.workspace.getConfiguration('PRFilesOpener');
        let githubToken = config.get('githubToken');

        if (!githubToken) {
            // Prompt the user to input the GitHub token
            githubToken = await vscode.window.showInputBox({ prompt: 'Enter your GitHub token' });

            if (!githubToken) {
                vscode.window.showWarningMessage('GitHub token is required to use this extension.');
                return;
            }

            // Save the GitHub token in the settings
            await config.update('githubToken', githubToken, vscode.ConfigurationTarget.Global);
        }

        // Get PR URL from the user
        let PRUrl = await vscode.window.showInputBox({ prompt: 'Enter PR URL' });

        if (!PRUrl) {
            vscode.window.showErrorMessage('PR URL is required!');
            return;
        }

        // Extract user, repo, and number from the PR URL
        const prRegex = /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)$/;
        const match = prRegex.exec(PRUrl);
        if (!match) {
            vscode.window.showErrorMessage('Invalid PR URL!');
            return;
        }
        const [, user, repo, number] = match;

        const octokit = new Octokit({
            auth: githubToken as string,
        });

        // Fetch PR details using GitHub API
        try {
            let { data: files } = await octokit.rest.pulls.listFiles({
                owner: user,
                repo: repo,
                pull_number: parseInt(number),
            });

            // Open each file in the editor
            const openedEditors: vscode.TextEditor[] = [];
            for (let file of files) {
                if (file.status !== 'removed') {
                    // Construct the correct file path relative to the current directory
                    const filePath = path.resolve(file.filename);

                    try {
                        const document = await vscode.workspace.openTextDocument(filePath);
                        const editor = await vscode.window.showTextDocument(document, {
                            preserveFocus: true,
                            preview: false,
                        });
                        openedEditors.push(editor);
                    } catch (error) {
                        vscode.window.showErrorMessage(`Failed to open file: ${file.filename}`);
                    }
                }
            }

            // Focus the first opened editor
            if (openedEditors.length > 0) {
                const firstEditor = openedEditors[0];
                vscode.window.showTextDocument(firstEditor.document, firstEditor.viewColumn);
            }
        } catch (error) {
            vscode.window.showErrorMessage('Failed to fetch PR details!');
        }
    });

    context.subscriptions.push(disposable);
}
