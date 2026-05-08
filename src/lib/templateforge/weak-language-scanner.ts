export interface WeakLanguageMatch {
  phrase: string;
  line: number;
  file: string;
  context: string;
  severity: "major" | "minor";
}

const WEAK_PHRASES = [
  "maybe",
  "might",
  "should probably",
  "basic",
  "rough draft",
  "incomplete",
  "temporary",
  "generic",
  "optional later",
  "can be added later",
  "not production ready",
];

const MAJOR_WEAK_PHRASES = [
  "incomplete",
  "not production ready",
  "rough draft",
  "temporary",
];

export function scanForWeakLanguage(
  files: Array<{ path: string; content: string }>
): WeakLanguageMatch[] {
  const matches: WeakLanguageMatch[] = [];

  for (const file of files) {
    if (
      file.path.endsWith(".md") ||
      file.path.includes("README") ||
      file.path.includes("CHANGELOG")
    ) {
      continue;
    }

    const lines = file.content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineLower = line.toLowerCase();

      if (!line.trim().startsWith("//") && !line.trim().startsWith("*")) {
        continue;
      }

      for (const phrase of WEAK_PHRASES) {
        if (lineLower.includes(phrase.toLowerCase())) {
          matches.push({
            phrase,
            line: i + 1,
            file: file.path,
            context: line.trim().slice(0, 120),
            severity: MAJOR_WEAK_PHRASES.includes(phrase) ? "major" : "minor",
          });
        }
      }
    }
  }

  return matches;
}
