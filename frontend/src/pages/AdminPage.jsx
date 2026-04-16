import { useEffect, useMemo, useState } from 'react'
import PageShell from '../components/PageShell'
import { createUser } from '../services/authService'
import { createEmployee, fetchEmployees } from '../services/employeeService'
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

export default function AdminPage() {
  const [employees, setEmployees] = useState([])
  const [reviews, setReviews] = useState([])
  const [skillGaps, setSkillGaps] = useState([])

  const [loadingEmployees, setLoadingEmployees] = useState(true)
  const [employeeMessage, setEmployeeMessage] = useState('')
  const [userMessage, setUserMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState(null)

  const [employeeForm, setEmployeeForm] = useState({
    name: '',
    email: '',
    department: '',
    role: '',
    team: '',
    manager_id: '',
  })

  const [userForm, setUserForm] = useState({
    employee_id: '',
    role: '',
    password: '',
  })

  async function loadEmployees() {
    try {
      setLoadingEmployees(true)
      const data = await fetchEmployees()
      const employeeList = safeArray(data)
      setEmployees(employeeList)

      if (!selectedEmployee && employeeList.length > 0) {
        setSelectedEmployee(employeeList[0])
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error)
      setEmployees([])
    } finally {
      setLoadingEmployees(false)
    }
  }

  async function loadSupportingData() {
    try {
      const [reviewsData, skillGapData] = await Promise.allSettled([
        fetchReviews(),
        fetchSkillGaps(),
      ])

      setReviews(
        reviewsData.status === 'fulfilled' ? safeArray(reviewsData.value) : []
      )

      setSkillGaps(
        skillGapData.status === 'fulfilled' ? safeArray(skillGapData.value) : []
      )
    } catch (error) {
      console.error('Failed to load admin supporting data:', error)
      setReviews([])
      setSkillGaps([])
    }
  }

  useEffect(() => {
    loadEmployees()
    loadSupportingData()
  }, [])

  function handleEmployeeChange(event) {
    const { name, value } = event.target
    setEmployeeForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  function handleUserChange(event) {
    const { name, value } = event.target
    setUserForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  async function handleCreateEmployee(event) {
    event.preventDefault()
    setEmployeeMessage('')

    try {
      const result = await createEmployee({
        name: employeeForm.name,
        email: employeeForm.email,
        department: employeeForm.department,
        role: employeeForm.role,
        team: employeeForm.team,
        manager_id: employeeForm.manager_id
          ? Number(employeeForm.manager_id)
          : null,
      })

      let successMessage = 'Employee created successfully.'

      if (result?.employee_id) {
        successMessage = `Employee created successfully with ID ${result.employee_id}.`
      } else if (typeof result?.message === 'string') {
        successMessage = result.message
      }

      setEmployeeMessage(successMessage)

      setEmployeeForm({
        name: '',
        email: '',
        department: '',
        role: '',
        team: '',
        manager_id: '',
      })

      await loadEmployees()
    } catch (error) {
      console.error('Create employee error:', error)
      setEmployeeMessage(error.message || 'Failed to create employee.')
    }
  }

  async function handleCreateUser(event) {
    event.preventDefault()
    setUserMessage('')

    try {
      const result = await createUser({
        employee_id: Number(userForm.employee_id),
        role: userForm.role,
        password: userForm.password,
      })

      let successMessage = 'User created successfully.'

      if (typeof result?.message === 'string') {
        successMessage = result.message
      }

      setUserMessage(successMessage)

      setUserForm({
        employee_id: '',
        role: '',
        password: '',
      })
    } catch (error) {
      console.error('Create user error:', error)
      setUserMessage(error.message || 'Failed to create user.')
    }
  }

  const filteredEmployees = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    if (!query) return employees

    return employees.filter((employee) => {
      const name = employee.name?.toLowerCase() || ''
      const email = employee.email?.toLowerCase() || ''
      const department = employee.department?.toLowerCase() || ''
      const role = employee.role?.toLowerCase() || ''
      const team = employee.team?.toLowerCase() || ''

      return (
        name.includes(query) ||
        email.includes(query) ||
        department.includes(query) ||
        role.includes(query) ||
        team.includes(query)
      )
    })
  }, [employees, searchTerm])

  const selectedEmployeeReviews = useMemo(() => {
    if (!selectedEmployee) return []
    return reviews.filter(
      (review) => Number(review.employee_id) === Number(selectedEmployee.id)
    )
  }, [reviews, selectedEmployee])

  const selectedEmployeeSkillGaps = useMemo(() => {
    if (!selectedEmployee) return []
    return skillGaps.filter(
      (gap) => Number(gap.employee_id) === Number(selectedEmployee.id)
    )
  }, [skillGaps, selectedEmployee])

  const managerCount = useMemo(() => {
    return employees.filter((employee) =>
      employees.some((otherEmployee) => otherEmployee.manager_id === employee.id)
    ).length
  }, [employees])

  const departmentCount = useMemo(() => {
    return [...new Set(employees.map((employee) => employee.department).filter(Boolean))]
      .length
  }, [employees])

  const teamCount = useMemo(() => {
    return [...new Set(employees.map((employee) => employee.team).filter(Boolean))]
      .length
  }, [employees])

  return (
    <PageShell
      title="Admin Controls"
      subtitle="Manage employee records, user access, and organizational structure."
    >
      <div className="cards-grid">
        <div className="stat-card">
          <div className="stat-title">Total Employees</div>
          <div className="stat-value">{employees.length}</div>
          <div className="stat-subtitle">Across all departments</div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Managers</div>
          <div className="stat-value">{managerCount}</div>
          <div className="stat-subtitle">People leaders</div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Departments</div>
          <div className="stat-value">{departmentCount}</div>
          <div className="stat-subtitle">Business units represented</div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Teams</div>
          <div className="stat-value">{teamCount}</div>
          <div className="stat-subtitle">Active teams</div>
        </div>
      </div>

      <section className="panel">
        <div className="admin-search-header">
          <h3>Employee Directory</h3>
          <input
            className="admin-search-input"
            type="text"
            placeholder="Search by name, email, department, role, or team"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        {loadingEmployees ? (
          <p>Loading employees...</p>
        ) : filteredEmployees.length === 0 ? (
          <p>No employees match your search.</p>
        ) : (
          <div className="employee-card-grid">
  {filteredEmployees.map((employee) => (
    <button
      key={employee.id}
      type="button"
      className={`employee-card ${
        selectedEmployee?.id === employee.id ? 'selected' : ''
      }`}
      onClick={() => setSelectedEmployee(employee)}
    >
      <div className="employee-card-name">{display(employee.name)}</div>

      <div className="employee-role-badge">
        {display(employee.role)}
      </div>

      <div className="employee-card-meta">
        {display(employee.department)}
      </div>

      <div className="employee-card-meta">
        {display(employee.team)}
      </div>
    </button>
  ))}
</div>
        )}
      </section>

      <section className="panel">
        <h3>Employee Details</h3>

        {!selectedEmployee ? (
          <p>Select an employee to view profile and review history.</p>
        ) : (
          <div className="employee-detail-layout">
            <div className="employee-detail-summary">
              <div className="employee-detail-name">{display(selectedEmployee.name)}</div>
              <div className="employee-detail-line">
                <strong>Email:</strong> {display(selectedEmployee.email)}
              </div>
              <div className="employee-detail-line">
                <strong>Department:</strong> {display(selectedEmployee.department)}
              </div>
              <div className="employee-detail-line">
                <strong>Role:</strong>{' '}
                <span className="role-badge">{display(selectedEmployee.role)}</span>
              </div>
              <div className="employee-detail-line">
                <strong>Team:</strong> {display(selectedEmployee.team)}
              </div>
              <div className="employee-detail-line">
                <strong>Manager ID:</strong> {display(selectedEmployee.manager_id, 'None')}
              </div>
            </div>

            <div className="employee-detail-sections">
              <div className="employee-detail-block">
                <h4>Review History</h4>
                {selectedEmployeeReviews.length === 0 ? (
                  <p>No reviews available for this employee.</p>
                ) : (
                  <div className="simple-table">
                    <div className="table-head">
                      <span>Rating</span>
                      <span>Date</span>
                      <span>Comments</span>
                    </div>

                    {selectedEmployeeReviews.map((review, index) => (
                      <div className="table-row" key={review.id ?? index}>
                        <span>{display(review.rating)}</span>
                        <span>{display(review.review_date)}</span>
                        <span>{display(review.comments || review.feedback, 'No comments')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="employee-detail-block">
                <h4>Critical Skill Gaps</h4>
                {selectedEmployeeSkillGaps.length === 0 ? (
                  <p>No critical skill gaps available for this employee.</p>
                ) : (
                  <div className="simple-table">
                    <div className="table-head">
                      <span>Skill</span>
                      <span>Gap</span>
                    </div>

                    {selectedEmployeeSkillGaps.map((gap, index) => (
                      <div
                        className="table-row"
                        key={`${gap.employee_id ?? selectedEmployee.id}-${gap.skill ?? 'skill'}-${index}`}
                      >
                        <span>{display(gap.skill)}</span>
                        <span>{display(gap.gap || gap.severity)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      <div className="panel-grid">
        <section className="panel">
          <h3>Add Employee</h3>

          <form className="admin-form" onSubmit={handleCreateEmployee}>
            <label>Name</label>
            <input
              name="name"
              type="text"
              value={employeeForm.name}
              onChange={handleEmployeeChange}
              placeholder="Enter employee name"
              required
            />

            <label>Email</label>
            <input
              name="email"
              type="email"
              value={employeeForm.email}
              onChange={handleEmployeeChange}
              placeholder="name@company.com"
              required
            />

            <label>Department</label>
            <input
              name="department"
              type="text"
              value={employeeForm.department}
              onChange={handleEmployeeChange}
              placeholder="Enter department"
              required
            />

            <label>Role</label>
            <select
              name="role"
              value={employeeForm.role}
              onChange={handleEmployeeChange}
              required
            >
              <option value="">Select role</option>
              <option value="admin">Admin</option>
              <option value="hr">HR</option>
              <option value="manager">Manager</option>
              <option value="employee">Employee</option>
            </select>

            <label>Team</label>
            <input
              name="team"
              type="text"
              value={employeeForm.team}
              onChange={handleEmployeeChange}
              placeholder="Enter team name"
              required
            />

            <label>Manager ID</label>
            <input
              name="manager_id"
              type="number"
              value={employeeForm.manager_id}
              onChange={handleEmployeeChange}
              placeholder="Optional manager employee ID"
            />

            {employeeMessage ? (
              <div className="form-message">{employeeMessage}</div>
            ) : null}

            <button className="primary-btn" type="submit">
              Add Employee
            </button>
          </form>
        </section>

        <section className="panel">
          <h3>Provision User Access</h3>

          <form className="admin-form" onSubmit={handleCreateUser}>
            <label>Employee ID</label>
            <input
              name="employee_id"
              type="number"
              value={userForm.employee_id}
              onChange={handleUserChange}
              placeholder="Enter employee ID"
              required
            />

            <label>Role</label>
            <select
              name="role"
              value={userForm.role}
              onChange={handleUserChange}
              required
            >
              <option value="">Select role</option>
              <option value="admin">Admin</option>
              <option value="hr">HR</option>
              <option value="manager">Manager</option>
              <option value="employee">Employee</option>
            </select>

            <label>Password</label>
            <input
              name="password"
              type="password"
              value={userForm.password}
              onChange={handleUserChange}
              placeholder="Set temporary password"
              required
            />

            {userMessage ? <div className="form-message">{userMessage}</div> : null}

            <button className="primary-btn" type="submit">
              Create User
            </button>
          </form>
        </section>
      </div>
    </PageShell>
  )
}