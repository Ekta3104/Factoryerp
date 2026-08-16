import api from './api';

export const partyService = {
  getParties: async (params) => {
    const response = await api.get('/parties', { params });
    return response.data;
  },

  getPartyProfile: async (id) => {
    const response = await api.get(`/parties/${id}/profile`);
    return response.data;
  },

  createParty: async (data) => {
    const response = await api.post('/parties', data);
    return response.data;
  },

  updateParty: async (id, data) => {
    const response = await api.put(`/parties/${id}`, data);
    return response.data;
  },
};
