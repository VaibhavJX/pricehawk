import apiClient from './client';

/**
 * Fetch deals by category.
 * @param {string} category - Category slug (e.g. 'electronics', 'fashion')
 * @param {Object} params - Optional query params { page, limit, sort }
 */
export const getDeals = async (category = 'all', params = {}) => {
  const { data } = await apiClient.get('/api/discover/deals', {
    params: { category, ...params },
  });
  return data;
};

/**
 * Fetch all available deal categories.
 */
export const getCategories = async () => {
  const { data } = await apiClient.get('/api/discover/categories');
  return data;
};

/**
 * Fetch trending products (most price drops in last 24h).
 */
export const getTrending = async () => {
  const { data } = await apiClient.get('/api/discover/trending');
  return data;
};
