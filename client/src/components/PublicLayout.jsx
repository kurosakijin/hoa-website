import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import ResidentChatWidget from './ResidentChatWidget';
import PublicHeader from './PublicHeader';
import { getResidentChatThread, sendResidentChatMessage } from '../services/api';

const RESIDENT_CHAT_WIDGET_STORAGE_KEY = 'hoa-resident-chat-widget';
const MAX_CHAT_ATTACHMENT_BYTES = 2 * 1024 * 1024;
const ALLOWED_CHAT_ATTACHMENT_TYPES = ['image/png', 'image/jpeg'];

function getDefaultChatPosition() {
  if (typeof window === 'undefined') {
    return { x: 24, y: 120 };
  }

  const estimatedWidth = Math.min(384, window.innerWidth - 24);
  const estimatedHeight = Math.min(620, window.innerHeight - 24);

  return {
    x: Math.max(12, window.innerWidth - estimatedWidth - 20),
    y: Math.max(12, window.innerHeight - estimatedHeight - 20),
  };
}

function clampChatPosition(position) {
  if (typeof window === 'undefined') {
    return position || { x: 24, y: 120 };
  }

  const estimatedWidth = Math.min(384, window.innerWidth - 24);
  const estimatedHeight = Math.min(620, window.innerHeight - 24);
  const nextPosition = position || getDefaultChatPosition();

  return {
    x: Math.min(Math.max(nextPosition.x, 12), Math.max(12, window.innerWidth - estimatedWidth - 12)),
    y: Math.min(Math.max(nextPosition.y, 12), Math.max(12, window.innerHeight - estimatedHeight - 12)),
  };
}

