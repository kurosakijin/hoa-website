import { useEffect } from 'react';

const SITE_NAME = 'Sitio Hiyas Homeowners Association';

function getSiteUrl() {
  const configuredUrl = import.meta.env.VITE_SITE_URL;

  if (configuredUrl) {
    return String(configuredUrl).trim().replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return '';
}

function buildAbsoluteUrl(pathname = '/') {
  const siteUrl = getSiteUrl();

  if (!siteUrl) {
    return pathname;
  }

  return new URL(pathname, `${siteUrl}/`).toString();
}

function upsertMeta(attributeName, attributeValue, content) {
  let tag = document.head.querySelector(`meta[${attributeName}="${attributeValue}"]`);

  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attributeName, attributeValue);
    document.head.appendChild(tag);
  }

  tag.setAttribute('content', content);
}

function upsertLink(rel, href) {
  let tag = document.head.querySelector(`link[rel="${rel}"]`);

  if (!tag) {
    tag = document.createElement('link');
    tag.setAttribute('rel', rel);
    document.head.appendChild(tag);
  }

  tag.setAttribute('href', href);
}

function upsertStructuredData(structuredData) {
  const scriptId = 'seo-structured-data';
  let tag = document.head.querySelector(`#${scriptId}`);

  if (!structuredData) {
    tag?.remove();
    return;
  }

  if (!tag) {
    tag = document.createElement('script');
    tag.id = scriptId;
    tag.type = 'application/ld+json';
    document.head.appendChild(tag);
  }

  tag.textContent = JSON.stringify(structuredData);
}

function Seo({ title, description, path = '/', robots = 'index,follow', structuredData = null }) {
  useEffect(() => {
    const pageTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
    const pageUrl = buildAbsoluteUrl(path);

    document.title = pageTitle;
    upsertMeta('name', 'description', description);
    upsertMeta('name', 'robots', robots);
    upsertMeta('property', 'og:type', 'website');
    upsertMeta('property', 'og:site_name', SITE_NAME);
    upsertMeta('property', 'og:title', pageTitle);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:url', pageUrl);
    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', pageTitle);
    upsertMeta('name', 'twitter:description', description);
    upsertLink('canonical', pageUrl);
    upsertStructuredData(structuredData);
  }, [description, path, robots, structuredData, title]);

  return null;
}

export default Seo;
