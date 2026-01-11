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
  if (event.data.command !== "results") {return;};

  const container = document.getElementById("results");
  container.innerHTML = "";

  const results = event.data.results;

  if (!results.length) {
    container.innerHTML = "<div class='muted'>No issues found 🎉</div>";
    return;
  }

  // ---- GROUP BY FILE ----
  const grouped = {};
  results.forEach(r => {
    grouped[r.file] ??= [];
    grouped[r.file].push(r);
  });

  Object.entries(grouped).forEach(([file, findings]) => {
    // File header
    const fileDiv = document.createElement("div");
    fileDiv.className = "file-group";

    fileDiv.innerHTML = `
      <div class="file-header">
        <span class="file-path" title="${file}">${file}</span>
        <span class="file-count">${findings.length}</span>
      </div>
    `;

    // Findings
    findings.forEach(r => {
      const div = document.createElement("div");
      div.className = "result sev-" + r.severity;
      div.innerHTML = `
        <b>[${r.severity}]</b> ${r.title}
        <div class="muted">Line ${r.line}</div>
      `;

      div.onclick = () => {
        vscode.postMessage({
          command: "open",
          uri: r.uri,
          line: r.line - 1,
          character: r.character - 1
        });
      };

      fileDiv.appendChild(div);
    });

    container.appendChild(fileDiv);
  });
});