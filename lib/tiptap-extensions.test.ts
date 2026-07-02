import test from "node:test"
import assert from "node:assert/strict"
import { MarkdownManager } from "@tiptap/markdown"

import { normalizeParsedMarkdownContentForEditor } from "./tiptap-markdown-content"
import { CustomImage } from "./tiptap-extensions"

const markdownManager = new MarkdownManager({
  extensions: [CustomImage],
})

const infographicImageMarkdown = "![](https://cdn.joyword.link/infographic/cdf59391bcb8440b1590789c7e2beb13.png)"
const materialImageMarkdown = "![SCR-20260701-slhv.png](https://cdn.joyword.link/materials/2/ee6ab10ef201284483b5e453f2f84d5e.png)"

const infographicImageParagraph = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [
        {
          type: "customImage",
          attrs: {
            src: "https://cdn.joyword.link/infographic/cdf59391bcb8440b1590789c7e2beb13.png",
            title: null,
            alt: "",
          },
          content: undefined,
        },
      ],
    },
  ],
}

const materialImageParagraph = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [
        {
          type: "customImage",
          attrs: {
            src: "https://cdn.joyword.link/materials/2/ee6ab10ef201284483b5e453f2f84d5e.png",
            title: null,
            alt: "SCR-20260701-slhv.png",
          },
          content: undefined,
        },
      ],
    },
  ],
}

test("parses empty-alt markdown images into custom image nodes", () => {
  assert.deepEqual(markdownManager.parse(infographicImageMarkdown), infographicImageParagraph)
})

test("parses markdown images with alt text into custom image nodes", () => {
  assert.deepEqual(markdownManager.parse(materialImageMarkdown), materialImageParagraph)
})

test("lifts standalone custom image paragraphs before editor insertion", () => {
  assert.deepEqual(
    normalizeParsedMarkdownContentForEditor(markdownManager.parse(infographicImageMarkdown)),
    [
      {
        type: "customImage",
        attrs: {
          src: "https://cdn.joyword.link/infographic/cdf59391bcb8440b1590789c7e2beb13.png",
          title: null,
          alt: "",
        },
      },
    ]
  )

  assert.deepEqual(
    normalizeParsedMarkdownContentForEditor(markdownManager.parse(materialImageMarkdown)),
    [
      {
        type: "customImage",
        attrs: {
          src: "https://cdn.joyword.link/materials/2/ee6ab10ef201284483b5e453f2f84d5e.png",
          title: null,
          alt: "SCR-20260701-slhv.png",
        },
      },
    ]
  )
})
