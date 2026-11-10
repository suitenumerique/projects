import socket from './socket';

/* Actions */

const getApiTokens = (headers) => socket.get('/api-tokens', undefined, headers);

const createApiToken = (data, headers) => socket.post('/api-tokens', data, headers);

const deleteApiToken = (id, headers) => socket.delete(`/api-tokens/${id}`, undefined, headers);

export default {
  getApiTokens,
  createApiToken,
  deleteApiToken,
};
