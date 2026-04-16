import { API_BASES, getAuthHeaders, handleJsonResponse } from './api'

export async function fetchEmployees() {
  const response = await fetch(`${API_BASES.employee}/employees`, {
    headers: {
      ...getAuthHeaders(),
    },
  })

  return handleJsonResponse(response)
}

export async function createEmployee(payload) {
  const response = await fetch(`${API_BASES.employee}/employees`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
  })

  return handleJsonResponse(response)
}

export async function fetchTrainingRecords() {
  const response = await fetch(`${API_BASES.employee}/training-records`, {
    headers: {
      ...getAuthHeaders(),
    },
  })

  return handleJsonResponse(response)
}