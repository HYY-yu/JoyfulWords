# Unify AI Feature Dialog Shells Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify the dialog chrome (header, borders, sizing, footer) across all six AI feature modals in the right-sidebar `AI 功能` panel so they share a consistent look, using `infographic-dialog.tsx` as the visual reference.

**Architecture:** Extract a shared `AIFeatureDialogShell` component that encapsulates `Dialog` + `DialogContent` sizing variants, a standardized `DialogHeader` (SparklesIcon + title + optional description), a body slot, and an optional `DialogFooter`. Each of the six dialogs/mode wrappers replaces its ad-hoc shell with this component. Internal feature layouts (canvas, two-column form, etc.) are preserved — only the chrome is unified.

**Tech Stack:** Next.js 16, React, TypeScript, Tailwind CSS 4, Shadcn/ui Dialog (Radix), lucide-react icons.

**Scope note:** This is a pure visual/structural refactor with no behavior changes. This codebase has no unit-test infra for these dialogs, so verification relies on `pnpm lint`, `pnpm build`, and manual visual QA in the browser. TDD is not applied here.

---

## File Structure

**Create:**
- `components/ui/ai/ai-feature-dialog-shell.tsx` — shared shell component with size variants `compact | large | fullscreen`.

**Modify:**
- `components/article/infographic-dialog.tsx` — reference; switch to shell (compact).
- `components/ui/ai/ai-rewrite-dialog.tsx` — switch to shell (large).
- `components/ui/ai/ai-mindmap-dialog.tsx` — switch to shell (fullscreen).
- `components/article/editor-ai-panel.tsx` — replace local `renderImageFeatureDialog` helper with shell (fullscreen) for `CreatorMode`, `InversionMode`, `StyleMode`.

**Not touched:**
- `components/image-generator/creator-mode.tsx`, `modes/inversion-mode.tsx`, `modes/style-mode.tsx` — these are inline panels rendered inside the dialog body; their internal 2/3-column layouts are out of scope.

---

## Design: The Shared Shell

**Shell responsibilities:**
1. Own `<Dialog>` + `<DialogContent>` with one of three size variants.
2. Render a standardized `<DialogHeader>`: `border-b px-6 py-5`, title with `SparklesIcon h-5 w-5 text-primary`, optional description.
3. Render a body container: `flex min-h-0 flex-1 flex-col overflow-hidden`.
4. Optionally render `<DialogFooter>`: `border-t px-6 py-4`.
5. Accept `overlayClassName` and `contentClassName` escape hatches for edge cases.

**Size variants (Tailwind class strings):**

| Variant | DialogContent className |
|---|---|
| `compact` | `flex max-h-[88vh] flex-col overflow-hidden p-0 sm:max-w-5xl` |
| `large` | `flex h-auto max-h-[min(900px,calc(100vh-2rem))] w-[calc(100vw-2rem)] max-w-none flex-col overflow-hidden p-0 sm:max-w-[1200px] lg:max-w-[1400px] xl:max-w-[1600px]` |
| `fullscreen` | `flex h-screen w-screen max-w-none flex-col overflow-hidden rounded-none border-0 p-0 sm:h-[calc(100vh-1rem)] sm:w-[calc(100vw-1rem)] sm:max-w-none sm:rounded-xl sm:border sm:border-border sm:shadow-2xl` |

**Why no explicit close button in header:** Shadcn `DialogContent` already renders a close button via `showCloseButton` (default `true`). Today, several of the dialogs disable it with `showCloseButton={false}` and roll their own `XIcon` button. We standardize on letting `DialogContent` render the default close button, removing those custom buttons.

---

## Task 1: Create the shared shell component

**Files:**
- Create: `components/ui/ai/ai-feature-dialog-shell.tsx`

- [ ] **Step 1: Write the shell component**

Create file `components/ui/ai/ai-feature-dialog-shell.tsx` with this exact content:

