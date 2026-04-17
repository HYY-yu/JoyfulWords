export const MATERIAL_IMAGE_DATA_TRANSFER_TYPE =
  "application/x-joyfulwords-material-image"

interface DataTransferReader {
  getData(format: string): string
}

export function getMaterialImageFromDataTransfer(
  dataTransfer: DataTransferReader
): string | null {
  const imageUrl = dataTransfer
    .getData(MATERIAL_IMAGE_DATA_TRANSFER_TYPE)
    .trim()

  return imageUrl.length > 0 ? imageUrl : null
}
