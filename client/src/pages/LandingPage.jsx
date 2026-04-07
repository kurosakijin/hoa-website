import { Link } from 'react-router-dom';
import Seo from '../components/Seo';
import ThemeToggleButton from '../components/ThemeToggleButton';

const publicFeatureCards = [
  {
    title: 'Resident services',
    text: 'Send residents to a dedicated resident page instead of mixing property tools into the public homepage.',
  },
  {
    title: 'Community information',
    text: 'Present Sitio Hiyas as a real subdivision homepage with public-facing copy, overview sections, and welcome details.',
  },
  {
    title: 'Association guidance',
    text: 'Keep the resident record search, occupancy visuals, and payment visibility on a separate page built for homeowners.',
  },
];

const publicFacts = [
  { label: 'Public-facing layout', value: 'Subdivision welcome page with a clear resident entry point' },
  { label: 'Resident access', value: 'Separate resident page for lookup, balances, and records' },
  { label: 'Association flow', value: 'Public homepage first, resident tools second' },
  { label: 'Community focus', value: 'Overview copy, homeowner guidance, and neighborhood identity' },
];

const heroBackdropStyle = {
  backgroundImage: [
    'linear-gradient(180deg, rgba(22, 34, 13, 0.18), rgba(18, 24, 12, 0.7))',
    'radial-gradient(circle at 14% 18%, rgba(126, 162, 89, 0.34), transparent 24%)',
    'radial-gradient(circle at 26% 76%, rgba(87, 110, 55, 0.22), transparent 24%)',
    'linear-gradient(118deg, rgba(88, 111, 52, 0.96) 0%, rgba(68, 55, 38, 0.94) 34%, rgba(60, 74, 48, 0.94) 66%, rgba(28, 36, 24, 0.98) 100%)',
  ].join(', '),
};

function LandingPage() {

  return (
    <main className="pb-20">
      <Seo
        title="Home"
        description="Official public homepage for Sitio Hiyas Homeowners Association with community information and a direct path into the resident page."
        path="/"
        structuredData={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'Organization',
              name: 'Sitio Hiyas Homeowners Association',
              url: import.meta.env.VITE_SITE_URL || undefined,
              description:
                'Public-facing homepage for Sitio Hiyas Homeowners Association with community information and a dedicated resident page.',
            },
            {
              '@type': 'WebSite',
              name: 'Sitio Hiyas Homeowners Association',
              url: import.meta.env.VITE_SITE_URL || undefined,
            },
          ],
        }}
      />
      <section id="home" className="relative isolate overflow-hidden border-b border-black/10 bg-[#355f16] text-[#fff8ee]">
        <div className="absolute inset-0" style={heroBackdropStyle} />
        <div className="absolute inset-y-0 right-0 hidden w-[36%] border-l border-white/10 opacity-35 lg:block">
          <div className="h-full w-full bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.08)_0_4px,transparent_4px_26px)]" />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-black/30" />

        <div className="relative mx-auto max-w-7xl">
          <div className="flex items-center justify-between gap-6 px-4 py-4 lg:px-6">
            <div className="flex items-center gap-4">
              <span className="grid h-14 w-14 place-items-center rounded-full border border-[#fff8ee]/70 text-lg font-semibold tracking-[0.14em] text-[#fff8ee]">
                SH
              </span>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#fff8ee]/80">Sitio Hiyas</p>
                <p className="text-base font-semibold text-[#fff8ee]">Homeowners Association</p>
              </div>
            </div>

            <div className="hidden items-center gap-6 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#fff8ee]/78 lg:flex">
              <a href="#home" className="transition hover:text-[#fff8ee]">
                Home
              </a>
              <a href="#community" className="transition hover:text-[#fff8ee]">
                Community
              </a>
              <a href="#about" className="transition hover:text-[#fff8ee]">
                About
              </a>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggleButton compact />
            </div>
          </div>

          <div className="grid min-h-[31rem] place-items-center px-4 py-16 text-center lg:px-6">
            <div className="max-w-3xl rounded-[2rem] border border-white/12 bg-black/20 px-6 py-10 shadow-[0_28px_70px_rgba(0,0,0,0.28)] backdrop-blur-sm sm:px-10">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.32em] text-[#f1d9a0]">
                Sitio Hiyas community welcome
              </p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight text-[#fff8ee] lg:text-6xl">
                Sitio Hiyas Homeowners Association
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-[#fff4e7]/84 sm:text-base">
                This public landing page is now separated from the resident tools. It introduces the community, presents Sitio Hiyas as a real homeowners homepage, and points residents directly to their dedicated resident page when they need records or lot details.
              </p>

              <div className="mt-8 flex justify-center">
                <Link to="/resident-page" className="action-button action-button--primary">
                  Go to Resident Page
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="community" className="mx-auto max-w-7xl px-4 py-16 lg:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="eyebrow">Community overview</p>
          <h2 className="mt-4 text-4xl font-semibold text-white">A public homepage that feels like a real subdivision website</h2>
          <p className="mt-4 text-base leading-7 text-slate-300">
            The homepage now acts as the welcome area for Sitio Hiyas, while the previous resident-focused content lives on its own separate resident page. That keeps the public side cleaner and gives homeowners a clearer next step.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {publicFeatureCards.map((card, index) => (
            <article key={card.title} className="surface-card p-6 text-center">
              <span className="mx-auto inline-grid h-14 w-14 place-items-center rounded-full border border-[#88b04b]/30 bg-[#88b04b]/10 text-lg font-semibold text-[#88b04b]">
                {`0${index + 1}`}
              </span>
              <h3 className="mt-5 text-xl font-semibold text-white">{card.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">{card.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="about" className="mx-auto max-w-7xl px-4 pb-16 lg:px-6">
        <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
          <article className="surface-card p-8 lg:p-10">
            <p className="eyebrow">About</p>
            <h2 className="mt-4 text-4xl font-semibold text-white">A cleaner front door for Sitio Hiyas</h2>
            <p className="mt-5 text-base leading-8 text-slate-300">
              This refreshed homepage is designed to feel more like the public association websites you referenced: a strong hero, a clear identity for the subdivision, and separate resident tools instead of putting everything on the front page.
            </p>
            <p className="mt-4 text-base leading-8 text-slate-300">
              Residents who need occupancy details, payment visibility, or resident search can move straight into the resident page, while public visitors can stay on this landing page to understand what Sitio Hiyas is about.
            </p>
          </article>

          <aside className="surface-card relative overflow-hidden p-8 lg:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(136,176,75,0.2),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(164,90,61,0.18),transparent_32%)]" />
            <div className="relative">
              <p className="eyebrow">Association details</p>
              <h2 className="mt-4 text-4xl font-semibold text-white">Public details first, resident tools second</h2>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {publicFacts.map((fact) => (
                  <div key={fact.label} className="rounded-[1.4rem] border border-white/10 bg-white/5 p-5">
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[#88b04b]">{fact.label}</p>
                    <p className="mt-3 text-sm leading-7 text-slate-300">{fact.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

export default LandingPage;
