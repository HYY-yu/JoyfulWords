import test from "node:test"
import assert from "node:assert/strict"
import type {
  PPTLogicRelation,
  PPTPageType,
  StorycardDocument,
  StorycardSlide,
} from "@/lib/api/presentations/v2/types"
import { isStorycardDocument, validateStorycardDocument } from "./storycard-validation"

function slide(id: string, pageType: PPTPageType, contentPoints: string[] = []): StorycardSlide {
  const common = {
    id,
    title: id,
    key_message: `${id} message`,
    content_points: contentPoints,
    source_refs: [],
  }
  if (pageType === "内容页") {
    return { ...common, page_type: pageType, logic_relations: ["总分"] }
  }
  return { ...common, page_type: pageType }
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

test("requires one to three unique supported logic relations on content slides", () => {
  const document = storycard(3)
  const contentIndex = document.slides.findIndex((item) => item.page_type === "内容页")
  const content = document.slides[contentIndex]
  if (content.page_type !== "内容页") assert.fail("expected content slide")

  content.logic_relations = []
  assert.ok(
    validateStorycardDocument(document).some((issue) => issue.code === "logicRelationsCount")
  )

  content.logic_relations = ["因果", "递进", "并列"]
  assert.deepEqual(validateStorycardDocument(document), [])

  content.logic_relations = ["因果", "因果"]
  assert.ok(
    validateStorycardDocument(document).some((issue) => issue.code === "logicRelationDuplicate")
  )

  content.logic_relations = ["unsupported" as PPTLogicRelation]
  assert.ok(
    validateStorycardDocument(document).some((issue) => issue.code === "logicRelationInvalid")
  )
})

test("rejects removed hints and logic relations on non-content slides", () => {
  const legacy = structuredClone(storycard(3)) as unknown as Record<string, unknown>
  const legacySlides = legacy.slides as Array<Record<string, unknown>>
  legacySlides[0].visual_hint = "removed"
  assert.equal(isStorycardDocument(legacy), false)

  const document = storycard(3)
  const cover = document.slides[0] as unknown as Record<string, unknown>
  cover.logic_relations = ["总分"]
  assert.ok(
    validateStorycardDocument(document).some(
      (issue) => issue.code === "logicRelationsContentOnly"
    )
  )
})
