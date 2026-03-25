const DEFAULT_DELAY_MS = 0

export function withMockDelay(value, delayMs = DEFAULT_DELAY_MS) {
  if (delayMs <= 0) {
    return Promise.resolve(value)
  }

  return new Promise((resolve) => {
    window.setTimeout(() => resolve(value), delayMs)
  })
}
