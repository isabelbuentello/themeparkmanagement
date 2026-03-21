import { useState } from 'react'
import { Link } from 'react-router-dom'
import { submitPurchase } from '../api/purchases'
import AsyncState from '../components/AsyncState'
import PageHero from '../components/PageHero'
import useCustomer from '../hooks/useCustomer'

const initialFormState = {
  email: '',
  visitDate: '',
  primaryGuest: ''
}

function CheckoutPage() {
  const { cartItems, cartSubtotal, clearCart } = useCustomer()
  const [formState, setFormState] = useState(initialFormState)
  const [orderConfirmed, setOrderConfirmed] = useState(false)
  const [confirmationId, setConfirmationId] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  const serviceFee = cartItems.length ? 12 : 0
  const total = cartSubtotal + serviceFee

  const handleInputChange = (event) => {
    const { name, value } = event.target

    setFormState((currentState) => ({
      ...currentState,
      [name]: value
    }))
    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      [name]: ''
    }))
    setSubmitError('')
  }

  const validateForm = () => {
    const nextErrors = {}
    const selectedVisitDate = formState.visitDate ? new Date(formState.visitDate) : null
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (!formState.primaryGuest.trim()) {
      nextErrors.primaryGuest = 'Enter the primary guest name.'
    }

    if (!formState.email.trim()) {
      nextErrors.email = 'Enter an email for ticket delivery.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email)) {
      nextErrors.email = 'Enter a valid email address.'
    }

    if (!formState.visitDate) {
      nextErrors.visitDate = 'Select a visit date.'
    } else if (selectedVisitDate < today) {
      nextErrors.visitDate = 'Choose today or a future visit date.'
    }

    setFieldErrors(nextErrors)

    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!cartItems.length) {
      setSubmitError('Add at least one item to the cart before checking out.')
      return
    }

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setSubmitError('')

    try {
      const response = await submitPurchase({
        ...formState,
        cartItems,
        cartSubtotal,
        serviceFee,
        total
      })

      setOrderConfirmed(true)
      setConfirmationId(response.confirmationId)
      clearCart()
      setFormState(initialFormState)
    } catch {
      setSubmitError('Purchase could not be completed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="page">
      <PageHero
        title="Checkout"
        compact
      />

      <section className="two-column-layout">
        <form className="content-card form-card" onSubmit={handleSubmit}>
          <h2>Guest Details</h2>
          <label className="form-field">
            <span>Primary guest name</span>
            <input
              type="text"
              name="primaryGuest"
              value={formState.primaryGuest}
              onChange={handleInputChange}
              placeholder="Jordan Lee"
              required
            />
            {fieldErrors.primaryGuest ? (
              <span className="field-error">{fieldErrors.primaryGuest}</span>
            ) : null}
          </label>

          <label className="form-field">
            <span>Email for digital delivery</span>
            <input
              type="email"
              name="email"
              value={formState.email}
              onChange={handleInputChange}
              placeholder="jordan@example.com"
              required
            />
            {fieldErrors.email ? (
              <span className="field-error">{fieldErrors.email}</span>
            ) : null}
          </label>

          <label className="form-field">
            <span>Preferred visit date</span>
            <input
              type="date"
              name="visitDate"
              value={formState.visitDate}
              onChange={handleInputChange}
              required
            />
            {fieldErrors.visitDate ? (
              <span className="field-error">{fieldErrors.visitDate}</span>
            ) : null}
          </label>

          <button
            type="submit"
            className={`primary-btn full-width${
              cartItems.length ? '' : ' button-disabled'
            }`}
            disabled={!cartItems.length || isSubmitting}
          >
            {isSubmitting ? 'Confirming...' : 'Confirm Purchase'}
          </button>

          {orderConfirmed ? (
            <div className="confirmation-box">
              <strong>Purchase confirmed.</strong>
              <p>
                Confirmation ID: {confirmationId}. Your order has been staged
                through the frontend API layer and the cart was cleared.
              </p>
            </div>
          ) : null}
          <AsyncState error={submitError} errorMessage={submitError} />
        </form>

        <aside className="content-card highlight-panel">
          <h2>Order Summary</h2>
          <div className="summary-list">
            {cartItems.length ? (
              cartItems.map((item) => (
                <div key={item.productId} className="summary-row">
                  <div>
                    <strong>{item.product.name}</strong>
                    <p>
                      {item.quantity}{' '}
                      {item.kind === 'membership' ? 'membership' : 'ticket'}
                      {item.quantity === 1 ? '' : 's'}
                    </p>
                  </div>
                  <span>${item.subtotal}</span>
                </div>
              ))
            ) : (
              <p className="muted-copy">
                Your cart is empty. Head back to ticket selection to add products.
              </p>
            )}
          </div>

          <div className="summary-totals">
            <div className="summary-row">
              <span>Subtotal</span>
              <span>${cartSubtotal}</span>
            </div>
            <div className="summary-row">
              <span>Service fee</span>
              <span>${serviceFee}</span>
            </div>
            <div className="summary-row summary-row-strong">
              <span>Total</span>
              <span>${total}</span>
            </div>
          </div>

          <Link to="/tickets" className="text-link">
            Back To Tickets
          </Link>
        </aside>
      </section>
    </div>
  )
}

export default CheckoutPage
