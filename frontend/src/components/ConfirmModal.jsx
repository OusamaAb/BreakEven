import { useEffect } from 'react'

export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Yes, delete',
  cancelText = 'Cancel',
  type = 'danger' // 'danger' or 'warning'
}) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        <div className="modal-content">
          <div className={`modal-icon ${type}`}>
            {type === 'danger' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                <line x1="10" y1="11" x2="10" y2="17"/>
                <line x1="14" y1="11" x2="14" y2="17"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            )}
          </div>
          
          <h3 className="modal-title">{title}</h3>
          <p className="modal-message">{message}</p>
          
          <div className="modal-actions">
            <button className="modal-btn modal-btn-cancel" onClick={onClose}>
              {cancelText}
            </button>
            <button className={`modal-btn modal-btn-confirm ${type}`} onClick={onConfirm}>
              {confirmText}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
          animation: fadeIn 0.2s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal-container {
          width: 100%;
          max-width: 400px;
          animation: slideUp 0.3s ease-out;
        }

        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .modal-content {
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.95));
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 32px;
          text-align: center;
          box-shadow: 
            0 0 0 1px rgba(255, 255, 255, 0.05),
            0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        .modal-icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 20px;
          padding: 16px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-icon.danger {
          background: rgba(239, 68, 68, 0.1);
          color: #f87171;
        }

        .modal-icon.warning {
          background: rgba(245, 158, 11, 0.1);
          color: #fbbf24;
        }

        .modal-icon svg {
          width: 32px;
          height: 32px;
        }

        .modal-title {
          font-size: 22px;
          font-weight: 700;
          color: white;
          margin-bottom: 10px;
          letter-spacing: -0.5px;
        }

        .modal-message {
          color: #94a3b8;
          font-size: 15px;
          line-height: 1.5;
          margin-bottom: 28px;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
        }

        .modal-btn {
          flex: 1;
          padding: 14px 20px;
          border-radius: 12px;
          font-family: inherit;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .modal-btn-cancel {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #94a3b8;
        }

        .modal-btn-cancel:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .modal-btn-confirm {
          color: white;
          position: relative;
          overflow: hidden;
        }

        .modal-btn-confirm.danger {
          background: linear-gradient(135deg, #ef4444, #dc2626);
        }

        .modal-btn-confirm.danger:hover {
          box-shadow: 0 10px 30px rgba(239, 68, 68, 0.3);
          transform: translateY(-1px);
        }

        .modal-btn-confirm.warning {
          background: linear-gradient(135deg, #f59e0b, #d97706);
        }

        .modal-btn-confirm.warning:hover {
          box-shadow: 0 10px 30px rgba(245, 158, 11, 0.3);
          transform: translateY(-1px);
        }

        .modal-btn:active {
          transform: scale(0.98);
        }
      `}</style>
    </div>
  )
}

