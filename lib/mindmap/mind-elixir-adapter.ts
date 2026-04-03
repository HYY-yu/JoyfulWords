import type { MindElixirData, NodeObj } from "mind-elixir"
import type { MindMapDocument, MindMapNode } from "@/lib/api/articles/types"

const BRANCH_COLORS = [
  "#2F6FED",
  "#0F9D7A",
  "#E87B2A",
  "#B94CCF",
  "#D64550",
  "#1481BA",
]

export function findMindMapNode(root: MindMapNode, nodeId: string): MindMapNode | null {
  if (root.id === nodeId) {
    return root
  }

  for (const child of root.children) {
    const found = findMindMapNode(child, nodeId)
    if (found) {
      return found
    }
  }

  return null
}

export function ensureBalancedRootDirections(root: MindMapNode): MindMapNode {
  return {
    ...root,
    children: root.children.map((child, index) => ({
      ...child,
      meta: {
        ...child.meta,
        side: child.meta?.side || (index % 2 === 0 ? "right" : "left"),
        color: child.meta?.color || BRANCH_COLORS[index % BRANCH_COLORS.length],
      },
      children: child.children.map(cloneNode),
    })),
  }
}

function cloneNode(node: MindMapNode): MindMapNode {
  return {
    ...node,
    meta: node.meta ? { ...node.meta } : undefined,
    children: node.children.map(cloneNode),
  }
}

function toMindElixirNode(node: MindMapNode, depth: number, branchIndex = 0): NodeObj {
  const nextSide = node.meta?.side || (branchIndex % 2 === 0 ? "right" : "left")
  const nextColor = node.meta?.color || BRANCH_COLORS[branchIndex % BRANCH_COLORS.length]

  return {
    id: node.id,
    topic: node.text,
    expanded: node.collapsed !== true,
    note: node.meta?.note,
    branchColor: depth === 1 ? nextColor : undefined,
    direction: depth === 1 ? (nextSide === "left" ? 0 : 1) : undefined,
    metadata: {
      color: nextColor,
      side: nextSide,
    },
    children: node.children.map((child, index) => toMindElixirNode(child, depth + 1, index)),
  }
}

function toMindMapNode(node: NodeObj, depth: number): MindMapNode {
  const side =
    depth === 1
      ? node.direction === 0
        ? "left"
        : "right"
      : node.metadata && typeof node.metadata === "object" && "side" in node.metadata
        ? String((node.metadata as Record<string, unknown>).side) === "left"
          ? "left"
          : "right"
        : undefined
  const color =
    (typeof node.branchColor === "string" && node.branchColor) ||
    (node.metadata && typeof node.metadata === "object" && "color" in node.metadata
      ? String((node.metadata as Record<string, unknown>).color || "")
      : "") ||
    undefined

  return {
    id: node.id,
    text: node.topic,
    collapsed: node.expanded === false,
    meta: {
      ...(color ? { color } : {}),
      ...(node.note ? { note: node.note } : {}),
      ...(side ? { side } : {}),
    },
    children: (node.children || []).map((child) => toMindMapNode(child, depth + 1)),
  }
}

export function toMindElixirData(document: MindMapDocument): MindElixirData {
  return {
    direction: 2,
    nodeData: toMindElixirNode(ensureBalancedRootDirections(document.root), 0),
  }
}

export function fromMindElixirData(
  data: MindElixirData,
  base: MindMapDocument
): MindMapDocument {
  return {
    ...base,
    root: ensureBalancedRootDirections(toMindMapNode(data.nodeData, 0)),
    updated_at: new Date().toISOString(),
  }
}
