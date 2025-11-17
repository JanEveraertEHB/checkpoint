export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const getImageUrl = (filename: string): string => {
  return `/uploads/${filename}`
}

export const stripHtmlTags = (html: string): string => {
  return html.replace(/<[^>]*>/g, '').trim()
}
