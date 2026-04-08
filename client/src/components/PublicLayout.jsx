import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import ResidentChatWidget from './ResidentChatWidget';
import PublicHeader from './PublicHeader';
import { isTurnstileConfigured } from './TurnstileWidget';
import { useToast } from '../context/ToastContext';
import { getResidentChatThread, sendResidentChatMessage } from '../services/api';

const RESIDENT_CHAT_WIDGET_STORAGE_KEY = 'hoa-resident-chat-widget';
const MAX_CHAT_ATTACHMENT_BYTES = 2 * 1024 * 1024;
const ALLOWED_CHAT_ATTACHMENT_TYPES = ['image/png', 'image/jpeg'];
const DEFAULT_CHAT_SIZE = {
  width: 300,
  height: 465,
};
const MIN_CHAT_SIZE = {
  width: 280,
  height: 360,
};
const MINIMIZED_CHAT_WIDTH = 216;

function getViewportChatBounds() {
  if (typeof window === 'undefined') {
    return {
      maxHeight: DEFAULT_CHAT_SIZE.height,
      maxWidth: DEFAULT_CHAT_SIZE.width,
    };
  }

  return {
    maxWidth: Math.max(MIN_CHAT_SIZE.width, window.innerWidth - 24),
    maxHeight: Math.max(MIN_CHAT_SIZE.height, window.innerHeight - 24),
  };
}

function clampChatSize(size) {
  const { maxWidth, maxHeight } = getViewportChatBounds();
  const nextSize = size || DEFAULT_CHAT_SIZE;

  return {
    width: Math.min(Math.max(nextSize.width, MIN_CHAT_SIZE.width), maxWidth),
    height: Math.min(Math.max(nextSize.height, MIN_CHAT_SIZE.height), maxHeight),
  };
}

function getDefaultChatPosition(size = DEFAULT_CHAT_SIZE) {
  if (typeof window === 'undefined') {
    return { x: 24, y: 120 };
  }

  const chatSize = clampChatSize(size);

  return {
    x: Math.max(12, window.innerWidth - chatSize.width - 20),
    y: Math.max(12, window.innerHeight - chatSize.height - 20),
  };
}

function clampChatPosition(position, size = DEFAULT_CHAT_SIZE, isMinimized = false) {
  if (typeof window === 'undefined') {
    return position || { x: 24, y: 120 };
  }

  const chatSize = isMinimized
    ? {
        width: Math.min(MINIMIZED_CHAT_WIDTH, Math.max(180, window.innerWidth - 24)),
        height: 64,
      }
    : clampChatSize(size);
  const nextPosition = position || getDefaultChatPosition(chatSize);

  return {
    x: Math.min(Math.max(nextPosition.x, 12), Math.max(12, window.innerWidth - chatSize.width - 12)),
    y: Math.min(Math.max(nextPosition.y, 12), Math.max(12, window.innerHeight - chatSize.height - 12)),
  };
}

