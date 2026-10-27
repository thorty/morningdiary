# Feature Workflow with Matt Pocock Skills

This guide describes the main flow for changes to Morningcoach. The skills support the process; they do not replace maintainer decisions or repository conventions.

## Main Flow: From Idea to Implementation

### 1. Understand the repository context

Before making a change:

- Read `GLOSSARY.md` and the ADRs in `docs/adr/` relevant to the task.
- Explore the current code and existing tests before deciding on a solution.
- Use the terms defined in `GLOSSARY.md`. `docs/agents/domain.md` explains how to use the domain documents.

### 2. Refine the idea — `/grill-with-docs`

For new features or larger changes, start with `/grill-with-docs`. The skill works through open product and design questions and records resolved terminology and decisions in the domain documents.

For a specific behavior or UI question, use `/prototype` to explore a concrete option before writing the spec. For efforts with more open decisions than can be resolved in one session, start with `/wayfinder` to create a map and decision tickets. The local map and ticket format is described in `docs/agents/issue-tracker.md`.

### 3. Turn the agreed discussion into a spec — `/to-spec`

`/to-spec` synthesizes the discussion so far; it does not replace resolving open questions. The skill checks the codebase context, proposes test seams, and asks you to confirm them.

Create the spec at `.scratch/<feature-slug>/spec.md`. It describes the problem, solution, user stories, implementation and testing decisions, and out-of-scope items. Set its status to `ready-for-agent` when it is ready to be broken down into tickets.

### 4. Break the spec into actionable tickets — `/to-tickets`

`/to-tickets` breaks the agreed spec into small, complete, independently verifiable implementation slices. Review and approve the granularity and dependencies before publishing the tickets.

For the local Markdown tracker:

- Create one file per ticket under `.scratch/<feature-slug>/issues/`, starting with `01-`.
- Record dependencies with `Blocked by`; keep tickets independent when they have no actual prerequisites.
- Use the repository's status conventions from `docs/agents/triage-labels.md`.
- See `docs/agents/issue-tracker.md` for the full file format and other tracker conventions.

### 5. Implement tickets one at a time — `/implement`

Pass a ticket's file path to the skill, for example `/implement .scratch/<feature-slug>/issues/01-<slug>.md`. This gives the skill a specific task and its acceptance criteria. Work in dependency order: start only on tickets whose blockers are complete.

The skill implements the ticket in small vertical slices, uses `/tdd` where appropriate, runs relevant tests and type checks, and reviews the change with `/code-review`. It then commits the work on the current branch. Commits are explicitly expected in this project. Before invoking the skill, confirm that the correct branch is active and that unrelated changes will not be included in the commit.

### 6. Review the change — `/code-review`

If the change was not reviewed as part of `/implement`, or additional changes were made afterward, run `/code-review` against an explicitly chosen comparison point, typically the base branch. The review assesses repository standards and spec compliance separately. Resolve any findings before considering the change complete.

## Supporting workflows

- **Bug or unexpected behavior:** Use `/diagnosing-bugs` to establish the cause and reproduce the issue; create a spec and tickets afterward if the work is substantial.
- **Backlog review:** Use `/triage`. The five status roles are mapped to the repository's labels in `docs/agents/triage-labels.md`.
- **Architecture or domain terminology:** Use `/domain-modeling` and record significant architecture decisions in `docs/adr/`.
- **Small, well-scoped change:** Do not force the full workflow. Check the context and scope, implement the change directly, and run appropriate tests.

## Storage and visibility

Specs, implementation tickets, and Wayfinder artifacts belong under `.scratch/`. Whether these files are shared through Git depends on whether `.scratch/` is ignored in the current repository state. Before leaving or switching branches, check that important local tracker artifacts are versioned or otherwise backed up.

The skills may be installed per user. This guide documents the workflow but does not install or update skills. Ensure that other contributors have the skills available and use a compatible version.
