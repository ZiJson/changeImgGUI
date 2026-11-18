export type ImageChecks = {
  filenameMatches: boolean | null
  extensionMatches: boolean | null
  aspectRatioMatches: boolean | null
  sizeDifferenceAcceptable: boolean | null
}

export type ImageAlternative = {
  newPath: string
  oldPath: string | null
  checks: ImageChecks
}

export type ImagePathPair = {
  newPath: string
  oldPath: string | null
}

export type CheckSummary = {
  passed: number
  failed: number
  skipped: number
}

export type ImageAlternativeSummary = {
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

export type ImageMetadata = {
  width: number
  height: number
  size: number
}
