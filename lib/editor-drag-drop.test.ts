import test from "node:test"
import assert from "node:assert/strict"

import {
  getImageFileFromClipboardData,
  getImageFileFromDataTransfer,
  getMaterialImageFromDataTransfer,
  MATERIAL_IMAGE_DATA_TRANSFER_TYPE,
} from "@/lib/editor-drag-drop"

function createMockFile(name: string, type: string): File {
  return {
    name,
    type,
    size: 1234,
  } as File
}

function createMockFileList(files: File[]) {
  return {
    length: files.length,
    item(index: number) {
      return files[index] ?? null
    },
  }
}

function createMockTransferItems(items: Array<{ file: File | null; type: string }>) {
  return {
    length: items.length,
    item(index: number) {
      const current = items[index]
      if (!current) return null
      return {
        kind: "file",
        type: current.type,
        getAsFile() {
          return current.file
        },
      }
    },
  }
}

test("reads material image url from custom drag data type", () => {
  const dataTransfer = {
    getData(format: string) {
      return format === MATERIAL_IMAGE_DATA_TRANSFER_TYPE
        ? " https://cdn.example.com/material.png "
        : ""
    },
  }

  assert.equal(
    getMaterialImageFromDataTransfer(dataTransfer),
    "https://cdn.example.com/material.png"
  )
})

test("returns null when custom material image drag data is absent", () => {
  const dataTransfer = {
    getData() {
      return ""
    },
  }

  assert.equal(getMaterialImageFromDataTransfer(dataTransfer), null)
})

test("reads first image file from drop dataTransfer.files", () => {
  const imageFile = createMockFile("cover.png", "image/png")
  const nonImageFile = createMockFile("notes.txt", "text/plain")
  const dataTransfer = {
    getData() {
      return ""
    },
    files: createMockFileList([nonImageFile, imageFile]),
  }

  assert.equal(getImageFileFromDataTransfer(dataTransfer), imageFile)
})

test("reads image file from drop dataTransfer.items when files is empty", () => {
  const imageFile = createMockFile("from-items.jpg", "image/jpeg")
  const dataTransfer = {
    getData() {
      return ""
    },
    files: createMockFileList([]),
    items: createMockTransferItems([
      { file: null, type: "text/plain" },
      { file: imageFile, type: "image/jpeg" },
    ]),
  }

  assert.equal(getImageFileFromDataTransfer(dataTransfer), imageFile)
})

test("returns null when drop payload has no image file", () => {
  const dataTransfer = {
    getData() {
      return ""
    },
    files: createMockFileList([createMockFile("report.pdf", "application/pdf")]),
  }

  assert.equal(getImageFileFromDataTransfer(dataTransfer), null)
})

test("reads image file from clipboard data", () => {
  const clipboardImage = createMockFile("clipboard.webp", "image/webp")
  const clipboardData = {
    files: createMockFileList([]),
    items: createMockTransferItems([
      { file: clipboardImage, type: "image/webp" },
    ]),
  }

  assert.equal(getImageFileFromClipboardData(clipboardData), clipboardImage)
})
