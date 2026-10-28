type ImageChecks = {
  filenameMatches: boolean | null
  extensionMatches: boolean | null
  aspectRatioMatches: boolean | null
  sizeDifferenceAcceptable: boolean | null
}

type ImageAlternative = {
  newPath: string
  oldPath: string | null
  checks: ImageChecks
}

type ImagePathPair = {
  newPath: string
  oldPath: string | null
}

type CheckSummary = {
  passed: number
  failed: number
  skipped: number
}

type ImageAlternativeSummary = {
  total: number
  matched: number
  unmatched: number
  checks: {
    filenameMatches: CheckSummary
    extensionMatches: CheckSummary
    aspectRatioMatches: CheckSummary
    sizeDifferenceAcceptable: CheckSummary
  }
}

export type ImageAlternativeResult = {
  results: ImageAlternative[]
  summary: ImageAlternativeSummary
}

type ImageMetadata = {
  width: number
  height: number
  size: number
}
