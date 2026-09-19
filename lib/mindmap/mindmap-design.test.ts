import { test } from "node:test"
import assert from "node:assert/strict"
import palettes from "@/lib/design/catalog-palettes.fixture.json"
import type { ArticleThemeDesign } from "@/lib/design/article-design"
import { createMindMapDesign } from "./mindmap-design"
import { toMindElixirData, fromMindElixirData } from "./mind-elixir-adapter"
import type { MindMapDocument } from "@/lib/api/articles/types"

test("all 30 catalog palettes preserve the original node geometry", () => {
  const geometry = { "--node-gap-x": "42px", "--node-gap-y": "14px", "--main-gap-x": "88px", "--main-gap-y": "46px", "--root-radius": "999px", "--main-radius": "18px", "--topic-padding": "8px 14px", "--map-padding": "90px 120px" }
  for (const p of palettes) {
    const design = createMindMapDesign({ style: { slug: p.slug }, palette: p } as unknown as ArticleThemeDesign)
    assert.equal(design.theme.cssVar["--root-bgcolor"], p.primary)
    assert.equal(design.theme.cssVar["--root-color"], p.on_primary)
    assert.equal(design.theme.cssVar["--color"], p.text)
    assert.equal(design.theme.palette[0], p.primary)
    for (const [key, value] of Object.entries(geometry)) {
      assert.equal(design.theme.cssVar[key as keyof typeof design.theme.cssVar], value)
    }
    assert.equal("mainBranch" in design, false)
  }
  assert.equal(palettes.length, 30)
})

test("visual branch palette never overwrites saved color, text, notes or collapse state", () => {
  const document = { root: { id: "root", text: "年度总结", children: [{ id: "a", text: "成果", collapsed: true, meta: { color: "#123456", note: "证据", side: "left" }, children: [] }] } } as unknown as MindMapDocument
  const data = toMindElixirData(document, ["#abcdef"])
  assert.equal(data.nodeData.children?.[0].branchColor, "#abcdef")
  const restored = fromMindElixirData(data, document)
  assert.deepEqual(restored.root.children[0], document.root.children[0])
  assert.equal(document.root.children[0].meta?.color, "#123456")
})
