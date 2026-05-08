export interface PlaceholderMatch {
  phrase: string;
  line: number;
  file: string;
  context: string;
  severity: "critical" | "major" | "minor";
}

const BLOCKED_PHRASES = [
  "TODO",
  "FIXME",
  "TBD",
  "placeholder",
  "your_key_here",
  "change_me",
  "insert here",
  "replace me",
  "lorem ipsum",
  "example.com",
  "dummy",
  "fake",
  "sample only",
  "coming soon",
  "not implemented",
  "stub",
  "mock",
  "pseudo",
  "boilerplate only",
  "fill this in",
  "to be added",
  "under construction",
];

const SEVERITY_MAP: Record<string, "critical" | "major" | "minor"> = {
  TODO: "critical",
  FIXME: "critical",
  TBD: "major",
  placeholder: "critical",
  your_key_here: "critical",
  change_me: "critical",
  "insert here": "major",
  "replace me": "major",
  "lorem ipsum": "major",
  "example.com": "minor",
  dummy: "minor",
  fake: "minor",
  "sample only": "minor",
  "coming soon": "major",
  "not implemented": "critical",
  stub: "major",
  mock: "minor",
  pseudo: "minor",
  "boilerplate only": "major",
  "fill this in": "critical",
  "to be added": "major",
  "under construction": "major",
};

export function scanForPlaceholders(
  files: Array<{ path: string; content: string }>
): PlaceholderMatch[] {
  const matches: PlaceholderMatch[] = [];

  for (const file of files) {
    const lines = file.content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineLower = line.toLowerCase();

      for (const phrase of BLOCKED_PHRASES) {
        const phraseLower = phrase.toLowerCase();

        if (lineLower.includes(phraseLower)) {
          const isComment =
            line.trim().startsWith("//") ||
            line.trim().startsWith("#") ||
            line.trim().startsWith("*") ||
            line.trim().startsWith("<!--");

          const isInString =
            line.includes(`"${phrase}"`) ||
            line.includes(`'${phrase}'`) ||
            line.includes(`\`${phrase}\``);

          if (
            phraseLower === "mock" &&
            (file.path.includes("test") || file.path.includes("spec"))
          ) {
            continue;
          }

          matches.push({
            phrase,
            line: i + 1,
            file: file.path,
            context: line.trim().slice(0, 120),
            severity: isComment
              ? SEVERITY_MAP[phrase] || "minor"
              : isInString
              ? "major"
              : SEVERITY_MAP[phrase] || "minor",
          });
        }
      }
    }
  }

  return matches;
}

export function countBySeverity(
  matches: PlaceholderMatch[]
): Record<string, number> {
  return {
    critical: matches.filter((m) => m.severity === "critical").length,
    major: matches.filter((m) => m.severity === "major").length,
    minor: matches.filter((m) => m.severity === "minor").length,
  };
}
