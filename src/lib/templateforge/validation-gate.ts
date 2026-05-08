import { parseArtifact } from "./parser";
import { compileSchema, validateAgainstSchema } from "./schema-compiler";
import { scanForPlaceholders, countBySeverity } from "./placeholder-scanner";
import { scanForWeakLanguage } from "./weak-language-scanner";
import { calculateArtifactScore, type ArtifactScoreResult } from "./artifact-score";

export interface ValidationReport {
  appSlug: string;
  artifactScore: ArtifactScoreResult;
  placeholderIssues: number;
  weakLanguageIssues: number;
  schemaMissing: string[];
  schemaExtra: string[];
  totalFiles: number;
  totalLines: number;
  totalSize: number;
  fileTypes: Record<string, number>;
  passed: boolean;
  issues: Array<{
    severity: string;
    category: string;
    message: string;
    file: string;
    line: number;
    matchedText: string;
    suggestedFix: string;
  }>;
}

export function runValidationGate(
  appMeta: {
    name: string;
    slug: string;
    description: string;
    category: string;
    revenueMode: string;
    priceMonthly: number;
  },
  files: Array<{ path: string; content: string }>
): ValidationReport {
  const artifact = parseArtifact(files);
  const schema = compileSchema(appMeta);
  const schemaResult = validateAgainstSchema(schema, files);
  const placeholderMatches = scanForPlaceholders(files);
  const weakMatches = scanForWeakLanguage(files);
  const artifactScore = calculateArtifactScore(
    placeholderMatches,
    weakMatches,
    schemaResult.missing
  );

  const issues: ValidationReport["issues"] = [];

  for (const match of placeholderMatches) {
    issues.push({
      severity: match.severity,
      category: "placeholder",
      message: `Blocked phrase "${match.phrase}" found`,
      file: match.file,
      line: match.line,
      matchedText: match.context,
      suggestedFix: `Remove or replace "${match.phrase}" with production content`,
    });
  }

  for (const match of weakMatches) {
    issues.push({
      severity: match.severity,
      category: "weak-language",
      message: `Weak language "${match.phrase}" found in comment`,
      file: match.file,
      line: match.line,
      matchedText: match.context,
      suggestedFix: `Replace with definitive language or remove the comment`,
    });
  }

  for (const missing of schemaResult.missing) {
    issues.push({
      severity: "critical",
      category: "schema",
      message: `Required file "${missing}" is missing`,
      file: "",
      line: 0,
      matchedText: "",
      suggestedFix: `Generate the required "${missing}" file`,
    });
  }

  const placeholderCounts = countBySeverity(placeholderMatches);

  return {
    appSlug: appMeta.slug,
    artifactScore,
    placeholderIssues: placeholderMatches.length,
    weakLanguageIssues: weakMatches.length,
    schemaMissing: schemaResult.missing,
    schemaExtra: schemaResult.extra,
    totalFiles: artifact.totalFiles,
    totalLines: artifact.totalLines,
    totalSize: artifact.totalSize,
    fileTypes: artifact.fileTypes,
    passed: artifactScore.score >= 70 && placeholderCounts.critical === 0,
    issues,
  };
}
