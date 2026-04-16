import { useContext, useEffect, useMemo, useState } from 'react'
import { AuthContext } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import StatCard from '../components/StatCard'
import { fetchEmployees, fetchTrainingRecords } from '../services/employeeService'
import { fetchReviews } from '../services/reviewService'
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

function RoleSection({ role, employees, reviews, training, analytics }) {
  if (role === 'admin') {
    return (
      <>
        <div className="section-title">Admin Overview</div>
        <div className="cards-grid">
          <StatCard
            title="Employees"
            value={employees.length}
            subtitle="Organization-wide"
          />
          <StatCard
            title="Reviews"
            value={reviews.length}
            subtitle="Performance records"
          />
          <StatCard
            title="High Potential"
            value={analytics.highPotential.length}
            subtitle="Promotion-ready talent"
          />
          <StatCard
            title="Attrition Risk"
            value={analytics.attrition.length}
            subtitle="Employees requiring attention"
          />
        </div>
      </>
    )
  }

  if (role === 'hr') {
    return (
      <>
        <div className="section-title">HR Overview</div>
        <div className="cards-grid">
          <StatCard
            title="Employees"
            value={employees.length}
            subtitle="Org-wide visibility"
          />
          <StatCard
            title="Skill Gaps"
            value={analytics.skillGaps.length}
            subtitle="Capability gaps identified"
          />
          <StatCard
            title="Training Records"
            value={training.length}
            subtitle="Development progress"
          />
          <StatCard
            title="Attrition Risk"
            value={analytics.attrition.length}
            subtitle="Retention watchlist"
          />
        </div>
      </>
    )
  }

  if (role === 'manager') {
    return (
      <>
        <div className="section-title">Manager Dashboard</div>
        <div className="cards-grid">
          <StatCard
            title="Team Members"
            value={employees.length}
            subtitle="Your reporting line"
          />
          <StatCard
            title="Team Reviews"
            value={reviews.length}
            subtitle="Accessible review records"
          />
          <StatCard
            title="Skill Gaps"
            value={analytics.skillGaps.length}
            subtitle="Team capability issues"
          />
          <StatCard
            title="At Risk"
            value={analytics.attrition.length}
            subtitle="Team intervention required"
          />
        </div>
      </>
    )
  }

  return (
    <>
      <div className="section-title">Employee Dashboard</div>
      <div className="cards-grid">
        <StatCard
          title="My Reviews"
          value={reviews.length}
          subtitle="Performance records"
        />
        <StatCard
          title="My Training"
          value={training.length}
          subtitle="Development activities"
        />
        <StatCard
          title="My Skill Gaps"
          value={analytics.skillGaps.length}
          subtitle="Growth opportunities"
        />
        <StatCard
          title="High Potential Status"
          value={analytics.highPotential.length ? 'Yes' : 'No'}
          subtitle="Based on current analytics"
        />
      </div>
    </>
  )
}

