# CI branch protection

The maintained CI contract is Windows-only. `.github/workflows/ci.yml` runs on `windows-latest` with Node.js `24.15.0`, npm `11.16.0`, and PowerShell for pushes and pull requests targeting the real maintained branches: `v1` (default/release) and `dev` (development).

GitHub branch protection is an external repository setting and must be configured manually in the `ZYist/reasonix-legacy` fork. The repository should treat `v1` as the default protected branch and `dev` as the integration branch. Require the Windows CI workflow and the CodeQL workflow on whichever branch the maintainer chooses to protect; do not claim that protection is enabled until the maintainer has actually configured and verified it.

The CI job keeps the release-hardening gates visible: `npm ci`, `node scripts/check-docs.mjs`, `npm run lint`, `npm run typecheck`, `npm run build`, the full Vitest suite via `node scripts/ci-test-with-retry.mjs`, the coverage summary, and the τ-bench dry-run. A failure still permits one diagnostic retry in the test wrapper, and a persistent retry failure preserves a non-zero job exit.
