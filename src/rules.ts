export const RULES: Record<string, { label: string; regex: string }> = {
  IDOR: {
    label: "IDOR (Direct Object Reference)",
    regex: "@PathVariable|@RequestParam"
  },
  SQLI: {
    label: "SQL Injection",
    regex: "(SELECT|UPDATE|DELETE|INSERT).*\\+"
  },
  RCE: {
    label: "Remote Code Execution",
    regex: "Runtime\\.getRuntime\\(\\)\\.exec|ProcessBuilder"
  },
  XXE: {
    label: "XML External Entity",
    regex: "DocumentBuilderFactory\\.newInstance|SAXParserFactory\\.newInstance"
  },
  DESERIALIZATION: {
    label: "Unsafe Deserialization",
    regex: "ObjectInputStream|readObject"
  }
};
