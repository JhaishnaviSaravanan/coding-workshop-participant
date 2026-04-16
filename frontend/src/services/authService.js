import { API_BASES, getAuthHeaders, handleJsonResponse } from './api'

export async function loginUser(email, password) {
  const response = await fetch(`${API_BASES.auth}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })

  return handleJsonResponse(response)
}

export async function createUser(payload) {
  const response = await fetch(`${API_BASES.auth}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
  })

  return handleJsonResponse(response)
}