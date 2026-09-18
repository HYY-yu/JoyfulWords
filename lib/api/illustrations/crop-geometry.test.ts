import test from "node:test"
import assert from "node:assert/strict"
import { centerCrop } from "./crop-geometry"
test("center crop fits every output without stretching or losing the source center", () => {
  for (const [sw, sh] of [[1024,1024],[1536,1024],[768,1024]]) {
    for (const [w,h] of [[1200,630],[900,383],[1242,1660],[1280,720],[1080,1080]]) {
      const r = centerCrop(sw,sh,w,h)
      assert.ok(r.sx >= -1e-8 && r.sy >= -1e-8)
      assert.ok(r.sx + r.sw <= sw + 1e-8 && r.sy + r.sh <= sh + 1e-8)
      assert.ok(Math.abs(r.sw/r.sh-w/h) < 1e-8)
      assert.ok(Math.abs(r.sx+r.sw/2-sw/2) < 1e-8)
      assert.ok(Math.abs(r.sy+r.sh/2-sh/2) < 1e-8)
    }
  }
  assert.throws(() => centerCrop(0,1024,900,383))
})
