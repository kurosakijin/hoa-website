import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ImagePreviewModal from './ImagePreviewModal';
import { formatDate } from '../utils/format';

function AttachmentIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="resident-chat-widget__icon">
      <path
        d="M8.5 12.5l6.6-6.6a3.5 3.5 0 115 5l-8.4 8.4a5.5 5.5 0 11-7.8-7.8l8.1-8.1"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.9"
      />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="resident-chat-widget__icon">
      <path
        d="M5 4l14 8-14 8 3-8-3-8z"
        fill="currentColor"
      />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="resident-chat-widget__icon resident-chat-widget__icon--spin">
      <circle cx="12" cy="12" r="8.5" fill="none" opacity="0.25" stroke="currentColor" strokeWidth="2" />
      <path
        d="M20.5 12A8.5 8.5 0 0012 3.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function ResidentChatWidget({
  isOpen,
  isMinimized,
  residentChatId,
  residentChat,
  chatMessage,
  attachmentImageFile,
  isChatLoading,
  isChatSending,
  position,
  size,
  onPositionChange,
  onSizeChange,
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
  const resizeStateRef = useRef(null);
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

  function handleResizeStart(event) {
    if ((event.pointerType === 'mouse' && event.button !== 0) || !widgetRef.current || isMinimized) {
      return;
    }

    event.stopPropagation();
    const rect = widgetRef.current.getBoundingClientRect();
    const activePointerId = event.pointerId;
    const currentTarget = event.currentTarget;

    function handlePointerMove(moveEvent) {
      if (!resizeStateRef.current || moveEvent.pointerId !== activePointerId) {
        return;
      }

      const nextWidth = resizeStateRef.current.startWidth + (moveEvent.clientX - resizeStateRef.current.startX);
      const nextHeight = resizeStateRef.current.startHeight + (moveEvent.clientY - resizeStateRef.current.startY);

      onSizeChange({
        width: nextWidth,
        height: nextHeight,
      });
    }

    function cleanupResize() {
      resizeStateRef.current = null;
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

      cleanupResize();
    }

    resizeStateRef.current = {
      startHeight: rect.height,
      startWidth: rect.width,
      startX: event.clientX,
      startY: event.clientY,
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
  }

  return (
    <div
      ref={widgetRef}
      className={`resident-chat-widget ${isMinimized ? 'resident-chat-widget--minimized' : ''}`}
      style={
        position
          ? {
              height: !isMinimized && size ? `${size.height}px` : undefined,
              left: `${position.x}px`,
              top: `${position.y}px`,
              width: !isMinimized && size ? `${size.width}px` : undefined,
            }
          : undefined
      }
    >
      <div className="resident-chat-widget__header" onPointerDown={handleDragStart}>
        <div className="resident-chat-widget__identity">
          <div className="min-w-0">
            <p className="resident-chat-widget__title">Chat with Sitio Hiyas Admin</p>
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
            <span
              className={`resident-chat-widget__presence ${
                residentChat?.adminPresence?.isOnline ? '' : 'resident-chat-widget__presence--offline'
              }`}
            >
              <span className="resident-chat-widget__presence-dot" />
              {residentChat?.adminPresence?.isOnline ? 'Admin online' : 'Admin offline'}
            </span>
            {residentChat?.adminPresence?.lastSeenAt ? (
              <span className="resident-chat-widget__status-text">
                Last active {formatDate(residentChat.adminPresence.lastSeenAt)}
              </span>
            ) : residentChat?.resident ? (
              <span className="resident-chat-widget__status-text">
                Admin status is available, but no recent activity has been recorded yet.
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
              <p className="resident-chat-widget__thread-note">
                Your conversation stays here while you browse the resident pages. Only the messages are shown in the thread.
              </p>

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
                <div className="resident-chat-widget__composer-row">
                  <label className="chat-composer-attachment__picker chat-composer-attachment__picker--resident-icon">
                    <input
                      ref={attachmentInputRef}
                      type="file"
                      accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                      onChange={onAttachmentImageChange}
                    />
                    <span aria-hidden="true">
                      <AttachmentIcon />
                    </span>
                    <span className="sr-only">Attach image</span>
                  </label>
                  <textarea
                    rows="1"
                    value={chatMessage}
                    onChange={(event) => onMessageChange(event.target.value)}
                    placeholder={
                      residentChat.adminPresence?.isOnline
                        ? 'Write a message...'
                        : 'Admin is offline. Leave a message...'
                    }
                  />
                  <button
                    type="submit"
                    className="action-button action-button--primary resident-chat-widget__composer-submit"
                    disabled={isChatSending || (!chatMessage.trim() && !attachmentImageFile)}
                    aria-label={isChatSending ? 'Sending message' : residentChat.adminPresence?.isOnline ? 'Send message' : 'Leave message'}
                  >
                    {isChatSending ? <SpinnerIcon /> : <SendIcon />}
                  </button>
                </div>
                <div className="chat-composer-attachment chat-composer-attachment--resident">
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
              </form>
            </>
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
      {!isMinimized ? (
        <button
          type="button"
          className="resident-chat-widget__resize-handle"
          onPointerDown={handleResizeStart}
          aria-label="Resize chat window"
        >
          <span />
          <span />
          <span />
        </button>
      ) : null}
    </div>
  );
}

export default ResidentChatWidget;