```tsx
"use client"

import { type ReactNode } from "react"
import { SparklesIcon } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/base/dialog"
import { cn } from "@/lib/utils"

export type AIFeatureDialogSize = "compact" | "large" | "fullscreen"

const SIZE_CLASSES: Record<AIFeatureDialogSize, string> = {
  compact:
    "flex max-h-[88vh] flex-col overflow-hidden p-0 sm:max-w-5xl",
  large:
    "flex h-auto max-h-[min(900px,calc(100vh-2rem))] w-[calc(100vw-2rem)] max-w-none flex-col overflow-hidden p-0 sm:max-w-[1200px] lg:max-w-[1400px] xl:max-w-[1600px]",
  fullscreen:
    "flex h-screen w-screen max-w-none flex-col overflow-hidden rounded-none border-0 p-0 sm:h-[calc(100vh-1rem)] sm:w-[calc(100vw-1rem)] sm:max-w-none sm:rounded-xl sm:border sm:border-border sm:shadow-2xl",
}

export interface AIFeatureDialogShellProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description?: ReactNode
  size?: AIFeatureDialogSize
  children: ReactNode
  footer?: ReactNode
  overlayClassName?: string
  contentClassName?: string
  showCloseButton?: boolean
}

export function AIFeatureDialogShell({
  open,
  onOpenChange,
  title,
  description,
  size = "compact",
  children,
  footer,
  overlayClassName,
  contentClassName,
  showCloseButton = true,
}: AIFeatureDialogShellProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={showCloseButton}
        overlayClassName={overlayClassName}
        className={cn(SIZE_CLASSES[size], contentClassName)}
      >
        <DialogHeader className="shrink-0 border-b px-6 py-5 text-left">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <SparklesIcon className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          {description ? (
            <DialogDescription className="mt-1">{description}</DialogDescription>
          ) : null}
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {children}
        </div>

        {footer ? (
          <DialogFooter className="shrink-0 border-t px-6 py-4">
            {footer}
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `pnpm tsc --noEmit`
Expected: No errors related to the new file.

- [ ] **Step 3: Verify lint passes**

Run: `pnpm lint`
Expected: 0 warnings, 0 errors.

- [ ] **Step 4: Commit**

```bash
git add components/ui/ai/ai-feature-dialog-shell.tsx
git commit -m "feat(ui/ai): add shared AIFeatureDialogShell component"
```

---

## Task 2: Refactor infographic-dialog.tsx to use shell

**Rationale:** Infographic is the reference. Porting it first validates that the shell fits the reference case exactly — if it doesn't, we fix the shell before touching the other five.

**Files:**
- Modify: `components/article/infographic-dialog.tsx:259-550`

- [ ] **Step 1: Replace imports**

In `components/article/infographic-dialog.tsx`, remove these imports:

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/base/dialog"
```

