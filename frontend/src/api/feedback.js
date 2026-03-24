async function request(url, payload, token) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(payload)
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Request failed')
  }

  return data
}

export async function submitReview(reviewForm) {
  const token = localStorage.getItem('token')

  const payload = {
    rating: reviewForm.rating,
    notes: reviewForm.notes
  }

  const data = await request('/api/feedback/reviews', payload, token)

  return {
    ok: true,
    message: data.message
  }
}

export async function submitComplaint(complaintForm) {
  const token = localStorage.getItem('token')

  const payload = {
    notes: complaintForm.notes
  }

  const data = await request('/api/feedback/complaints', payload, token)

  return {
    ok: true,
    message: data.message
  }
}

