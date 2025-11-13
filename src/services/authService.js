import { apiClient } from './apiClient';

export const authService = {
  login: ({ email, password }) => apiClient.post('login', { data: { email, password } }),
};



