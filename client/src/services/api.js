import axios from 'axios';

const defaultApiBaseUrl =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' ? `${window.location.origin}/api` : '/api');

const api = axios.create({
  baseURL: defaultApiBaseUrl,
});

function getErrorMessage(error) {
  return error.response?.data?.message || error.message || 'Something went wrong.';
}

async function request(config) {
  try {
    const { data } = await config();
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

function authHeaders(token) {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
}

function isFileLike(value) {
  return (
    value &&
    typeof value === 'object' &&
    typeof value.name === 'string' &&
    typeof value.size === 'number'
  );
}

function createMultipartPayload(payload, fileEntries) {
  const formData = new FormData();
  formData.append('payload', JSON.stringify(payload));

  fileEntries.forEach(([fieldName, fileValue]) => {
    if (isFileLike(fileValue)) {
      formData.append(fieldName, fileValue);
    }
  });

  return formData;
}

export function loginAdmin(credentials) {
  return request(() => api.post('/auth/login', credentials));
}

export function getAdminProfile(token) {
  return request(() => api.get('/auth/me', authHeaders(token)));
}

export function getDashboardSummary(token) {
  return request(() => api.get('/dashboard/summary', authHeaders(token)));
}

export function getResidents(token) {
  return request(() => api.get('/residents', authHeaders(token)));
}

export function createResident(token, payload) {
  const { profileImageFile, ...residentPayload } = payload;
  const requestPayload = isFileLike(profileImageFile)
    ? createMultipartPayload(residentPayload, [['profileImage', profileImageFile]])
    : residentPayload;

  return request(() => api.post('/residents', requestPayload, authHeaders(token)));
}

export function updateResident(token, residentId, payload) {
  const { profileImageFile, ...residentPayload } = payload;
  const requestPayload = isFileLike(profileImageFile)
    ? createMultipartPayload(residentPayload, [['profileImage', profileImageFile]])
    : residentPayload;

  return request(() => api.put(`/residents/${residentId}`, requestPayload, authHeaders(token)));
}

export function transferResident(token, residentId, payload) {
  return request(() => api.post(`/residents/${residentId}/transfer`, payload, authHeaders(token)));
}

export function deleteResident(token, residentId) {
  return request(() => api.delete(`/residents/${residentId}`, authHeaders(token)));
}

export function getPaymentLots(token) {
  return request(() => api.get('/payments/lots', authHeaders(token)));
}

export function getPaymentLotDetails(token, residentId, lotId) {
  return request(() => api.get(`/payments/lots/${residentId}/${lotId}`, authHeaders(token)));
}

export function createPayment(token, payload) {
  const { receiptImageFile, ...paymentPayload } = payload;
  const requestPayload = isFileLike(receiptImageFile)
    ? createMultipartPayload(paymentPayload, [['receiptImage', receiptImageFile]])
    : paymentPayload;

  return request(() => api.post('/payments', requestPayload, authHeaders(token)));
}

export function updatePayment(token, paymentId, payload) {
  const { receiptImageFile, ...paymentPayload } = payload;
  const requestPayload = isFileLike(receiptImageFile)
    ? createMultipartPayload(paymentPayload, [['receiptImage', receiptImageFile]])
    : paymentPayload;

  return request(() => api.put(`/payments/${paymentId}`, requestPayload, authHeaders(token)));
}

export function deletePayment(token, paymentId) {
  return request(() => api.delete(`/payments/${paymentId}`, authHeaders(token)));
}

export function searchResidentByDetails(params) {
  return request(() => api.get('/public/resident-search', { params }));
}

export function searchResidentById(residentId, turnstileToken) {
  return request(() => api.get('/public/resident-search', { params: { residentId, turnstileToken } }));
}

export function getPublicOccupancySummary() {
  return request(() => api.get('/public/occupancy-summary'));
}

export function getPublicBlockLotStatus() {
  return request(() => api.get('/public/block-lot-status'));
}

export function getPublicLandingPageContent() {
  return request(() => api.get('/public/landing-page-content'));
}

export function getResidentChatThread(residentId) {
  return request(() => api.get('/public/chat-thread', { params: { residentId } }));
}

export function sendResidentChatMessage(payload) {
  const { attachmentImageFile, ...messagePayload } = payload || {};
  const requestPayload = isFileLike(attachmentImageFile)
    ? createMultipartPayload(messagePayload, [['attachmentImage', attachmentImageFile]])
    : messagePayload;

  return request(() => api.post('/public/chat-message', requestPayload));
}

export function getAdminChatThreads(token) {
  return request(() => api.get('/chat/threads', authHeaders(token)));
}

export function getAdminChatThread(token, threadId) {
  return request(() => api.get('/chat/thread', { ...authHeaders(token), params: { threadId } }));
}

export function sendAdminChatMessage(token, threadId, payload) {
  const { attachmentImageFile, ...messagePayload } = payload || {};
  const requestPayload = isFileLike(attachmentImageFile)
    ? createMultipartPayload({ threadId, ...messagePayload }, [['attachmentImage', attachmentImageFile]])
    : { threadId, ...messagePayload };

  return request(() => api.post('/chat/message', requestPayload, authHeaders(token)));
}

export function clearAdminChatThread(token, threadId) {
  return request(() => api.post('/chat/clear-thread', { threadId }, authHeaders(token)));
}

export function setAdminChatTyping(token, threadId) {
  return request(() => api.post('/chat/typing', { threadId }, authHeaders(token)));
}

export function clearAdminChatTyping(token, threadId) {
  return request(() => api.post('/chat/typing/stop', { threadId }, authHeaders(token)));
}

export function heartbeatAdminChat(token) {
  return request(() => api.post('/chat/presence-heartbeat', {}, authHeaders(token)));
}

export function setAdminChatOffline(token) {
  return request(() => api.post('/chat/presence-offline', {}, authHeaders(token)));
}

export function getAdminLandingPageContent(token) {
  return request(() => api.get('/content/landing-page', authHeaders(token)));
}

export function updateAdminLandingPageContent(token, payload) {
  return request(() => api.put('/content/landing-page', payload, authHeaders(token)));
}
