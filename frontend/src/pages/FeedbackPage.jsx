import { useEffect, useState } from 'react'
import { submitComplaint, submitReview } from '../api/feedback'
import AsyncState from '../components/AsyncState'
import PageHero from '../components/PageHero'

const reviewInitialState = {
  rating: '5',
  notes: ''
}

const complaintInitialState = {
  notes: ''
}

function FeedbackPage() {
  const [activeTab, setActiveTab] = useState('reviews')
  const [reviewForm, setReviewForm] = useState(reviewInitialState)
  const [complaintForm, setComplaintForm] = useState(complaintInitialState)
  const [submittedMessage, setSubmittedMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const token = localStorage.getItem('token')
  const role = localStorage.getItem('role')
  const canSubmitReview = Boolean(token) && role === 'customer'

  useEffect(() => {
    setFieldErrors({})
    setSubmitError('')
  }, [activeTab])

  const handleFormChange = (setter) => (event) => {
    const { name, value } = event.target

    setter((currentState) => ({
      ...currentState,
      [name]: value
    }))
    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      [name]: ''
    }))
    setSubmitError('')
  }

  const validateReviewForm = () => {
    const nextErrors = {}

    if (!reviewForm.notes.trim()) {
      nextErrors.notes = 'Share a few details about the experience.'
    } else if (reviewForm.notes.trim().length < 20) {
      nextErrors.notes = 'Add at least 20 characters so the review is useful.'
    }

    setFieldErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const validateComplaintForm = () => {
    const nextErrors = {}

    if (!complaintForm.notes.trim()) {
      nextErrors.notes = 'Describe what happened.'
    } else if (complaintForm.notes.trim().length < 20) {
      nextErrors.notes = 'Add at least 20 characters so the team can follow up.'
    }

    setFieldErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = (type) => async (event) => {
    event.preventDefault()

    setSubmittedMessage('')
    setSubmitError('')

    if (type === 'reviews' && !canSubmitReview) {
      setSubmitError('You must be logged in as a customer to leave a review.')
      return
    }

    const isValid =
      type === 'reviews' ? validateReviewForm() : validateComplaintForm()

    if (!isValid) {
      return
    }

    setIsSubmitting(true)

    try {
      const response =
        type === 'reviews'
          ? await submitReview(reviewForm)
          : await submitComplaint(complaintForm)

      setSubmittedMessage(response.message)

      if (type === 'reviews') {
        setReviewForm(reviewInitialState)
        setFieldErrors({})
        return
      }

      setComplaintForm(complaintInitialState)
      setFieldErrors({})
    } catch {
      setSubmitError(
        type === 'reviews'
          ? 'Review could not be submitted. Please try again.'
          : 'Complaint could not be submitted. Please try again.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="page">
      <PageHero title="Feedback" />

      <div className="filter-row">
        <button
          type="button"
          className={`filter-pill${activeTab === 'reviews' ? ' filter-pill-active' : ''}`}
          onClick={() => setActiveTab('reviews')}
        >
          Reviews
        </button>
        <button
          type="button"
          className={`filter-pill${activeTab === 'complaints' ? ' filter-pill-active' : ''}`}
          onClick={() => setActiveTab('complaints')}
        >
          Complaints
        </button>
      </div>

      <section className="feedback-layout">
        {activeTab === 'reviews' ? (
          <form className="content-card form-card" onSubmit={handleSubmit('reviews')}>
            <h2>Submit A Review</h2>

            {!canSubmitReview ? (
              <div className="confirmation-box">
                <strong>Login required.</strong>
                <p>You must be logged in as a customer to leave a review.</p>
              </div>
            ) : null}

            <label className="form-field">
              <span>Rating</span>
              <select
                name="rating"
                value={reviewForm.rating}
                onChange={handleFormChange(setReviewForm)}
              >
                <option value="5">5 - Excellent</option>
                <option value="4">4 - Strong</option>
                <option value="3">3 - Fine</option>
                <option value="2">2 - Needs work</option>
                <option value="1">1 - Poor</option>
              </select>
            </label>

            <label className="form-field">
              <span>Review details</span>
              <textarea
                name="notes"
                value={reviewForm.notes}
                onChange={handleFormChange(setReviewForm)}
                rows="6"
                maxLength="400"
                placeholder="Tell us what stood out."
                required
              />
              {fieldErrors.notes ? (
                <span className="field-error">{fieldErrors.notes}</span>
              ) : null}
            </label>

            <p className="character-count">{reviewForm.notes.length}/400</p>

            <button
              type="submit"
              className="primary-btn full-width"
              disabled={isSubmitting || !canSubmitReview}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        ) : (
          <form
            className="content-card form-card"
            onSubmit={handleSubmit('complaints')}
          >
            <h2>Submit A Complaint</h2>

            <label className="form-field">
              <span>What happened?</span>
              <textarea
                name="notes"
                value={complaintForm.notes}
                onChange={handleFormChange(setComplaintForm)}
                rows="6"
                maxLength="300"
                placeholder="Share enough detail for follow-up."
                required
              />
              {fieldErrors.notes ? (
                <span className="field-error">{fieldErrors.notes}</span>
              ) : null}
            </label>

            <p className="character-count">{complaintForm.notes.length}/300</p>

            <button
              type="submit"
              className="primary-btn full-width"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
            </button>
          </form>
        )}

        {submittedMessage ? (
          <div className="content-card">
            <div className="confirmation-box">
              <strong>Submission received.</strong>
              <p>{submittedMessage}</p>
            </div>
          </div>
        ) : null}

        <AsyncState error={submitError} errorMessage={submitError} />
      </section>
    </div>
  )
}

export default FeedbackPage
