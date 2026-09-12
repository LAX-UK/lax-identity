# Staging release

1. CI verifies the pinned schema image, all unit and database integration tests,
   production dependencies, Docker readiness, secrets, vulnerabilities, and
   SBOM.
2. A successful main build publishes the immutable tag
   `lax-test-identity:<commit>` plus release evidence. Publish does **not**
   move live traffic; it only records the qualified digest.
3. The publish workflow creates the Auth Sentry release and sends repository,
   commit, and image digest to the monorepo deployment receiver.
4. The monorepo runs read-only qualification first. Approved cutover then runs
   migrations, role grants, OIDC client provisioning, registry alias promotion,
   and App Platform deployment through the serialized release path.
5. Before the first production-traffic cutover, run the monorepo auth at-rest
   maintenance workflow against the staging auth database when inventory reports
   pending legacy rows.

`stage_only` qualification performs no database writes and does not retag
`:test`. Terraform pins Identity, Shop Identity, and Shop to immutable SHA
tags; rolling aliases remain informational only.

Identity must never deploy App Platform directly. Roll back by restoring the
accepted immutable manifest artifact captured by the monorepo staging-recovery
workflow, applying its per-component SHA tags through reviewed Terraform, and
verifying `/health/ready` plus acceptance smoke tests. Never treat a
registry-only retag as rollback.
