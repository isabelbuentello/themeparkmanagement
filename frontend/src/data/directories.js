export const directories = {
  dining: {
    eyebrow: 'Food And Drink',
    title: 'Restaurants & Dining',
    description:
      'Browse quick bites, table service, and signature snack stops across the park.',
    filters: ['All', 'Quick Service', 'Snack Stand', 'Sit-Down Dining'],
    items: [
      {
        id: 'castle-bites',
        name: 'Castle Bites',
        type: 'Quick Service',
        location: 'Fantasy Plaza',
        hours: '10:00 AM - 9:00 PM',
        highlight: 'Family combos and fast pickup windows',
        description:
          'Burgers, fries, chicken tenders, and family combo meals close to the main castle hub.',
        details: [
          'Mobile order ready in 12-15 minutes during lunch peak.',
          'Covered outdoor seating with stroller parking nearby.',
          'Kid-friendly combo meals with allergen guide available on request.'
        ]
      },
      {
        id: 'rocket-fuel-cafe',
        name: 'Rocket Fuel Cafe',
        type: 'Snack Stand',
        location: 'Tomorrow Terrace',
        hours: '11:00 AM - 8:00 PM',
        highlight: 'Coffee, frozen drinks, and quick recharge stops',
        description:
          'Coffee, pastries, smoothies, and frozen treats for guests moving between headline attractions.',
        details: [
          'Best stop for early caffeine before the lunch rush hits.',
          'Seasonal cold brew flight rotates every month.',
          'Small shaded standing counters and refill station.'
        ]
      },
      {
        id: 'pirates-table',
        name: 'Pirates Table',
        type: 'Sit-Down Dining',
        location: 'Adventure Harbor',
        hours: '12:00 PM - 10:00 PM',
        highlight: 'Signature entrees and evening harbor atmosphere',
        description:
          'Seafood baskets, pasta, signature drinks, and dessert specials overlooking the water.',
        details: [
          'Live acoustic set during the dinner service window.',
          'Large-share plates make it a strong group option.',
          'Offers indoor seating with air conditioning.'
        ]
      }
    ]
  },
  shops: {
    eyebrow: 'Merchandise',
    title: 'Shops & Park Finds',
    description:
      'Explore gifts, apparel, collectibles, and convenience stops before you head out.',
    filters: ['All', 'Apparel', 'Collectibles', 'Essentials'],
    items: [
      {
        id: 'radical-outfitters',
        name: 'Radical Outfitters',
        type: 'Apparel',
        location: 'Main Street',
        hours: '9:00 AM - 10:00 PM',
        highlight: 'Signature hoodies, hats, and seasonal drops',
        description:
          'The primary apparel shop for park-branded clothing and limited capsule collections.',
        details: [
          'New drop shelf refreshes every Friday afternoon.',
          'Fitting rooms available in the back half of the store.',
          'Carries matching family sets and weather gear.'
        ]
      },
      {
        id: 'treasure-vault',
        name: 'Treasure Vault',
        type: 'Collectibles',
        location: 'Legends Ridge',
        hours: '10:00 AM - 8:30 PM',
        highlight: 'Pins, art prints, and ride-themed collectibles',
        description:
          'A collector-focused stop with rotating pins, prints, and display-worthy souvenirs.',
        details: [
          'Limited-edition enamel pins usually sell through by mid-afternoon.',
          'Protective sleeves available for prints and maps.',
          'Some stock is tied to seasonal festivals.'
        ]
      },
      {
        id: 'park-prep',
        name: 'Park Prep',
        type: 'Essentials',
        location: 'Entry Plaza',
        hours: '8:30 AM - 9:30 PM',
        highlight: 'Ponchos, sunscreen, chargers, and forgotten-day saves',
        description:
          'A practical stop near the entrance for weather, battery, and comfort essentials.',
        details: [
          'Good first stop on rainy days because lines move fast.',
          'Portable chargers and lockers are available nearby.',
          'Also carries baby care basics and bottled water.'
        ]
      }
    ]
  },
  shows: {
    eyebrow: 'Entertainment',
    title: 'Shows & Live Entertainment',
    description:
      'Check show times, venues, and experience details while planning your route through the park.',
    filters: ['All', 'Stage Show', 'Parade', 'Nighttime Spectacular'],
    items: [
      {
        id: 'ignite-parade',
        name: 'Ignite Parade',
        type: 'Parade',
        location: 'Main Street Loop',
        hours: '2:00 PM and 5:30 PM',
        highlight: 'Colorful float parade with character appearances',
        description:
          'An afternoon parade with music, dancers, and high-energy floats moving through the central boulevard.',
        details: [
          'Good curbside spots start filling 20 minutes before showtime.',
          'The parade route stays mostly sun exposed in the afternoon.',
          'Accessibility viewing areas are marked near the square.'
        ]
      },
      {
        id: 'midnight-signal',
        name: 'Midnight Signal',
        type: 'Stage Show',
        location: 'Tomorrow Terrace Theater',
        hours: '1:15 PM, 4:15 PM, 7:15 PM',
        highlight: 'Projection-heavy stunt and music performance',
        description:
          'A fast-paced indoor stage show combining acrobatics, projection mapping, and live percussion.',
        details: [
          'Indoor venue makes this a reliable midday cool-down option.',
          'Recommended for guests who want a break from ride queues.',
          'Late seating is limited once effects sequences begin.'
        ]
      },
      {
        id: 'skyfall-symphony',
        name: 'Skyfall Symphony',
        type: 'Nighttime Spectacular',
        location: 'Central Lagoon',
        hours: '8:45 PM',
        highlight: 'Fireworks, fountains, and synchronized score',
        description:
          'The park-closing show with fireworks, water effects, and a full-park musical finale.',
        details: [
          'Best wide-angle viewing is from the west bridge and central hub.',
          'Night winds may slightly shift launch timing.',
          'A strong anchor for the end of a full park day.'
        ]
      }
    ]
  }
}
