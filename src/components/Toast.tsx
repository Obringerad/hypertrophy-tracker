interface Props {
  message: string
  actionLabel?: string
  onAction?: () => void
  onDismiss: () => void
}

export function Toast({ message, actionLabel, onAction, onDismiss }: Props) {
  return (
    <div className="toast">
      <span>{message}</span>
      {actionLabel && onAction && (
        <button type="button" className="toast-action" onClick={onAction}>
          {actionLabel}
        </button>
      )}
      <button type="button" className="toast-dismiss" onClick={onDismiss} aria-label="Dismiss">
        &times;
      </button>
    </div>
  )
}
