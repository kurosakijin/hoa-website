import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Link } from 'react-router-dom';
import Seo from '../components/Seo';
import {
  getPublicOccupancySummary,
  getResidentChatThread,
  sendResidentChatMessage,
} from '../services/api';
import { formatDate } from '../utils/format';

const featureCards = [
  {
    title: 'Resident records that stay organized',
    text: 'Track contact details, addresses, lot assignments, and resident IDs with a single searchable directory.',
  },
  {
    title: 'Payment visibility for every assigned lot',
    text: 'See total balance, remaining balance, and exact-date payment history for each homeowner property.',
  },
  {
    title: 'Resident-friendly information access',
    text: 'Residents can search their own records, confirm assigned lots, and review exact-date payment history from a dedicated lookup page.',
  },
];

const residentServices = [
  { label: 'Resident info search', value: 'Name, block, lot, or ID' },
  { label: 'Payment visibility', value: 'Exact-date lot history' },
  { label: 'Property support', value: 'Single or multi-lot records' },
];

const lookupPreparation = [
  'Prepare your resident ID if you already received one from the admin team.',
  'If you do not have your ID yet, use your last name, first name, block, and lot number.',
  'Uploaded payment receipts and posted payment dates will appear directly in your resident result.',
];

const RESIDENT_CHAT_STORAGE_KEY = 'hoa-resident-chat-id';

