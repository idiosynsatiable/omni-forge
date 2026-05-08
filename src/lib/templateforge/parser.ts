export interface ParsedFile {
  path: string;
  content: string;
  lines: string[];
  lineCount: number;
  fileType: string;
  size: number;
}

export interface ParsedArtifact {
  files: ParsedFile[];
  totalFiles: number;
  totalLines: number;
  totalSize: number;
  fileTypes: Record<string, number>;
}

export function detectFileType(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() || "";
  const typeMap: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript-react",
    js: "javascript",
    jsx: "javascript-react",
    json: "json",
    md: "markdown",
    yml: "yaml",
    yaml: "yaml",
    css: "css",
    html: "html",
    prisma: "prisma",
    sql: "sql",
    env: "env",
    dockerfile: "dockerfile",
  };
  if (path.toLowerCase().includes("dockerfile")) return "dockerfile";
  if (path.toLowerCase().includes(".env")) return "env";
  return typeMap[ext] || "unknown";
}

export function parseFile(path: string, content: string): ParsedFile {
  const lines = content.split("\n");
  return {
    path,
    content,
    lines,
    lineCount: lines.length,
    fileType: detectFileType(path),
    size: Buffer.byteLength(content, "utf-8"),
  };
}

export function parseArtifact(
  files: Array<{ path: string; content: string }>
): ParsedArtifact {
  const parsed = files.map((f) => parseFile(f.path, f.content));
  const fileTypes: Record<string, number> = {};

  for (const f of parsed) {
    fileTypes[f.fileType] = (fileTypes[f.fileType] || 0) + 1;
  }

  return {
    files: parsed,
    totalFiles: parsed.length,
    totalLines: parsed.reduce((sum, f) => sum + f.lineCount, 0),
    totalSize: parsed.reduce((sum, f) => sum + f.size, 0),
    fileTypes,
  };
}
