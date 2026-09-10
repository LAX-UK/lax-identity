import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const workflow = readFileSync(
  resolve(import.meta.dirname, "../../.github/workflows/publish.yml"),
  "utf8",
);

function assertOrdered(markers) {
  let previous = -1;
  for (const marker of markers) {
    const current = workflow.indexOf(marker);
    assert.notEqual(current, -1, `missing ${marker}`);
    assert.ok(current > previous, `${marker} is out of order`);
    previous = current;
  }
}

test("publish builds once, qualifies the exact digest, and never mutates the rolling tag", () => {
  assert.match(workflow, /^name: Publish Identity image$/m);
  assert.match(workflow, /workflow_run:[\s\S]*workflows: \[CI\][\s\S]*branches: \[main\]/);
  assert.match(workflow, /tags: \$\{\{ env\.IMAGE_REPOSITORY \}\}:\$\{\{ env\.SHA \}\}/);
  assert.doesNotMatch(workflow, /IMAGE_REPOSITORY \}\}:test/);
  assert.match(workflow, /no-cache-filters: runner/);
  assert.match(
    workflow,
    /image-ref: \$\{\{ env\.IMAGE_REPOSITORY \}\}@\$\{\{ steps\.image\.outputs\.digest \}\}/,
  );
  assert.match(workflow, /identity-\$\{\{ env\.SHA \}\}\.trivy\.sarif/);
  assert.match(workflow, /exit-code: "1"/);
  assert.match(workflow, /identity-\$\{\{ env\.SHA \}\}\.spdx\.json/);
  assert.match(workflow, /sentryRelease: \$sentry_release/);
  assert.match(workflow, /release: \$\{\{ env\.SHA \}\}/);
  assert.match(workflow, /ignore_missing: true/);
  assert.match(workflow, /fetch-depth: 0/);
  assert.match(workflow, /client_payload\[publish_run_id\]/);
  assertOrdered([
    "Build and publish the immutable candidate digest",
    "Scan the published digest before promotion",
    "Generate SBOM for the published digest",
    "Create Auth Sentry release and upload source maps",
    "Retain qualified digest, vulnerability, SBOM, and Sentry evidence",
    "Dispatch the immutable candidate to monorepo",
  ]);
});
