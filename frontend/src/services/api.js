import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('greenlink_user') || 'null');
  if (user?.token) config.headers.Authorization = `Bearer ${user.token}`;
  return config;
});

// Handle 401 globally — clear storage and redirect, but avoid redirect loop on login/signup pages
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const authPages = ['/login', '/signup'];
      const currentPath = window.location.pathname;
      if (!authPages.includes(currentPath)) {
        localStorage.removeItem('greenlink_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
