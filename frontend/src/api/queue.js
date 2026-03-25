function getAuthHeaders() {
  const token = localStorage.getItem('token')

  return token ? { Authorization: `Bearer ${token}` } : {}
}

function formatReturnWindow(reservationTime) {
  const start = new Date(reservationTime)
  const end = new Date(start.getTime() + 30 * 60 * 1000)

  const formatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  })

  return `${formatter.format(start)} - ${formatter.format(end)}`
}

function mapQueueAttraction(row) {
  const pendingReservations = Number(row.pending_reservations || 0)
  const isAvailable = row.status_ride === 'open'

  return {
    id: String(row.ride_id),
    name: row.ride_name,
    location: `Ride ${row.ride_id}`,
    thrillLevel: 'Ride attraction',
    status: isAvailable ? 'Open' : 'Unavailable',
    waitTime: isAvailable
      ? `${15 + pendingReservations * 5} min`
      : 'Temporarily unavailable',
    returnWindow: isAvailable ? 'Assigned at booking' : 'Not available',
    description: `Current ride status: ${String(row.status_ride).replace('_', ' ')}`,
    pendingReservations,
    myReservation: row.my_reservation_id
      ? {
          reservationId: Number(row.my_reservation_id),
          attractionId: String(row.ride_id),
          attractionName: row.ride_name,
          location: `Ride ${row.ride_id}`,
          returnWindow: formatReturnWindow(row.my_reservation_time),
          joinedAt: new Date(row.my_reservation_time).toISOString()
        }
      : null
  }
}

export async function getQueueAttractions() {
  const response = await fetch('/api/rides/customer/queues', {
    headers: {
      ...getAuthHeaders()
    }
  })
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Failed to load queue attractions')
  }

  return data.map(mapQueueAttraction)
}

export async function createQueueEntry(attraction) {
  const response = await fetch(`/api/rides/customer/queues/${attraction.id}/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    }
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Failed to create queue reservation')
  }

  return {
    reservationId: Number(data.reservation_id),
    attractionId: String(data.ride_id),
    attractionName: data.ride_name,
    location: attraction.location,
    returnWindow: 'Assigned at booking',
    joinedAt: new Date().toISOString()
  }
}

export async function cancelQueueEntry(reservationId) {
  const response = await fetch(`/api/rides/customer/reservations/${reservationId}`, {
    method: 'DELETE',
    headers: {
      ...getAuthHeaders()
    }
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Failed to cancel queue reservation')
  }

  return true
}
