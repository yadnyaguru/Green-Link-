import api from './api';

// Listings
export const getListings       = ()        => api.get('/listings');
export const getNearbyListings = (lat, lng, radius) => api.get(`/listings/nearby?lat=${lat}&lng=${lng}&radius=${radius || 50000}`);
export const getMyListings     = ()        => api.get('/listings/mine');
export const createListing     = (data)    => api.post('/listings', data);
export const updateListing     = (id, data)=> api.put(`/listings/${id}`, data);
export const deleteListing     = (id)      => api.delete(`/listings/${id}`);

// Requests
export const createRequest         = (data)    => api.post('/requests', data);
export const getMyRequests         = ()        => api.get('/requests/mine');
export const getIncomingRequests   = ()        => api.get('/requests/incoming');
export const updateRequestStatus   = (id, status) => api.put(`/requests/${id}/status`, { status });

// Messages
export const sendMessage  = (data)      => api.post('/messages', data);
export const getMessages  = (requestId) => api.get(`/messages/${requestId}`);

// Ratings
export const createRating        = (data)       => api.post('/ratings', data);
export const getProviderRatings  = (providerId) => api.get(`/ratings/provider/${providerId}`);

// Users
export const uploadProfileImage = (formData) =>
  api.post('/users/profile-image', formData);
export const updateProfile      = (data) => api.put('/users/profile', data);
export const getProviderProfile = (id)   => api.get(`/users/${id}`);

// Dashboard
export const getDashboardStats  = ()     => api.get('/dashboard/stats');
export const getProviderStats   = ()     => api.get('/dashboard/provider-stats');
