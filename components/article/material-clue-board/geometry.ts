import type { Point } from "./types"

export const NODE_FOOTPRINT = {
  width: 340,
  height: 420,
  gap: 56,
}

export interface OccupiedRect {
  center: Point
  width: number
  height: number
}

export function dist(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

export function bezierPath(from: Point, to: Point): string {
  const dx = to.x - from.x
  let c1: Point
  let c2: Point

  if (Math.abs(dx) > Math.abs(to.y - from.y)) {
    c1 = { x: from.x + dx * 0.5, y: from.y }
    c2 = { x: to.x - dx * 0.5, y: to.y }
  } else {
    c1 = { x: from.x, y: from.y + (to.y - from.y) * 0.5 }
    c2 = { x: to.x, y: to.y - (to.y - from.y) * 0.5 }
  }

  return `M ${from.x} ${from.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${to.x} ${to.y}`
}

function inflatedBounds(rect: OccupiedRect, gap = 0) {
  const halfW = rect.width / 2 + gap
  const halfH = rect.height / 2 + gap
  return {
    left: rect.center.x - halfW,
    right: rect.center.x + halfW,
    top: rect.center.y - halfH,
    bottom: rect.center.y + halfH,
  }
}

export function rectsOverlap(a: OccupiedRect, b: OccupiedRect, gap: number) {
  const ab = inflatedBounds(a, gap)
  const bb = inflatedBounds(b, gap)
  return !(
    ab.right <= bb.left ||
    ab.left >= bb.right ||
    ab.bottom <= bb.top ||
    ab.top >= bb.bottom
  )
}

function angleDelta(a: number, b: number) {
  return Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)))
}

function candidateScore(
  point: Point,
  sourceCenter: Point,
  preferredAngle: number,
  angle: number,
  ringIndex: number
) {
  return (
    angleDelta(angle, preferredAngle) * 260 +
    ringIndex * 120 +
    dist(sourceCenter, point) * 0.08
  )
}

export function placeTargetNode(
  sourceCenter: Point,
  anchor: Point,
  occupiedRects: OccupiedRect[],
  footprint: OccupiedRect = {
    center: { x: 0, y: 0 },
    width: NODE_FOOTPRINT.width,
    height: NODE_FOOTPRINT.height,
  }
): Point {
  const vx = anchor.x - sourceCenter.x
  const vy = anchor.y - sourceCenter.y
  const len = Math.hypot(vx, vy) || 1
  const ux = vx / len
  const uy = vy / len
  const preferredAngle = Math.atan2(uy, ux)
  const newSize = {
    width: footprint.width,
    height: footprint.height,
  }

  const baseDistance =
    Math.max(NODE_FOOTPRINT.width, NODE_FOOTPRINT.height) * 0.78 +
    NODE_FOOTPRINT.gap
  const angleOffsets = [
    0,
    -Math.PI / 6,
    Math.PI / 6,
    -Math.PI / 3,
    Math.PI / 3,
    -Math.PI / 2,
    Math.PI / 2,
    (-Math.PI * 2) / 3,
    (Math.PI * 2) / 3,
    Math.PI,
  ]

  const candidates: Array<{ point: Point; score: number }> = []
  for (let ring = 0; ring < 8; ring += 1) {
    const radius = baseDistance + ring * 130
    for (const offset of angleOffsets) {
      const angle = preferredAngle + offset + ring * 0.18
      const point = {
        x: sourceCenter.x + Math.cos(angle) * radius,
        y: sourceCenter.y + Math.sin(angle) * radius,
      }
      candidates.push({
        point,
        score: candidateScore(point, sourceCenter, preferredAngle, angle, ring),
      })
    }
  }

  candidates.sort((a, b) => a.score - b.score)

  for (const { point } of candidates) {
    const rect = {
      center: point,
      ...newSize,
    }
    const overlaps = occupiedRects.some((occupied) =>
      rectsOverlap(rect, occupied, NODE_FOOTPRINT.gap)
    )
    if (!overlaps) return point
  }

  let radius = baseDistance + candidates.length * 18
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const point = {
      x: sourceCenter.x + ux * radius,
      y: sourceCenter.y + uy * radius,
    }
    const rect = {
      center: point,
      ...newSize,
    }
    if (!occupiedRects.some((occupied) => rectsOverlap(rect, occupied, NODE_FOOTPRINT.gap))) {
      return point
    }
    radius += 160
  }

  return {
    x: sourceCenter.x + ux * radius,
    y: sourceCenter.y + uy * radius,
  }
}

export function screenToCanvas(origin: Point, pan: Point, scale: number): Point {
  return {
    x: (origin.x - pan.x) / scale,
    y: (origin.y - pan.y) / scale,
  }
}

export function normalizeClueHref(href: string | undefined): string {
  if (!href) return ""
  try {
    return decodeURIComponent(href).trim()
  } catch {
    return href.trim()
  }
}

