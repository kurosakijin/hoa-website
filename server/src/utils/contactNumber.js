function sanitizeContactNumber(value) {
  return String(value || '').replace(/\D+/g, '');
}

module.exports = {
  sanitizeContactNumber,
};
