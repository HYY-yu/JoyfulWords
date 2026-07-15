# Presentation V1 archive

This directory contains code disconnected from the production presentation flow after the
`/presentations/v2` migration.

## Replacement

- Runtime UI: `components/presentation/v2/*`
- API contract: `lib/api/presentations/v2/*`
- TaskCenter entry: `components/taskcenter/presentation-task-detail.tsx`

## Still-active V1 compatibility

Historical TaskCenter records still use
`components/taskcenter/presentation/legacy-presentation-task-detail.tsx`, the V1 API client, and
the legacy SVG preview. They must remain active until the backend exposes V2 generations through
TaskCenter and the historical retention window ends.

## Delete when

1. V2 presentation generation has passed production acceptance.
2. TaskCenter returns an explicit `contract_version: "v2"` and `generation_id`.
3. Historical V1 task retention has expired.
4. The backend removes the V1 storycard, layouts, and logs endpoints.

Production code must not import files from this archive.

