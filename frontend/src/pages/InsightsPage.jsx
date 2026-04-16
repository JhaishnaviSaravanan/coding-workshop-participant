import { useEffect, useMemo, useState } from 'react'
import PageShell from '../components/PageShell'
import {
  fetchAttritionRisk,
  fetchHighPotential,
  fetchSkillDistribution,
  fetchSkillGaps,
  fetchTeamPerformance,
} from '../services/analyticsService'

function safeArray(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.data)) return data.data
  return []
}

function display(value, fallback = 'N/A') {
  if (value === null || value === undefined || value === '') return fallback
  return value
}

export default function InsightsPage() {
  const [loading, setLoading] = useState(true)
  const [highPotential, setHighPotential] = useState([])
  const [skillGaps, setSkillGaps] = useState([])
  const [attritionRisk, setAttritionRisk] = useState([])
  const [skillDistribution, setSkillDistribution] = useState([])
  const [teamPerformance, setTeamPerformance] = useState([])

  useEffect(() => {
    async function loadInsights() {
      setLoading(true)

      const results = await Promise.allSettled([
        fetchHighPotential(),
        fetchSkillGaps(),
        fetchAttritionRisk(),
        fetchSkillDistribution(),
        fetchTeamPerformance(),
      ])

      const [
        highPotentialRes,
        skillGapsRes,
        attritionRiskRes,
        skillDistributionRes,
        teamPerformanceRes,
      ] = results

      setHighPotential(
        highPotentialRes.status === 'fulfilled'
          ? safeArray(highPotentialRes.value)
          : []
      )

      setSkillGaps(
        skillGapsRes.status === 'fulfilled'
          ? safeArray(skillGapsRes.value)
          : []
      )

      setAttritionRisk(
        attritionRiskRes.status === 'fulfilled'
          ? safeArray(attritionRiskRes.value)
          : []
      )

      setSkillDistribution(
        skillDistributionRes.status === 'fulfilled'
          ? safeArray(skillDistributionRes.value)
          : []
      )

      setTeamPerformance(
        teamPerformanceRes.status === 'fulfilled'
          ? safeArray(teamPerformanceRes.value)
          : []
      )

      const failures = results.filter((item) => item.status === 'rejected')
      if (failures.length > 0) {
        console.error('Insights load failures:', failures)
      }

      setLoading(false)
    }

    loadInsights()
  }, [])

  const highPotentialRows = useMemo(() => highPotential.slice(0, 8), [highPotential])
  const skillGapRows = useMemo(() => skillGaps.slice(0, 8), [skillGaps])
  const attritionRows = useMemo(() => attritionRisk.slice(0, 8), [attritionRisk])
  const skillRows = useMemo(() => skillDistribution.slice(0, 8), [skillDistribution])
  const teamRows = useMemo(() => teamPerformance.slice(0, 8), [teamPerformance])

  return (
    <PageShell
      title="Organization Insights"
      subtitle="Monitor promotion readiness, skill gaps, attrition risk, and team performance across the organization."
    >
      <div className="cards-grid insights-cards-grid">
        <div className="stat-card insights-stat-card">
          <div className="stat-title">High-Potential Employees</div>
          <div className="stat-value">{highPotential.length}</div>
          <div className="stat-subtitle">Promotion-ready talent</div>
        </div>

        <div className="stat-card insights-stat-card">
          <div className="stat-title">Critical Skill Gaps</div>
          <div className="stat-value">{skillGaps.length}</div>
          <div className="stat-subtitle">Capability gaps identified</div>
        </div>

        <div className="stat-card insights-stat-card">
          <div className="stat-title">Attrition Risk Cases</div>
          <div className="stat-value">{attritionRisk.length}</div>
          <div className="stat-subtitle">Employees requiring attention</div>
        </div>

        <div className="stat-card insights-stat-card">
          <div className="stat-title">Skills Tracked</div>
          <div className="stat-value">{skillDistribution.length}</div>
          <div className="stat-subtitle">Distinct skill entries returned</div>
        </div>
      </div>

      {loading ? <div className="panel">Loading insights...</div> : null}

      {!loading ? (
        <>
          <div className="panel-grid insights-panel-grid">
            <section className="panel insights-panel">
              <h3>High-Potential Employees</h3>

              {highPotentialRows.length === 0 ? (
                <p>No high-potential employees available.</p>
              ) : (
                <div className="simple-table">
                  <div className="table-head insights-two-col">
                    <span>Name</span>
                    <span>Status</span>
                  </div>

                  {highPotentialRows.map((item, index) => (
                    <div className="table-row insights-two-col" key={item.employee_id ?? index}>
                      <span>{display(item.name)}</span>
                      <span>{display(item.status || item.readiness, 'High Potential')}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="panel insights-panel">
              <h3>Critical Skill Gaps</h3>

              {skillGapRows.length === 0 ? (
                <p>No critical skill gaps available.</p>
              ) : (
                <div className="simple-table">
                  <div className="table-head">
                    <span>Name</span>
                    <span>Skill</span>
                    <span>Gap</span>
                  </div>

                  {skillGapRows.map((item, index) => (
                    <div
                      className="table-row"
                      key={`${item.employee_id ?? 'emp'}-${item.skill ?? 'skill'}-${index}`}
                    >
                      <span>{display(item.name)}</span>
                      <span>{display(item.skill)}</span>
                      <span>{display(item.gap || item.severity)}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="panel-grid insights-panel-grid">
            <section className="panel insights-panel">
              <h3>Attrition Risk Watchlist</h3>

              {attritionRows.length === 0 ? (
                <p>No attrition risk data available.</p>
              ) : (
                <div className="simple-table">
                  <div className="table-head insights-two-col">
                    <span>Name</span>
                    <span>Risk</span>
                  </div>

                  {attritionRows.map((item, index) => (
                    <div className="table-row insights-two-col" key={item.employee_id ?? index}>
                      <span>{display(item.name)}</span>
                      <span>{display(item.risk || item.status, 'At Risk')}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="panel insights-panel">
              <h3>Skill Distribution</h3>

              {skillRows.length === 0 ? (
                <p>No skill distribution data available.</p>
              ) : (
                <div className="simple-table">
                  <div className="table-head insights-two-col">
                    <span>Skill</span>
                    <span>Count</span>
                  </div>

                  {skillRows.map((item, index) => (
                    <div className="table-row insights-two-col" key={`${item.skill ?? 'skill'}-${index}`}>
                      <span>{display(item.skill || item.name)}</span>
                      <span>{display(item.count || item.employee_count)}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <section className="panel insights-panel insights-team-panel">
            <h3>Team Performance Overview</h3>

            {teamRows.length === 0 ? (
              <p>No team performance data available.</p>
            ) : (
              <div className="simple-table">
                <div className="table-head insights-two-col">
                  <span>Team</span>
                  <span>Performance</span>
                </div>

                {teamRows.map((item, index) => (
                  <div className="table-row insights-two-col" key={`${item.team ?? 'team'}-${index}`}>
                    <span>{display(item.team)}</span>
                    <span>{display(item.value || item.score || item.metric, 'Available')}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      ) : null}
    </PageShell>
  )
}