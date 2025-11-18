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
  const apiUrl = import.meta.env.VITE_API_URL || '/api'
  // Remove /api suffix if present to get base URL
  const baseUrl = apiUrl.replace(/\/api\/?$/, '')
  return `${baseUrl}/uploads/${filename}`
}

export const getDocumentUrl = (filename: string): string => {
  const apiUrl = import.meta.env.VITE_API_URL || '/api'
  // Remove /api suffix if present to get base URL
  const baseUrl = apiUrl.replace(/\/api\/?$/, '')
  return `${baseUrl}/uploads/${filename}`
}

export const stripHtmlTags = (html: string): string => {
  return html.replace(/<[^>]*>/g, '').trim()
}
