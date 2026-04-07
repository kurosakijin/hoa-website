import Modal from './Modal';

function ImagePreviewModal({ isOpen, title, description, imageUrl, onClose }) {
  return (
    <Modal isOpen={isOpen} title={title} description={description} onClose={onClose} wide>
      <div className="image-preview-shell">
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="image-preview-shell__image" />
        ) : (
          <div className="image-preview-shell__empty">
            <p className="text-sm font-semibold text-white">No image available.</p>
            <p className="mt-2 text-sm text-slate-400">Upload a resident photo or payment evidence to view it here.</p>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default ImagePreviewModal;
