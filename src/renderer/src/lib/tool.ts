export const getNameFromPath = (path: string): string => {
  return path.split(/[\\/]/).filter(Boolean).at(-1) ?? ''
}
