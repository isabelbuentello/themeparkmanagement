import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { submitPurchase } from '../api/purchases'
import AsyncState from '../components/AsyncState'
import PageHero from '../components/PageHero'
import useCustomer from '../hooks/useCustomer'

const initialFormState = {
  email: '',
  visitDate: '',
  primaryGuest: '',
  paymentMethod: 'card',
  cardholderName: '',
  cardNumber: '',
  cardExpiry: '',
  cardCvv: ''
}

const formatCardExpiry = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 4)

  if (digits.length <= 2) {
    return digits
  }

  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

const isCardExpiryValid = (value) => {
  const trimmedValue = value.trim()

  if (!/^\d{2}\/\d{2}$/.test(trimmedValue)) {
    return false
  }

  const [monthText, yearText] = trimmedValue.split('/')
  const month = Number(monthText)
  const year = 2000 + Number(yearText)

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return false
  }

  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1

  if (year < currentYear) {
    return false
  }

  if (year === currentYear && month < currentMonth) {
    return false
  }

  return true
}

const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function CheckoutPage() {
  const { cartItems, cartSubtotal, clearCart } = useCustomer()
  const [formState, setFormState] = useState(initialFormState)
  const [orderConfirmed, setOrderConfirmed] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const token = localStorage.getItem('token')
  const role = localStorage.getItem('role')
  const canCheckout = Boolean(token) && role === 'customer'

  const serviceFee = cartItems.length ? 12 : 0
  const total = cartSubtotal + serviceFee
  const todayDate = getLocalDateString()

  useEffect(() => {
    if (!canCheckout || !token) {
      return
    }

    let isMounted = true

    const loadCustomerProfile = async () => {
      try {
        const response = await fetch('/api/customer/profile', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        const data = await response.json()

        if (!response.ok || !isMounted) {
          return
        }

        setFormState((currentState) => ({
          ...currentState,
          primaryGuest: currentState.primaryGuest || data.name || '',
          email: currentState.email || data.email || ''
        }))
      } catch {
        // Leave the form editable and empty if profile prefill fails.
      }
    }

    loadCustomerProfile()

    return () => {
      isMounted = false
    }
  }, [canCheckout, token])

  const handleInputChange = (event) => {
    const { name, value } = event.target
    const nextValue = name === 'cardExpiry' ? formatCardExpiry(value) : value

    setFormState((currentState) => ({
      ...currentState,
      [name]: nextValue
    }))
    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      [name]: ''
    }))
    setSubmitError('')
  }

  const validateForm = () => {
    const nextErrors = {}
    const selectedVisitDate = formState.visitDate || ''
    const today = getLocalDateString()

    if (!formState.primaryGuest.trim()) {
      nextErrors.primaryGuest = 'Enter the account name.'
    }

    if (!formState.email.trim()) {
      nextErrors.email = 'Enter the account email.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email)) {
      nextErrors.email = 'Enter a valid email address.'
    }

    if (!formState.visitDate) {
      nextErrors.visitDate = 'Select a visit date.'
    } else if (selectedVisitDate < today) {
      nextErrors.visitDate = 'Choose today or a future visit date.'
    }

    if (formState.paymentMethod === 'card') {
      if (!formState.cardholderName.trim()) {
        nextErrors.cardholderName = 'Enter the cardholder name.'
      }

      const normalizedCardNumber = formState.cardNumber.replace(/\s+/g, '')
      if (!normalizedCardNumber) {
        nextErrors.cardNumber = 'Enter the card number.'
      } else if (!/^\d{13,19}$/.test(normalizedCardNumber)) {
        nextErrors.cardNumber = 'Enter a valid card number.'
      }

      if (!formState.cardExpiry.trim()) {
        nextErrors.cardExpiry = 'Enter the card expiry.'
      } else if (!/^\d{2}\/\d{2}$/.test(formState.cardExpiry.trim())) {
        nextErrors.cardExpiry = 'Use MM/YY format.'
      } else if (!isCardExpiryValid(formState.cardExpiry)) {
        nextErrors.cardExpiry = 'Use an expiry this month or later.'
      }

      if (!/^\d{3,4}$/.test(formState.cardCvv.trim())) {
        nextErrors.cardCvv = 'Enter a valid CVV.'
      }
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
      await submitPurchase({
        ...formState,
        cartItems,
        cartSubtotal,
        serviceFee,
        total
      })

      setOrderConfirmed(true)
      clearCart()
      setFormState(initialFormState)
    } catch (error) {
      setSubmitError(error.message || 'Purchase could not be completed. Please try again.')
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

      {!canCheckout ? (
        <section className="purchase-grid">
          <div className="async-state async-state-empty" role="status">
            <p className="async-state-label">Login required</p>
            <p className="async-state-message">
              Please sign in as a customer to access checkout.
            </p>
          </div>
        </section>
      ) : (
      <section className="two-column-layout">
        <form className="content-card form-card" onSubmit={handleSubmit}>
          <h2>Account Details</h2>
          <label className="form-field">
            <span>Account name</span>
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
            <span>Account email</span>
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
              min={todayDate}
              value={formState.visitDate}
              onChange={handleInputChange}
              required
            />
            {fieldErrors.visitDate ? (
              <span className="field-error">{fieldErrors.visitDate}</span>
            ) : null}
          </label>

          <label className="form-field">
            <span>Payment method</span>
            <select
              name="paymentMethod"
              value={formState.paymentMethod}
              onChange={handleInputChange}
            >
              <option value="card">Card</option>
              <option value="cash">Cash</option>
            </select>
          </label>

          {formState.paymentMethod === 'card' ? (
            <>
              <label className="form-field">
                <span>Cardholder name</span>
                <input
                  type="text"
                  name="cardholderName"
                  value={formState.cardholderName}
                  onChange={handleInputChange}
                  placeholder="Jordan Lee"
                  autoComplete="cc-name"
                />
                {fieldErrors.cardholderName ? (
                  <span className="field-error">{fieldErrors.cardholderName}</span>
                ) : null}
              </label>

              <label className="form-field">
                <span>Card number</span>
                <input
                  type="text"
                  name="cardNumber"
                  value={formState.cardNumber}
                  onChange={handleInputChange}
                  placeholder="4242 4242 4242 4242"
                  inputMode="numeric"
                  autoComplete="cc-number"
                />
                {fieldErrors.cardNumber ? (
                  <span className="field-error">{fieldErrors.cardNumber}</span>
                ) : null}
              </label>

              <div className="form-row">
                <label className="form-field">
                  <span>Expiry</span>
                  <input
                    type="text"
                    name="cardExpiry"
                    value={formState.cardExpiry}
                    onChange={handleInputChange}
                    placeholder="MM/YY"
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    maxLength="5"
                  />
                  {fieldErrors.cardExpiry ? (
                    <span className="field-error">{fieldErrors.cardExpiry}</span>
                  ) : null}
                </label>

                <label className="form-field">
                  <span>CVV</span>
                  <input
                    type="password"
                    name="cardCvv"
                    value={formState.cardCvv}
                    onChange={handleInputChange}
                    placeholder="123"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                  />
                  {fieldErrors.cardCvv ? (
                    <span className="field-error">{fieldErrors.cardCvv}</span>
                  ) : null}
                </label>
              </div>
            </>
          ) : null}

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
              <p>Your order has been confirmed and your cart has been cleared.</p>
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
      )}
    </div>
  )
}

export default CheckoutPage
