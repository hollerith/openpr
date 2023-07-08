// openpr/src/extension.ts
import * as vscode from 'vscode';
import { Octokit } from "@octokit/rest";
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    let disposableOpenPRFiles = vscode.commands.registerCommand('extension.openPRFiles', async () => {
        let config = vscode.workspace.getConfiguration('PRFilesOpener');
        let githubToken = config.get('githubToken');

        if (!githubToken) {
            githubToken = await vscode.window.showInputBox({ prompt: 'Enter your GitHub token' });

            if (!githubToken) {
                vscode.window.showWarningMessage('GitHub token is required to use this extension.');
                return;
            }

            await config.update('githubToken', githubToken, vscode.ConfigurationTarget.Global);
        }

        let PRUrl = await vscode.window.showInputBox({ prompt: 'Enter PR URL' });

        if (!PRUrl) {
            vscode.window.showErrorMessage('PR URL is required!');
            return;
        }

        vscode.commands.executeCommand('workbench.action.closeAllEditors');

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

        try {
            let { data: files } = await octokit.rest.pulls.listFiles({
                owner: user,
                repo: repo,
                pull_number: parseInt(number),
            });

            const openedEditors: vscode.TextEditor[] = [];
            for (let file of files) {
                if (file.status !== 'removed') {
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

            if (openedEditors.length > 0) {
                const firstEditor = openedEditors[0];
                vscode.window.showTextDocument(firstEditor.document, firstEditor.viewColumn);
            }
        } catch (error) {
            vscode.window.showErrorMessage('Failed to fetch PR details!');
        }
    });

    let disposableOpenStringLocation = vscode.commands.registerCommand('extension.openStringLocation', async () => {
        const pasteBuffer = await vscode.env.clipboard.readText();
        const position = parseStringLocation(pasteBuffer);

        if (position) {
            openFileAndPositionCursor(position);
        } else {
            vscode.window.showErrorMessage('Invalid string format in the paste buffer.');
        }
    });

    context.subscriptions.push(disposableOpenPRFiles, disposableOpenStringLocation);
}

function parseStringLocation(locationString: string): { filePath: string; position: vscode.Position } | null {
    let line = 1;
    let column = 1;
    let filePath: string;

    if (locationString.includes('github.com')) {
        const gitHubRegex = /https:\/\/github\.com\/[^/]+\/[^/]+\/blob\/[^/]+\/([^#]+)#?L?(\d+)?/;
        const matches = gitHubRegex.exec(locationString);

        if (matches) {
            filePath = matches[1];
            line = matches[2] ? parseInt(matches[2]) : line;
        } else {
            return null;
        }
    } else {
        const localFileRegex = /([^:]+):?(\d+)?:?(\d+)?/;
        const matches = localFileRegex.exec(locationString);

        if (matches) {
            filePath = matches[1];
            line = matches[2] ? parseInt(matches[2]) : line;
            column = matches[3] ? parseInt(matches[3]) : column;
        } else {
            return null;
        }
    }

    return {
        filePath,
        position: new vscode.Position(line - 1, column - 1)
    };
}

async function openFileAndPositionCursor(location: { filePath: string; position: vscode.Position } | null) {
    if (!location) {
        return;
    }

    let rootPath: string | undefined;

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
        rootPath = workspaceFolders[0].uri.fsPath;
    } else if (vscode.workspace.workspaceFile) {
        rootPath = path.dirname(vscode.workspace.workspaceFile.fsPath);
    } else {
        rootPath = process.cwd();
    }

    const fullPath = path.resolve(rootPath, location.filePath);

    try {
        const document = await vscode.workspace.openTextDocument(fullPath);
        const editor = await vscode.window.showTextDocument(document);
        const { position } = location;
        editor.selection = new vscode.Selection(position, position);
        editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to open file: ${error}`);
    }
}
