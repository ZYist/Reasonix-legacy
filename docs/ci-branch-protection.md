# CI branch protection

The repository CI workflow runs the full Node 22 matrix on Ubuntu and Windows for pushes and pull requests targeting `dev` or `main`.

GitHub branch protection is an external repository setting and must be configured manually in the `ZYist/Reasonix-legacy` fork. Require both matrix checks for `dev` before merge. Do not configure or modify protection in the upstream repository.

The test step always runs the complete Vitest coverage suite, including tokenizer, job/process, and other slow tests. It first runs with retries disabled. A failure triggers one diagnostic rerun with the repository's documented single-retry policy. The GitHub job summary distinguishes a clean first pass, a retry pass, and a persistent failure; a failed retry preserves a non-zero job exit.
