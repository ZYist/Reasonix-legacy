---
phase: 09-ci-and-flaky-visibility
status: discussed
mode: auto
---
# Phase 9 Context

- CI targets pushes and pull requests for active `dev` plus `main`, on Ubuntu and Windows with Node 22.
- Each matrix job runs install, lint, typecheck, build, and the complete coverage suite.
- Tests run once without retry. Only a failed first attempt is rerun with the documented single retry; the job summary must label the outcome and the final process must fail if the retry fails.
- No slow-test exclusions are introduced; tokenizer/jobs/process-spawn tests remain in the default suite.
- Branch protection is documented as a manual GitHub repository setting and is not changed automatically.
