import { useContext, useEffect, useMemo, useState } from 'react'
import PageShell from '../components/PageShell'
import { AuthContext } from '../context/AuthContext'
import { fetchEmployees } from '../services/employeeService'
import { createReview, fetchReviews } from '../services/reviewService'

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

export default function ReviewsPage() {
  const { user } = useContext(AuthContext)

  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState([])
  const [employees, setEmployees] = useState([])
  const [reviewMessage, setReviewMessage] = useState('')

  const [reviewForm, setReviewForm] = useState({
    employee_id: '',
    rating: '',
    review_date: '',
    feedback: '',
    goals: '',
  })

  async function loadPage() {
    setLoading(true)

    try {
      const [reviewsData, employeesData] = await Promise.all([
        fetchReviews(),
        fetchEmployees(),
      ])

      setReviews(safeArray(reviewsData))
      setEmployees(safeArray(employeesData))
    } catch (error) {
      console.error('Reviews load failed:', error)
      setReviews([])
      setEmployees([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPage()
  }, [])

  function handleReviewChange(event) {
    const { name, value } = event.target
    setReviewForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  async function handleCreateReview(event) {
    event.preventDefault()
    setReviewMessage('')

    try {
      const result = await createReview({
        employee_id: Number(reviewForm.employee_id),
        rating: Number(reviewForm.rating),
        review_date: reviewForm.review_date,
        feedback: reviewForm.feedback,
        goals: reviewForm.goals,
      })

      setReviewMessage(result?.message || 'Review added successfully.')

      setReviewForm({
        employee_id: '',
        rating: '',
        review_date: '',
        feedback: '',
        goals: '',
      })

      await loadPage()
    } catch (error) {
      console.error('Create review failed:', error)
      setReviewMessage(error.message || 'Failed to add review.')
    }
  }

  const recentReviews = useMemo(() => reviews.slice(0, 10), [reviews])

  const avgRating = useMemo(() => {
    const valid = reviews
      .map((item) => Number(item.rating))
      .filter((value) => !Number.isNaN(value))

    if (!valid.length) return 'N/A'

    const avg = valid.reduce((sum, value) => sum + value, 0) / valid.length
    return avg.toFixed(1)
  }, [reviews])

  const highestRating = useMemo(() => {
    const valid = reviews
      .map((item) => Number(item.rating))
      .filter((value) => !Number.isNaN(value))

    if (!valid.length) return 'N/A'
    return Math.max(...valid)
  }, [reviews])

  return (
    <PageShell
      title="Team Reviews"
      subtitle="Review employee ratings, performance history, and recent feedback across your accessible scope."
    >
      <div className="cards-grid reviews-cards-grid">
        <div className="stat-card reviews-stat-card">
          <div className="stat-title">Accessible Reviews</div>
          <div className="stat-value">{reviews.length}</div>
          <div className="stat-subtitle">Review records available</div>
        </div>

        <div className="stat-card reviews-stat-card">
          <div className="stat-title">Average Rating</div>
          <div className="stat-value">{avgRating}</div>
          <div className="stat-subtitle">Across visible review history</div>
        </div>

        <div className="stat-card reviews-stat-card">
          <div className="stat-title">Highest Rating</div>
          <div className="stat-value">{highestRating}</div>
          <div className="stat-subtitle">Top recorded performance score</div>
        </div>

        <div className="stat-card reviews-stat-card">
          <div className="stat-title">Role Scope</div>
          <div className="stat-value">{display(user?.role)}</div>
          <div className="stat-subtitle">Current access profile</div>
        </div>
      </div>

      {(user?.role === 'manager' || user?.role === 'admin') && (
        <section className="panel reviews-panel">
          <h3>Add Review</h3>

          <form className="admin-form" onSubmit={handleCreateReview}>
            <label>Employee</label>
            <select
              name="employee_id"
              value={reviewForm.employee_id}
              onChange={handleReviewChange}
              required
            >
              <option value="">Select employee</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>

            <label>Rating</label>
            <input
              name="rating"
              type="number"
              min="1"
              max="5"
              value={reviewForm.rating}
              onChange={handleReviewChange}
              placeholder="Enter rating from 1 to 5"
              required
            />

            <label>Review Date</label>
            <input
              name="review_date"
              type="date"
              value={reviewForm.review_date}
              onChange={handleReviewChange}
              required
            />

            <label>Feedback</label>
            <input
              name="feedback"
              type="text"
              value={reviewForm.feedback}
              onChange={handleReviewChange}
              placeholder="Enter performance feedback"
              required
            />

            <label>Goals</label>
            <input
              name="goals"
              type="text"
              value={reviewForm.goals}
              onChange={handleReviewChange}
              placeholder="Enter development goals"
              required
            />

            {reviewMessage ? (
              <div className="form-message">{reviewMessage}</div>
            ) : null}

            <button className="primary-btn" type="submit">
              Add Review
            </button>
          </form>
        </section>
      )}

      <section className="panel reviews-panel">
        <h3>Review History</h3>

        {loading ? (
          <p>Loading reviews...</p>
        ) : recentReviews.length === 0 ? (
          <p>No reviews available.</p>
        ) : (
          <div className="simple-table">
            <div className="table-head review-table">
              <span>Employee ID</span>
              <span>Rating</span>
              <span>Date</span>
              <span>Feedback</span>
            </div>

            {recentReviews.map((item, index) => (
              <div className="table-row review-table" key={item.id ?? index}>
                <span>{display(item.employee_id)}</span>
                <span>{display(item.rating)}</span>
                <span>{display(item.review_date)}</span>
                <span>{display(item.feedback, 'No feedback')}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  )
}