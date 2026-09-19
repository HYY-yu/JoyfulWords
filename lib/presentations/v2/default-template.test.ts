import test from "node:test"
import assert from "node:assert/strict"
import { defaultPresentationTemplate } from "./default-template"
import type { PPTTemplate } from "@/lib/api/presentations/v2/types"
test("select latest published style mapping without mutating catalog", () => {
 const templates = [1,3,2].map(version => ({template_key:"minimal-business",version,metadata:{style_slug:"minimal-business"}} as PPTTemplate))
 assert.equal(defaultPresentationTemplate(templates,"minimal-business")?.version,3)
 assert.deepEqual(templates.map(t=>t.version),[1,3,2])
 assert.equal(defaultPresentationTemplate(templates,"hand-drawn"),null)
 assert.equal(defaultPresentationTemplate(templates),null)
})
