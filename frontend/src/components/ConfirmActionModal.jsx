import '../styles/confirm-action-modal.css'

function ConfirmActionModal({
  open,
  title = 'Confirm Action',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isProcessing = false
}) {
  if (!open) return null

  return (
    <div className="confirm-modal-overlay" onClick={isProcessing ? undefined : onCancel}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <h4 className="confirm-modal-title">{title}</h4>
        <p className="confirm-modal-message">{message}</p>
        <div className="confirm-modal-actions">
          <button
            type="button"
            className="confirm-modal-btn confirm-modal-btn-cancel"
            onClick={onCancel}
            disabled={isProcessing}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="confirm-modal-btn confirm-modal-btn-confirm"
            onClick={onConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmActionModal
