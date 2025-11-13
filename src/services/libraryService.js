import { apiClient } from './apiClient';
import { isStaticSource } from '../config/env';

const toNumber = (value) => {
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
};

export const libraryService = {
  getStores: () => apiClient.get('stores'),

  createStore: (payload) => apiClient.post('stores', { data: payload }),

  updateStore: (id, payload) => apiClient.patch(`stores/${id}`, { data: payload }),

  deleteStore: (id) => apiClient.delete(`stores/${id}`),

  getBooks: () => apiClient.get('books'),

  createBook: (payload) => apiClient.post('books', { data: payload }),

  updateBook: (id, payload) => apiClient.patch(`books/${id}`, { data: payload }),

  deleteBook: (id) => apiClient.delete(`books/${id}`),

  getAuthors: () => apiClient.get('authors'),

  createAuthor: (payload) => apiClient.post('authors', { data: payload }),

  updateAuthor: (id, payload) => apiClient.patch(`authors/${id}`, { data: payload }),

  deleteAuthor: (id) => apiClient.delete(`authors/${id}`),

  getInventory: (params) => apiClient.get('inventory', { params }),

  async getInventoryByStore(storeId) {
    const id = toNumber(storeId);

    if (id === null) {
      return [];
    }

    if (isStaticSource) {
      const items = await apiClient.get('inventory');
      return items.filter((item) => Number(item.store_id) === id);
    }

    return apiClient.get('inventory', { params: { store_id: id } });
  },

  createInventoryItem: (payload) => apiClient.post('inventory', { data: payload }),

  updateInventoryItem: (id, payload) => apiClient.patch(`inventory/${id}`, { data: payload }),

  deleteInventoryItem: (id) => apiClient.delete(`inventory/${id}`),
};



