import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import useCustomer from '../hooks/useCustomer'

function CartPage() {
  const { cartItems, cartSubtotal, removeFromCart, updateCartQuantity } =
    useCustomer()
  const [quantityInputs, setQuantityInputs] = useState({})

  useEffect(() => {
    setQuantityInputs((currentInputs) => {
      const nextInputs = {}

      cartItems.forEach((item) => {
        const key = `${item.kind}-${item.productId}`
        nextInputs[key] =
          currentInputs[key] !== undefined
            ? currentInputs[key]
            : String(item.quantity)
      })

      return nextInputs
    })
  }, [cartItems])

  const commitQuantity = (item) => {
    const key = `${item.kind}-${item.productId}`
    const rawValue = quantityInputs[key] ?? ''
    const parsedQuantity = Number.parseInt(rawValue, 10)
    const nextQuantity = Number.isFinite(parsedQuantity) && parsedQuantity >= 1
      ? parsedQuantity
      : item.quantity

    updateCartQuantity(item.productId, nextQuantity, item.kind)
    setQuantityInputs((currentInputs) => ({
      ...currentInputs,
      [key]: String(nextQuantity)
    }))
  }

  return (
    <div className="page">
      <section className="cart-layout">
        <div className="cart-main-panel">
          <div className="cart-panel-header">
            <h1>Shopping Cart</h1>
            <span className="cart-price-label">Price</span>
          </div>

          <div className="cart-item-list">
            {cartItems.length ? (
              cartItems.map((item) => (
                <article
                  key={`${item.kind}-${item.productId}`}
                  className="cart-item-row"
                >
                  <div className="cart-item-main">
                    <p className="section-label">
                      {item.kind === 'membership'
                        ? 'Membership'
                        : item.product.type}
                    </p>
                    <h2>{item.product.name}</h2>
                    <p className="cart-item-description">
                      {item.product.description ?? item.product.spotlight}
                    </p>
                    {item.kind === 'membership' ? (
                      <p className="muted-copy">
                        One membership can be active at a time.
                      </p>
                    ) : null}

                    <div className="cart-item-actions">
                      {item.kind === 'membership' ? null : (
                        <label className="cart-quantity-control">
                          <span className="sr-only">Quantity</span>
                          <input
                            type="number"
                            min="1"
                            value={
                              quantityInputs[`${item.kind}-${item.productId}`] ??
                              String(item.quantity)
                            }
                            onChange={(event) =>
                              setQuantityInputs((currentInputs) => ({
                                ...currentInputs,
                                [`${item.kind}-${item.productId}`]: event.target.value
                              }))
                            }
                            onBlur={() => commitQuantity(item)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                event.preventDefault()
                                commitQuantity(item)
                              }
                            }}
                          />
                        </label>
                      )}

                      <button
                        type="button"
                        className="text-link"
                        onClick={() => removeFromCart(item.productId, item.kind)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="cart-item-price">
                    <strong>${item.subtotal}</strong>
                    <p>
                      {item.kind === 'membership'
                        ? item.product.price
                        : `$${item.product.price} each`}
                    </p>
                  </div>
                </article>
              ))
            ) : (
              <article className="cart-item-row">
                <div className="cart-item-main">
                  <h2>Your cart is empty</h2>
                  <p className="muted-copy">
                    Head back to tickets to choose an option first.
                  </p>
                  <Link to="/tickets" className="text-link">
                    Browse Tickets
                  </Link>
                </div>
              </article>
            )}
          </div>

          <div className="cart-footer-total">
            <span>
              Subtotal ({cartItems.length} item{cartItems.length === 1 ? '' : 's'})
            </span>
            <strong>${cartSubtotal}</strong>
          </div>
        </div>

        <aside className="cart-summary-panel">
          <h2>
            Subtotal ({cartItems.length} item{cartItems.length === 1 ? '' : 's'})
          </h2>
          <p className="cart-summary-amount">${cartSubtotal}</p>
          <Link
            to="/checkout"
            className={`purchase-button cart-checkout-button${
              cartItems.length ? '' : ' button-disabled'
            }`}
          >
            Proceed to checkout
          </Link>
        </aside>
      </section>
    </div>
  )
}

export default CartPage
