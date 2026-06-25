"use client"

import { useEffect, useRef, useState } from "react"
import type { MaterialClueEdge } from "./types"
import { bezierPath } from "./geometry"

interface ConnectionProps {
  edge: MaterialClueEdge
}

export function Connection({ edge }: ConnectionProps) {
  const pathRef = useRef<SVGPathElement>(null)
  const cometRef = useRef<SVGGElement>(null)
  const [pathLen, setPathLen] = useState(0)
  const [showRipple, setShowRipple] = useState(false)

  const d = bezierPath(edge.from, edge.to)
  const loading = edge.state === "loading"

  useEffect(() => {
    const path = pathRef.current
    if (!path) return
    const measure = () => {
      const len = path.getTotalLength()
      if (len > 0) setPathLen(len)
    }
    measure()
    const id = requestAnimationFrame(measure)
    return () => cancelAnimationFrame(id)
  }, [d])

  useEffect(() => {
    if (!loading || pathLen === 0) return
    const path = pathRef.current
    const comet = cometRef.current
    if (!path || !comet) return

    let raf = 0
    let start = 0
    const duration = 1100
    const dots = comet.querySelectorAll<SVGCircleElement>("circle")

    const tick = (time: number) => {
      if (!start) start = time
      const phase = ((time - start) % duration) / duration
      for (let i = 0; i < dots.length; i += 1) {
        const ratio = i / Math.max(dots.length - 1, 1)
        const position = phase - ratio * 0.12
        if (position < 0 || position > 1) {
          dots[i].setAttribute("opacity", "0")
          continue
        }
        const point = path.getPointAtLength(position * pathLen)
        dots[i].setAttribute("cx", String(point.x))
        dots[i].setAttribute("cy", String(point.y))
        dots[i].setAttribute("opacity", String((1 - ratio) * 0.95))
      }
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [loading, pathLen])

  useEffect(() => {
    if (edge.state !== "settled") return
    setShowRipple(true)
    const id = window.setTimeout(() => setShowRipple(false), 750)
    return () => window.clearTimeout(id)
  }, [edge.state])

  const glowColor = loading ? "var(--jw-accent)" : "color-mix(in srgb, var(--jw-accent) 78%, #ffffff)"

  return (
    <g>
      <defs>
        <linearGradient
          id={`clue-grad-${edge.id}`}
          gradientUnits="userSpaceOnUse"
          x1={edge.from.x}
          y1={edge.from.y}
          x2={edge.to.x}
          y2={edge.to.y}
        >
          <stop offset="0%" stopColor="color-mix(in srgb, var(--jw-accent) 78%, #ffffff)" stopOpacity="0.96" />
          <stop offset="100%" stopColor="var(--jw-accent)" stopOpacity="0.82" />
        </linearGradient>
        <filter id={`clue-blur-${edge.id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <path
        className={loading ? "material-clue-beam-draw material-clue-beam-draw-glow" : undefined}
        d={d}
        fill="none"
        stroke={glowColor}
        strokeWidth={loading ? 8 : 6}
        strokeOpacity={loading ? 0.32 : 0.2}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        filter={`url(#clue-blur-${edge.id})`}
        pathLength={loading ? 1 : undefined}
      />
      <path
        ref={pathRef}
        className={loading ? "material-clue-beam-draw material-clue-beam-draw-core" : undefined}
        d={d}
        fill="none"
        stroke={`url(#clue-grad-${edge.id})`}
        strokeWidth={loading ? 2.2 : 1.5}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        pathLength={loading ? 1 : undefined}
      />

      {loading ? (
        <path
          className="material-clue-beam-flow"
          d={d}
          fill="none"
          stroke="color-mix(in srgb, var(--jw-accent) 38%, #ffffff)"
          strokeWidth={1.4}
          strokeLinecap="round"
          strokeOpacity={0.72}
          vectorEffect="non-scaling-stroke"
        />
      ) : null}

      {loading && pathLen > 0 ? (
        <g ref={cometRef} className="material-clue-beam-comet" filter={`url(#clue-blur-${edge.id})`}>
          {[0, 1, 2, 3, 4].map((index) => (
            <circle
              key={index}
              cx={edge.from.x}
              cy={edge.from.y}
              r={4.5 - index * 0.7}
              fill={index === 0 ? "#ffffff" : "var(--jw-accent)"}
              opacity={0}
            />
          ))}
        </g>
      ) : null}

      <circle cx={edge.from.x} cy={edge.from.y} r={loading ? 3 : 2} fill="var(--jw-accent)" opacity={loading ? 0.95 : 0.62}>
        {loading ? <animate attributeName="r" values="2;4;2" dur="1.1s" repeatCount="indefinite" /> : null}
      </circle>

      {loading ? (
        <circle
          className="material-clue-beam-terminal"
          cx={edge.to.x}
          cy={edge.to.y}
          r={4}
          fill="var(--jw-accent)"
          opacity={0.85}
          filter={`url(#clue-blur-${edge.id})`}
        />
      ) : null}

      {showRipple ? (
        <circle cx={edge.to.x} cy={edge.to.y} fill="none" stroke="var(--jw-accent)" strokeWidth={2}>
          <animate attributeName="r" values="8;34" dur="0.75s" fill="freeze" />
          <animate attributeName="opacity" values="0.72;0" dur="0.75s" fill="freeze" />
        </circle>
      ) : null}

      {edge.state === "settled" ? (
        <circle cx={edge.to.x} cy={edge.to.y} r={3} fill="var(--jw-accent)" opacity={0.72} />
      ) : null}
    </g>
  )
}
