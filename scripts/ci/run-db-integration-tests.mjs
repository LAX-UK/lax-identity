#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required; database integration tests may not skip.");
  process.exit(1);
}

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const appRoot = join(root, "apps/auth");

function integrationFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return integrationFiles(path);
    return entry.name.endsWith(".integration.test.ts") ? [relative(appRoot, path)] : [];
  });
}

const files = integrationFiles(join(appRoot, "src")).sort();
if (files.length === 0) {
  console.error("No database integration test files were found.");
  process.exit(1);
}

const outputDirectory = mkdtempSync(join(tmpdir(), "identity-db-tests-"));
const reportPath = join(outputDirectory, "vitest.json");
try {
  const result = spawnSync(
    process.platform === "win32" ? "pnpm.cmd" : "pnpm",
    [
      "--filter",
      "@auction/auth-app",
      "exec",
      "vitest",
      "run",
      ...files,
      "--reporter=json",
      `--outputFile=${reportPath}`,
    ],
    {
      cwd: root,
      env: { ...process.env, CI: "true" },
      encoding: "utf8",
    },
  );
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  let report;
  try {
    report = JSON.parse(readFileSync(reportPath, "utf8"));
  } catch {
    console.error("Vitest did not produce a readable JSON report.");
    process.exit(1);
  }

  const skipped = (report.numPendingTests ?? 0) + (report.numTodoTests ?? 0);
  if (
    result.status !== 0 ||
    (report.numTotalTests ?? 0) === 0 ||
    skipped !== 0 ||
    report.numPassedTests !== report.numTotalTests
  ) {
    console.error(
      `DB integration gate failed: total=${report.numTotalTests ?? 0}, passed=${report.numPassedTests ?? 0}, failed=${report.numFailedTests ?? 0}, skipped=${skipped}.`,
    );
    process.exit(1);
  }
  console.log(
    `DB integration gate: ok (${files.length} files, ${report.numPassedTests} tests, none skipped)`,
  );
} finally {
  rmSync(outputDirectory, { recursive: true, force: true });
}
