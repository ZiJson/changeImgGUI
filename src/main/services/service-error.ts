export const errorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) return error.message
  return String(error)
}

export const serviceError = (message: string, cause: unknown): Error =>
  new Error(message, { cause })

export const isEnoent = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  (error as { code?: unknown }).code === 'ENOENT'
