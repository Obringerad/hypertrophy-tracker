import { useEffect } from 'react'

interface Props {
  open: boolean
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ open, message, confirmLabel = 'Delete', cancelLabel = 'Cancel', onConfirm, onCancel }: Props) {
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="confirm-dialog-backdrop" onClick={onCancel}>
      <div className="confirm-dialog" role="alertdialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <p>{message}</p>
        <div className="confirm-dialog-actions">
          <button type="button" className="choice-btn" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className="btn-delete" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
