function AsyncState({
  isLoading = false,
  error = '',
  isEmpty = false,
  loadingMessage = 'Loading...',
  errorMessage = '',
  emptyMessage = '',
  className = ''
}) {
  if (!isLoading && !error && !isEmpty) {
    return null
  }

  const tone = error ? 'error' : isLoading ? 'loading' : 'empty'
  const message = error ? errorMessage || error : isLoading ? loadingMessage : emptyMessage

  return (
    <div className={`async-state async-state-${tone} ${className}`.trim()} role={error ? 'alert' : 'status'}>
      <p className="async-state-label">
        {error ? 'Something went wrong' : isLoading ? 'Loading' : 'Nothing here yet'}
      </p>
      <p className="async-state-message">{message}</p>
    </div>
  )
}

export default AsyncState
