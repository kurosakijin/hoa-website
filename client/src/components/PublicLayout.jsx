import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import ResidentChatWidget from './ResidentChatWidget';
import PublicHeader from './PublicHeader';
import { getResidentChatThread, sendResidentChatMessage } from '../services/api';

const RESIDENT_CHAT_STORAGE_KEY = 'hoa-resident-chat-id';
const RESIDENT_CHAT_WIDGET_STORAGE_KEY = 'hoa-resident-chat-widget';

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
  const [isResidentChatOpen, setIsResidentChatOpen] = useState(false);
  const [isResidentChatMinimized, setIsResidentChatMinimized] = useState(false);
  const [residentChatId, setResidentChatId] = useState('');
  const [connectedResidentId, setConnectedResidentId] = useState('');
  const [residentChat, setResidentChat] = useState(null);
  const [residentChatMessage, setResidentChatMessage] = useState('');
  const [residentChatError, setResidentChatError] = useState('');
  const [isResidentChatLoading, setIsResidentChatLoading] = useState(false);
  const [isResidentChatSending, setIsResidentChatSending] = useState(false);
  const [residentChatPosition, setResidentChatPosition] = useState(() => getDefaultChatPosition());

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
      window.localStorage.setItem(RESIDENT_CHAT_STORAGE_KEY, data.resident.residentCode);
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
    const savedResidentId = window.localStorage.getItem(RESIDENT_CHAT_STORAGE_KEY);
    const savedWidgetState = window.localStorage.getItem(RESIDENT_CHAT_WIDGET_STORAGE_KEY);

    if (!savedResidentId) {
      setResidentChatId('');
    } else {
      setResidentChatId(savedResidentId);
    }

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
    setIsResidentChatOpen(false);
    setIsResidentChatMinimized(false);
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

    if (!connectedResidentId || !residentChatMessage.trim()) {
      return;
    }

    try {
      setIsResidentChatSending(true);
      const data = await sendResidentChatMessage({
        residentId: connectedResidentId,
        message: residentChatMessage,
      });
      setResidentChat(data);
      setResidentChatMessage('');
      setResidentChatError('');
    } catch (error) {
      setResidentChatError(error.message);
    } finally {
      setIsResidentChatSending(false);
    }
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
        chatError={residentChatError}
        isChatLoading={isResidentChatLoading}
        isChatSending={isResidentChatSending}
        position={residentChatPosition}
        onPositionChange={setResidentChatPosition}
        onResidentChatIdChange={setResidentChatId}
        onConnect={handleResidentChatConnect}
        onSend={handleResidentChatSend}
        onMessageChange={setResidentChatMessage}
        onClose={closeResidentChatWidget}
        onToggleMinimized={toggleResidentChatMinimized}
      />
    </div>
  );
}

export default PublicLayout;
