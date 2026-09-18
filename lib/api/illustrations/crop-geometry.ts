// Center crop preserves aspect ratio; the browser scales this rectangle to the exact output pixels.
export function centerCrop(sourceWidth: number, sourceHeight: number, width: number, height: number) {
  if (![sourceWidth, sourceHeight, width, height].every((n) => Number.isFinite(n) && n > 0)) throw new Error("Invalid image dimensions")
  const scale = Math.max(width / sourceWidth, height / sourceHeight)
  const sw = width / scale, sh = height / scale
  return { sx: (sourceWidth - sw) / 2, sy: (sourceHeight - sh) / 2, sw, sh }
}
