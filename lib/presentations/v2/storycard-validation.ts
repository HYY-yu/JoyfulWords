import type {
  PPTLogicRelation,
  PPTPageType,
  StorycardDocument,
} from "@/lib/api/presentations/v2/types"
import { PPT_LOGIC_RELATIONS } from "@/lib/api/presentations/v2/types"

export type StorycardValidationCode =
  | "firstSlideCover"
  | "lastSlideEnding"
  | "exactlyOneAgenda"
  | "agendaBeforeSections"
  | "sectionCount"
  | "agendaPointCount"
  | "contentSlideRequired"
  | "slideTitleRequired"
  | "slideKeyMessageRequired"
  | "invalidPageType"
  | "logicRelationsRequired"
  | "logicRelationsCount"
  | "logicRelationInvalid"
  | "logicRelationDuplicate"
  | "logicRelationsContentOnly"

export interface StorycardValidationIssue {
  code: StorycardValidationCode
  path: string
  slideIndex?: number
}

const PAGE_TYPES = new Set<PPTPageType>([
  "封面页",
  "目录页",
  "章节过渡页",
  "内容页",
  "结尾页",
])

const LOGIC_RELATIONS = new Set<PPTLogicRelation>(PPT_LOGIC_RELATIONS)

function isLogicRelation(value: unknown): value is PPTLogicRelation {
  return typeof value === "string" && LOGIC_RELATIONS.has(value as PPTLogicRelation)
}

function hasOwn(value: object, key: PropertyKey): boolean {
  return Object.prototype.hasOwnProperty.call(value, key)
}

export function isStorycardDocument(value: unknown): value is StorycardDocument {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false
  const candidate = value as Partial<StorycardDocument>
  return (
    candidate.schema_version === 1 &&
    typeof candidate.article_id === "number" &&
    typeof candidate.title === "string" &&
    (candidate.language === "zh" || candidate.language === "en") &&
    typeof candidate.audience === "string" &&
    typeof candidate.presentation_goal === "string" &&
    typeof candidate.narrative_structure === "string" &&
    Array.isArray(candidate.slides) &&
    candidate.slides.every((slide) => {
      if (
        !slide ||
        typeof slide !== "object" ||
        typeof slide.id !== "string" ||
        !PAGE_TYPES.has(slide.page_type) ||
        typeof slide.title !== "string" ||
        typeof slide.key_message !== "string" ||
        !Array.isArray(slide.content_points) ||
        !slide.content_points.every((point) => typeof point === "string") ||
        !Array.isArray(slide.source_refs) ||
        !slide.source_refs.every((ref) => typeof ref === "string") ||
        hasOwn(slide, "relation_hint") ||
        hasOwn(slide, "visual_hint")
      ) {
        return false
      }

      if (slide.page_type === "内容页") {
        return (
          Array.isArray(slide.logic_relations) &&
          slide.logic_relations.length >= 1 &&
          slide.logic_relations.length <= 3 &&
          slide.logic_relations.every(isLogicRelation) &&
          new Set(slide.logic_relations).size === slide.logic_relations.length
        )
      }

      return !hasOwn(slide, "logic_relations")
    })
  )
}

export function cloneStorycardDocument(document: StorycardDocument): StorycardDocument {
  return structuredClone(document)
}

export function validateStorycardDocument(
  document: StorycardDocument
): StorycardValidationIssue[] {
  const issues: StorycardValidationIssue[] = []
  const { slides } = document

  if (slides[0]?.page_type !== "封面页") {
    issues.push({ code: "firstSlideCover", path: "slides.0.page_type", slideIndex: 0 })
  }

  const lastIndex = Math.max(0, slides.length - 1)
  if (slides[lastIndex]?.page_type !== "结尾页") {
    issues.push({
      code: "lastSlideEnding",
      path: `slides.${lastIndex}.page_type`,
      slideIndex: lastIndex,
    })
  }

  const agendaIndexes = slides.flatMap((slide, index) =>
    slide.page_type === "目录页" ? [index] : []
  )
  if (agendaIndexes.length !== 1) {
    issues.push({ code: "exactlyOneAgenda", path: "slides" })
  }

  const sectionIndexes = slides.flatMap((slide, index) =>
    slide.page_type === "章节过渡页" ? [index] : []
  )
  if (sectionIndexes.length < 3 || sectionIndexes.length > 6) {
    issues.push({ code: "sectionCount", path: "slides" })
  }

  if (
    agendaIndexes.length === 1 &&
    sectionIndexes.length > 0 &&
    agendaIndexes[0] > sectionIndexes[0]
  ) {
    issues.push({
      code: "agendaBeforeSections",
      path: `slides.${agendaIndexes[0]}.page_type`,
      slideIndex: agendaIndexes[0],
    })
  }

  if (
    agendaIndexes.length === 1 &&
    slides[agendaIndexes[0]].content_points.length !== sectionIndexes.length
  ) {
    issues.push({
      code: "agendaPointCount",
      path: `slides.${agendaIndexes[0]}.content_points`,
      slideIndex: agendaIndexes[0],
    })
  }

  if (!slides.some((slide) => slide.page_type === "内容页")) {
    issues.push({ code: "contentSlideRequired", path: "slides" })
  }

  slides.forEach((slide, index) => {
    if (!PAGE_TYPES.has(slide.page_type)) {
      issues.push({ code: "invalidPageType", path: `slides.${index}.page_type`, slideIndex: index })
    }
    if (!slide.title.trim()) {
      issues.push({ code: "slideTitleRequired", path: `slides.${index}.title`, slideIndex: index })
    }
    if (!slide.key_message.trim()) {
      issues.push({
        code: "slideKeyMessageRequired",
        path: `slides.${index}.key_message`,
        slideIndex: index,
      })
    }

    const rawSlide = slide as unknown as Record<string, unknown>
    const rawRelations = rawSlide.logic_relations
    if (slide.page_type === "内容页") {
      if (!Array.isArray(rawRelations)) {
        issues.push({
          code: "logicRelationsRequired",
          path: `slides.${index}.logic_relations`,
          slideIndex: index,
        })
      } else {
        if (rawRelations.length < 1 || rawRelations.length > 3) {
          issues.push({
            code: "logicRelationsCount",
            path: `slides.${index}.logic_relations`,
            slideIndex: index,
          })
        }
        if (!rawRelations.every(isLogicRelation)) {
          issues.push({
            code: "logicRelationInvalid",
            path: `slides.${index}.logic_relations`,
            slideIndex: index,
          })
        }
        if (new Set(rawRelations).size !== rawRelations.length) {
          issues.push({
            code: "logicRelationDuplicate",
            path: `slides.${index}.logic_relations`,
            slideIndex: index,
          })
        }
      }
    } else if (hasOwn(rawSlide, "logic_relations")) {
      issues.push({
        code: "logicRelationsContentOnly",
        path: `slides.${index}.logic_relations`,
        slideIndex: index,
      })
    }
  })

  return issues
}
