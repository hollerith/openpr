# VSCode PR Files Opener and Permalink helper Extension

This is a Visual Studio Code extension that adds two commands:

1. `Open PR Files` fetches the list of files in a given GitHub Pull Request (PR) and opens all of them in new editor tabs.
2. `Open String Location` opens the file of the permalink or file path in the clipboard

## Installation

1. Download or clone this repository.
2. Open it in Visual Studio Code.
3. Press `F5` or run the `Debug: Start Debugging` command to launch a new VS Code window with the extension loaded.

## Usage

### Open PR Files

1. Press `F1` to open the command palette.
2. Type and select `Open PR Files`.
3. Enter the URL of the PR when prompted.

The extension will then fetch the list of files in the PR from the GitHub API and open each file in a new editor tab.

### Open String Location

1. Press `F1` to open the command palette.
2. Type and select `Open String Location`.

The extension will then open the file and position the cursor.

## Configuration

You need to provide your GitHub token as an environment variable named `GITHUB_TOKEN`. This token is required to make requests to the GitHub API.

## Note

This extension assumes that the PR URL is in the form of `https://github.com/user/repo/pull/number`.

## Contribution

Contributions to the VSCode PR Files Opener Extension are welcomed! Feel free to report any issues or submit pull requests.

## License

VSCode PR Files Opener Extension is open-sourced software licensed under the [MIT license](LICENSE.md).
