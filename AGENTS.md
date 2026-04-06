# AGENTS.md

This repository was implemented with AI assistance, but the brief stayed as the main source of truth throughout the work.

## Working Style

The agent was used as a coding assistant, not as the final authority on product or architecture decisions. Each implementation step was checked against the brief to keep the solution on scope.

The working instructions during implementation were basically:

- keep the solution inside the 4-hour take-home scope
- do not add endpoints outside create, list, deactivate, and evaluate
- keep NestJS layers clean: controller, service, repository
- use file-backed persistence behind an abstraction
- prefer explicit evaluation logic over generic rule-engine abstractions
- focus unit tests on service logic first, then add lightweight controller and repository coverage
- avoid extra NestJS abstractions, such as custom parameter decorators, unless they remove clear duplication
- use markdown documentation only

## Codex Prompt Notes

The working prompt used with Codex was kept close to the assignment and updated as the implementation evolved.

Core prompt directions:

- build a small NestJS backend for promotion management and evaluation
- keep the solution simple, deterministic, and maintainable
- use controller, service, and repository separation
- keep persistence file-backed through a repository abstraction
- do not add update, delete, auth, Swagger, pagination, filtering, background jobs, or e2e tests
- focus unit tests on evaluation logic and deactivation behavior

Prompt updates requested during implementation:

- create a seeded `data/promotions.json` file so the application starts with testable data
- improve the unit test suite with negative cases
- standardize unit test names so they start with `should`
- add unit tests for controller and repository layers as well
- move shared promotion test data creation into a factory
- mock all repository file reads and writes in unit tests
- clean up documentation wording, typos, and formatting where needed
- add a repository-level `findOne` lookup instead of fetching the full list and calling `.find()` in the service
- add a repository-level `updateOne` write instead of rewriting the full list in the service for single-promotion changes
- remove non-null assertion operators from variables in the implementation

## AI Usage Notes

The AI agent was mainly used to speed up file creation, boilerplate setup, refactoring, and test expansion. It helped move the implementation faster, but it still needed review and correction to keep the solution aligned with the brief.

In practice, the workflow was:

- use the agent to draft the initial NestJS structure and implementation files
- review each layer against the brief
- push back on anything that felt too broad, too generic, or off-scope
- revise wording, structure, and tests after seeing the first pass in code
- use the agent to clean up typos, simplify awkward phrasing, and improve documentation formatting

The main rule during implementation was simple: the brief stayed in charge, not the generated output.

## Areas Where Extra Review Was Applied

- DTO validation and TypeScript strictness
- tie-breaking determinism
- negative-path test coverage around mismatches and failed deactivation
- negative-path test coverage in controller and repository tests as well
- keeping test data setup consistent through shared test factories
- keeping unit tests isolated by mocking file system reads and writes
- repository responsibilities versus service responsibilities
- scope control when the assistant started drifting toward common framework defaults or convenience features

## Examples of Direction Changes

- The DTO strict initialization issue was initially handled with definite assignment markers. That was later replaced with `declare`, which is a better fit for how Nest DTO classes are used with strict TypeScript settings.
- A seeded `data/promotions.json` file was added after the initial pass so the repository starts from a usable state before the first write.
- The test suite was extended beyond the positive path to cover mismatch cases, future-dated rules, missing promotions, and no-op deactivation behavior.
- Additional unit tests were added for the controller and file-backed repository, and the shared `buildPromotion` helper was moved into a test factory so fixtures stay consistent across suites.
- Negative cases were also added to the controller and repository tests so the suite covers error propagation and invalid persisted data, not just successful flows.
- Test names were standardized to start with `should` for consistency across the unit test suite.
- Repository unit tests were updated to mock all file reads and writes through `fs.promises` so the tests stay fully isolated from the real file system.
- The deactivation flow was corrected to use a repository-level `findOne` lookup instead of loading the full list and calling `.find()` in the service.
- The deactivation write path was corrected to use a repository-level `updateOne` operation instead of rebuilding the full list in the service and calling `saveAll`.
- The evaluation tie-breaker was corrected to avoid non-null assertion operators on `minimumCartAmount` and use explicit narrowing instead.
- A custom NestJS parameter decorator was considered for promotion inputs, but it was intentionally not added because the controllers already use simple DTO bodies and there was no repeated request-mapping logic to justify it.
- The implementation was intentionally kept away from edit/delete endpoints, Swagger, and e2e testing even though those are common defaults in NestJS projects.

## Documentation Intent

The main implementation notes are in `docs/implementation-plan.md`. That document captures the assumptions, architecture, persistence choice, testing approach, tradeoffs, and iteration decisions. This file captures the AI-assisted workflow and the main implementation guidance used during the work.
