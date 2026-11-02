# 07: Set the coverage threshold from the first measurement

**What to build:** Once the initial CI coverage baseline has been measured, coverage checks enforce a threshold slightly below that baseline so coverage cannot silently fall.

**Blocked by:** 02: Add the core pull-request CI checks.

**Status:** ready-for-agent

- [ ] The initial successful coverage measurement is used as the baseline.
- [ ] A threshold is set slightly below the measured coverage.
- [ ] Coverage below the threshold fails the relevant check; coverage at or above it passes.
