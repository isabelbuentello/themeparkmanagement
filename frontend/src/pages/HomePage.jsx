import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMemberships } from '../api/memberships'
import { getTicketProducts } from '../api/tickets'
import { getDirectory } from '../api/venues'
import AsyncState from '../components/AsyncState'
import theme from '../assets/theme.avif'
import ticketsImage from '../assets/tickets.jpg'
import membershipsImage from '../assets/memberships.jpg'
import diningImage from '../assets/dining.webp'
import shopsImage from '../assets/shops.webp'
import showsImage from '../assets/shows.webp'
import feedbackImage from '../assets/feedback.webp'

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
            image: ticketsImage,
            imageAlt: 'Theme park ticket gate and attractions',
            imagePosition: 'center 42%',
            description: `World class theme park for an affordable price! Buy tickets and passes starting at $${Math.min(
              ...ticketProducts.map((ticket) => ticket.price)
            )}.`,
            to: '/tickets'
          },
          {
            title: 'Memberships',
            image: membershipsImage,
            imageAlt: 'Theme park guests enjoying attractions',
            imagePosition: 'center 50%',
            description: `Become a member by signing up with our membership and become the benefeciary of our perks.`,
            to: '/memberships'
          },
          {
            title: 'Dining',
            image: diningImage,
            imageAlt: 'Theme park dining area',
            imagePosition: 'center 58%',
            description: `Dine with our chefs with a great selection of meals and drinks tailored just for you.`,
            to: '/dining'
          },
          {
            title: 'Shops',
            image: shopsImage,
            imageAlt: 'Theme park shops and walkways',
            imagePosition: 'center 64%',
            description: `${shopsDirectory.items.length} Purchase apparel, collectible items, or park essentials to capture that memory forever.`,
            to: '/shops'
          },
          {
            title: 'Shows',
            image: showsImage,
            imageAlt: 'Theme park live entertainment area',
            imagePosition: 'center 72%',
            description: `${showsDirectory.items.length} Come visit our live entertainment options throughout the day and night.`,
            to: '/shows'
          },
          {
            title: 'Feedback',
            image: feedbackImage,
            imageAlt: 'Theme park guest services area',
            imagePosition: 'center 48%',
            description: 'Share a review or report a problem before you leave the park.',
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
      <section
        className="home-park-banner"
        style={{ '--home-hero-image': `url(${theme})` }}
      >
        <div className="home-park-banner-copy">
          <p className="section-label">Team6 ThemePark</p>
          <h1>Plan your day at the park.</h1>
          <p>
            Team6 ThemePark is an adventurous playground for your family and friends.
            Come join us with our fastest roller coasters in the south, fine dining with our chefs,
            and romance, cry or laugh with our world class performers who put on the best shows right here at the park!
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
            <div
              className="home-section-media"
              style={{
                backgroundImage: `url(${section.image})`,
                backgroundPosition: section.imagePosition
              }}
            >
              <img
                src={section.image}
                alt={section.imageAlt}
                style={{ objectPosition: section.imagePosition }}
              />
            </div>
            <div className="home-section-banner-main">
              <div>
                <h2>{section.title}</h2>
              </div>
              <p>{section.description}</p>
            </div>
          </Link>
        ))}
      </section>
    </div>
  )
}

export default HomePage
