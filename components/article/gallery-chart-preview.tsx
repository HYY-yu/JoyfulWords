"use client"

import { forwardRef, useEffect, useRef, useState } from "react"
import { JoyChartRenderer, type JoyChartRendererHandle } from "@/components/editor/joy-chart-renderer"
import type { JoyChartSpec } from "@/lib/api/echarts/types"

// Lay out the chart at a full-size 4:3 canvas before scaling the entire result.
// Rendering directly at tile size squeezes the plot between fixed-size labels,
// legends and padding; CSS scaling preserves their proportions and PNG quality.
const CANVAS_WIDTH = 640
const CANVAS_HEIGHT = 480

export const GalleryChartPreview = forwardRef<JoyChartRendererHandle, { spec: JoyChartSpec }>(
  function GalleryChartPreview({ spec }, ref) {
    const frameRef = useRef<HTMLDivElement>(null)
    const [scale, setScale] = useState(0)

    useEffect(() => {
      const frame = frameRef.current
      if (!frame) return
      const observer = new ResizeObserver(([entry]) => {
        const { width, height } = entry.contentRect
        setScale(Math.min(width / CANVAS_WIDTH, height / CANVAS_HEIGHT))
      })
      observer.observe(frame)
      return () => observer.disconnect()
    }, [])

    return <div ref={frameRef} className="absolute inset-0 overflow-hidden">
      <div
        className="absolute left-1/2 top-1/2 origin-center"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT, transform: `translate(-50%, -50%) scale(${scale})` }}
      >
        <JoyChartRenderer ref={ref} spec={spec} />
      </div>
    </div>
  }
)
