# Identity architecture boundary

This repository owns the issuer runtime closure:

- `apps/auth`
- `packages/auth`
- `packages/identity-contracts`
- `packages/identity-db`
- `packages/observability`
- `packages/config-ts`

The monorepo remains authoritative for the shared database migration journal,
application-role grants, OIDC client provisioning, product projectors, and the
serialized staging deployment receiver. Identity consumes the immutable
migration artifact pinned by `schema-contract.json`; it never runs an
independent migration journal.

Source authority transfers only after standalone CI, staging acceptance,
measured soak, and both rollback rehearsals pass. Production remains on the
monorepo fallback during this phase.
