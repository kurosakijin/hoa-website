import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ImagePreviewModal from './ImagePreviewModal';
import { formatDate } from '../utils/format';

function getResidentInitials(name) {
  return String(name || 'SH')
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function ResidentChatWidget({
  isOpen,
  isMinimized,
  residentChatId,
  residentChat,
  chatMessage,
  attachmentImageFile,
  chatError,
  isChatLoading,
  isChatSending,
  position,
  onPositionChange,
  onResidentChatIdChange,
  onConnect,
  onSend,
  onMessageChange,
  onAttachmentImageChange,
  onAttachmentImageClear,
  onClose,
  onToggleMinimized,
}) {
  const widgetRef = useRef(null);
  const dragStateRef = useRef(null);
  const messagesEndRef = useRef(null);
  const attachmentInputRef = useRef(null);
  const [previewImage, setPreviewImage] = useState(null);
  const messageCount = residentChat?.thread?.messages?.length || 0;

  useEffect(() => {
    if (!isOpen || isMinimized || !messagesEndRef.current) {
      return;
    }

    messagesEndRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    });
  }, [isMinimized, isOpen, messageCount, residentChat?.thread?.isAdminTyping]);

  useEffect(() => {
    if (!attachmentImageFile && attachmentInputRef.current) {
      attachmentInputRef.current.value = '';
    }
  }, [attachmentImageFile]);

  if (!isOpen) {
    return null;
  }

  function handleDragStart(event) {
    const target = event.target instanceof Element ? event.target : null;

    if (
      (event.pointerType === 'mouse' && event.button !== 0) ||
      !widgetRef.current ||
      target?.closest('button') ||
      target?.closest('a') ||
      target?.closest('input') ||
      target?.closest('textarea')
    ) {
      return;
    }

    const rect = widgetRef.current.getBoundingClientRect();
    const activePointerId = event.pointerId;
    const currentTarget = event.currentTarget;

    function handlePointerMove(moveEvent) {
      if (!dragStateRef.current || moveEvent.pointerId !== activePointerId) {
        return;
      }

      const nextX = Math.min(
        Math.max(moveEvent.clientX - dragStateRef.current.offsetX, 12),
        window.innerWidth - dragStateRef.current.width - 12
      );
      const nextY = Math.min(
        Math.max(moveEvent.clientY - dragStateRef.current.offsetY, 12),
        window.innerHeight - dragStateRef.current.height - 12
      );

      onPositionChange({ x: nextX, y: nextY });
    }

    function cleanupDrag() {
      dragStateRef.current = null;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);

      if (currentTarget?.releasePointerCapture) {
        try {
          currentTarget.releasePointerCapture(activePointerId);
        } catch (_error) {
          // Ignore release failures when the pointer is already gone.
        }
      }
    }

    function handlePointerUp(upEvent) {
      if (upEvent.pointerId !== activePointerId) {
        return;
      }

      cleanupDrag();
    }

    dragStateRef.current = {
      pointerId: activePointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      width: rect.width,
      height: rect.height,
    };

    if (currentTarget?.setPointerCapture) {
      try {
        currentTarget.setPointerCapture(activePointerId);
      } catch (_error) {
        // Ignore capture failures and continue with window listeners.
      }
    }

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    onPositionChange({ x: rect.left, y: rect.top });
  }

  function handleControlPointerDown(event) {
    event.stopPropagation();
  }

  return (
    <div
      ref={widgetRef}
      className={`resident-chat-widget ${isMinimized ? 'resident-chat-widget--minimized' : ''}`}
      style={position ? { left: `${position.x}px`, top: `${position.y}px` } : undefined}
    >
      <div className="resident-chat-widget__header" onPointerDown={handleDragStart}>
        <div className="resident-chat-widget__identity">
          <div className="resident-chat-widget__avatar">
            {residentChat?.resident?.profileImageUrl ? (
              <img
                src={residentChat.resident.profileImageUrl}
                alt={residentChat.resident.fullName}
                className="resident-chat-widget__avatar-image"
              />
            ) : (
              <span>{getResidentInitials(residentChat?.resident?.fullName || 'Sitio Hiyas')}</span>
            )}
          </div>

          <div className="min-w-0">
            <p className="resident-chat-widget__title">Sitio Hiyas Chat</p>
            <p className="resident-chat-widget__subtitle">
              {residentChat?.adminPresence?.isOnline ? 'Admin online' : 'Admin offline'}
            </p>
          </div>
        </div>

        <div className="resident-chat-widget__controls">
          <button
            type="button"
            className="resident-chat-widget__control"
            onPointerDown={handleControlPointerDown}
            onClick={onToggleMinimized}
          >
            {isMinimized ? '+' : '-'}
          </button>
          <button
            type="button"
            className="resident-chat-widget__control"
            onPointerDown={handleControlPointerDown}
            onClick={onClose}
          >
            x
          </button>
        </div>
      </div>

      {!isMinimized ? (
        <div className="resident-chat-widget__body">
          <div className="resident-chat-widget__status">
            <span className={`status-tag ${residentChat?.adminPresence?.isOnline ? '' : 'status-tag--danger'}`}>
              {residentChat?.adminPresence?.isOnline ? 'Admin online' : 'Admin offline'}
            </span>
            {residentChat?.adminPresence?.lastSeenAt ? (
              <span className="resident-chat-widget__status-text">
                Last active {formatDate(residentChat.adminPresence.lastSeenAt)}
              </span>
            ) : (
              <span className="resident-chat-widget__status-text">
                Enter your resident ID to start chatting with the admin team.
              </span>
            )}
          </div>

          {!residentChat?.resident ? (
            <form className="resident-chat-widget__connect" onSubmit={onConnect}>
              <label className="field-shell">
                <span>Resident ID</span>
                <input
                  value={residentChatId}
                  onChange={(event) => onResidentChatIdChange(event.target.value.toUpperCase())}
                  placeholder="Example: HOA-A12F90"
                />
              </label>

              <div className="resident-chat-widget__connect-actions">
                <button type="submit" className="action-button action-button--primary" disabled={isChatLoading || !residentChatId.trim()}>
                  {isChatLoading ? 'Opening...' : 'Open chat'}
                </button>
                <Link to="/find-my-resident-info" className="action-button action-button--secondary">
                  Find ID
                </Link>
              </div>
            </form>
          ) : null}

          {residentChat?.resident ? (
            <>
              <div className="resident-chat-widget__profile">
                <div className="resident-chat-widget__avatar resident-chat-widget__avatar--large">
                  {residentChat.resident.profileImageUrl ? (
                    <img
                      src={residentChat.resident.profileImageUrl}
                      alt={residentChat.resident.fullName}
                      className="resident-chat-widget__avatar-image"
                    />
                  ) : (
                    <span>{getResidentInitials(residentChat.resident.fullName)}</span>
                  )}
                </div>

                <div className="min-w-0">
                  <p className="resident-chat-widget__resident-name">{residentChat.resident.fullName}</p>
                  <p className="resident-chat-widget__resident-code">{residentChat.resident.residentCode}</p>
                </div>
              </div>

              {residentChat.thread?.isAdminTyping ? (
                <div className="chat-typing-indicator">
                  <span className="chat-typing-indicator__dot" />
                  <span>Admin is typing...</span>
                </div>
              ) : null}

              <div className="resident-chat-widget__messages">
                {residentChat.thread?.messages?.length ? (
                  residentChat.thread.messages.map((chatItem) => (
                    <div
                      key={chatItem.id}
                      className={`chat-message ${chatItem.senderRole === 'resident' ? 'chat-message--self' : ''}`}
                    >
                      <div className="chat-message__bubble">
                        <p className="chat-message__sender">{chatItem.senderName}</p>
                        {chatItem.attachmentImageUrl ? (
                          <button
                            type="button"
                            className="chat-message__attachment-button"
                            onClick={() =>
                              setPreviewImage({
                                title: chatItem.attachmentImageName || 'Chat attachment',
                                description: `Sent ${formatDate(chatItem.createdAt)}`,
                                imageUrl: chatItem.attachmentImageUrl,
                              })
                            }
                          >
                            <img
                              src={chatItem.attachmentImageUrl}
                              alt={chatItem.attachmentImageName || 'Chat attachment'}
                              className="chat-message__attachment-image"
                            />
                          </button>
                        ) : null}
                        {chatItem.attachmentImageName ? (
                          <p className="chat-message__attachment-name">{chatItem.attachmentImageName}</p>
                        ) : null}
                        {chatItem.body ? (
                          <p className="chat-message__body">{chatItem.body}</p>
                        ) : null}
                        <p className="chat-message__meta">{formatDate(chatItem.createdAt)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="chat-empty-state chat-empty-state--compact">
                    <p className="text-sm font-semibold text-white">No messages yet.</p>
                    <p className="mt-2 text-sm text-slate-400">
                      {residentChat.adminPresence?.isOnline
                        ? 'Send a message to start the conversation.'
                        : 'Leave a message and the admin will reply when they come back online.'}
                    </p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <form className="resident-chat-widget__composer" onSubmit={onSend}>
                <textarea
                  rows="2"
                  value={chatMessage}
                  onChange={(event) => onMessageChange(event.target.value)}
                  placeholder={
                    residentChat.adminPresence?.isOnline
                      ? 'Write a message...'
                      : 'Admin is offline. Leave a message...'
                  }
                />
                <div className="chat-composer-attachment">
                  <div className="chat-composer-attachment__row">
                    <label className="chat-composer-attachment__picker">
                      <input
                        ref={attachmentInputRef}
                        type="file"
                        accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                        onChange={onAttachmentImageChange}
                      />
                      <span>Attach image</span>
                    </label>
                    <p className="chat-composer-attachment__hint">PNG or JPG only, maximum 2 MB.</p>
                  </div>

                  {attachmentImageFile ? (
                    <div className="chat-composer-attachment__meta">
                      <p className="chat-composer-attachment__name">{attachmentImageFile.name}</p>
                      <button
                        type="button"
                        className="chat-composer-attachment__clear"
                        onClick={onAttachmentImageClear}
                      >
                        Remove
                      </button>
                    </div>
                  ) : null}
                </div>
                <button
                  type="submit"
                  className="action-button action-button--primary"
                  disabled={isChatSending || (!chatMessage.trim() && !attachmentImageFile)}
                >
                  {isChatSending ? 'Sending...' : residentChat.adminPresence?.isOnline ? 'Send' : 'Leave message'}
                </button>
              </form>
            </>
          ) : null}

          {chatError ? (
            <p className="resident-chat-widget__error">
              {chatError}
            </p>
          ) : null}
        </div>
      ) : null}
      <ImagePreviewModal
        isOpen={Boolean(previewImage)}
        title={previewImage?.title || 'Chat attachment'}
        description={previewImage?.description || 'Resident chat image attachment'}
        imageUrl={previewImage?.imageUrl || ''}
        onClose={() => setPreviewImage(null)}
      />
    </div>
  );
}

export default ResidentChatWidget;
