import { useContext, useEffect, useMemo, useState } from 'react'
import PageShell from '../components/PageShell'
import { AuthContext } from '../context/AuthContext'
import { fetchTrainingRecords } from '../services/employeeService'
import { fetchReviews } from '../services/reviewService'
import { fetchSkillGaps } from '../services/analyticsService'

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

export default function ProgressPage() {
  const { user } = useContext(AuthContext)

  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState([])
  const [training, setTraining] = useState([])
  const [skillGaps, setSkillGaps] = useState([])

  useEffect(() => {
    async function loadProgress() {
      setLoading(true)

      const results = await Promise.allSettled([
        fetchReviews(),
        fetchTrainingRecords(),
        fetchSkillGaps(),
      ])

      const [reviewsRes, trainingRes, skillGapsRes] = results

      setReviews(reviewsRes.status === 'fulfilled' ? safeArray(reviewsRes.value) : [])
      setTraining(trainingRes.status === 'fulfilled' ? safeArray(trainingRes.value) : [])
      setSkillGaps(skillGapsRes.status === 'fulfilled' ? safeArray(skillGapsRes.value) : [])

      const failures = results.filter((item) => item.status === 'rejected')
      if (failures.length > 0) {
        console.error('Progress load failures:', failures)
      }

      setLoading(false)
    }

    loadProgress()
  }, [])

  const myReviews = useMemo(() => {
    return reviews.filter(
      (item) => Number(item.employee_id) === Number(user?.employee_id)
    )
  }, [reviews, user])

  const myTraining = useMemo(() => {
    return training.filter((item) => {
      const employeeId =
        item.employee_id ?? item.employeeId ?? item.user_id ?? item.userId
      if (employeeId === undefined || employeeId === null) return true
      return Number(employeeId) === Number(user?.employee_id)
    })
  }, [training, user])

  const mySkillGaps = useMemo(() => {
    return skillGaps.filter(
      (item) => Number(item.employee_id) === Number(user?.employee_id)
    )
  }, [skillGaps, user])

  const recentReviews = useMemo(() => myReviews.slice(0, 8), [myReviews])
  const recentTraining = useMemo(() => myTraining.slice(0, 8), [myTraining])
  const currentSkillGaps = useMemo(() => mySkillGaps.slice(0, 8), [mySkillGaps])

  return (
    <PageShell
      title="My Progress"
      subtitle="Track your review history, completed development activity, and current skill growth priorities."
    >
      <div className="cards-grid progress-cards-grid">
        <div className="stat-card progress-stat-card">
          <div className="stat-title">My Reviews</div>
          <div className="stat-value">{myReviews.length}</div>
          <div className="stat-subtitle">Performance records available</div>
        </div>

        <div className="stat-card progress-stat-card">
          <div className="stat-title">Training Activities</div>
          <div className="stat-value">{myTraining.length}</div>
          <div className="stat-subtitle">Completed or tracked activities</div>
        </div>

        <div className="stat-card progress-stat-card">
          <div className="stat-title">Skill Gaps</div>
          <div className="stat-value">{mySkillGaps.length}</div>
          <div className="stat-subtitle">Current development priorities</div>
        </div>

        <div className="stat-card progress-stat-card">
          <div className="stat-title">Growth View</div>
          <div className="stat-value">Active</div>
          <div className="stat-subtitle">Self-service progress tracking</div>
        </div>
      </div>

      <div className="panel-grid progress-panel-grid">
        <section className="panel progress-panel">
          <h3>Recent Reviews</h3>

          {loading ? (
            <p>Loading reviews...</p>
          ) : recentReviews.length === 0 ? (
            <p>No reviews available.</p>
          ) : (
            <div className="simple-table">
              <div className="table-head">
                <span>Employee ID</span>
                <span>Rating</span>
                <span>Date</span>
              </div>

              {recentReviews.map((item, index) => (
                <div className="table-row" key={item.id ?? index}>
                  <span>{display(item.employee_id)}</span>
                  <span>{display(item.rating)}</span>
                  <span>{display(item.review_date)}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="panel progress-panel">
          <h3>Training Activity</h3>

          {loading ? (
            <p>Loading training records...</p>
          ) : recentTraining.length === 0 ? (
            <p>No training records available.</p>
          ) : (
            <div className="simple-table">
              <div className="table-head progress-table">
                <span>Title</span>
                <span>Status</span>
                <span>Date</span>
              </div>

              {recentTraining.map((item, index) => (
                <div className="table-row progress-table" key={item.id ?? index}>
                  <span>{display(item.title || item.training_name || item.name)}</span>
                  <span>{display(item.status || item.completion_status, 'Pending')}</span>
                  <span>{display(item.date || item.completed_at || item.training_date)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="panel progress-panel">
        <h3>Current Skill Gaps</h3>

        {loading ? (
          <p>Loading skill gaps...</p>
        ) : currentSkillGaps.length === 0 ? (
          <p>No skill gaps available.</p>
        ) : (
          <div className="simple-table">
            <div className="table-head">
              <span>Name</span>
              <span>Skill</span>
              <span>Gap</span>
            </div>

            {currentSkillGaps.map((item, index) => (
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
    </PageShell>
  )
}