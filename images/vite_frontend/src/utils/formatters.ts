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
  
  if (window.location.href.includes("localhost")) {
    const apiUrl = import.meta.env.VITE_API_URL || '/api'
    // Remove /api suffix if present to get base URL
    const baseUrl = apiUrl.replace(/\/api\/?$/, '')
    console.log(baseUrl)
    return `${baseUrl}/uploads/${filename}`
  } else {
    console.log(import.meta.env.VITE_API_URL )
    if(import.meta.env.VITE_API_URL ) {
      return `${import.meta.env.VITE_API_URL}/uploads/${filename}`
    } else {
      return ''
    }
  }
}

export const getDocumentUrl = (filename: string): string => {
  const apiUrl = import.meta.env.VITE_API_URL || '/api'
  // Remove /api suffix if present to get base URL
  const baseUrl = apiUrl.replace(/\/api\/?$/, '')
  console.log(baseUrl)
  return `${baseUrl}/uploads/${filename}`
}

export const stripHtmlTags = (html: string): string => {
  return html.replace(/<[^>]*>/g, '').trim()
}
