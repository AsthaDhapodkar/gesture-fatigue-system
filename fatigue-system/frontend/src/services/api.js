import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  signup: async (email, password) => {
    const response = await api.post('/auth/signup', { email, password });
    return response.data;
  },
  
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  
  verifyToken: async () => {
    const response = await api.get('/auth/verify');
    return response.data;
  },
};

// Session API
export const sessionAPI = {
  start: async (sessionType, adaptiveMode = true) => {
    const response = await api.post('/session/start', { sessionType, adaptiveMode });
    return response.data;
  },
  
  end: async (sessionId, avgFatigue) => {
    const response = await api.post('/session/end', { sessionId, avgFatigue });
    return response.data;
  },
  
  getActive: async () => {
    const response = await api.get('/session/active');
    return response.data;
  },
};

// Analytics API
export const analyticsAPI = {
  logGesture: async (sessionId, gestureType, successFlag, fatigueLevel, moduleName) => {
    const response = await api.post('/analytics/log/gesture', {
      sessionId,
      gestureType,
      successFlag,
      fatigueLevel,
      moduleName,
    });
    return response.data;
  },
  
  logFatigue: async (sessionId, fatigueLevel, fatigueScore, fatigueMode) => {
    const response = await api.post('/analytics/log/fatigue', {
      sessionId,
      fatigueLevel,
      fatigueScore,
      fatigueMode,
    });
    return response.data;
  },
  
  logModuleUsage: async (sessionId, moduleName, duration, gestureCount) => {
    const response = await api.post('/analytics/log/module', {
      sessionId,
      moduleName,
      duration,
      gestureCount,
    });
    return response.data;
  },
  
  getSessionAnalytics: async (sessionId) => {
    const response = await api.get(`/analytics/session/${sessionId}`);
    return response.data;
  },
  
  getHistoricalAnalytics: async () => {
    const response = await api.get('/analytics/history');
    return response.data;
  },
};

export default api;
