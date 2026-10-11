import apiClient from './client';

/**
 * Fetch all tracked products for the current user.
 */
export const getProducts = async () => {
  const { data } = await apiClient.get('/api/products');
  return data;
};

/**
 * Add a new product to track.
 * @param {Object} payload - { url, targetPrice, checkInterval, notifications }
 */
export const addProduct = async (payload) => {
  const { data } = await apiClient.post('/api/products', payload);
  return data;
};

/**
 * Update an existing tracked product.
 * @param {string} productId
 * @param {Object} payload - { targetPrice, checkInterval, notifications }
 */
export const updateProduct = async (productId, payload) => {
  const { data } = await apiClient.put(`/api/products/${productId}`, payload);
  return data;
};

/**
 * Delete a tracked product.
 * @param {string} productId
 */
export const deleteProduct = async (productId) => {
  const { data } = await apiClient.delete(`/api/products/${productId}`);
  return data;
};

/**
 * Trigger an immediate price check for a product.
 * @param {string} productId
 */
export const checkProductNow = async (productId) => {
  const { data } = await apiClient.post(`/api/products/${productId}/check`);
  return data;
};

/**
 * Get the price history for a product.
 * @param {string} productId
 * @param {number} days - Number of days of history to fetch (default 30)
 */
export const getProductHistory = async (productId, days = 30) => {
  const { data } = await apiClient.get(`/api/products/${productId}/history`, {
    params: { days },
  });
  return data;
};

/**
 * Compare two products by URL or product ID.
 * @param {Object} payload - { urlA, urlB } or { idA, idB }
 */
export const compareProducts = async (payload) => {
  const { data } = await apiClient.post('/api/products/compare', payload);
  return data;
};

/**
 * Login a user.
 * @param {Object} payload - { email, password }
 */
export const loginUser = async (payload) => {
  const { data } = await apiClient.post('/api/auth/login', payload);
  return data;
};

/**
 * Register a new user.
 * @param {Object} payload - { name, email, password }
 */
export const registerUser = async (payload) => {
  const { data } = await apiClient.post('/api/auth/register', payload);
  return data;
};
