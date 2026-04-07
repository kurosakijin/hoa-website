import { useEffect, useMemo, useState } from 'react';
import Seo from '../components/Seo';
import { useToast } from '../context/ToastContext';
import { getPublicBlockLotStatus } from '../services/api';

function getLotStatusLabel(status) {
  switch (status) {
    case 'fully-paid':
      return 'Fully paid';
    case 'occupied':
      return 'Occupied';
    default:
      return 'Available';
  }
}

function BlockLotsPage() {
  const toast = useToast();
  const [statusSummary, setStatusSummary] = useState({
    blocks: [],
    totals: {
      available: 0,
      occupied: 0,
      fullyPaid: 0,
    },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBlock, setSelectedBlock] = useState('all');
  const [lotSearch, setLotSearch] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadStatusSummary() {
      try {
        const data = await getPublicBlockLotStatus();

        if (!isMounted) {
          return;
        }

        setStatusSummary(data);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        toast.warning({
          title: 'Block and lot board unavailable',
          message: loadError.message,
        });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadStatusSummary();

    return () => {
      isMounted = false;
    };
  }, []);

  function preventRestrictedAction(event) {
    event.preventDefault();
  }

  const filteredBlocks = useMemo(() => {
    const normalizedLotSearch = lotSearch.trim().toLowerCase();

    return statusSummary.blocks
      .filter((block) => selectedBlock === 'all' || block.block === selectedBlock)
      .map((block) => ({
        ...block,
        lots: normalizedLotSearch
          ? block.lots.filter((lot) => String(lot.lotNumber).toLowerCase().includes(normalizedLotSearch))
          : block.lots,
      }))
      .filter((block) => block.lots.length > 0);
  }, [lotSearch, selectedBlock, statusSummary.blocks]);

  const totalVisibleLots = useMemo(
    () => filteredBlocks.reduce((sum, block) => sum + block.lots.length, 0),
    [filteredBlocks]
  );

  return (
    <>
      <Seo
        title="Block and Lots"
        description="Public block and lot status board for Sitio Hiyas showing available, occupied, and fully paid lots by block."
        path="/block-and-lots"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Sitio Hiyas Block and Lots',
          description:
            'Public block and lot availability page for Sitio Hiyas showing available, occupied, and fully paid lots.',
          url: import.meta.env.VITE_SITE_URL
            ? `${import.meta.env.VITE_SITE_URL.replace(/\/+$/, '')}/block-and-lots`
            : undefined,
        }}
      />
      <main
        className="lot-status-page mx-auto max-w-7xl px-4 py-10 lg:px-6"
        onContextMenu={preventRestrictedAction}
        onCopy={preventRestrictedAction}
        onCut={preventRestrictedAction}
      >
        <section className="surface-card p-8">
          <p className="eyebrow">Block and lots</p>
          <h1 className="mt-3 text-4xl font-semibold text-white">Lot availability across Sitio Hiyas</h1>
          <p className="mt-4 max-w-4xl text-base leading-7 text-slate-300">
            Review which lots are available, occupied, or fully paid for every block. Hovering an occupied or fully paid lot shows only the resident last name and profile picture.
          </p>

          <div className="lot-status-page__filters">
            <label className="field-shell">
              <span>Filter by block</span>
              <select value={selectedBlock} onChange={(event) => setSelectedBlock(event.target.value)}>
                <option value="all">All blocks</option>
                {statusSummary.blocks.map((block) => (
                  <option key={block.block} value={block.block}>
                    Block {block.block}
                  </option>
                ))}
              </select>
            </label>

            <label className="field-shell">
              <span>Search lot number</span>
              <input
                value={lotSearch}
                onChange={(event) => setLotSearch(event.target.value)}
                placeholder="Type a lot number..."
                inputMode="numeric"
              />
            </label>

            <div className="lot-status-page__filter-note">
              <strong>{isLoading ? '...' : `${totalVisibleLots} lots shown`}</strong>
              <span>Narrow the board by block or search a specific lot number.</span>
            </div>
          </div>

          <div className="lot-status-page__legend">
            <div className="lot-status-page__legend-item">
              <span className="lot-status-page__legend-swatch lot-status-page__legend-swatch--available" />
              <div>
                <strong>Available</strong>
                <span>{isLoading ? '...' : `${statusSummary.totals.available} lots`}</span>
              </div>
            </div>
            <div className="lot-status-page__legend-item">
              <span className="lot-status-page__legend-swatch lot-status-page__legend-swatch--occupied" />
              <div>
                <strong>Occupied</strong>
                <span>{isLoading ? '...' : `${statusSummary.totals.occupied} lots`}</span>
              </div>
            </div>
            <div className="lot-status-page__legend-item">
              <span className="lot-status-page__legend-swatch lot-status-page__legend-swatch--fully-paid" />
              <div>
                <strong>Fully paid</strong>
                <span>{isLoading ? '...' : `${statusSummary.totals.fullyPaid} lots`}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 space-y-6">
          {isLoading ? (
            <div className="surface-card p-6 text-sm text-slate-300">Loading block and lot availability...</div>
          ) : null}

          {!isLoading && !statusSummary.blocks.length ? (
            <div className="surface-card p-6 text-sm text-slate-300">No block and lot information is available yet.</div>
          ) : null}

          {!isLoading && statusSummary.blocks.length && !filteredBlocks.length ? (
            <div className="surface-card p-6 text-sm text-slate-300">
              No lots matched the current block filter or lot-number search.
            </div>
          ) : null}

          {!isLoading
            ? filteredBlocks.map((block) => (
                <article key={block.block} className="surface-card lot-status-block p-6">
                  <div className="lot-status-block__header">
                    <div>
                      <p className="eyebrow">Block {block.block}</p>
                      <h2 className="mt-2 text-2xl font-semibold text-white">Lot status list</h2>
                    </div>
                    <span className="status-tag status-tag--violet">{block.lots.length} visible lots</span>
                  </div>

                  <div className="lot-status-block__row">
                    {block.lots.map((lot) => (
                      <div
                        key={`${block.block}-${lot.lotNumber}`}
                        className={`lot-status-chip lot-status-chip--${lot.status}`}
                        aria-label={`Block ${block.block} lot ${lot.lotNumber}: ${getLotStatusLabel(lot.status)}`}
                      >
                        <span className="lot-status-chip__number">Lot {lot.lotNumber}</span>
                        <span className="lot-status-chip__label">{getLotStatusLabel(lot.status)}</span>

                        {lot.residentLastName ? (
                          <div className="lot-status-chip__hover-card" aria-hidden="true">
                            <div className="lot-status-chip__hover-photo">
                              {lot.residentProfileImageUrl ? (
                                <img
                                  src={lot.residentProfileImageUrl}
                                  alt=""
                                  className="lot-status-chip__hover-image"
                                  draggable="false"
                                />
                              ) : (
                                <span>{lot.residentLastName.charAt(0).toUpperCase()}</span>
                              )}
                            </div>
                            <div>
                              <p className="lot-status-chip__hover-title">Resident</p>
                              <p className="lot-status-chip__hover-name">{lot.residentLastName}</p>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </article>
              ))
            : null}
        </section>
      </main>
    </>
  );
}

export default BlockLotsPage;