export default function DashboardPage() {
  const { user } = useContext(AuthContext)

  const [employees, setEmployees] = useState([])
  const [reviews, setReviews] = useState([])
  const [training, setTraining] = useState([])
  const [analytics, setAnalytics] = useState({
    highPotential: [],
    skillGaps: [],
    attrition: [],
    skillDistribution: [],
    teamPerformance: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true)

      const results = await Promise.allSettled([
        fetchEmployees(),
        fetchReviews(),
        fetchTrainingRecords(),
        fetchHighPotential(),
        fetchSkillGaps(),
        fetchAttritionRisk(),
        fetchSkillDistribution(),
        fetchTeamPerformance(),
      ])

      const [
        employeesRes,
        reviewsRes,
        trainingRes,
        highPotentialRes,
        skillGapsRes,
        attritionRes,
        skillDistributionRes,
        teamPerformanceRes,
      ] = results

      const allEmployees =
        employeesRes.status === 'fulfilled' ? safeArray(employeesRes.value) : []
      const allReviews =
        reviewsRes.status === 'fulfilled' ? safeArray(reviewsRes.value) : []
      const allTraining =
        trainingRes.status === 'fulfilled' ? safeArray(trainingRes.value) : []
      const allHighPotential =
        highPotentialRes.status === 'fulfilled'
          ? safeArray(highPotentialRes.value)
          : []
      const allSkillGaps =
        skillGapsRes.status === 'fulfilled'
          ? safeArray(skillGapsRes.value)
          : []
      const allAttrition =
        attritionRes.status === 'fulfilled'
          ? safeArray(attritionRes.value)
          : []
      const allSkillDistribution =
        skillDistributionRes.status === 'fulfilled'
          ? safeArray(skillDistributionRes.value)
          : []
      const allTeamPerformance =
        teamPerformanceRes.status === 'fulfilled'
          ? safeArray(teamPerformanceRes.value)
          : []

      const isEmployee = user?.role === 'employee'

      const filteredEmployees = allEmployees
      const filteredReviews = isEmployee
        ? allReviews.filter(
            (item) => Number(item.employee_id) === Number(user?.employee_id)
          )
        : allReviews

      const filteredTraining = isEmployee
        ? allTraining.filter((item) => {
            const employeeId =
              item.employee_id ?? item.employeeId ?? item.user_id ?? item.userId
            if (employeeId === undefined || employeeId === null) return true
            return Number(employeeId) === Number(user?.employee_id)
          })
        : allTraining

      const filteredHighPotential = isEmployee
        ? allHighPotential.filter(
            (item) => Number(item.employee_id) === Number(user?.employee_id)
          )
        : allHighPotential

      const filteredSkillGaps = isEmployee
        ? allSkillGaps.filter(
            (item) => Number(item.employee_id) === Number(user?.employee_id)
          )
        : allSkillGaps

      const filteredAttrition = isEmployee
        ? allAttrition.filter(
            (item) => Number(item.employee_id) === Number(user?.employee_id)
          )
        : allAttrition

      setEmployees(filteredEmployees)
      setReviews(filteredReviews)
      setTraining(filteredTraining)
      setAnalytics({
        highPotential: filteredHighPotential,
        skillGaps: filteredSkillGaps,
        attrition: filteredAttrition,
        skillDistribution: allSkillDistribution,
        teamPerformance: allTeamPerformance,
      })

      const failures = results.filter((item) => item.status === 'rejected')
      if (failures.length > 0) {
        console.error('Dashboard section load failures:', failures)
      }

      setLoading(false)
    }

    loadDashboard()
  }, [user])

  const recentReviews = useMemo(() => reviews.slice(0, 5), [reviews])
  const topSkillGaps = useMemo(
    () => analytics.skillGaps.slice(0, 5),
    [analytics.skillGaps]
  )

  return (
    <div className="dashboard-shell">
      <Navbar />
      <div className="dashboard-body">
        <Sidebar role={user?.role} />

        <main className="dashboard-content">
          <div className="hero-panel">
            <div>
              <div className="hero-label">PulseTrack Workspace</div>
              <h1>Welcome back, {user?.name}</h1>
              <p>
                Monitor workforce performance, development progress, and
                role-based decision insights from a single enterprise dashboard.
              </p>
            </div>
          </div>

          {loading ? <div className="panel">Loading dashboard...</div> : null}

          {!loading ? (
            <>
              <RoleSection
                role={user?.role}
                employees={employees}
                reviews={reviews}
                training={training}
                analytics={analytics}
              />

              <div className="panel-grid">
                <section className="panel">
                  <h3>Recent Reviews</h3>
                  {recentReviews.length === 0 ? (
                    <p>No reviews available.</p>
                  ) : (
                    <div className="simple-table">
                      <div className="table-head">
                        <span>Employee ID</span>
                        <span>Rating</span>
                        <span>Date</span>
                      </div>

                      {recentReviews.map((item, index) => (
                        <div className="table-row" key={item.id || index}>
                          <span>{item.employee_id ?? '-'}</span>
                          <span>{item.rating ?? '-'}</span>
                          <span>{item.review_date ?? '-'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="panel">
                  <h3>Top Skill Gaps</h3>
                  {topSkillGaps.length === 0 ? (
                    <p>No skill gaps available.</p>
                  ) : (
                    <div className="simple-table">
                      <div className="table-head">
                        <span>Name</span>
                        <span>Skill</span>
                        <span>Gap</span>
                      </div>

                      {topSkillGaps.map((item, index) => (
                        <div
                          className="table-row"
                          key={`${item.employee_id || 'emp'}-${item.skill || 'skill'}-${index}`}
                        >
                          <span>{item.name ?? '-'}</span>
                          <span>{item.skill ?? '-'}</span>
                          <span>{item.gap ?? '-'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </>
          ) : null}
        </main>
      </div>
    </div>
  )
}