function PublicLayout() {
  const location = useLocation();
  const shouldShowHeader = location.pathname !== '/';
  const shouldShowChatLauncher = !location.pathname.startsWith('/hiyas-admin-access');
  const [isResidentChatOpen, setIsResidentChatOpen] = useState(false);
  const [isResidentChatMinimized, setIsResidentChatMinimized] = useState(false);
  const [residentChatId, setResidentChatId] = useState('');
  const [connectedResidentId, setConnectedResidentId] = useState('');
  const [residentChat, setResidentChat] = useState(null);
  const [residentChatMessage, setResidentChatMessage] = useState('');
  const [residentAttachmentImageFile, setResidentAttachmentImageFile] = useState(null);
  const [residentChatError, setResidentChatError] = useState('');
  const [isResidentChatLoading, setIsResidentChatLoading] = useState(false);
  const [isResidentChatSending, setIsResidentChatSending] = useState(false);
  const [residentChatPosition, setResidentChatPosition] = useState(() => getDefaultChatPosition());

  function resetResidentChatSession({ closeWidget = false } = {}) {
    setResidentChat(null);
    setResidentChatId('');
    setConnectedResidentId('');
    setResidentChatMessage('');
    setResidentAttachmentImageFile(null);
    setResidentChatError('');
    setIsResidentChatLoading(false);
    setIsResidentChatSending(false);

    if (closeWidget) {
      setIsResidentChatOpen(false);
      setIsResidentChatMinimized(false);
    }

    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('hoa-resident-chat-id');
    }
  }

  async function loadResidentChat(id, options = {}) {
    const { silent = false } = options;

    if (!id) {
      return;
    }

    if (!silent) {
      setIsResidentChatLoading(true);
    }

    try {
      const data = await getResidentChatThread(id);
      setResidentChat(data);
      setResidentChatId(data.resident.residentCode);
      setConnectedResidentId(data.resident.residentCode);
      setResidentChatError('');
    } catch (error) {
      if (!silent) {
        setResidentChat(null);
        setConnectedResidentId('');
      }

      setResidentChatError(error.message);
    } finally {
      if (!silent) {
        setIsResidentChatLoading(false);
      }
    }
  }

  useEffect(() => {
    const savedWidgetState = window.localStorage.getItem(RESIDENT_CHAT_WIDGET_STORAGE_KEY);

    window.localStorage.removeItem('hoa-resident-chat-id');

    if (!savedWidgetState) {
      return;
    }

    try {
      const parsedWidgetState = JSON.parse(savedWidgetState);

      if (parsedWidgetState?.position) {
        setResidentChatPosition(clampChatPosition(parsedWidgetState.position));
      }

      if (typeof parsedWidgetState?.isMinimized === 'boolean') {
        setIsResidentChatMinimized(parsedWidgetState.isMinimized);
      }
    } catch (_error) {
      setResidentChatPosition(getDefaultChatPosition());
    }
  }, []);

  useEffect(() => {
    if (!connectedResidentId) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      loadResidentChat(connectedResidentId, { silent: true });
    }, 2500);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [connectedResidentId]);

  useEffect(() => {
    window.localStorage.setItem(
      RESIDENT_CHAT_WIDGET_STORAGE_KEY,
      JSON.stringify({
        isMinimized: isResidentChatMinimized,
        position: residentChatPosition,
      })
    );
  }, [isResidentChatMinimized, residentChatPosition]);

  useEffect(() => {
    function handleResize() {
      setResidentChatPosition((currentPosition) => clampChatPosition(currentPosition));
    }

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  function openResidentChatWidget() {
    setIsResidentChatOpen(true);
    setIsResidentChatMinimized(false);

    if (residentChatId && !residentChat && !isResidentChatLoading) {
      loadResidentChat(residentChatId, { silent: false });
    }
  }

  function closeResidentChatWidget() {
    resetResidentChatSession({ closeWidget: true });
  }

  function toggleResidentChatMinimized() {
    setIsResidentChatMinimized((current) => !current);
  }

  async function handleResidentChatConnect(event) {
    event.preventDefault();
    setIsResidentChatOpen(true);
    setIsResidentChatMinimized(false);
    await loadResidentChat(residentChatId);
  }

  async function handleResidentChatSend(event) {
    event.preventDefault();

    if (!connectedResidentId || (!residentChatMessage.trim() && !residentAttachmentImageFile)) {
      return;
    }

    try {
      setIsResidentChatSending(true);
      const data = await sendResidentChatMessage({
        residentId: connectedResidentId,
        message: residentChatMessage,
        attachmentImageFile: residentAttachmentImageFile,
      });
      setResidentChat(data);
      setResidentChatMessage('');
      setResidentAttachmentImageFile(null);
      setResidentChatError('');
    } catch (error) {
      setResidentChatError(error.message);
    } finally {
      setIsResidentChatSending(false);
    }
  }

  function handleResidentAttachmentChange(event) {
    const nextFile = event.target.files?.[0];

    if (!nextFile) {
      setResidentAttachmentImageFile(null);
      return;
    }

    if (!ALLOWED_CHAT_ATTACHMENT_TYPES.includes(nextFile.type)) {
      setResidentAttachmentImageFile(null);
      setResidentChatError('Only PNG and JPG images up to 2 MB are allowed for chat attachments.');
      event.target.value = '';
      return;
    }

    if (nextFile.size > MAX_CHAT_ATTACHMENT_BYTES) {
      setResidentAttachmentImageFile(null);
      setResidentChatError('Only PNG and JPG images up to 2 MB are allowed for chat attachments.');
      event.target.value = '';
      return;
    }

    setResidentAttachmentImageFile(nextFile);
    setResidentChatError('');
  }

  function clearResidentAttachment() {
    setResidentAttachmentImageFile(null);
  }

  return (
    <div className="min-h-screen public-shell text-slate-100">
      {shouldShowHeader ? <PublicHeader /> : null}
      <Outlet
        context={{
          openResidentChatWidget,
          residentChatId,
          setResidentChatId,
          residentChat,
        }}
      />
      <ResidentChatWidget
        isOpen={isResidentChatOpen}
        isMinimized={isResidentChatMinimized}
        residentChatId={residentChatId}
        residentChat={residentChat}
        chatMessage={residentChatMessage}
        attachmentImageFile={residentAttachmentImageFile}
        chatError={residentChatError}
        isChatLoading={isResidentChatLoading}
        isChatSending={isResidentChatSending}
        position={residentChatPosition}
        onPositionChange={setResidentChatPosition}
        onResidentChatIdChange={setResidentChatId}
        onConnect={handleResidentChatConnect}
        onSend={handleResidentChatSend}
        onMessageChange={setResidentChatMessage}
        onAttachmentImageChange={handleResidentAttachmentChange}
        onAttachmentImageClear={clearResidentAttachment}
        onClose={closeResidentChatWidget}
        onToggleMinimized={toggleResidentChatMinimized}
      />
      {shouldShowChatLauncher && !isResidentChatOpen ? (
        <button
          type="button"
          className="resident-chat-launcher"
          onClick={openResidentChatWidget}
          aria-label="Open resident chat"
          title="Open resident chat"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="resident-chat-launcher__icon">
            <path
              d="M14.06 4.94h4a1 1 0 0 1 1 1v12.12a1 1 0 0 1-1 1H5.94a1 1 0 0 1-1-1V5.94a1 1 0 0 1 1-1h7.12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M14.76 4.24a1.8 1.8 0 0 1 2.55 0l1.45 1.45a1.8 1.8 0 0 1 0 2.55l-7.66 7.66-3.43.88.88-3.43 7.66-7.66Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      ) : null}
    </div>
  );
}

export default PublicLayout;
