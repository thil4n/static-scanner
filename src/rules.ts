export const RULES: Record<string, any> = {
  sqli: {
    title: "SQL Injection",
    severity: "HIGH",
    regex: "(Statement|PreparedStatement).*execute(Query|Update)"
  },
  xss: {
    title: "Cross-Site Scripting",
    severity: "MEDIUM",
    regex: "innerHTML|document.write"
  },
  rce: {
    title: "Remote Code Execution",
    severity: "CRITICAL",
    regex: "Runtime\\.getRuntime\\(\\)\\.exec"
  }
};


