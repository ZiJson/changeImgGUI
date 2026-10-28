export const LocalImg = ({ src, ...props }: React.ComponentProps<'img'>) => {
  const imageUrl = `local-source://${src}`
  return <img {...props} src={imageUrl} />
}
