import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
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
  chatError,
  isChatLoading,
  isChatSending,
  position,
  onPositionChange,
  onResidentChatIdChange,
  onConnect,
  onSend,
  onMessageChange,
  onClose,
  onToggleMinimized,
}) {
  const widgetRef = useRef(null);
  const dragStateRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messageCount = residentChat?.thread?.messages?.length || 0;

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handlePointerMove(event) {
      if (!dragStateRef.current || !widgetRef.current) {
        return;
      }

      const nextX = Math.min(
        Math.max(event.clientX - dragStateRef.current.offsetX, 12),
        window.innerWidth - dragStateRef.current.width - 12
      );
      const nextY = Math.min(
        Math.max(event.clientY - dragStateRef.current.offsetY, 12),
        window.innerHeight - dragStateRef.current.height - 12
      );

      onPositionChange({ x: nextX, y: nextY });
    }

    function handlePointerUp() {
      dragStateRef.current = null;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    }

    if (dragStateRef.current) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isOpen, onPositionChange]);

  useEffect(() => {
    if (!isOpen || isMinimized || !messagesEndRef.current) {
      return;
    }

    messagesEndRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    });
  }, [isMinimized, isOpen, messageCount, residentChat?.thread?.isAdminTyping]);

  if (!isOpen) {
    return null;
  }

  function handleDragStart(event) {
    const target = event.target instanceof Element ? event.target : null;

    if (event.button !== 0 || !widgetRef.current || target?.closest('button')) {
      return;
    }

    const rect = widgetRef.current.getBoundingClientRect();
    dragStateRef.current = {
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      width: rect.width,
      height: rect.height,
    };

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
                        <p className="chat-message__body">{chatItem.body}</p>
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
                <button
                  type="submit"
                  className="action-button action-button--primary"
                  disabled={isChatSending || !chatMessage.trim()}
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
    </div>
  );
}

export default ResidentChatWidget;
