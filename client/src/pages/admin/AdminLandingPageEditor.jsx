import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { defaultLandingPageContent } from '../../data/landingPageContent';
import {
  getAdminLandingPageContent,
  updateAdminLandingPageContent,
} from '../../services/api';

function AdminLandingPageEditor() {
  const { token } = useAuth();
  const [form, setForm] = useState(defaultLandingPageContent);
  const [lastSavedAt, setLastSavedAt] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    getAdminLandingPageContent(token)
      .then((data) => {
        if (!isMounted) {
          return;
        }

        setForm({
          ...defaultLandingPageContent,
          ...(data.content || {}),
        });
        setLastSavedAt(data.updatedAt || '');
        setError('');
      })
      .catch((loadError) => {
        if (!isMounted) {
          return;
        }

        setError(loadError.message);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  function handleFieldChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
    setSuccessMessage('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);

    try {
      const data = await updateAdminLandingPageContent(token, form);
      setForm({
        ...defaultLandingPageContent,
        ...(data.content || {}),
      });
      setLastSavedAt(data.updatedAt || '');
      setError('');
      setSuccessMessage('Landing page headers were saved to the database.');
    } catch (saveError) {
      setError(saveError.message);
      setSuccessMessage('');
    } finally {
      setIsSaving(false);
    }
  }

  function handleResetToDefaults() {
    setForm(defaultLandingPageContent);
    setSuccessMessage('');
  }

  if (isLoading) {
    return <div className="surface-card p-6 text-sm text-slate-300">Loading landing page editor...</div>;
  }

  return (
    <div className="space-y-6">
      <section className="surface-card p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="eyebrow">Protected editor</p>
            <h2 className="mt-2 text-3xl font-semibold text-white">Landing page headers</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
              This screen is only available inside the protected admin workspace. Save here to update the public landing page hero and section headers without editing code.
            </p>
          </div>

          <div className="flex flex-col items-start gap-2 rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-3 text-sm text-slate-300">
            <span className="font-semibold text-white">Admin-only link</span>
            <span>/admin/landing-page</span>
            {lastSavedAt ? <span>Last saved: {new Date(lastSavedAt).toLocaleString('en-PH')}</span> : null}
          </div>
        </div>

        {error ? (
          <p className="mt-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </p>
        ) : null}

        {successMessage ? (
          <p className="mt-5 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {successMessage}
          </p>
        ) : null}
      </section>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <section className="surface-card p-6">
          <p className="eyebrow">Header area</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="field-shell">
              <span>Brand short name</span>
              <input name="brandShortName" value={form.brandShortName} onChange={handleFieldChange} />
            </label>
            <label className="field-shell">
              <span>Brand full name</span>
              <input name="brandFullName" value={form.brandFullName} onChange={handleFieldChange} />
            </label>
            <label className="field-shell">
              <span>Navigation label: Home</span>
              <input name="navHomeLabel" value={form.navHomeLabel} onChange={handleFieldChange} />
            </label>
            <label className="field-shell">
              <span>Navigation label: Community</span>
              <input name="navCommunityLabel" value={form.navCommunityLabel} onChange={handleFieldChange} />
            </label>
            <label className="field-shell md:col-span-2">
              <span>Navigation label: About</span>
              <input name="navAboutLabel" value={form.navAboutLabel} onChange={handleFieldChange} />
            </label>
          </div>
        </section>

        <section className="surface-card p-6">
          <p className="eyebrow">Hero section</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="field-shell">
              <span>Hero eyebrow</span>
              <input name="heroEyebrow" value={form.heroEyebrow} onChange={handleFieldChange} />
            </label>
            <label className="field-shell">
              <span>Hero title</span>
              <input name="heroTitle" value={form.heroTitle} onChange={handleFieldChange} />
            </label>
            <label className="field-shell">
              <span>Primary button label</span>
              <input name="primaryCtaLabel" value={form.primaryCtaLabel} onChange={handleFieldChange} />
            </label>
            <label className="field-shell">
              <span>Secondary button label</span>
              <input name="secondaryCtaLabel" value={form.secondaryCtaLabel} onChange={handleFieldChange} />
            </label>
            <label className="field-shell md:col-span-2">
              <span>Hero description</span>
              <textarea
                rows="4"
                name="heroDescription"
                value={form.heroDescription}
                onChange={handleFieldChange}
              />
            </label>
          </div>
        </section>

        <section className="surface-card p-6">
          <p className="eyebrow">Community section</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="field-shell">
              <span>Community eyebrow</span>
              <input name="communityEyebrow" value={form.communityEyebrow} onChange={handleFieldChange} />
            </label>
            <label className="field-shell">
              <span>Community title</span>
              <input name="communityTitle" value={form.communityTitle} onChange={handleFieldChange} />
            </label>
            <label className="field-shell md:col-span-2">
              <span>Community description</span>
              <textarea
                rows="4"
                name="communityDescription"
                value={form.communityDescription}
                onChange={handleFieldChange}
              />
            </label>
          </div>
        </section>

        <section className="surface-card p-6">
          <p className="eyebrow">About section</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="field-shell">
              <span>About eyebrow</span>
              <input name="aboutEyebrow" value={form.aboutEyebrow} onChange={handleFieldChange} />
            </label>
            <label className="field-shell">
              <span>About title</span>
              <input name="aboutTitle" value={form.aboutTitle} onChange={handleFieldChange} />
            </label>
            <label className="field-shell md:col-span-2">
              <span>About paragraph one</span>
              <textarea
                rows="4"
                name="aboutParagraphOne"
                value={form.aboutParagraphOne}
                onChange={handleFieldChange}
              />
            </label>
            <label className="field-shell md:col-span-2">
              <span>About paragraph two</span>
              <textarea
                rows="4"
                name="aboutParagraphTwo"
                value={form.aboutParagraphTwo}
                onChange={handleFieldChange}
              />
            </label>
            <label className="field-shell">
              <span>Association details eyebrow</span>
              <input name="detailsEyebrow" value={form.detailsEyebrow} onChange={handleFieldChange} />
            </label>
            <label className="field-shell">
              <span>Association details title</span>
              <input name="detailsTitle" value={form.detailsTitle} onChange={handleFieldChange} />
            </label>
          </div>
        </section>

        <div className="flex flex-wrap gap-3">
          <button type="submit" className="action-button action-button--primary" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save landing page'}
          </button>
          <button
            type="button"
            className="action-button action-button--secondary"
            onClick={handleResetToDefaults}
            disabled={isSaving}
          >
            Reset form to defaults
          </button>
        </div>
      </form>
    </div>
  );
}

export default AdminLandingPageEditor;
