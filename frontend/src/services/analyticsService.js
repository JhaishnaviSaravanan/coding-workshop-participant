import { API_BASES, getAuthHeaders, handleJsonResponse } from './api'

async function fetchAnalytics(path) {
  const response = await fetch(`${API_BASES.analytics}${path}`, {
    headers: {
      ...getAuthHeaders(),
    },
  })

  return handleJsonResponse(response)
}

export function fetchHighPotential() {
  return fetchAnalytics('/high-potential')
}

export function fetchSkillGaps() {
  return fetchAnalytics('/skill-gaps')
}

export function fetchAttritionRisk() {
  return fetchAnalytics('/attrition-risk')
}

export function fetchSkillDistribution() {
  return fetchAnalytics('/skill-distribution')
}

export function fetchTeamPerformance() {
  return fetchAnalytics('/team-performance')
}