import { Link } from 'react-router-dom'
import useCustomer from '../hooks/useCustomer'

function CartPage() {
  const { cartItems, cartSubtotal, removeFromCart, updateCartQuantity } =
    useCustomer()

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
                            min="0"
                            value={item.quantity}
                            onChange={(event) =>
                              updateCartQuantity(
                                item.productId,
                                Number(event.target.value)
                              )
                            }
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
