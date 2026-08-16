import { useEffect } from 'react';
import { RiCloseLine } from 'react-icons/ri';
import './ui.css';

const Modal = ({ isOpen, onClose, title, subtitle, icon: Icon, children, size = 'md' }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal-container modal-${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-header-text">
            {Icon && (
              <span className="modal-header-icon" aria-hidden="true">
                <Icon size={18} />
              </span>
            )}
            <div>
              <h2 className="modal-title" id="modal-title">{title}</h2>
              {subtitle && <p className="modal-subtitle">{subtitle}</p>}
            </div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close dialog">
            <RiCloseLine size={24} />
          </button>
        </div>
        <div className="modal-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
