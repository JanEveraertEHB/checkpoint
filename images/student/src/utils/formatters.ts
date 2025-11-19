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
  const extra = "/uploads/" + filename;
  const l = location;

  if (/^(localhost|127\.0\.0\.1|::1)$/.test(l.hostname)) {
    return "/api" + extra;
  } else {
    const newHost = "api." + l.hostname;
    const base = `${l.protocol}//${newHost}`;
    return base + extra;
  }

}

export const getDocumentUrl = (filename: string): string => {
  const extra = "/uploads/" + filename;
  const l = location;

  if (/^(localhost|127\.0\.0\.1|::1)$/.test(l.hostname)) {
    return "/api" + extra;
  } else {
    const newHost = "api." + l.hostname;
    const base = `${l.protocol}//${newHost}`;
    return base + extra;
  }
}

export const stripHtmlTags = (html: string): string => {
  return html.replace(/<[^>]*>/g, '').trim()
}
