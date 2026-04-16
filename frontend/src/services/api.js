export const API_BASES = {
  auth: '/api/auth-api',
  employee: '/api/employee-api',
  review: '/api/review-api',
  analytics: '/api/analytics-api',
}

export function getAuthHeaders() {
  const token = localStorage.getItem('token')

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {}
}

export async function handleJsonResponse(response) {
  const text = await response.text()
  let data = null

  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = null
  }

  if (!response.ok) {
    let message = 'Request failed'

    if (typeof data?.detail === 'string') {
      message = data.detail
    } else if (Array.isArray(data?.detail)) {
      message = data.detail
        .map((item) => item.msg || item.message || JSON.stringify(item))
        .join(', ')
    } else if (typeof data?.message === 'string') {
      message = data.message
    } else if (text) {
      message = text
    }

    throw new Error(message)
  }

  return data
}