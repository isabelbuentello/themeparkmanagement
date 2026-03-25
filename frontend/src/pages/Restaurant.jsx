const restaurants = [
  {
    name: 'Castle Bites',
    type: 'Quick Service',
    location: 'Fantasy Plaza',
    hours: '10:00 AM - 9:00 PM',
    description: 'Burgers, fries, chicken tenders, and family combo meals.'
  },
  {
    name: 'Rocket Fuel Café',
    type: 'Snack Stand',
    location: 'Tomorrow Zone',
    hours: '11:00 AM - 8:00 PM',
    description: 'Coffee, pastries, smoothies, and frozen treats.'
  },
  {
    name: 'Pirate’s Table',
    type: 'Sit-Down Dining',
    location: 'Adventure Harbor',
    hours: '12:00 PM - 10:00 PM',
    description: 'Seafood baskets, pasta, signature drinks, and dessert specials.'
  }
]

function RestaurantPage() {
  return (
    <div className="page">
      <div className="page-header">
        <h1>Restaurants & Dining</h1>
        <p>
          Browse available dining spots across the park.
        </p>
      </div>

      <div className="card-grid">
        {restaurants.map((restaurant) => (
          <div className="info-card" key={restaurant.name}>
            <h2>{restaurant.name}</h2>
            <p className="card-description">{restaurant.description}</p>
            <p className="card-type"><strong>Type:</strong> {restaurant.type}</p>
            <p><strong>Location:</strong> {restaurant.location}</p>
            <p><strong>Hours:</strong> {restaurant.hours}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default RestaurantPage
