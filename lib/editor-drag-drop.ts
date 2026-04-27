export const MATERIAL_IMAGE_DATA_TRANSFER_TYPE =
  "application/x-joyfulwords-material-image"

interface DataTransferReader {
  getData(format: string): string
  files?: FileListReader | null
  items?: DataTransferItemListReader | null
}

interface ClipboardDataReader {
  files?: FileListReader | null
  items?: DataTransferItemListReader | null
}

interface FileListReader {
  length: number
  item?: (index: number) => File | null
  [index: number]: File
}

interface DataTransferItemReader {
  kind?: string
  type?: string
  getAsFile?: () => File | null
}

interface DataTransferItemListReader {
  length: number
  item?: (index: number) => DataTransferItemReader | null
  [index: number]: DataTransferItemReader
}

export function getMaterialImageFromDataTransfer(
  dataTransfer: DataTransferReader
): string | null {
  const imageUrl = dataTransfer
    .getData(MATERIAL_IMAGE_DATA_TRANSFER_TYPE)
    .trim()

  return imageUrl.length > 0 ? imageUrl : null
}

function getFileAt(files: FileListReader, index: number): File | null {
  if (typeof files.item === "function") {
    return files.item(index)
  }
  return files[index] ?? null
}

function getTransferItemAt(
  items: DataTransferItemListReader,
  index: number
): DataTransferItemReader | null {
  if (typeof items.item === "function") {
    return items.item(index)
  }
  return items[index] ?? null
}

function findFirstImageFileInFileList(
  files: FileListReader | null | undefined
): File | null {
  if (!files || files.length === 0) {
    return null
  }

  for (let index = 0; index < files.length; index += 1) {
    const file = getFileAt(files, index)
    if (file?.type?.startsWith("image/")) {
      return file
    }
  }

  return null
}

function findFirstImageFileInTransferItems(
  items: DataTransferItemListReader | null | undefined
): File | null {
  if (!items || items.length === 0) {
    return null
  }

  for (let index = 0; index < items.length; index += 1) {
    const transferItem = getTransferItemAt(items, index)
    if (!transferItem) {
      continue
    }

    const isImageFile =
      transferItem.kind === "file" &&
      typeof transferItem.type === "string" &&
      transferItem.type.startsWith("image/")

    if (!isImageFile || typeof transferItem.getAsFile !== "function") {
      continue
    }

    const file = transferItem.getAsFile()
    if (file) {
      return file
    }
  }

  return null
}

export function getImageFileFromDataTransfer(
  dataTransfer: DataTransferReader
): File | null {
  return (
    findFirstImageFileInFileList(dataTransfer.files) ??
    findFirstImageFileInTransferItems(dataTransfer.items)
  )
}

export function getImageFileFromClipboardData(
  clipboardData: ClipboardDataReader
): File | null {
  return (
    findFirstImageFileInFileList(clipboardData.files) ??
    findFirstImageFileInTransferItems(clipboardData.items)
  )
}
