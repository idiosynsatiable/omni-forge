export interface ReadinessCheck {
  name: string;
  passed: boolean;
  detail: string;
}

export interface DeployReadinessResult {
  score: number;
  status: string;
  checks: ReadinessCheck[];
  missingItems: string[];
  ready: boolean;
}

export function checkDeployReadiness(
  files: Array<{ path: string; content: string }>,
  app: {
    slug: string;
    revenueMode: string;
    artifactIntegrityScore: number;
  }
): DeployReadinessResult {
  const fileNames = files.map((f) => {
    const parts = f.path.split("/");
    return parts[parts.length - 1];
  });

  const allContent = files.map((f) => f.content).join("\n");

  const checks: ReadinessCheck[] = [
    {
      name: "has_package_json",
      passed: fileNames.includes("package.json"),
      detail: "package.json present",
    },
    {
      name: "has_build_script",
      passed: allContent.includes('"build"') || allContent.includes('"start"'),
      detail: "Build or start script defined",
    },
    {
      name: "has_start_script",
      passed: allContent.includes('"start"') || allContent.includes("tsx server"),
      detail: "Start script or tsx command present",
    },
    {
      name: "has_env_example",
      passed: fileNames.includes(".env.example"),
      detail: ".env.example file present",
    },
    {
      name: "has_readme",
      passed: fileNames.includes("README.md"),
      detail: "README.md present",
    },
    {
      name: "has_dockerfile",
      passed: fileNames.includes("Dockerfile"),
      detail: "Dockerfile present",
    },
    {
      name: "has_billing_config",
      passed:
        app.revenueMode === "free" ||
        allContent.includes("STRIPE") ||
        allContent.includes("billing") ||
        allContent.includes("revenueMode"),
      detail: "Billing configuration present",
    },
    {
      name: "has_health_endpoint",
      passed: allContent.includes("/health"),
      detail: "Health endpoint defined",
    },
    {
      name: "no_placeholder_strings",
      passed: !allContent.match(/your_key_here|change_me|insert here|replace me/i),
      detail: "No placeholder strings found",
    },
    {
      name: "no_hardcoded_secrets",
      passed: !allContent.match(/sk_live_|sk_test_|pk_live_|pk_test_/),
      detail: "No hardcoded API secrets found",
    },
  ];

  const passed = checks.filter((c) => c.passed).length;
  const total = checks.length;
  const score = Math.round((passed / total) * 100);
  const missingItems = checks
    .filter((c) => !c.passed)
    .map((c) => c.name);

  let status: string;
  if (score === 100) status = "ready";
  else if (score >= 80) status = "config_generated";
  else if (score >= 50) status = "blocked";
  else status = "not_configured";

  return {
    score,
    status,
    checks,
    missingItems,
    ready: score === 100,
  };
}
