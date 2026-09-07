# Contributing

Use Node 22 and pnpm 10.34.5. Keep the isolated pnpm linker and
`auto-install-peers=false`.

```sh
corepack enable
corepack prepare pnpm@10.34.5 --activate
pnpm install --frozen-lockfile
pnpm ci:verify
```

Database integration tests require PostgreSQL initialized by the immutable
migration image in `schema-contract.json`; Redis must also be available:

```sh
DATABASE_URL=postgres://... REDIS_URL=redis://... pnpm test:redis
DATABASE_URL=postgres://... pnpm test:integration
```

Keep changes inside the six-package Identity closure. Identity does not own the
shared migration journal, application-role grants, product projectors, OIDC
client provisioning, or App Platform deployment orchestration. Update
`schema-contract.json` only with coordinated monorepo migration evidence.

Never commit secrets. Run Gitleaks on the working tree and full history before
source transfer. Pull requests require CODEOWNER review and all CI gates.
