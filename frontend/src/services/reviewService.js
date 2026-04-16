import { API_BASES, getAuthHeaders, handleJsonResponse } from './api'

export async function fetchReviews() {
  const response = await fetch(`${API_BASES.review}/reviews`, {
    headers: {
      ...getAuthHeaders(),
    },
  })

  return handleJsonResponse(response)
}

export async function createReview(payload) {
  const response = await fetch(`${API_BASES.review}/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
  })

  return handleJsonResponse(response)
}