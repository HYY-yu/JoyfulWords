import test from "node:test"
import assert from "node:assert/strict"

import {
  getMaterialImageFromDataTransfer,
  MATERIAL_IMAGE_DATA_TRANSFER_TYPE,
} from "@/lib/editor-drag-drop"

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
