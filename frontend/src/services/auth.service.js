import api from '../utils/api';

export const authService = {
  login: async (credentials) => {
    const response = await api.post('/users/login', credentials);
    return response.data;
  },
  
  register: async (userData) => {
    const response = await api.post('/users/register', userData);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  }
};
