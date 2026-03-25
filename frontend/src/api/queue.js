export async function getQueueAttractions() {
  const response = await fetch('/api/customer/queue')
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Failed to load queue attractions')
  }

  return data
}

export async function createQueueEntry(attraction) {
  const token = localStorage.getItem('token')

  const response = await fetch('/api/customer/queue', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({
      rideId: attraction.id
    })
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Failed to create queue reservation')
  }

  return data
}

export async function cancelQueueEntry(reservationId) {
  const token = localStorage.getItem('token')

  const response = await fetch(`/api/customer/queue/${reservationId}`, {
    method: 'DELETE',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  })

  if (response.status === 204) {
    return true
  }

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Failed to cancel queue reservation')
  }

  return true
}
