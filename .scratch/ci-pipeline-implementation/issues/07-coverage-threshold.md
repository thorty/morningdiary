# 07: Set the coverage threshold from the first measurement

**What to build:** Once the initial CI coverage baseline has been measured, coverage checks enforce a threshold slightly below that baseline so coverage cannot silently fall.

**Blocked by:** 02: Add the core pull-request CI checks.

**Status:** completed

- [x] The initial successful coverage measurement is used as the baseline (backend 90%, frontend 89.15%).
- [x] A threshold is set slightly below the measured coverage (85% for each service).
- [x] Coverage below the threshold fails the relevant check; coverage at or above it passes.
