export async function getDirectory(category) {
  const response = await fetch(`/api/venues/${category}`)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Failed to load directory')
  }

  return data
}

export async function getVenueById(category, itemId) {
  const response = await fetch(`/api/venues/${category}/${itemId}`)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Failed to load venue')
  }

  return data
}
