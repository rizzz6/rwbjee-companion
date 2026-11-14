# rwbjee-companion Agent Guide

- Surface: web-fullstack
- Verify: vgate
- Verify (manual): npm run lint && npx tsc --noEmit
- Release: Run the production build and typecheck before merging.
- Architecture: ARCHITECTURE.md (stack map + invariants; keep it current)
- Version: package.json ("version"); bump it, then tag vX.Y.Z

## Conventions
- Keep diffs minimal; run the verify command before reporting work as done.
- Update this file when the stack or verification command changes.