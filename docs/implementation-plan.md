# Implementation Plan

## Goal

Build a small NestJS service that can:

- create promotion rules
- list promotion rules
- deactivate promotion rules
- evaluate a request context and return the single winning promotion

The plan was to keep the solution small, deterministic, and easy to follow, without adding features outside the assignment scope.

## Scope

Included:

- `POST /promotions`
- `GET /promotions`
- `PATCH /promotions/:id/deactivate`
- `POST /promotions/evaluate`
- file-backed persistence through a repository abstraction
- unit tests
- markdown documentation

Explicitly left out:

- update endpoints
- delete endpoints
- authentication
- Swagger or OpenAPI
- e2e tests
- pagination and filtering
- database setup beyond the JSON file repository

## Assumptions From the Brief

The following assumptions were used during implementation:

- this is an internal v1 service, so the focus is correctness and clarity rather than scalability
- optional rule fields mean no restriction when they are not set
- `validFrom` and `validTo` should be treated as inclusive bounds
- promotion creation is append-only for this exercise, with deactivation used instead of general editing
- a JSON file repository is acceptable as long as the persistence logic is kept behind a repository layer

## Architecture Overview

The implementation was planned around a simple NestJS split:

- controller: HTTP concerns only
- service: business rules and evaluation logic
- repository: persistence only

Planned file layout:

```text
src/
  promotions/
    dto/
    models/
    promotions.controller.ts
    promotions.service.ts
    promotions.repository.ts
    promotions.module.ts
```

This structure keeps the assignment readable and avoids mixing responsibilities.

## Planned Delivery Order

The work was planned in this order:

1. define the domain model and DTOs
2. implement the repository abstraction and file-backed repository
3. implement create, list, and deactivate flows
4. implement promotion evaluation and tie-breaking
5. add unit tests
6. add markdown documentation

This order keeps the business logic grounded in the domain model first, then layers the rest of the application on top.

## Converted Technical Requirements

The brief was turned into the following implementation rules:

- `POST /promotions` creates a rule and assigns `id`, `active`, and `createdAt`
- `GET /promotions` returns all stored rules
- `PATCH /promotions/:id/deactivate` marks a rule inactive
- `POST /promotions/evaluate` returns one winning rule or `null`
- validation should cover required fields, basic numeric constraints, allowed promotion types, and valid date range ordering
- the promotion selection logic should be explicit in code rather than hidden behind a generic rule engine

The service uses one focused module with three clear responsibilities:

- controller methods receive requests and forward them to the service
- the service owns creation, deactivation, matching, and tie-breaking
- the repository reads and writes `data/promotions.json`

This was chosen because it is enough structure for maintainability without adding unnecessary abstraction.

## Persistence Choice and Justification

Persistence was planned as a JSON-backed repository with an in-memory cache.

Reasoning:

- it matches the assignment brief
- it avoids database setup time
- it still demonstrates separation of concerns
- it keeps service tests simple because business logic can be tested with a mocked repository

Known tradeoffs:

- not safe for concurrent writers
- not intended for production-scale usage
- simple file persistence means limited recovery and auditability

## Evaluation Plan

The core evaluation logic was planned as explicit step-by-step code.

A rule matches when:

- it is active
- `currentDate` is within `validFrom` and `validTo`, inclusive
- if `customerGroup` is set on the rule, it must match
- if `country` is set on the rule, it must match
- if `minimumCartAmount` is set on the rule, `cartAmount` must be greater than or equal to it

When multiple rules match, the winner is selected in this order:

1. higher `priority`
2. if both rules define `minimumCartAmount`, higher `minimumCartAmount`
3. more specific rule, based on the number of defined optional conditions
4. latest `createdAt`

The goal here was to keep the selection logic deterministic and readable.

## Validation Plan

Validation was planned to stay basic and practical:

- required fields for promotion creation
- enum validation for `promotionType`
- positive numeric validation where needed
- `validFrom <= validTo`
- numeric transformation for request payloads handled through Nest validation tooling

The intent was to catch obvious input mistakes without adding a heavy custom validation layer.

## Testing Approach

Unit tests were planned to focus on the parts of the system that carry behavior:

- service tests for matching, exclusion rules, tie-breaking, and deactivation
- controller tests for delegation and error propagation
- repository tests for read/write behavior

The test plan includes both positive and negative cases.

Examples:

- inactive and expired rules should not match
- mismatched optional conditions should not match
- higher priority should win
- later tie-breakers should only apply when earlier ones tie
- deactivating a missing rule should fail
- repository behavior should be tested without touching the real file system

What was intentionally not planned:

- e2e tests
- large integration-style test setup

## Tradeoffs and Known Limitations

- JSON file persistence is simple but not safe for concurrent writers
- the service is optimized for clarity, not for scale or operational robustness
- there is no edit or delete flow beyond deactivation
- there is no authentication because the exercise describes an internal service
- controller and repository tests stay lightweight and do not try to replace e2e coverage
- date handling depends on ISO-compatible input and JavaScript date parsing

## Major Iteration Decisions

Several implementation decisions were made to keep the solution aligned with the brief:

- start with the domain model and DTOs before adding behavior
- keep the controller thin and put all selection/evaluation logic in the service
- use a repository abstraction even though persistence is only a JSON file
- keep the winner selection/evaluation logic explicit rather than introducing a reusable rule engine
- add seeded data so the service can be exercised immediately
- extend unit test coverage beyond the service once the core logic was stable
- keep API documentation in markdown rather than adding Swagger

## Examples Where the Agent Was Corrected

- The first DTO strictness fix used definite assignment markers (!). That was replaced with `declare` because it is a cleaner fit for Nest DTO classes under strict TypeScript settings.
- The initial repository setup created the data file lazily only on first write. A seeded `data/promotions.json` file was added so the application starts from a visible and testable state.
- The unit test suite initially covered only the service. It was later extended with controller and repository tests, plus negative cases, to better cover the expected behavior.
- Repository tests originally used real file system access. They were updated to mock `fs.promises` so the tests stay isolated.
- Test names were standardized to start with `should` to keep the suite consistent.

## What the Agent Got Wrong Initially and How Scope Was Restored

The main issues were not large architectural mistakes, but smaller decisions that needed correction:

- the first DTO compile fix solved the error but did not reflect the cleanest approach
- the initial test coverage was too narrow
- the repository tests were not fully isolated at first
- some documentation drifted either too formal or too focused on the AI process instead of the assignment output

Scope was restored by checking each change against the original brief:

- if it improved clarity, determinism, or maintainability for the requested service, it stayed
- if it looked like generic framework output or extra scope, it was removed or rewritten

## Documentation Plan

The documentation was planned to cover three areas:

- `README.md` for setup, run steps, tests, project structure, and API usage
- `AGENTS.md` for AI-assistance notes and implementation workflow notes
- `docs/implementation-plan.md` for the planned approach, architecture, assumptions, and tradeoffs

API documentation was kept in markdown rather than Swagger to stay within scope.

## Main Tradeoffs

The main tradeoffs in the plan were:

- choose explicit and readable code over generic extensibility
- choose a file-backed repository over a real database
- choose unit tests over broader test layers
- choose narrow scope over additional convenience features

This keeps the result appropriate for the assignment rather than turning it into a larger platform design.