And `SparklesIcon` from the lucide-react import (it's now rendered inside the shell). Keep `AlertCircleIcon, CheckCircle2Icon, Loader2Icon` — they are still used in the body.

Add:

```tsx
import { AIFeatureDialogShell } from "@/components/ui/ai/ai-feature-dialog-shell"
```

- [ ] **Step 2: Replace the return JSX shell**

Replace lines 259–550 (the `return (...)` block) so the outer wrapper becomes the shell. The inner two-column body and the footer buttons stay the same, just reparented. Full replacement:

```tsx
  return (
    <AIFeatureDialogShell
      open={open}
      onOpenChange={onOpenChange}
      title={t("infographicDialog.title")}
      description={t("infographicDialog.description")}
      size="compact"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("infographicDialog.close")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleCopyToMaterials}
            disabled={!canCopyToMaterials}
          >
            {copyingToMaterials ? (
              <>
                <Loader2Icon className="h-4 w-4 animate-spin" />
                {t("infographicDialog.addToMaterialsLoading")}
              </>
            ) : (
              t("infographicDialog.addToMaterials")
            )}
          </Button>
          <Button type="button" onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2Icon className="h-4 w-4 animate-spin" />
                {t("infographicDialog.generating")}
              </>
            ) : (
              t("infographicDialog.generate")
            )}
          </Button>
        </>
      }
    >
      <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[1.1fr_0.9fr]">
        {/* LEFT COLUMN — unchanged from current lines 271-425 */}
        <ScrollArea className="min-h-0 border-b lg:border-r lg:border-b-0">
          {/* ... keep existing content verbatim ... */}
        </ScrollArea>

        {/* RIGHT COLUMN — unchanged from current lines 427-511 */}
        <div className="flex min-h-0 flex-col bg-muted/20">
          {/* ... keep existing content verbatim ... */}
        </div>
      </div>
    </AIFeatureDialogShell>
  )
```

**Important:** do NOT rewrite the left ScrollArea column or right result column. Copy them verbatim from the current file. Only the outer `<Dialog>/<DialogContent>/<DialogHeader>/<DialogFooter>` shell is replaced.

- [ ] **Step 3: Verify build + lint**

Run: `pnpm lint && pnpm tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 4: Manual visual check**

Run: `pnpm dev`, open an article, select text, click `信息图`. Confirm:
- Header shows SparklesIcon + title + description, with `border-b` separator
- Two-column body looks identical to before
- Footer shows three buttons with `border-t` separator
- Default Shadcn close button (×) visible top-right

- [ ] **Step 5: Commit**

```bash
git add components/article/infographic-dialog.tsx
git commit -m "refactor(infographic-dialog): use shared AIFeatureDialogShell"
```

---

## Task 3: Refactor ai-rewrite-dialog.tsx to use shell

**Files:**
- Modify: `components/ui/ai/ai-rewrite-dialog.tsx:287-592`

- [ ] **Step 1: Update imports**

Remove from the lucide-react import: `XIcon` (custom close button is gone). Remove the `Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription` imports from `@/components/ui/base/dialog`. Add:

```tsx
import { AIFeatureDialogShell } from "@/components/ui/ai/ai-feature-dialog-shell"
```

- [ ] **Step 2: Replace outer shell**

Locate `return (` at line 287. Replace the outer shell (lines 288–314 for opening, the matching `</DialogContent></Dialog>` at line 588) so it looks like:

```tsx
  return (
    <AIFeatureDialogShell
      open={open}
      onOpenChange={onOpenChange}
      title={t("aiRewrite.title")}
      description={t("aiRewrite.description")}
      size="large"
      footer={/* existing action buttons block from near the bottom of current file */}
    >
      {/* EXISTING body content from current lines 316-end-minus-footer, verbatim */}
    </AIFeatureDialogShell>
  )
```

The existing file embeds its action buttons inside the scrollable body rather than in a footer. As part of this task, identify the primary action row (cancel / generate / confirm buttons) near the bottom of the current JSX and lift it into the shell's `footer` prop. Everything else — the waiting hint, the two-column text panes, the tabs — stays in `children` verbatim.

**Before committing to the lift:** read lines 540-588 of the current file to find the exact button block. If the buttons are deeply intertwined with body state (e.g. appear/disappear based on mode), it's acceptable to leave them in the body and pass `footer={undefined}`. Chrome consistency (header + borders + size) is the non-negotiable part; footer lift is a bonus.

- [ ] **Step 3: Remove custom close button**

The current file has its own `<Button variant="ghost" size="icon"><XIcon/></Button>` at lines 304-312. Delete it — the shell's default close button replaces it.

- [ ] **Step 4: Verify build + lint**

Run: `pnpm lint && pnpm tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 5: Manual visual check**

In the running dev server, trigger the AI rewrite dialog (via the `joyfulwords-open-ai-edit` custom event path — normally by clicking `文章 AI 编辑` in the AI panel). Confirm:
- Header, borders, sizing match infographic's visual language
- All existing rewrite functionality still works (tabs, generate, apply)

- [ ] **Step 6: Commit**

```bash
git add components/ui/ai/ai-rewrite-dialog.tsx
git commit -m "refactor(ai-rewrite-dialog): use shared AIFeatureDialogShell"
```

---

## Task 4: Refactor ai-mindmap-dialog.tsx to use shell (fullscreen)

**Files:**
- Modify: `components/ui/ai/ai-mindmap-dialog.tsx:402-485`

- [ ] **Step 1: Update imports**

Remove `Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription` from `@/components/ui/base/dialog`. Remove `XIcon` if only used for the custom close button. Add:

```tsx
import { AIFeatureDialogShell } from "@/components/ui/ai/ai-feature-dialog-shell"
```

- [ ] **Step 2: Replace outer shell**

Replace the `return (...)` block at line 402 with:

```tsx
  return (
    <AIFeatureDialogShell
      open={open}
      onOpenChange={onOpenChange}
      title={t("aiMindmap.title")}
      description={t("aiMindmap.canvas.hint")}
      size="fullscreen"
      overlayClassName="bg-black/75"
    >
      {/* EXISTING body content: loading state + MindElixir canvas + floating action buttons
          — copy verbatim from current lines 434-484 */}
    </AIFeatureDialogShell>
  )
```

Delete the current custom header block (lines 409-432) — the shell provides it. Delete the custom `<XIcon/>` close button (lines 422-429). Do NOT touch the floating regenerate/save buttons that live over the canvas; they remain in the body.

- [ ] **Step 3: Verify build + lint**

Run: `pnpm lint && pnpm tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 4: Manual visual check**

Trigger the mindmap dialog. Confirm:
- Fullscreen layout preserved (same footprint as before)
- Header now shows SparklesIcon + title + hint, with `border-b`
- Floating regenerate/save buttons still work over the canvas
- Overlay is still the darker `bg-black/75`

- [ ] **Step 5: Commit**

```bash
git add components/ui/ai/ai-mindmap-dialog.tsx
git commit -m "refactor(ai-mindmap-dialog): use shared AIFeatureDialogShell"
```

---

## Task 5: Refactor editor-ai-panel.tsx image feature wrappers

**Files:**
- Modify: `components/article/editor-ai-panel.tsx:312-479`

- [ ] **Step 1: Update imports**

Remove `Dialog, DialogContent, DialogTitle` from `@/components/ui/base/dialog` **only if they are no longer used elsewhere in this file**. Note: the task-detail dialog at line 400 still uses `Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription` — keep those imports. Remove `XIcon` if only used by `renderImageFeatureDialog`. Add:

```tsx
import { AIFeatureDialogShell } from "@/components/ui/ai/ai-feature-dialog-shell"
```

- [ ] **Step 2: Rewrite `renderImageFeatureDialog`**

Replace the entire `renderImageFeatureDialog` function (lines 312-342) with:

```tsx
  function renderImageFeatureDialog(
    open: boolean,
    onOpenChange: (nextOpen: boolean) => void,
    title: string,
    content: ReactNode
  ) {
    return (
      <AIFeatureDialogShell
        open={open}
        onOpenChange={onOpenChange}
        title={title}
        size="fullscreen"
        overlayClassName="bg-black/75"
      >
        {content}
      </AIFeatureDialogShell>
    )
  }
```

The three call sites at lines 460-479 (`renderImageFeatureDialog(isCreateImageOpen, …)`, etc.) do NOT change — they already pass the right arguments.

- [ ] **Step 3: Verify build + lint**

Run: `pnpm lint && pnpm tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 4: Manual visual check**

Click `创作图片`, `拆分图片图层`, and `风格化图片` in the AI panel. For each:
- Fullscreen dialog opens
- Header now shows SparklesIcon + title + `border-b` (previously a plain title with a custom close button)
- Inner panel (CreatorMode / InversionMode / StyleMode) renders correctly, no layout break
- Default Shadcn close button (×) closes the dialog

- [ ] **Step 5: Commit**

```bash
git add components/article/editor-ai-panel.tsx
git commit -m "refactor(editor-ai-panel): use shared AIFeatureDialogShell for image modes"
```

---

## Task 6: Full verification pass

- [ ] **Step 1: Lint**

Run: `pnpm lint`
Expected: 0 warnings, 0 errors (project policy is 0 warnings per CLAUDE.md).

- [ ] **Step 2: Type check**

Run: `pnpm tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Production build**

Run: `pnpm build`
Expected: build succeeds.

- [ ] **Step 4: Full visual QA checklist**

With `pnpm dev` running, open an article and click each of the six AI panel buttons in order. For each, compare side-by-side against infographic as the reference:

| Feature | Header (SparklesIcon + title + border-b) | Body unchanged | Footer or no-footer intentional | Default close (×) works |
|---|---|---|---|---|
| 文章 AI 编辑 | ☐ | ☐ | ☐ | ☐ |
| AI 思维导图 | ☐ | ☐ | ☐ (no footer, floating buttons) | ☐ |
| 创作图片 | ☐ | ☐ | ☐ (no footer, inline panel) | ☐ |
| 拆分图片图层 | ☐ | ☐ | ☐ (no footer, inline panel) | ☐ |
| 风格化图片 | ☐ | ☐ | ☐ (no footer, inline panel) | ☐ |
| 信息图 | ☐ | ☐ | ☐ (3 buttons, border-t) | ☐ |

- [ ] **Step 5: Final commit (if any cleanup was needed)**

If Step 4 revealed minor fixes, commit them:

```bash
git add -p
git commit -m "fix(ui/ai): address visual QA findings for unified dialog shells"
```

---

## Self-Review Notes

**Spec coverage:** User asked for consistent styling across the six right-panel AI function modals, referencing infographic's style. Tasks 2–5 cover all six (infographic itself + rewrite + mindmap + the three image modes rendered by editor-ai-panel).

**Placeholder scan:** Task 3 Step 2 contains a conditional fallback ("if buttons are deeply intertwined... leave them in the body") — this is not a placeholder but a pre-authorized judgment call with a clear decision criterion. All other code blocks are concrete.

**Type consistency:** `AIFeatureDialogShellProps` defined in Task 1 is consumed identically in Tasks 2–5. Prop names (`open`, `onOpenChange`, `title`, `description`, `size`, `children`, `footer`, `overlayClassName`) are stable across usages.

**Risk:** The biggest unknown is Task 3 — `ai-rewrite-dialog.tsx` is 592 lines and its button layout may not lift cleanly into a footer. The plan explicitly authorizes leaving footer=undefined for that dialog if the lift is too invasive; chrome consistency (header + borders + size) is the non-negotiable outcome.
