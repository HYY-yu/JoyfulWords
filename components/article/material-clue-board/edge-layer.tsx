"use client"

import type { MaterialClueEdge, Point } from "./types"
import { Connection } from "./connection"

interface EdgeLayerProps {
  edges: MaterialClueEdge[]
  pan: Point
  scale: number
}

export function EdgeLayer({ edges, pan, scale }: EdgeLayerProps) {
  return (
    <svg
      className="pointer-events-none absolute inset-0"
      width="100%"
      height="100%"
      style={{ overflow: "visible" }}
      aria-hidden="true"
    >
      <g transform={`translate(${pan.x} ${pan.y}) scale(${scale})`}>
        {edges.map((edge) => (
          <Connection key={edge.id} edge={edge} />
        ))}
      </g>
    </svg>
  )
}

