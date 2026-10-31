const BASE = '/api';

let token = localStorage.getItem('hinga.token') || null;

export function setToken(value) {
  token = value;
  if (value) localStorage.setItem('hinga.token', value);
  else localStorage.removeItem('hinga.token');
}

export function getToken() {
  return token;
}

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request(path, { method = 'GET', body, headers = {}, auth = true } = {}) {
  const finalHeaders = { ...headers };
  if (body !== undefined) finalHeaders['Content-Type'] = 'application/json';
  if (auth && token) finalHeaders.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${BASE}${path}`, {
      method,
      headers: finalHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Cannot reach the server. Check your connection and try again.', 0, null);
  }

  if (response.status === 204) return null;

  let data = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }
  }

  if (!response.ok) {
    const message = data?.error || `Request failed (${response.status})`;
    throw new ApiError(message, response.status, data);
  }

  return data;
}

const query = (params) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params || {})) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  const str = search.toString();
  return str ? `?${str}` : '';
};

export const api = {
  /* auth */
  login: (body) => request('/auth/login', { method: 'POST', body, auth: false }),
  register: (body) => request('/auth/register', { method: 'POST', body, auth: false }),
  adminRegister: (body) => request('/auth/admin/register', { method: 'POST', body, auth: false }),
  adminSignupStatus: () => request('/auth/admin/signup-status', { auth: false }),
  me: () => request('/auth/me'),
  updateProfile: (body) => request('/auth/me', { method: 'PATCH', body }),
  addresses: () => request('/auth/addresses'),
  addAddress: (body) => request('/auth/addresses', { method: 'POST', body }),
  deleteAddress: (id) => request(`/auth/addresses/${id}`, { method: 'DELETE' }),

  /* catalog */
  products: (params) => request(`/products${query(params)}`, { auth: false }),
  dealOfTheDay: () => request('/products/deal-of-the-day', { auth: false }),
  product: (slug) => request(`/products/${slug}`, { auth: false }),
  categories: () => request('/categories', { auth: false }),
  facets: () => request('/products/facets', { auth: false }),
  reviews: (productId) => request(`/products/${productId}/reviews`, { auth: false }),
  addReview: (productId, body) => request(`/products/${productId}/reviews`, { method: 'POST', body }),

  /* cart */
  cart: () => request('/cart'),
  addToCart: (body) => request('/cart/items', { method: 'POST', body }),
  updateCartItem: (id, body) => request(`/cart/items/${id}`, { method: 'PATCH', body }),
  removeCartItem: (id) => request(`/cart/items/${id}`, { method: 'DELETE' }),
  clearCart: () => request('/cart', { method: 'DELETE' }),
  mergeCart: (items) => request('/cart/merge', { method: 'POST', body: { items } }),

  /* orders */
  quote: (body) => request('/orders/quote', { method: 'POST', body }),
  validateCoupon: (body) => request('/orders/coupon/validate', { method: 'POST', body }),
  checkout: (body) => request('/orders', { method: 'POST', body }),
  myOrders: () => request('/orders'),
  myOrder: (orderNumber) => request(`/orders/${orderNumber}`),
  cancelOrder: (orderNumber) => request(`/orders/${orderNumber}/cancel`, { method: 'POST' }),

  /* admin */
  adminStats: () => request('/admin/stats'),
  adminOrders: (params) => request(`/admin/orders${query(params)}`),
  adminOrder: (id) => request(`/admin/orders/${id}`),
  updateAdminOrder: (id, body) => request(`/admin/orders/${id}`, { method: 'PATCH', body }),
  deleteAdminOrder: (id) => request(`/admin/orders/${id}`, { method: 'DELETE' }),
  adminProducts: (params) => request(`/admin/products${query(params)}`),
  createProduct: (body) => request('/admin/products', { method: 'POST', body }),
  updateProduct: (id, body) => request(`/admin/products/${id}`, { method: 'PATCH', body }),
  archiveProduct: (id) => request(`/admin/products/${id}`, { method: 'DELETE' }),
  restoreProduct: (id) => request(`/admin/products/${id}/restore`, { method: 'POST' }),
  adminCategories: (params) => request(`/admin/categories${query(params)}`),
  createCategory: (body) => request('/admin/categories', { method: 'POST', body }),
  updateCategory: (id, body) => request(`/admin/categories/${id}`, { method: 'PATCH', body }),
  deleteCategory: (id) => request(`/admin/categories/${id}`, { method: 'DELETE' }),
  adminCustomers: (params) => request(`/admin/customers${query(params)}`),
  adminCustomer: (id) => request(`/admin/customers/${id}`),
  adminCoupons: () => request('/admin/coupons'),
  createCoupon: (body) => request('/admin/coupons', { method: 'POST', body }),
  updateCoupon: (code, body) => request(`/admin/coupons/${code}`, { method: 'PATCH', body }),
  deleteCoupon: (code) => request(`/admin/coupons/${code}`, { method: 'DELETE' }),
  adminReviews: () => request('/admin/reviews'),
  deleteReview: (id) => request(`/admin/reviews/${id}`, { method: 'DELETE' }),
  adminGetDeal: () => request('/admin/deal-of-the-day'),
  adminSetDeal: (body) => request('/admin/deal-of-the-day', { method: 'PUT', body }),
  uploadImage: (body) => request('/admin/upload', { method: 'POST', body }),

  /* landscaping */
  requestQuotation: (body) => request('/landscaping', { method: 'POST', body }),
  myLandscapingRequests: () => request('/landscaping/mine'),
  addLandscapingMessage: (id, body) =>
    request(`/landscaping/${id}/messages`, { method: 'POST', body: { body } }),
  adminLandscapingRequests: (params) => request(`/landscaping${query(params)}`),
  updateLandscapingRequest: (id, body) => request(`/landscaping/${id}`, { method: 'PATCH', body }),
  deleteLandscapingRequest: (id) => request(`/landscaping/${id}`, { method: 'DELETE' }),

  /* misc */
  newsletter: (email) => request('/newsletter', { method: 'POST', body: { email }, auth: false }),
};
