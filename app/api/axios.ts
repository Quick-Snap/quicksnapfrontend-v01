import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        // Check if running in browser
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            const activeRole = localStorage.getItem('activeRole');
            if (activeRole) {
                config.headers['x-active-role'] = activeRole;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor — 401 clears token; 429 is passed through (no token wipe / retry storm)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        if (status === 401 && typeof window !== 'undefined') {
            localStorage.removeItem('token');
        }
        return Promise.reject(error);
    }
);

export default api;
