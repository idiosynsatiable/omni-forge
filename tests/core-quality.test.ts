import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateArtifactScore,
  getScoreLabel,
} from "../src/lib/templateforge/artifact-score";
import {
  countBySeverity,
  scanForPlaceholders,
} from "../src/lib/templateforge/placeholder-scanner";
import { checkDeployReadiness } from "../src/lib/deployment/deploy-readiness";
import { recommendPricing } from "../src/lib/revenue/pricing-engine";
import { toSlug } from "../src/lib/validators";

test("toSlug returns a bounded, URL-safe identifier", () => {
  assert.equal(toSlug("  E11EVEN PRIME: Build & Verify  "), "e11even-prime-build-verify");
  assert.equal(toSlug("A".repeat(80)).length, 60);
});

test("placeholder scanning reports real release blockers by severity", () => {
  const matches = scanForPlaceholders([
    { path: "src/worker.ts", content: "// TODO connect the production queue\nconst key = \"change_me\";" },
    { path: "tests/worker.test.ts", content: "const mock = createFixture();" },
  ]);

  assert.deepEqual(
    matches.map(({ phrase, file, line }) => ({ phrase, file, line })),
    [
      { phrase: "TODO", file: "src/worker.ts", line: 1 },
      { phrase: "change_me", file: "src/worker.ts", line: 2 },
    ],
  );
  assert.deepEqual(countBySeverity(matches), { critical: 1, major: 1, minor: 0 });
});

test("artifact scoring cannot mark a known placeholder ship-ready", () => {
  const placeholders = scanForPlaceholders([
    { path: "src/config.ts", content: "export const apiKey = \"your_key_here\";" },
  ]);
  const result = calculateArtifactScore(placeholders, [], []);

  assert.equal(result.score, 90);
  assert.equal(result.criticalIssues, 0);
  assert.equal(result.majorIssues, 1);
  assert.equal(result.shipReady, false);
  assert.equal(getScoreLabel(result.score), "Strong");
});

test("deployment readiness fails closed when required evidence is missing", () => {
  const result = checkDeployReadiness(
    [{ path: "README.md", content: "# Candidate" }],
    { slug: "candidate", revenueMode: "subscription", artifactIntegrityScore: 100 },
  );

  assert.equal(result.ready, false);
  assert.ok(result.missingItems.includes("has_package_json"));
  assert.ok(result.missingItems.includes("has_billing_config"));
  assert.ok(result.score < 50);
});

test("pricing recommendation is deterministic for a known category", () => {
  const recommendation = recommendPricing({
    category: "automation-tool",
    revenueMode: "subscription",
    priceMonthly: 5,
    description: "Automates a repeatable operations workflow.",
  });

  assert.equal(recommendation.recommendedPrice, 49);
  assert.equal(recommendation.confidence, 0.75);
  assert.deepEqual(
    recommendation.tiers.map(({ name, price }) => ({ name, price })),
    [
      { name: "Free", price: 0 },
      { name: "Pro", price: 49 },
      { name: "Agency", price: 147 },
      { name: "Enterprise", price: 490 },
    ],
  );
});
