import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import Seo from '../components/Seo';
import { useAuth } from '../context/AuthContext';

function AdminLoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(form);
      navigate(location.state?.from?.pathname || '/admin/dashboard', { replace: true });
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Seo
        title="Admin Login"
        description="Administrator sign-in page for the Sitio Hiyas Homeowners Association control center."
        path="/hiyas-admin-access"
        robots="noindex,nofollow"
      />
      <main className="admin-shell grid min-h-screen place-items-center px-4 py-10">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:px-6">
          <section className="surface-card p-8 lg:p-10">
            <p className="eyebrow">Admin-only access</p>
            <h1 className="mt-3 text-4xl font-semibold text-white">Sign in to the HOA control center</h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">
              This route is intentionally separated from the public resident homepage. Only administrators managing resident records, transfers, balances, and posted payments should use it.
            </p>

            <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
              <label className="field-shell">
                <span>Admin username</span>
                <input value={form.username} onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))} required />
              </label>
              <label className="field-shell">
                <span>Password</span>
                <input type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} required />
              </label>

              {error ? <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p> : null}

              <button type="submit" className="action-button action-button--primary w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Signing in...' : 'Enter admin dashboard'}
              </button>
            </form>
          </section>

          <section className="surface-card p-8 lg:p-10">
            <p className="eyebrow">What admins can do</p>
            <div className="mt-6 grid gap-4">
              <div className="info-chip">
                <strong>Resident management</strong>
                <span>Create, edit, remove, or transfer residents with lot assignments and balances.</span>
              </div>
              <div className="info-chip">
                <strong>Payment history by exact date</strong>
                <span>Review payment entries, update mistakes, and keep every lot ledger current in MongoDB.</span>
              </div>
              <div className="info-chip">
                <strong>Admin dashboard insights</strong>
                <span>Monitor collections, outstanding balances, and active lot records in one SaaS-style workspace.</span>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

export default AdminLoginPage;
