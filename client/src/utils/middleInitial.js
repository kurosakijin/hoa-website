export function sanitizeMiddleName(value) {
  return String(value || '')
    .replace(/[^a-zA-Z\s'-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function formatMiddleName(value) {
  return sanitizeMiddleName(value);
}

export function sanitizeMiddleInitial(value) {
  return sanitizeMiddleName(value).slice(0, 1).toUpperCase();
}

export function formatMiddleInitial(value) {
  const sanitized = sanitizeMiddleInitial(value);
  return sanitized ? `${sanitized}.` : '';
}

export function formatResidentFullName(resident) {
  const middleName = formatMiddleName(resident.middleName || resident.middleInitial);
  return [resident.firstName, middleName, resident.lastName].filter(Boolean).join(' ').trim();
}

export function formatResidentSortableName(resident) {
  const givenName = [resident.firstName, formatMiddleName(resident.middleName || resident.middleInitial)]
    .filter(Boolean)
    .join(' ')
    .trim();
  return [resident.lastName, givenName].filter(Boolean).join(', ').trim();
}
