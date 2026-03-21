import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMemberships } from '../api/memberships'
import { getTicketProducts } from '../api/tickets'
import { getDirectory } from '../api/venues'
import AsyncState from '../components/AsyncState'

function HomePage() {
  const [homepageSections, setHomepageSections] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let isMounted = true

    const loadHomeData = async () => {
      setIsLoading(true)
      setLoadError('')

      try {
        const [
          ticketProducts,
          memberships,
          diningDirectory,
          shopsDirectory,
          showsDirectory
        ] = await Promise.all([
          getTicketProducts(),
          getMemberships(),
          getDirectory('dining'),
          getDirectory('shops'),
          getDirectory('shows')
        ])

        if (!isMounted) {
          return
        }

        setHomepageSections([
          {
            title: 'Tickets',
            description: `Buy tickets and passes starting at $${Math.min(
              ...ticketProducts.map((ticket) => ticket.price)
            )}.`,
            points: [
              { title: 'Easy entry', description: 'Buy park tickets before you arrive.' },
              { title: 'Flexible choices', description: `${ticketProducts.length} options for different visit plans.` },
              { title: 'Simple pricing', description: `Starting at $${Math.min(...ticketProducts.map((ticket) => ticket.price))}.` },
              { title: 'Fast checkout', description: 'Add tickets to cart and check out in one place.' }
            ],
            to: '/tickets'
          },
          {
            title: 'Memberships',
            description: `${memberships.length} membership options with perks for casual and frequent visits.`,
            points: [
              { title: 'Three plans', description: 'Choose the membership that fits your visits.' },
              { title: 'Park perks', description: 'Get discounts, entry benefits, and bonus access.' },
              { title: 'Monthly pricing', description: 'See pricing and compare what each plan includes.' },
              { title: 'Easy to switch', description: 'Update your active membership option anytime.' }
            ],
            to: '/memberships'
          },
          {
            title: 'Virtual Queue',
            description: 'Join the virtual queue and keep your place without waiting in line.',
            points: [
              { title: 'Less waiting', description: 'Hold your place without standing in line.' },
              { title: 'Live updates', description: 'See current ride availability and return windows.' },
              { title: 'Easy selection', description: 'Pick an attraction and join with one click.' },
              { title: 'Simple management', description: 'View or cancel your active queue entry anytime.' }
            ],
            to: '/queue'
          },
          {
            title: 'Dining',
            description: `${diningDirectory.items.length} dining spots across quick service, snacks, and sit-down meals.`,
            points: [
              { title: 'Food & drinks', description: 'Browse meals, snacks, and drinks across the park.' },
              { title: 'Dining types', description: 'Quick service, snack stops, and sit-down dining.' },
              { title: 'Plan ahead', description: 'Check hours and highlights before you head over.' },
              { title: 'Family friendly', description: 'Find options that fit different tastes and group sizes.' }
            ],
            to: '/dining'
          },
          {
            title: 'Shops',
            description: `${shopsDirectory.items.length} shops with apparel, collectibles, and park essentials.`,
            points: [
              { title: 'Park merch', description: 'Shop for apparel, gifts, and souvenir items.' },
              { title: 'Different categories', description: 'Browse collectibles, clothing, and essentials.' },
              { title: 'Useful stops', description: 'Pick up practical items during your visit.' },
              { title: 'Easy browsing', description: 'See shop hours, locations, and highlights quickly.' }
            ],
            to: '/shops'
          },
          {
            title: 'Shows',
            description: `${showsDirectory.items.length} live entertainment options throughout the day and night.`,
            points: [
              { title: 'Live entertainment', description: 'Explore shows happening throughout the day.' },
              { title: 'Different formats', description: 'See parades, stage shows, and nighttime events.' },
              { title: 'Check times', description: 'Review show times before planning your route.' },
              { title: 'Family viewing', description: 'Find entertainment for all ages around the park.' }
            ],
            to: '/shows'
          },
          {
            title: 'Feedback',
            description: 'Share a review or report a problem before you leave the park.',
            points: [
              { title: 'Quick reviews', description: 'Share what went well during your visit.' },
              { title: 'Report issues', description: 'Let the park know if something went wrong.' },
              { title: 'Simple forms', description: 'Send feedback in just a few steps.' },
              { title: 'Guest focused', description: 'Help improve the park experience for future visits.' }
            ],
            to: '/feedback'
          }
        ])
      } catch {
        if (isMounted) {
          setLoadError('Unable to load the customer homepage right now.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadHomeData()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="page page-home">
      <section className="home-park-banner">
        <div className="home-park-banner-copy">
          <p className="section-label">ThemePark Radical</p>
          <h1>Plan your day at the park.</h1>
          <p>
            ThemePark Radical brings rides, food, shopping, shows, and guest
            services together in one place so visitors can plan before they arrive.
          </p>
        </div>
      </section>

      <section className="home-banner-stack">
        <AsyncState
          isLoading={isLoading}
          error={loadError}
          isEmpty={!isLoading && !loadError && homepageSections.length === 0}
          loadingMessage="Loading park highlights..."
          emptyMessage="No customer features are available right now."
        />
        {homepageSections.map((section) => (
          <Link key={section.title} to={section.to} className="home-section-banner">
            <div className="home-section-banner-main">
              <div>
                <p className="section-label">Explore</p>
                <h2>{section.title}</h2>
              </div>
              <p>{section.description}</p>
            </div>
            <div className="home-section-points">
              {section.points.map((point) => (
                <div key={point.title} className="home-point">
                  <h3>{point.title}</h3>
                  <p>{point.description}</p>
                </div>
              ))}
            </div>
          </Link>
        ))}
      </section>
    </div>
  )
}

export default HomePage