function PublicLayout() {
  const location = useLocation();
  const toast = useToast();
  const shouldShowHeader = location.pathname !== '/';
  const shouldShowChatLauncher = !location.pathname.startsWith('/hiyas-admin-access');
  const [isResidentChatOpen, setIsResidentChatOpen] = useState(false);
  const [isResidentChatMinimized, setIsResidentChatMinimized] = useState(false);
  const [residentChatId, setResidentChatId] = useState('');
  const [connectedResidentId, setConnectedResidentId] = useState('');
  const [residentChat, setResidentChat] = useState(null);
  const [residentChatMessage, setResidentChatMessage] = useState('');
  const [residentAttachmentImageFile, setResidentAttachmentImageFile] = useState(null);
  const [isResidentChatLoading, setIsResidentChatLoading] = useState(false);
  const [isResidentChatSending, setIsResidentChatSending] = useState(false);
  const [residentChatTurnstileToken, setResidentChatTurnstileToken] = useState('');
  const [residentChatTurnstileResetKey, setResidentChatTurnstileResetKey] = useState(0);
  const [residentChatPosition, setResidentChatPosition] = useState(() => getDefaultChatPosition(DEFAULT_CHAT_SIZE));
  const [residentChatSize, setResidentChatSize] = useState(() => clampChatSize(DEFAULT_CHAT_SIZE));

  function handleResidentChatSizeChange(nextSize) {
    const clampedSize = clampChatSize(nextSize);
    setResidentChatSize(clampedSize);
    setResidentChatPosition((currentPosition) =>
      clampChatPosition(currentPosition, clampedSize, isResidentChatMinimized)
    );
  }

  function resetResidentChatSession({ closeWidget = false } = {}) {
    setResidentChat(null);
    setResidentChatId('');
    setConnectedResidentId('');
    setResidentChatMessage('');
    setResidentAttachmentImageFile(null);
    setIsResidentChatLoading(false);
    setIsResidentChatSending(false);
    setResidentChatTurnstileToken('');
    setResidentChatTurnstileResetKey((current) => current + 1);

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
    } catch (error) {
      if (!silent) {
        setResidentChat(null);
        setConnectedResidentId('');
        toast.warning({
          title: 'Resident chat unavailable',
          message: error.message,
        });
      }
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
      const nextSize = parsedWidgetState?.size ? clampChatSize(parsedWidgetState.size) : clampChatSize(DEFAULT_CHAT_SIZE);

      if (parsedWidgetState?.position) {
        setResidentChatPosition(clampChatPosition(parsedWidgetState.position, nextSize, parsedWidgetState?.isMinimized));
      }

      setResidentChatSize(nextSize);

      if (typeof parsedWidgetState?.isMinimized === 'boolean') {
        setIsResidentChatMinimized(parsedWidgetState.isMinimized);
      }
    } catch (_error) {
      setResidentChatSize(clampChatSize(DEFAULT_CHAT_SIZE));
      setResidentChatPosition(getDefaultChatPosition(DEFAULT_CHAT_SIZE));
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
        size: residentChatSize,
      })
    );
  }, [isResidentChatMinimized, residentChatPosition, residentChatSize]);

  useEffect(() => {
    function handleResize() {
      const clampedSize = clampChatSize(residentChatSize);
      setResidentChatSize(clampedSize);
      setResidentChatPosition((currentPosition) =>
        clampChatPosition(currentPosition, clampedSize, isResidentChatMinimized)
      );
    }

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isResidentChatMinimized, residentChatSize]);

  function openResidentChatWidget() {
    setIsResidentChatOpen(true);
    setIsResidentChatMinimized(false);
    setResidentChatPosition((currentPosition) => clampChatPosition(currentPosition, residentChatSize, false));

    if (residentChatId && !residentChat && !isResidentChatLoading) {
      loadResidentChat(residentChatId, { silent: false });
    }
  }

  function closeResidentChatWidget() {
    resetResidentChatSession({ closeWidget: true });
  }

  function toggleResidentChatMinimized() {
    setIsResidentChatMinimized((current) => {
      const nextIsMinimized = !current;
      setResidentChatPosition((currentPosition) =>
        clampChatPosition(currentPosition, residentChatSize, nextIsMinimized)
      );
      return nextIsMinimized;
    });
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

    if (isTurnstileConfigured() && !residentChatTurnstileToken) {
      toast.warning({
        title: 'Security check required',
        message: 'Please complete the Cloudflare security check before sending a chat message.',
      });
      return;
    }

    try {
      setIsResidentChatSending(true);
      const data = await sendResidentChatMessage({
        residentId: connectedResidentId,
        message: residentChatMessage,
        attachmentImageFile: residentAttachmentImageFile,
        turnstileToken: residentChatTurnstileToken,
      });
      setResidentChat(data);
      setResidentChatMessage('');
      setResidentAttachmentImageFile(null);
    } catch (error) {
      toast.error({
        title: 'Message not sent',
        message: error.message,
      });
    } finally {
      setResidentChatTurnstileToken('');
      setResidentChatTurnstileResetKey((current) => current + 1);
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
      toast.warning({
        title: 'Attachment not allowed',
        message: 'Only PNG and JPG images up to 2 MB are allowed for chat attachments.',
      });
      event.target.value = '';
      return;
    }

    if (nextFile.size > MAX_CHAT_ATTACHMENT_BYTES) {
      setResidentAttachmentImageFile(null);
      toast.warning({
        title: 'Attachment too large',
        message: 'Only PNG and JPG images up to 2 MB are allowed for chat attachments.',
      });
      event.target.value = '';
      return;
    }

    setResidentAttachmentImageFile(nextFile);
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
        isChatLoading={isResidentChatLoading}
        isChatSending={isResidentChatSending}
        position={residentChatPosition}
        size={residentChatSize}
        onPositionChange={setResidentChatPosition}
        onSizeChange={handleResidentChatSizeChange}
        onResidentChatIdChange={setResidentChatId}
        onConnect={handleResidentChatConnect}
        onSend={handleResidentChatSend}
        onMessageChange={setResidentChatMessage}
        onAttachmentImageChange={handleResidentAttachmentChange}
        onAttachmentImageClear={clearResidentAttachment}
        onClose={closeResidentChatWidget}
        onTurnstileError={() => {
          setResidentChatTurnstileToken('');
          toast.warning({
            title: 'Security check unavailable',
            message: 'Cloudflare verification could not be completed. Please try again.',
          });
        }}
        onTurnstileExpire={() => setResidentChatTurnstileToken('')}
        onTurnstileVerify={setResidentChatTurnstileToken}
        onToggleMinimized={toggleResidentChatMinimized}
        turnstileResetKey={residentChatTurnstileResetKey}
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
