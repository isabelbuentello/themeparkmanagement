import { useEffect, useState } from 'react'

function readStoredValue(key, initialValue) {
  const fallbackValue =
    typeof initialValue === 'function' ? initialValue() : initialValue

  if (typeof window === 'undefined') {
    return fallbackValue
  }

  const storedValue = window.localStorage.getItem(key)

  if (!storedValue) {
    return fallbackValue
  }

  try {
    return JSON.parse(storedValue)
  } catch {
    return fallbackValue
  }
}

function usePersistentState(key, initialValue) {
  const [state, setState] = useState(() => readStoredValue(key, initialValue))

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(state))
  }, [key, state])

  return [state, setState]
}

export default usePersistentState
