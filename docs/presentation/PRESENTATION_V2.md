# PPT V2 frontend implementation

The production presentation flow uses `/presentations/v2` and starts from a saved JoyfulWords
article.

## User flow

1. Generate and poll a Storycard.
2. Edit, save, and confirm the current Storycard version.
3. Explicitly select a template package and choose one backend-provided image style for the whole
   presentation.
4. Create and poll a persistent generation job with the selected `image_style_id`.
5. Download the PPTX or retry the same failed job.
6. From a terminal generation, explicitly return to the Storycard to start a new revision and
   generation job.

The Storycard and generation are separate state machines. Polling their GET endpoints is the
reliable status source. WebSocket presentation events only trigger an immediate refresh.

## Image style and generation contract

- `GET /presentations/v2/image-styles` is the only source for selectable styles and the default
  style. The UI displays localized `label_i18n` values and never exposes or edits `prompt_suffix`.
- `POST /presentations/v2/generations` sends the selected `image_style_id` together with the
  confirmed Storycard version and immutable template reference.
- The backend reuses validated article images first and may generate zero to three additional
  images. `generated_image_count` reports the successfully generated images bound to the job.
- Generation progress includes `cataloging_images`, `planning_images`, and, when needed,
  `generating_images` before template matching. Progress remains segmented and non-regressing;
  the frontend does not synthesize a percentage from polling frequency.

## Storycard contract

- Every slide has `id`, `page_type`, `title`, `key_message`, `content_points`, and `source_refs`.
- Content slides additionally require `logic_relations`: one to three unique values ordered by
  template-matching priority.
- Supported relations are `并列`, `递进`, `对比`, `包含`, `四象限`, `时间轴`, `循环`, `总分`,
  `金字塔`, `因果`, and `图文`.
- Non-content slides omit `logic_relations`. The removed `relation_hint` and `visual_hint` fields
  are not accepted.

## Source layout

- `lib/api/presentations/v2`: backend HTTP contract and client.
- `lib/presentations/v2`: validation, stage ordering, errors, and local recovery session.
- `components/presentation/v2`: the four-step article workflow.
- `components/taskcenter/presentation-task-detail.tsx`: TaskCenter V2 detail entry.

## Recovery

The browser stores only the generation ID, selected template reference, and selected image style
ID under a key scoped by user ID and article ID. Storycard content remains server-owned. On reopen,
the frontend validates the stored style against the latest `/image-styles` response, GETs the
current Storycard and generation, and discards stale or cross-article job IDs.

Once generation starts, the stepper is progress-only. A succeeded or failed generation exposes an
explicit `Edit Storycard` action that clears the active browser recovery pointer and template
selection before returning to the editor. The previous server job remains available in TaskCenter;
confirming the revised Storycard and selecting a template creates a new generation job instead of
retrying the old snapshot.

## TaskCenter

TaskCenter reads presentation jobs directly from `ppt_generation_jobs` through the shared
`/api/taskcenter/tasks` list and `/api/taskcenter/task/presentation/:id` detail endpoints. The only
presentation statuses are `queued`, `processing`, `succeeded`, and `failed`; the terminal statuses
are `succeeded` and `failed`.

Presentation WebSocket `task_update`, `task_complete`, and `task_failed` messages are refresh
signals. They invalidate the shared TaskCenter query keyed by `type + task_id`; the TaskCenter GET
response remains the source of truth. TaskCenter detail does not run a second presentation polling
loop. Retrying a failed job calls `/presentations/v2/generations/:id/retry`, keeps the same job ID,
and immediately refreshes the shared query. HTTP 402 continues through the global insufficient
credits dialog.

TaskCenter uses the same generation-stage type as the article flow, so the image catalog, planning,
and generation stages render with the same localized copy. The current TaskCenter response does not
include `image_style_id` or `generated_image_count`; those fields are displayed only in the article
generation result until the TaskCenter backend contract exposes them.

The TaskCenter frontend does not read V1 presentation fields such as `slide_summary`, `slides`,
`preview`, `layouts_json`, or `deck_model_json`.

## Observability

- Debug: article-flow polling, TaskCenter WebSocket-triggered refresh, and stage changes.
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