function getResidentInitials(name) {
  return String(name || 'SH')
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function ResidentPage() {
  const [occupancySummary, setOccupancySummary] = useState({
    occupiedResidents: 0,
    occupiedLots: 0,
    occupiedBlocksCount: 0,
    occupiedBlocks: [],
  });
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [occupancyError, setOccupancyError] = useState('');
  const [residentChatId, setResidentChatId] = useState('');
  const [connectedResidentId, setConnectedResidentId] = useState('');
  const [residentChat, setResidentChat] = useState(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatError, setChatError] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isChatSending, setIsChatSending] = useState(false);

  async function loadResidentChat(residentId, options = {}) {
    const { silent = false } = options;

    if (!residentId) {
      return;
    }

    if (!silent) {
      setIsChatLoading(true);
    }

    try {
      const data = await getResidentChatThread(residentId);
      setResidentChat(data);
      setResidentChatId(data.resident.residentCode);
      setConnectedResidentId(data.resident.residentCode);
      setChatError('');
      window.localStorage.setItem(RESIDENT_CHAT_STORAGE_KEY, data.resident.residentCode);
    } catch (error) {
      if (!silent) {
        setResidentChat(null);
        setConnectedResidentId('');
      }

      setChatError(error.message);
    } finally {
      if (!silent) {
        setIsChatLoading(false);
      }
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function loadOccupancySummary() {
      try {
        const summary = await getPublicOccupancySummary();

        if (!isMounted) {
          return;
        }

        setOccupancySummary(summary);
        setOccupancyError('');
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setOccupancyError(error.message);
      } finally {
        if (isMounted) {
          setIsLoadingSummary(false);
        }
      }
    }

    loadOccupancySummary();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const savedResidentId = window.localStorage.getItem(RESIDENT_CHAT_STORAGE_KEY);

    if (!savedResidentId) {
      return;
    }

    setResidentChatId(savedResidentId);
    loadResidentChat(savedResidentId);
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

  async function handleChatConnect(event) {
    event.preventDefault();
    await loadResidentChat(residentChatId);
  }

  async function handleChatSend(event) {
    event.preventDefault();

    if (!connectedResidentId || !chatMessage.trim()) {
      return;
    }

    try {
      setIsChatSending(true);
      const data = await sendResidentChatMessage({
        residentId: connectedResidentId,
        message: chatMessage,
      });
      setResidentChat(data);
      setChatMessage('');
      setChatError('');
    } catch (error) {
      setChatError(error.message);
    } finally {
      setIsChatSending(false);
    }
  }

  return (
    <main className="pb-20">
      <Seo
        title="Resident Page"
        description="Resident-facing page for Sitio Hiyas homeowners with occupancy visibility, lot payment summaries, and access to resident record lookup."
        path="/resident-page"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Sitio Hiyas Resident Page',
          description:
            'Resident page for Sitio Hiyas Homeowners Association with occupancy updates, payment visibility, and resident lookup access.',
          url: import.meta.env.VITE_SITE_URL
            ? `${import.meta.env.VITE_SITE_URL.replace(/\/+$/, '')}/resident-page`
            : undefined,
        }}
      />
      <section className="mx-auto grid max-w-7xl gap-8 px-4 pt-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-6 lg:pt-10">
        <div className="hero-copy surface-card p-8 lg:p-10">
          <p className="eyebrow">Resident page</p>
          <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-white lg:text-6xl">
            Resident records, lot balances, and payment visibility in one place.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-slate-300">
            This page keeps the resident-focused portal separate from the public homepage. Use it to review occupancy updates, understand the resident search process, and move into your own record lookup when you are ready.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/find-my-resident-info" className="action-button action-button--primary">
              Find My Resident Info
            </Link>
            <a href="#resident-chat" className="action-button action-button--secondary">
              Chat with Admin
            </a>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <div className="info-chip">
              <strong>Resident lookup</strong>
              <span>Search by name, block, lot, or resident ID.</span>
            </div>
            <div className="info-chip">
              <strong>Lot-based payments</strong>
              <span>Track balances and exact-date histories per property.</span>
            </div>
            <div className="info-chip">
              <strong>Multi-lot resident view</strong>
              <span>Residents with two or more lots are shown with card-based property records.</span>
            </div>
          </div>
        </div>

        <div className="dashboard-preview">
          <div className="surface-card preview-card preview-card--hero p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="eyebrow">Resident services</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Community and resident information at a glance</h2>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {residentServices.map((service) => (
                <div key={service.label} className="preview-stat preview-stat--compact-copy">
                  <span>{service.label}</span>
                  <strong>{service.value}</strong>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="eyebrow">Current occupancy</p>
                  <h3 className="mt-2 text-xl font-semibold text-white">Occupied resident records by block</h3>
                </div>
                <span className="status-tag">
                  {isLoadingSummary ? 'Loading occupancy...' : `${occupancySummary.occupiedLots} occupied lots`}
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="preview-stat">
                  <span>Occupied residents</span>
                  <strong>{isLoadingSummary ? '...' : occupancySummary.occupiedResidents}</strong>
                </div>
                <div className="preview-stat">
                  <span>Occupied lots</span>
                  <strong>{isLoadingSummary ? '...' : occupancySummary.occupiedLots}</strong>
                </div>
              </div>

              {occupancyError ? (
                <p className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                  {occupancyError}
                </p>
              ) : null}

              {!occupancyError && !isLoadingSummary && occupancySummary.occupiedBlocks.length ? (
                <div className="mt-5 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={occupancySummary.occupiedBlocks}>
                      <CartesianGrid stroke="rgba(44, 62, 80, 0.12)" vertical={false} />
                      <XAxis dataKey="block" stroke="#768694" tickLine={false} axisLine={false} />
                      <YAxis allowDecimals={false} stroke="#768694" tickLine={false} axisLine={false} />
                      <Tooltip
                        formatter={(value) => [`${value} occupied lots`, 'Occupied lots']}
                        labelFormatter={(value) => `Block ${value}`}
                        contentStyle={{
                          background: '#fbf6ef',
                          border: '1px solid rgba(44, 62, 80, 0.12)',
                          borderRadius: '18px',
                          color: '#2c3e50',
                        }}
                      />
                      <Bar dataKey="occupiedLots" fill="#88b04b" radius={[10, 10, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : null}

              {!occupancyError && !isLoadingSummary && !occupancySummary.occupiedBlocks.length ? (
                <div className="mt-5 rounded-3xl border border-white/10 bg-slate-950/40 p-5 text-sm text-slate-300">
                  No occupied resident records are available yet. Once residents and lot assignments are added by the admin team, this chart will reflect the current occupied blocks.
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-4 surface-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="eyebrow">Before you search</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Resident lookup preparation</h3>
              </div>
              <span className="status-tag status-tag--violet">Resident guide</span>
            </div>

            <div className="grid gap-3">
              {lookupPreparation.map((item) => (
                <div key={item} className="preview-stat">
                  <span>Resident support</span>
                  <strong>{item}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-7xl px-4 lg:px-6">
        <div className="grid gap-4 lg:grid-cols-3">
          {featureCards.map((card) => (
            <article key={card.title} className="surface-card p-6">
              <p className="eyebrow">Platform feature</p>
              <h3 className="mt-3 text-2xl font-semibold text-white">{card.title}</h3>
              <p className="mt-4 text-sm leading-7 text-slate-300">{card.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-7xl px-4 lg:px-6">
        <div id="resident-chat" className="resident-chat-shell">
          <article className="surface-card p-6">
            <p className="eyebrow">Resident support chat</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Message the admin with your resident ID</h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              Enter the resident ID created by the admin team to open your chat. If the admin is offline, you can still leave a message here and it will wait for the admin when they return.
            </p>

            <form className="mt-6 space-y-4" onSubmit={handleChatConnect}>
              <label className="field-shell">
                <span>Resident ID</span>
                <input
                  value={residentChatId}
                  onChange={(event) => setResidentChatId(event.target.value.toUpperCase())}
                  placeholder="Example: HOA-A12F90"
                />
              </label>

              <div className="flex flex-wrap gap-3">
                <button type="submit" className="action-button action-button--primary" disabled={isChatLoading || !residentChatId.trim()}>
                  {isChatLoading ? 'Opening chat...' : 'Open resident chat'}
                </button>
                <Link to="/find-my-resident-info" className="action-button action-button--secondary">
                  Find my resident ID
                </Link>
              </div>
            </form>

            <div className="chat-presence-card mt-6">
              <div className="flex flex-wrap items-center gap-3">
                <span className={`status-tag ${residentChat?.adminPresence?.isOnline ? '' : 'status-tag--danger'}`}>
                  {residentChat?.adminPresence?.isOnline ? 'Admin online' : 'Admin offline'}
                </span>
                {residentChat?.adminPresence?.lastSeenAt ? (
                  <span className="text-sm text-slate-400">
                    Last active {formatDate(residentChat.adminPresence.lastSeenAt)}
                  </span>
                ) : (
                  <span className="text-sm text-slate-400">Status will appear once your resident ID is connected.</span>
                )}
              </div>

              {residentChat?.resident ? (
                <div className="chat-presence-card__resident">
                  <div className="chat-thread-list__avatar">
                    {residentChat.resident.profileImageUrl ? (
                      <img
                        src={residentChat.resident.profileImageUrl}
                        alt={residentChat.resident.fullName}
                        className="chat-thread-list__avatar-image"
                      />
                    ) : (
                      <span>{getResidentInitials(residentChat.resident.fullName)}</span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="chat-panel__name">{residentChat.resident.fullName}</p>
                    <p className="chat-panel__sub">{residentChat.resident.residentCode}</p>
                  </div>
                </div>
              ) : null}
            </div>

            {chatError ? (
              <p className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                {chatError}
              </p>
            ) : null}
          </article>

          <article className="surface-card chat-panel">
            <div className="chat-panel__header">
              <div>
                <p className="eyebrow">Resident conversation</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Chat with the admin team</h3>
              </div>
              <span className="status-tag status-tag--violet">
                {residentChat?.thread?.messages?.length || 0} message{residentChat?.thread?.messages?.length === 1 ? '' : 's'}
              </span>
            </div>

            {residentChat?.thread?.isAdminTyping ? (
              <div className="chat-typing-indicator">
                <span className="chat-typing-indicator__dot" />
                <span>Admin is typing...</span>
              </div>
            ) : null}

            <div className="chat-messages">
              {residentChat?.thread?.messages?.length ? (
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
                <div className="chat-empty-state chat-empty-state--panel">
                  <p className="text-base font-semibold text-white">No messages yet.</p>
                  <p className="mt-2 text-sm text-slate-400">
                    Open your resident chat with your resident ID first. You can leave a message here even when the admin is offline.
                  </p>
                </div>
              )}
            </div>

            <form className="chat-composer" onSubmit={handleChatSend}>
              <label className="field-shell">
                <span>Your message</span>
                <textarea
                  rows="3"
                  value={chatMessage}
                  onChange={(event) => setChatMessage(event.target.value)}
                  placeholder={
                    residentChat?.adminPresence?.isOnline
                      ? 'Type your message to the admin...'
                      : 'Admin is offline right now. Leave a message and the admin will see it when they return.'
                  }
                  disabled={!residentChat?.resident}
                />
              </label>

              <div className="chat-composer__actions">
                <span className="text-sm text-slate-400">
                  Chat uses your resident ID so the admin can identify your record quickly, even if you leave a message while the admin is offline.
                </span>
                <button
                  type="submit"
                  className="action-button action-button--primary"
                  disabled={
                    isChatSending ||
                    !residentChat?.resident ||
                    !chatMessage.trim()
                  }
                >
                  {isChatSending ? 'Sending...' : residentChat?.adminPresence?.isOnline ? 'Send message' : 'Leave message'}
                </button>
              </div>
            </form>
          </article>
        </div>
      </section>
    </main>
  );
}

export default ResidentPage;
