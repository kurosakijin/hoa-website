function sanitizeMiddleName(value) {
  return String(value || '')
    .replace(/[^a-zA-Z\s'-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatMiddleName(value) {
  return sanitizeMiddleName(value);
}

function sanitizeMiddleInitial(value) {
  return sanitizeMiddleName(value).slice(0, 1).toUpperCase();
}

function formatMiddleInitial(value) {
  const sanitized = sanitizeMiddleInitial(value);
  return sanitized ? `${sanitized}.` : '';
}

function formatResidentFullName(resident) {
  const middleName = formatMiddleName(resident.middleName || resident.middleInitial);
  return [resident.firstName, middleName, resident.lastName].filter(Boolean).join(' ').trim();
}

function formatResidentSortableName(resident) {
  const givenName = [resident.firstName, formatMiddleName(resident.middleName || resident.middleInitial)]
    .filter(Boolean)
    .join(' ')
    .trim();
  return [resident.lastName, givenName].filter(Boolean).join(', ').trim();
}

module.exports = {
  sanitizeMiddleName,
  formatMiddleName,
  sanitizeMiddleInitial,
  formatMiddleInitial,
  formatResidentFullName,
  formatResidentSortableName,
};
