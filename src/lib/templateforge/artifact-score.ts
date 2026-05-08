import { type PlaceholderMatch } from "./placeholder-scanner";
import { type WeakLanguageMatch } from "./weak-language-scanner";

export interface ArtifactScoreResult {
  score: number;
  label: string;
  criticalIssues: number;
  majorIssues: number;
  minorIssues: number;
  breakdown: {
    placeholderDeductions: number;
    weakLanguageDeductions: number;
    schemaDeductions: number;
  };
  shipReady: boolean;
}

export function getScoreLabel(score: number): string {
  if (score >= 95) return "Ship-ready";
  if (score >= 85) return "Strong";
  if (score >= 70) return "Usable but incomplete";
  if (score >= 50) return "Risky";
  return "Rejected";
}

export function calculateArtifactScore(
  placeholderMatches: PlaceholderMatch[],
  weakLanguageMatches: WeakLanguageMatch[],
  schemaMissing: string[]
): ArtifactScoreResult {
  const criticalFromPlaceholders = placeholderMatches.filter(
    (m) => m.severity === "critical"
  ).length;
  const majorFromPlaceholders = placeholderMatches.filter(
    (m) => m.severity === "major"
  ).length;
  const minorFromPlaceholders = placeholderMatches.filter(
    (m) => m.severity === "minor"
  ).length;

  const majorFromWeak = weakLanguageMatches.filter(
    (m) => m.severity === "major"
  ).length;
  const minorFromWeak = weakLanguageMatches.filter(
    (m) => m.severity === "minor"
  ).length;

  const criticalFromSchema = schemaMissing.length;

  const criticalIssues = criticalFromPlaceholders + criticalFromSchema;
  const majorIssues = majorFromPlaceholders + majorFromWeak;
  const minorIssues = minorFromPlaceholders + minorFromWeak;

  const placeholderDeductions =
    criticalFromPlaceholders * 20 +
    majorFromPlaceholders * 10 +
    minorFromPlaceholders * 3;

  const weakLanguageDeductions = majorFromWeak * 10 + minorFromWeak * 3;

  const schemaDeductions = criticalFromSchema * 20;

  const rawScore =
    100 - placeholderDeductions - weakLanguageDeductions - schemaDeductions;
  const score = Math.max(0, Math.min(100, rawScore));
  const label = getScoreLabel(score);

  return {
    score,
    label,
    criticalIssues,
    majorIssues,
    minorIssues,
    breakdown: {
      placeholderDeductions,
      weakLanguageDeductions,
      schemaDeductions,
    },
    shipReady: score >= 95,
  };
}
