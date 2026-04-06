import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
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
  return request(() => api.post('/residents', payload, authHeaders(token)));
}

export function updateResident(token, residentId, payload) {
  return request(() => api.put(`/residents/${residentId}`, payload, authHeaders(token)));
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
  return request(() => api.post('/payments', payload, authHeaders(token)));
}

export function updatePayment(token, paymentId, payload) {
  return request(() => api.put(`/payments/${paymentId}`, payload, authHeaders(token)));
}

export function deletePayment(token, paymentId) {
  return request(() => api.delete(`/payments/${paymentId}`, authHeaders(token)));
}

export function searchResidentByDetails(params) {
  return request(() => api.get('/public/resident-search', { params }));
}

export function searchResidentById(residentId) {
  return request(() => api.get('/public/resident-search', { params: { residentId } }));
}
