# Copilot Instructions - Financy Me

## Stack and Architecture
- Backend: Laravel + Inertia.
- Frontend: React + TypeScript.
- Tests: Pest.
- This project uses multi-tenant by house (`house_id`) in a shared database.

## Multi-tenant Rules (Critical)
- Always scope domain queries by current house.
- Current (active) house comes from authenticated user active_house_id.
- Do not use `user_id` to isolate business data.
- Domain tables (categories, accounts, products, purchases, invoices, financial entries) must use `house_id`.

## Authentication and Houses
- In registration, user can create or join a house.
- A user can belong to multiple houses.
- User login operates on active house by default.
- If user has houses but no active house set, assign first available house.

## Controller and Validation Conventions
- Keep authorization and filtering aligned with `house_id`.
- Validation `Rule::exists` and `Rule::unique` must include house scope when applicable.
- Avoid breaking existing payload shape used by current frontend.

## Database and Migrations
- Prefer fresh schema consistency over legacy migration compatibility for this phase.
- Keep migrations simple and explicit.
- Preserve foreign keys and cascade rules for house-bound data.

## Quality Gates
- After meaningful changes:
  - Run tests (`php artisan test` or targeted tests).
  - Run frontend build (`npm run build`) for TypeScript integrity.
- Prefer minimal diffs and preserve existing UI patterns unless requested.

## Language and UX
- Keep labels and messages in pt-BR where project already uses pt-BR.
- Follow current UI behavior: table row click edit flows, consistent filters, and modal patterns.
