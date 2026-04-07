import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  clearAdminChatThread,
  clearAdminChatTyping,
  getAdminChatThread,
  getAdminChatThreads,
  sendAdminChatMessage,
  setAdminChatTyping,
} from '../../services/api';
import { formatDate } from '../../utils/format';

function getResidentInitials(name) {
  return String(name || 'SH')
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function AdminChatPage() {
  const { token } = useAuth();
  const [threads, setThreads] = useState([]);
  const [adminPresence, setAdminPresence] = useState(null);
  const [selectedThreadId, setSelectedThreadId] = useState('');
  const [selectedThread, setSelectedThread] = useState(null);
  const [message, setMessage] = useState('');
  const [isThreadsLoading, setIsThreadsLoading] = useState(true);
  const [isThreadLoading, setIsThreadLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [error, setError] = useState('');
  const typingTimeoutRef = useRef(null);
  const selectedThreadIdRef = useRef('');

  async function loadThreads({ silent = false } = {}) {
    if (!silent) {
      setIsThreadsLoading(true);
    }

    try {
      const data = await getAdminChatThreads(token);
      setThreads(data.threads);
      setAdminPresence(data.adminPresence);
      setError('');
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      if (!silent) {
        setIsThreadsLoading(false);
      }
    }
  }

  async function loadThreadDetail(threadId, { silent = false } = {}) {
    if (!threadId) {
      setSelectedThread(null);
      return;
    }

    if (!silent) {
      setIsThreadLoading(true);
    }

    try {
      const data = await getAdminChatThread(token, threadId);
      setSelectedThread(data.thread);
      setAdminPresence(data.adminPresence);
      setError('');
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      if (!silent) {
        setIsThreadLoading(false);
      }
    }
  }

  async function stopTyping(threadId) {
    const targetThreadId = threadId || selectedThreadIdRef.current;

    if (!targetThreadId) {
      return;
    }

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    await clearAdminChatTyping(token, targetThreadId).catch(() => {});
  }

  function handleComposerChange(event) {
    const nextValue = event.target.value;
    setMessage(nextValue);

    if (!selectedThreadId) {
      return;
    }

    if (!nextValue.trim()) {
      stopTyping(selectedThreadId);
      return;
    }

    setAdminChatTyping(token, selectedThreadId).catch(() => {});

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = window.setTimeout(() => {
      clearAdminChatTyping(token, selectedThreadId).catch(() => {});
      typingTimeoutRef.current = null;
    }, 2200);
  }

  useEffect(() => {
    loadThreads();
  }, [token]);

  useEffect(() => {
    if (!threads.length) {
      setSelectedThreadId('');
      setSelectedThread(null);
      return;
    }

    if (!selectedThreadId || !threads.some((thread) => thread.id === selectedThreadId)) {
      setSelectedThreadId(threads[0].id);
    }
  }, [threads, selectedThreadId]);

  useEffect(() => {
    const previousThreadId = selectedThreadIdRef.current;
    selectedThreadIdRef.current = selectedThreadId;

    if (previousThreadId && previousThreadId !== selectedThreadId) {
      stopTyping(previousThreadId);
      setMessage('');
    }
  }, [selectedThreadId]);

  useEffect(() => {
    if (!selectedThreadId) {
      return undefined;
    }

    loadThreadDetail(selectedThreadId);
    const intervalId = window.setInterval(() => {
      loadThreadDetail(selectedThreadId, { silent: true });
    }, 2500);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [selectedThreadId, token]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      loadThreads({ silent: true });
    }, 3500);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [token]);

  useEffect(() => {
    return () => {
      stopTyping(selectedThreadIdRef.current);
    };
  }, []);

  async function handleSendMessage(event) {
    event.preventDefault();

    if (!selectedThreadId || !message.trim()) {
      return;
    }

    try {
      setIsSending(true);
      await stopTyping(selectedThreadId);
      const data = await sendAdminChatMessage(token, selectedThreadId, { message });
      setSelectedThread(data.thread);
      setAdminPresence(data.adminPresence);
      setMessage('');
      setError('');
      await loadThreads({ silent: true });
    } catch (sendError) {
      setError(sendError.message);
    } finally {
      setIsSending(false);
    }
  }

  async function handleClearThread() {
    if (!selectedThreadId) {
      return;
    }

    if (!window.confirm('Clear this chat thread? This will delete the whole conversation for both the resident and admin.')) {
      return;
    }

    try {
      setIsClearing(true);
      await stopTyping(selectedThreadId);
      await clearAdminChatThread(token, selectedThreadId);
      setSelectedThread(null);
      setSelectedThreadId('');
      setMessage('');
      setError('');
      await loadThreads({ silent: true });
    } catch (clearError) {
      setError(clearError.message);
    } finally {
      setIsClearing(false);
    }
  }

  const selectedThreadSummary = useMemo(
    () => threads.find((thread) => thread.id === selectedThreadId) || selectedThread,
    [threads, selectedThread, selectedThreadId]
  );

  return (
    <div className="space-y-6">
      <section className="surface-card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="eyebrow">Resident chat</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Resident to admin conversations</h2>
            <p className="mt-2 text-sm text-slate-400">
              Residents can open chat with their resident ID, leave messages while you are offline, and get near real-time replies once you are back in the admin workspace.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className={`status-tag ${adminPresence?.isOnline ? '' : 'status-tag--danger'}`}>
              {adminPresence?.isOnline ? 'Admin online' : 'Admin offline'}
            </span>
            {adminPresence?.lastSeenAt ? (
              <span className="text-sm text-slate-400">Last active {formatDate(adminPresence.lastSeenAt)}</span>
            ) : null}
          </div>
        </div>

        {error ? <p className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p> : null}

        <div className="admin-chat-shell mt-6">
          <aside className="chat-thread-list">
            <div className="chat-thread-list__header">
              <h3 className="text-lg font-semibold text-white">Open resident threads</h3>
              <p className="text-sm text-slate-400">Unread resident messages are highlighted here and also reflected in the admin sidebar badge.</p>
            </div>

            <div className="chat-thread-list__items">
              {isThreadsLoading ? (
                <div className="chat-empty-state">
                  <p className="text-sm text-slate-300">Loading resident conversations...</p>
                </div>
              ) : null}

              {!isThreadsLoading && !threads.length ? (
                <div className="chat-empty-state">
                  <p className="text-sm font-semibold text-white">No resident chats yet.</p>
                  <p className="mt-2 text-sm text-slate-400">
                    Once a resident opens chat with their resident ID and sends a message, the thread will appear here.
                  </p>
                </div>
              ) : null}

              {threads.map((thread) => (
                <button
                  key={thread.id}
                  type="button"
                  className={`chat-thread-list__item ${thread.id === selectedThreadId ? 'chat-thread-list__item--active' : ''}`}
                  onClick={() => setSelectedThreadId(thread.id)}
                >
                  <div className="chat-thread-list__item-top">
                    <div className="chat-thread-list__avatar">
                      {thread.residentProfileImageUrl ? (
                        <img
                          src={thread.residentProfileImageUrl}
                          alt={thread.residentName}
                          className="chat-thread-list__avatar-image"
                        />
                      ) : (
                        <span>{getResidentInitials(thread.residentName)}</span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="chat-thread-list__name">{thread.residentName}</p>
                      <p className="chat-thread-list__sub">{thread.residentCode}</p>
                    </div>
                  </div>

                  <p className="chat-thread-list__preview">{thread.lastMessageText || 'No messages yet.'}</p>

                  <div className="chat-thread-list__item-meta">
                    <span>{thread.lastMessageAt ? formatDate(thread.lastMessageAt) : 'Waiting for first message'}</span>
                    {thread.unreadForAdmin ? (
                      <strong className="chat-thread-list__badge">{thread.unreadForAdmin}</strong>
                    ) : null}
                  </div>
                </button>
              ))}
            </div>
          </aside>

          <div className="chat-panel surface-card">
            {selectedThreadSummary ? (
              <>
                <div className="chat-panel__header">
                  <div className="chat-panel__identity">
                    <div className="chat-thread-list__avatar">
                      {selectedThreadSummary.residentProfileImageUrl ? (
                        <img
                          src={selectedThreadSummary.residentProfileImageUrl}
                          alt={selectedThreadSummary.residentName}
                          className="chat-thread-list__avatar-image"
                        />
                      ) : (
                        <span>{getResidentInitials(selectedThreadSummary.residentName)}</span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="chat-panel__name">{selectedThreadSummary.residentName}</p>
                      <p className="chat-panel__sub">{selectedThreadSummary.residentCode}</p>
                    </div>
                  </div>

                  <div className="chat-panel__header-actions">
                    <span className="status-tag status-tag--violet">
                      {selectedThread?.messages?.length || 0} message{selectedThread?.messages?.length === 1 ? '' : 's'}
                    </span>
                    <button
                      type="button"
                      className="action-button action-button--danger"
                      onClick={handleClearThread}
                      disabled={isClearing}
                    >
                      {isClearing ? 'Clearing...' : 'Clear solved chat'}
                    </button>
                  </div>
                </div>

                <div className="chat-messages">
                  {isThreadLoading ? (
                    <div className="chat-empty-state">
                      <p className="text-sm text-slate-300">Loading conversation...</p>
                    </div>
                  ) : null}

                  {!isThreadLoading && selectedThread?.messages?.length ? (
                    selectedThread.messages.map((chatMessage) => (
                      <div
                        key={chatMessage.id}
                        className={`chat-message ${chatMessage.senderRole === 'admin' ? 'chat-message--self' : ''}`}
                      >
                        <div className="chat-message__bubble">
                          <p className="chat-message__sender">{chatMessage.senderName}</p>
                          <p className="chat-message__body">{chatMessage.body}</p>
                          <p className="chat-message__meta">{formatDate(chatMessage.createdAt)}</p>
                        </div>
                      </div>
                    ))
                  ) : null}

                  {!isThreadLoading && !selectedThread?.messages?.length ? (
                    <div className="chat-empty-state">
                      <p className="text-sm font-semibold text-white">No messages in this thread yet.</p>
                      <p className="mt-2 text-sm text-slate-400">
                        Residents can still leave the first message even while you are offline.
                      </p>
                    </div>
                  ) : null}
                </div>

                <form className="chat-composer" onSubmit={handleSendMessage}>
                  <label className="field-shell">
                    <span>Reply to resident</span>
                    <textarea
                      rows="3"
                      value={message}
                      onChange={handleComposerChange}
                      placeholder="Type your reply to the resident..."
                    />
                  </label>
                  <div className="chat-composer__actions">
                    <span className="text-sm text-slate-400">
                      Residents will see your reply on their side almost immediately, and they can also see when you are typing.
                    </span>
                    <button type="submit" className="action-button action-button--primary" disabled={isSending || !message.trim()}>
                      {isSending ? 'Sending...' : 'Send reply'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="chat-empty-state chat-empty-state--panel">
                <p className="text-base font-semibold text-white">Select a resident thread.</p>
                <p className="mt-2 text-sm text-slate-400">
                  When residents open chat using their resident ID, their conversation will appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default AdminChatPage;
