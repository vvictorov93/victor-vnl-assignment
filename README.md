# Promotion Rules Service

This repository contains a small NestJS service for managing promotion rules and deciding which single promotion should apply for a given request context.

The implementation stays intentionally small and close to the assignment scope. It supports creating, listing, deactivating, and evaluating promotion rules, with file-backed persistence behind a simple repository layer.

## Setup

Requirements:

- Node.js 20+
- npm 10+

Install dependencies:

```bash
npm install
```

## Run

Start the API locally:

```bash
npm run start:dev
```

Or build and run the compiled output:

```bash
npm run build
npm run start
```

The service listens on `http://localhost:3000`.

## Tests

Run the unit test suite:

```bash
npm test
```

The unit tests cover service logic, controller delegation and error propagation, and repository behavior with mocked file I/O.

## Seed Data

The repository includes a seeded data file at `data/promotions.json` so the service can be tried before any write happens.

## Project Structure

```text
src/
  app.module.ts
  main.ts
  promotions/
    dto/
    models/
    promotions.controller.ts
    promotions.module.ts
    promotions.repository.ts
    promotions.service.ts
test/
  factories/
    promotion.factory.ts
  promotions.controller.spec.ts
  promotions.repository.spec.ts
  promotions.service.spec.ts
data/
  promotions.json
docs/
  implementation-plan.md
```

High-level responsibilities:

- controller: HTTP concerns only
- service: business logic and deterministic promotion selection
- repository: file-backed persistence only

## API Overview

Development server:

- host: `localhost`
- port: `3000`
- base URL: `http://localhost:3000`

When running with `npm run start:dev` or `npm run start`, all endpoints below are available under that base URL.

### `POST /promotions`

Creates a new promotion rule.

Request body:

```json
{
  "promotionName": "VIP New Year Discount",
  "promotionType": "percentage",
  "value": 15,
  "validFrom": "2025-12-15T00:00:00.000Z",
  "validTo": "2026-01-15T23:59:59.999Z",
  "priority": 10,
  "customerGroup": "vip",
  "country": "DE",
  "minimumCartAmount": 200
}
```

Validation and behavior:

- `promotionName`, `promotionType`, `value`, `validFrom`, `validTo`, and `priority` are required
- `promotionType` must be `percentage` or `fixed_amount`
- `value` must be positive
- `priority` must be `0` or greater
- `minimumCartAmount`, when provided, must be `0` or greater
- `validTo` must be on or after `validFrom`
- `id`, `active`, and `createdAt` are set by the service

Example response:

```json
{
  "id": "3f53f6a1-82d8-4c0c-b2f3-9b0d9db55b46",
  "promotionName": "VIP New Year Discount",
  "promotionType": "percentage",
  "value": 15,
  "active": true,
  "validFrom": "2025-12-15T00:00:00.000Z",
  "validTo": "2026-01-15T23:59:59.999Z",
  "priority": 10,
  "customerGroup": "vip",
  "country": "DE",
  "minimumCartAmount": 200,
  "createdAt": "2026-04-05T10:15:00.000Z"
}
```

### `GET /promotions`

Returns all stored promotions.

Example response:

```json
[
  {
    "id": "promo-vip-de-200",
    "promotionName": "VIP Germany 15% Off",
    "promotionType": "percentage",
    "value": 15,
    "active": true,
    "validFrom": "2025-12-15T00:00:00.000Z",
    "validTo": "2026-01-15T23:59:59.999Z",
    "priority": 10,
    "customerGroup": "vip",
    "country": "DE",
    "minimumCartAmount": 200,
    "createdAt": "2025-12-01T09:00:00.000Z"
  }
]
```

### `PATCH /promotions/:id/deactivate`

Marks a promotion as inactive.

Behavior:

- returns `404` if the promotion does not exist
- behaves the same way if the rule is already inactive

Example response:

```json
{
  "id": "promo-vip-de-200",
  "promotionName": "VIP Germany 15% Off",
  "promotionType": "percentage",
  "value": 15,
  "active": false,
  "validFrom": "2025-12-15T00:00:00.000Z",
  "validTo": "2026-01-15T23:59:59.999Z",
  "priority": 10,
  "customerGroup": "vip",
  "country": "DE",
  "minimumCartAmount": 200,
  "createdAt": "2025-12-01T09:00:00.000Z"
}
```

### `POST /promotions/evaluate`

Evaluates the request context and returns the single winning promotion or `null`.

Request body:

```json
{
  "customerGroup": "vip",
  "country": "DE",
  "cartAmount": 250,
  "currentDate": "2026-01-01T00:00:00.000Z"
}
```

Matching behavior:

- rule must be active
- `currentDate` must be within `validFrom` and `validTo`, inclusive
- if `customerGroup` is defined on the rule, it must match
- if `country` is defined on the rule, it must match
- if `minimumCartAmount` is defined on the rule, `cartAmount` must be greater than or equal to it
- missing optional rule fields mean there is no restriction on that field

Tie-breaking order:

1. higher `priority`
2. if both rules define `minimumCartAmount`, higher `minimumCartAmount`
3. more specific rule, where specificity is the count of defined optional fields
4. latest `createdAt`

Example response:

```json
{
  "id": "promo-vip-de-200",
  "promotionName": "VIP Germany 15% Off",
  "promotionType": "percentage",
  "value": 15,
  "active": true,
  "validFrom": "2025-12-15T00:00:00.000Z",
  "validTo": "2026-01-15T23:59:59.999Z",
  "priority": 10,
  "customerGroup": "vip",
  "country": "DE",
  "minimumCartAmount": 200,
  "createdAt": "2025-12-01T09:00:00.000Z"
}
```

If no rule matches, the response is:

```json
null
```

## Notes

- Persistence is intentionally simple and file-backed for the exercise.
- No authentication, update endpoint, delete endpoint, Swagger, pagination, or e2e tests were added.
- More implementation detail and iteration notes are in `docs/implementation-plan.md`.
