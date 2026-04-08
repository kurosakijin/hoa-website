function trimUrl(value) {
  return typeof value === 'string' ? value.trim().replace(/\/+$/, '') : '';
}

function isLocalHost(hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

function buildUrl(baseUrl, path = '/') {
  return new URL(path, `${baseUrl}/`).toString();
}

function getConfiguredPublicSiteBaseUrl() {
  return trimUrl(import.meta.env.VITE_SITE_URL);
}

function getConfiguredAdminSiteBaseUrl() {
  return trimUrl(import.meta.env.VITE_ADMIN_SITE_URL);
}

export function isAdminHost() {
  if (typeof window === 'undefined') {
    return false;
  }

  const currentHost = window.location.hostname.toLowerCase();
  const configuredAdminUrl = getConfiguredAdminSiteBaseUrl();

  if (configuredAdminUrl) {
    try {
      return currentHost === new URL(configuredAdminUrl).hostname.toLowerCase();
    } catch (_error) {
      return false;
    }
  }

  return currentHost.startsWith('admin.');
}

export function getAdminSiteUrl(path = '/') {
  const configuredAdminUrl = getConfiguredAdminSiteBaseUrl();

  if (configuredAdminUrl) {
    return buildUrl(configuredAdminUrl, path);
  }

  if (typeof window === 'undefined') {
    return '';
  }

  const { protocol, hostname, port } = window.location;

  if (isLocalHost(hostname)) {
    return '';
  }

  const adminHostname = hostname.startsWith('admin.')
    ? hostname
    : hostname.startsWith('www.')
      ? `admin.${hostname.slice(4)}`
      : `admin.${hostname}`;
  const origin = `${protocol}//${adminHostname}${port ? `:${port}` : ''}`;

  return buildUrl(origin, path);
}

export function getPublicSiteUrl(path = '/') {
  const configuredPublicUrl = getConfiguredPublicSiteBaseUrl();

  if (configuredPublicUrl) {
    return buildUrl(configuredPublicUrl, path);
  }

  if (typeof window === 'undefined') {
    return '';
  }

  const { protocol, hostname, port } = window.location;
  const publicHostname = hostname.startsWith('admin.') ? hostname.slice('admin.'.length) : hostname;
  const origin = `${protocol}//${publicHostname}${port ? `:${port}` : ''}`;

  return buildUrl(origin, path);
}

export function getAdminLoginPath() {
  return isAdminHost() ? '/' : '/hiyas-admin-access';
}
