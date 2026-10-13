import api from './api';

export const getPlants    = (search = '') => api.get(`/plants${search ? `?search=${search}` : ''}`);
export const getPlant     = (id)          => api.get(`/plants/${id}`);
export const createPlant  = (formData)    => api.post('/plants', formData);
export const updatePlant  = (id, formData)=> api.put(`/plants/${id}`, formData);
export const deletePlant  = (id)          => api.delete(`/plants/${id}`);
