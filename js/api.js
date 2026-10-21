/**
 * SilentAlert REST API Client
 * Centralized HTTP service managing all server communication, JWT headers & error handling.
 */

const API_BASE_URL = window.location.origin.includes('localhost') 
    ? 'http://localhost:5000/api' 
    : '/api';

const api = {
    // Helper to get auth headers
    getHeaders(contentType = 'application/json') {
        const headers = {};
        if (contentType) headers['Content-Type'] = contentType;
        const token = localStorage.getItem('silentalert_token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    },

    // Generic fetch wrapper with standardized error handling
    async request(endpoint, options = {}) {
        try {
            const url = `${API_BASE_URL}${endpoint}`;
            const config = {
                ...options,
                headers: {
                    ...this.getHeaders(options.body instanceof FormData ? null : 'application/json'),
                    ...options.headers
                }
            };

            const response = await fetch(url, config);
            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                // Handle session expiration
                if (response.status === 401 && !endpoint.includes('/auth/login')) {
                    localStorage.removeItem('silentalert_token');
                    localStorage.removeItem('silentalert_user');
                    window.dispatchEvent(new CustomEvent('auth:expired'));
                }
                const errorMsg = data.message || `Request failed with status ${response.status}`;
                throw new Error(errorMsg);
            }

            return data;
        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error.message);
            throw error;
        }
    },

    // --- AUTH ENDPOINTS ---
    auth: {
        login: (credentials) => api.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        }),
        register: (userData) => api.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        }),
        demoLogin: (role) => api.request('/auth/demo-login', {
            method: 'POST',
            body: JSON.stringify({ role })
        }),
        firebaseSync: (payload) => api.request('/auth/firebase-sync', {
            method: 'POST',
            body: JSON.stringify(payload)
        }),
        getMe: () => api.request('/auth/me'),
        updateProfile: (profileData) => api.request('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        }),
        updatePassword: (passwordData) => api.request('/auth/password', {
            method: 'PUT',
            body: JSON.stringify(passwordData)
        })
    },

    // --- ZONES (ITEMS) ENDPOINTS ---
    zones: {
        getAll: (params = {}) => {
            const query = new URLSearchParams(params).toString();
            return api.request(`/zones${query ? `?${query}` : ''}`);
        },
        getById: (id) => api.request(`/zones/${id}`),
        create: (zoneData) => api.request('/zones', {
            method: 'POST',
            body: JSON.stringify(zoneData)
        }),
        update: (id, zoneData) => api.request(`/zones/${id}`, {
            method: 'PUT',
            body: JSON.stringify(zoneData)
        }),
        delete: (id) => api.request(`/zones/${id}`, {
            method: 'DELETE'
        })
    },

    // --- NOISE / TELEMETRY ENDPOINTS ---
    noise: {
        getLogs: (limit = 50) => api.request(`/noise?limit=${limit}`),
        getAnalytics: () => api.request('/noise/analytics'),
        postTelemetry: (telemetryData) => api.request('/noise', {
            method: 'POST',
            body: JSON.stringify(telemetryData)
        })
    },

    // --- ADMIN USER MANAGEMENT ---
    users: {
        getAll: (params = {}) => {
            const query = new URLSearchParams(params).toString();
            return api.request(`/users${query ? `?${query}` : ''}`);
        },
        updateRole: (id, role) => api.request(`/users/${id}/role`, {
            method: 'PUT',
            body: JSON.stringify({ role })
        }),
        delete: (id) => api.request(`/users/${id}`, {
            method: 'DELETE'
        })
    },

    // --- CONTACT FORM INQUIRIES ---
    contact: {
        submit: (formData) => api.request('/contact', {
            method: 'POST',
            body: JSON.stringify(formData)
        }),
        getAll: () => api.request('/contact')
    },

    // --- DYNAMIC SYSTEM OVERVIEW STATS ---
    stats: {
        getOverview: () => api.request('/stats/overview')
    }
};

window.api = api;

