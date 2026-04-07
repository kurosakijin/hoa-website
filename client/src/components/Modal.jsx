function Modal({ isOpen, title, description, onClose, children, wide = false }) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className={`modal-card ${wide ? 'modal-card--wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">{title}</p>
            {description ? <p className="mt-2 text-sm text-slate-400">{description}</p> : null}
          </div>

          <button type="button" className="modal-close" onClick={onClose}>
            Close
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

export default Modal;