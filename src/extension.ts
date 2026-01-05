import * as vscode from "vscode";
import { ScannerViewProvider } from "./scannerView";

export function activate(context: vscode.ExtensionContext) {
  const provider = new ScannerViewProvider(context);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "scannerView",
      provider
    )
  );

  vscode.window.onDidChangeActiveTextEditor(() => {});
}
