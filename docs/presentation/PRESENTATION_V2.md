# PPT V2 frontend implementation

The production presentation flow uses `/presentations/v2` and starts from a saved JoyfulWords
article.

## User flow

1. Generate and poll a Storycard.
2. Edit, save, and confirm the current Storycard version.
3. Explicitly select a template package.
4. Create and poll a persistent generation job.
5. Download the PPTX or retry the same failed job.

The Storycard and generation are separate state machines. Polling their GET endpoints is the
reliable status source. WebSocket presentation events only trigger an immediate refresh.

## Source layout

- `lib/api/presentations/v2`: backend HTTP contract and client.
- `lib/presentations/v2`: validation, stage ordering, errors, and local recovery session.
- `components/presentation/v2`: the four-step article workflow.
- `components/taskcenter/presentation-task-detail.tsx`: TaskCenter V2 detail entry.

## Recovery

The browser stores only the generation ID and selected template reference under a key scoped by
user ID and article ID. Storycard content remains server-owned. On reopen, the frontend GETs the
current Storycard and generation; stale or cross-article job IDs are discarded.

## TaskCenter

TaskCenter remains the target discovery and history surface for presentations. Until the backend
returns V2 generations there, the article dialog does not depend on TaskCenter. When available,
TaskCenter should return `generation_id` and may return `contract_version: "v2"`; the detail reads
the generation directly from `/presentations/v2/generations/:id`. The frontend no longer contains
the V1 presentation dialog, TaskCenter detail, API client, types, or compatibility adapter.

## Observability

- Debug: polling, WebSocket-triggered refresh, and stage changes.
- Info: generate, save, confirm, create, retry, and download actions.
- Warn: network retry, polling timeout, stale recovery data, and version conflicts.
- Error: terminal HTTP failures and invalid task/download responses.

TODO(observability): add metrics for Storycard latency, generation duration, stage failures, and
retry counts when the frontend metrics contract is finalized.

## Verification

```bash
pnpm tsx --test lib/presentations/v2/*.test.ts lib/api/taskcenter/presentation-v2.test.ts
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```
