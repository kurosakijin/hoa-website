function parseRequestPayload(request) {
  if (typeof request.body?.payload === 'string') {
    return JSON.parse(request.body.payload);
  }

  return request.body || {};
}

module.exports = {
  parseRequestPayload,
};
