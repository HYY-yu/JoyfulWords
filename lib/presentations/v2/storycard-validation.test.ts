import test from "node:test"
import assert from "node:assert/strict"
import type {
  PPTPageType,
  StorycardDocument,
  StorycardSlide,
} from "@/lib/api/presentations/v2/types"
import { isStorycardDocument, validateStorycardDocument } from "./storycard-validation"

function slide(id: string, pageType: PPTPageType, contentPoints: string[] = []): StorycardSlide {
  return {
    id,
    page_type: pageType,
    title: id,
    key_message: `${id} message`,
    content_points: contentPoints,
    relation_hint: "",
    visual_hint: "",
    source_refs: [],
  }
}

function storycard(sectionCount: number): StorycardDocument {
  const sections = Array.from({ length: sectionCount }, (_, index) =>
    slide(`section-${index + 1}`, "章节过渡页")
  )
  return {
    schema_version: 1,
    article_id: 123,
    title: "Test deck",
    language: "zh",
    audience: "Creators",
    presentation_goal: "Explain",
    narrative_structure: "Problem to solution",
    slides: [
      slide("cover", "封面页"),
      slide(
        "agenda",
        "目录页",
        Array.from({ length: sectionCount }, (_, index) => `Section ${index + 1}`)
      ),
      ...sections,
      slide("content", "内容页"),
      slide("ending", "结尾页"),
    ],
  }
}

for (const sectionCount of [3, 5, 6]) {
  test(`accepts a Storycard with ${sectionCount} sections`, () => {
    assert.deepEqual(validateStorycardDocument(storycard(sectionCount)), [])
  })
}

test("reports structural and required-field violations", () => {
  const document = storycard(2)
  document.slides[0].page_type = "内容页"
  document.slides[1].content_points = ["Only one"]
  document.slides.at(-1)!.title = ""

  const codes = validateStorycardDocument(document).map((issue) => issue.code)
  assert.ok(codes.includes("firstSlideCover"))
  assert.ok(codes.includes("sectionCount"))
  assert.ok(codes.includes("agendaPointCount"))
  assert.ok(codes.includes("slideTitleRequired"))
})

test("rejects malformed JSONB documents before rendering", () => {
  assert.equal(isStorycardDocument({ schema_version: 1, slides: [] }), false)
  assert.equal(isStorycardDocument(storycard(3)), true)
})
