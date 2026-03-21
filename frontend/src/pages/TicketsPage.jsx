import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTicketProducts } from '../api/tickets'
import AsyncState from '../components/AsyncState'
import PageHero from '../components/PageHero'
import useCustomer from '../hooks/useCustomer'

function TicketsPage() {
  const { addToCart } = useCustomer()
  const navigate = useNavigate()
  const [ticketProducts, setTicketProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let isMounted = true

    const loadProducts = async () => {
      setIsLoading(true)
      setLoadError('')

      try {
        const products = await getTicketProducts()

        if (isMounted) {
          setTicketProducts(products)
        }
      } catch {
        if (isMounted) {
          setLoadError('Unable to load ticket options right now.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadProducts()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="page">
      <PageHero
        title="Tickets"
      />

      <section className="purchase-grid">
        <AsyncState
          isLoading={isLoading}
          error={loadError}
          isEmpty={!isLoading && !loadError && ticketProducts.length === 0}
          loadingMessage="Loading ticket options..."
          emptyMessage="No tickets are available right now."
        />
        {ticketProducts.map((product, index) => (
          <article
            key={product.id}
            className={`purchase-card${index === 0 ? ' purchase-card-featured' : ''}`}
          >
            <p className="purchase-type">{product.type}</p>
            <h2>{product.name}</h2>
            <p className="purchase-description">{product.description}</p>

            <div className="purchase-price-row">
              <span className="purchase-price">${product.price}</span>
              <span className="purchase-unit">/guest</span>
            </div>

            <div className="purchase-divider" />

            <ul className="purchase-feature-list">
              {product.highlights.map((highlight) => (
                <li key={highlight} className="purchase-feature-item">
                  <span className="purchase-check" aria-hidden="true" />
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              className="purchase-button"
              onClick={() => {
                addToCart(product.id)
                navigate('/cart')
              }}
            >
              Select
            </button>
          </article>
        ))}
      </section>
    </div>
  )
}

export default TicketsPage
