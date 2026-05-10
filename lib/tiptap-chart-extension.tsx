import { Node, mergeAttributes } from "@tiptap/core"
import { ReactNodeViewRenderer } from "@tiptap/react"
import { JoyChartNodeView } from "@/components/editor/joy-chart-node-view"

function parseJSONAttribute(value: string | null) {
  if (!value) return null

  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

export const JoyChart = Node.create({
  name: "joyChart",

  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      localId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-local-id"),
        renderHTML: (attributes) =>
          attributes.localId ? { "data-local-id": attributes.localId } : {},
      },
      logId: {
        default: null,
        parseHTML: (element) => {
          const value = element.getAttribute("data-log-id")
          return value ? Number(value) : null
        },
        renderHTML: (attributes) =>
          typeof attributes.logId === "number" ? { "data-log-id": String(attributes.logId) } : {},
      },
      version: {
        default: null,
        parseHTML: (element) => {
          const value = element.getAttribute("data-version")
          return value ? Number(value) : null
        },
        renderHTML: (attributes) =>
          typeof attributes.version === "number" ? { "data-version": String(attributes.version) } : {},
      },
      status: {
        default: "ready",
        parseHTML: (element) => element.getAttribute("data-status") || "ready",
        renderHTML: (attributes) => ({ "data-status": attributes.status || "ready" }),
      },
      sourceMode: {
        default: "selection",
        parseHTML: (element) => element.getAttribute("data-source-mode") || "selection",
        renderHTML: (attributes) => ({ "data-source-mode": attributes.sourceMode || "selection" }),
      },
      chartType: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-chart-type"),
        renderHTML: (attributes) =>
          attributes.chartType ? { "data-chart-type": attributes.chartType } : {},
      },
      title: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-title"),
        renderHTML: (attributes) => (attributes.title ? { "data-title": attributes.title } : {}),
      },
      spec: {
        default: null,
        parseHTML: (element) => parseJSONAttribute(element.getAttribute("data-spec")),
        renderHTML: (attributes) =>
          attributes.spec ? { "data-spec": JSON.stringify(attributes.spec) } : {},
      },
      display: {
        default: null,
        parseHTML: (element) => parseJSONAttribute(element.getAttribute("data-display")),
        renderHTML: (attributes) =>
          attributes.display ? { "data-display": JSON.stringify(attributes.display) } : {},
      },
      errorMessage: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-error-message"),
        renderHTML: (attributes) =>
          attributes.errorMessage ? { "data-error-message": attributes.errorMessage } : {},
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="joy-chart"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "joy-chart",
        class: "joy-chart-node",
      }),
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(JoyChartNodeView)
  },
})
