export type PresentationTaskContract = "v1" | "v2"

interface PresentationTaskContractSource {
  contract_version?: string
  generation_id?: number
}

export function getPresentationTaskContract(
  detail: PresentationTaskContractSource
): PresentationTaskContract {
  if (detail.contract_version === "v2" || typeof detail.generation_id === "number") {
    return "v2"
  }
  return "v1"
}

