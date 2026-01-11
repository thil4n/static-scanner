import * as vscode from "vscode";
import { RULES } from "./rules";

export class ScannerViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "scannerView";

  constructor(private readonly context: vscode.ExtensionContext) {}

  resolveWebviewView(view: vscode.WebviewView) {
    view.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri],
    };

    view.webview.html = this.getHtml(view);

    view.webview.onDidReceiveMessage(async (msg) => {
      if (msg.command === "scan") {
        await this.scan(msg.language, msg.vulnerabilities, view);
      }

      if (msg.command === "open") {
        const uri = vscode.Uri.parse(msg.uri);
        const position = new vscode.Position(msg.line, msg.character);

        const doc = await vscode.workspace.openTextDocument(uri);
        const editor = await vscode.window.showTextDocument(doc, {
          preview: false,
        });

        editor.selection = new vscode.Selection(position, position);
        editor.revealRange(
          new vscode.Range(position, position),
          vscode.TextEditorRevealType.InCenter
        );
      }
    });
  }

  // -------------------- SCAN ENGINE --------------------

  private async scan(
    language: string,
    vulnerabilities: string[],
    view: vscode.WebviewView
  ) {
    const results: any[] = [];
    const fileGlob = this.getFileGlob(language);

    const files = await vscode.workspace.findFiles(fileGlob);

    for (const uri of files) {
      const doc = await vscode.workspace.openTextDocument(uri);
      const text = doc.getText();

      for (const vuln of vulnerabilities) {
        const rule = RULES[vuln];
        if (!rule) {continue;};

        const regex = new RegExp(rule.regex, "g");
        let match;

        while ((match = regex.exec(text)) !== null) {
          const pos = doc.positionAt(match.index);

          results.push({
            vulnerability: vuln,
            title: rule.title,
            severity: rule.severity,
            file: vscode.workspace.asRelativePath(uri),
            line: pos.line + 1,
            character: pos.character + 1,
            uri: uri.toString(),
          });
        }
      }
    }

    view.webview.postMessage({
      command: "results",
      results,
    });
  }

  private getFileGlob(language: string): string {
    switch (language) {
      case "java":
        return "**/*.java";
      case "javascript":
        return "**/*.{js,ts}";
      case "php":
        return "**/*.php";
      default:
        return "**/*";
    }
  }

  private getNonce() {
    let text = "";
    const possible =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  private getHtml(view: vscode.WebviewView): string {
    const htmlPath = vscode.Uri.joinPath(
      this.context.extensionUri,
      "src",
      "scanner.html"
    );

    let html = require("fs").readFileSync(htmlPath.fsPath, "utf8");

    const styleUri = view.webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "src", "scanner.css")
    );

    const scriptUri = view.webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "src", "scanner.js")
    );

    const nonce = this.getNonce();

    return html
      .replace(/{{styleUri}}/g, styleUri.toString())
      .replace(/{{scriptUri}}/g, scriptUri.toString())
      .replace(/{{nonce}}/g, nonce)
      .replace(/{{cspSource}}/g, view.webview.cspSource);
  }
}
