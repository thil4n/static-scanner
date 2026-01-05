import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	console.log('Static Scanner activated');


	vscode.window.showInformationMessage(
  'Static Scanner Activated'
);


	const disposable = vscode.commands.registerCommand(
		'static-scanner.helloWorld',
		() => {
			vscode.window.showInformationMessage('Hello World from Static Scanner!');
		}
	);

	context.subscriptions.push(disposable);
}

export function deactivate() {}
