# Staging release

1. CI verifies the pinned schema image, all unit and database integration tests,
   production dependencies, Docker readiness, secrets, vulnerabilities, and
   SBOM.
2. A successful main build publishes `lax-test-identity:<commit>` and moves
   `:test` to that exact digest.
3. The same workflow creates the Auth Sentry release and sends only repository,
   commit, and image digest to the monorepo deployment receiver.
4. The monorepo validates migration ancestry and journal compatibility. Its
   PRE_DEPLOY job runs migrations, role grants, and OIDC client provisioning
   before App Platform admits `/health/ready`.

Identity must never deploy App Platform directly. Roll back first to the
previous standalone digest; if necessary, restore the recorded monorepo
`lax-test-auth` image and reviewed Terraform state without schema changes.
