import * as vscode from "vscode";
import { RULES } from "./rules";

export class ScannerViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "scannerView";

  constructor(private readonly context: vscode.ExtensionContext) {}

  resolveWebviewView(view: vscode.WebviewView) {
    view.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri]
    };

    view.webview.html = this.getHtml();

view.webview.onDidReceiveMessage(async msg => {
  if (msg.command === "scan") {
    await this.scan(msg.language, msg.vulnerabilities, view);
  }

  if (msg.command === "open") {
    const uri = vscode.Uri.parse(msg.uri);
    const position = new vscode.Position(msg.line, msg.character);

    const doc = await vscode.workspace.openTextDocument(uri);
    const editor = await vscode.window.showTextDocument(doc, {
      preview: false
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
      if (!rule) continue;

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
          uri: uri.toString()
        });
      }
    }
  }

  view.webview.postMessage({
    command: "results",
    results
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

  // -------------------- UI --------------------

  private getHtml(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />

<style>
:root {
  --border: var(--vscode-panel-border);
  --card-bg: var(--vscode-sideBar-background);
  --muted: var(--vscode-descriptionForeground);
  --accent: var(--vscode-textLink-foreground);
}

body {
  font-family: var(--vscode-font-family);
  font-size: 13px;
  background: var(--vscode-editor-background);
  color: var(--vscode-foreground);
  padding: 12px;
}

h3 {
  margin: 0 0 10px;
  font-size: 14px;
}

.card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 10px;
  margin-bottom: 12px;
}

.section-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--accent);
  text-transform: uppercase;
  margin-bottom: 6px;
}

/* Language pills */
.lang-group {
  display: flex;
  gap: 6px;
  margin-bottom: 10px;
}

.lang-option {
  flex: 1;
  text-align: center;
  padding: 6px;
  border-radius: 5px;
  border: 1px solid var(--border);
  cursor: pointer;
  user-select: none;
}

.lang-option.active {
  background: var(--vscode-button-background);
  color: var(--vscode-button-foreground);
  border-color: var(--vscode-button-background);
}

.lang-option input {
  display: none;
}

/* Checkboxes */
.option {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 6px 0;
}

input[type="checkbox"] {
  accent-color: var(--vscode-button-background);
}

/* Button */
button {
  width: 100%;
  padding: 8px;
  border-radius: 6px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  background: linear-gradient(
    to right,
    var(--vscode-button-background),
    var(--vscode-button-hoverBackground)
  );
  color: var(--vscode-button-foreground);
}

button:hover {
  filter: brightness(1.05);
}

/* Results */
.result {
  border-top: 1px solid var(--border);
  padding-top: 8px;
  margin-top: 8px;
  font-size: 12px;
}

.result {
  padding: 8px;
  border-radius: 5px;
  cursor: pointer;
  border: 1px solid var(--border);
  margin-bottom: 6px;
}

.result:hover {
  background: var(--vscode-list-hoverBackground);
}


.sev-CRITICAL { color: #ff5555; }
.sev-HIGH { color: #ff8800; }
.sev-MEDIUM { color: #ffaa00; }
.sev-LOW { color: #55aa55; }
</style>
</head>

<body>
  <h3>Static Security Scanner</h3>

  <div class="card">
    <div class="section-title">Language</div>
    <div class="lang-group">
      <label class="lang-option active">
        <input type="radio" name="language" value="java" checked /> Java
      </label>
      <label class="lang-option">
        <input type="radio" name="language" value="javascript" /> JavaScript
      </label>
      <label class="lang-option">
        <input type="radio" name="language" value="php" /> PHP
      </label>
    </div>

    <div class="section-title">Vulnerabilities</div>
    <label class="option"><input type="checkbox" value="sqli" checked /> SQL Injection</label>
    <label class="option"><input type="checkbox" value="xss" /> XSS</label>
    <label class="option"><input type="checkbox" value="rce" /> RCE</label>
    <label class="option"><input type="checkbox" value="cmdi" /> Command Injection</label>
    <label class="option"><input type="checkbox" value="ssrf" /> SSRF</label>
    <label class="option"><input type="checkbox" value="lfi" /> LFI</label>
    <label class="option"><input type="checkbox" value="rfi" /> RFI</label>
    <label class="option"><input type="checkbox" value="xxe" /> XXE</label>
    <label class="option"><input type="checkbox" value="deserialize" /> Deserialization</label>

    <button id="scanBtn">Scan Workspace</button>

    <div id="results"></div>
  </div>

<script>
const vscode = acquireVsCodeApi();

// language toggle
document.querySelectorAll('.lang-option').forEach(el => {
  el.addEventListener('click', () => {
    document.querySelectorAll('.lang-option').forEach(e => e.classList.remove('active'));
    el.classList.add('active');
    el.querySelector('input').checked = true;
  });
});

document.getElementById('scanBtn').addEventListener('click', () => {
  const language = document.querySelector('input[name="language"]:checked').value;
  const vulnerabilities = [...document.querySelectorAll('input[type=checkbox]:checked')]
    .map(cb => cb.value);

  document.getElementById('results').innerHTML = "<div class='muted'>Scanning...</div>";

  vscode.postMessage({
    command: "scan",
    language,
    vulnerabilities
  });
});

window.addEventListener("message", event => {
  if (event.data.command === "results") {
    const container = document.getElementById("results");
    container.innerHTML = "";

    if (event.data.results.length === 0) {
      container.innerHTML = "<div class='muted'>No issues found 🎉</div>";
      return;
    }

    event.data.results.forEach(r => {
      const div = document.createElement("div");
      div.className = "result sev-" + r.severity;
      div.innerHTML =
        "<b>[" + r.severity + "]</b> " +
        r.title +
        "<br/>" +
        r.file + ":" + r.line;

            div.onclick = () => {
        vscode.postMessage({
          command: "open",
          uri: r.uri,
          line: r.line - 1,
          character: r.character - 1
        });
      };
      
      container.appendChild(div);
    });
  }
});
</script>
</body>
</html>`;
  }
}
