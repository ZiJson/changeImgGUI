export const LocalImg = ({
  src,
  ...props
}: React.ComponentProps<'img'>) => {
  if (!src) {
    return <img {...props} />
  }

  const imageUrl = `local-source://image?path=${encodeURIComponent(src)}`

  return <img {...props} src={imageUrl} />
}