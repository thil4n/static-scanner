import * as vscode from "vscode";
import { RULES } from "./rules";

export class ScannerViewProvider implements vscode.WebviewViewProvider {
  constructor(private context: vscode.ExtensionContext) {}

  resolveWebviewView(view: vscode.WebviewView) {
    view.webview.options = { enableScripts: true };

    view.webview.html = this.getHtml();

    view.webview.onDidReceiveMessage(async msg => {
      if (msg.command === "scan") {
        await this.scan(msg.rule, view);
      }
    });
  }

  private async scan(ruleKey: string, view: vscode.WebviewView) {
    const rule = RULES[ruleKey];
    const results: any[] = [];

// await vscode.workspace.findTextInFiles(
//   {
//     pattern: rule.regex,
//     isRegExp: true,
//     filesToInclude: "**/*.java"
//   },
//   (result: vscode.TextSearchResult) => {
//     results.push({
//       file: result.uri.fsPath,
//       line: result.ranges[0].start.line + 1,
//       uri: result.uri.toString(),
//       range: result.ranges[0]
//     });
//   }
// );


    view.webview.postMessage({ command: "results", results });
  }

  private getHtml(): string {
    const buttons = Object.entries(RULES)
      .map(
        ([key, r]) =>
          `<button onclick="scan('${key}')">${r.label}</button>`
      )
      .join("<br/>");

    return `
      <html>
      <body>
        <h3>Java Security Scanner</h3>
        ${buttons}
        <hr/>
        <ul id="results"></ul>

        <script>
          const vscode = acquireVsCodeApi();

          function scan(rule) {
            vscode.postMessage({ command: 'scan', rule });
          }

          window.addEventListener('message', event => {
            if (event.data.command === 'results') {
              const ul = document.getElementById('results');
              ul.innerHTML = '';
              event.data.results.forEach(r => {
                const li = document.createElement('li');
                li.textContent = r.file + ':' + r.line;
                li.onclick = () => vscode.postMessage({ command: 'open', uri: r.uri, range: r.range });
                ul.appendChild(li);
              });
            }
          });
        </script>
      </body>
      </html>
    `;
  }
}
