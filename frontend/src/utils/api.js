import axios from 'axios';
import { useAuthStore } from '../store';

// Create a centralized Axios instance.
// This ensures that our backend URL is mapped in one place.
const api = axios.create({
  baseURL: 'http://localhost:5001/api', // Pointing to our Express backend
});

// Axios Interceptor for injecting the Authorization header seamlessly.
// Before EVERY request leaves the browser, this interceptor runs.
api.interceptors.request.use((config) => {
  // Grab the latest token straight from the Zustand store
  const token = useAuthStore.getState().token;
  if (token) {
    // If we have a token, stick it in the Authorization header
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Adding a response interceptor to handle token expiration/unauthorized calls globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If the backend says 401 Unauthorized (invalid or expired token), auto-logout the user
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default api;
