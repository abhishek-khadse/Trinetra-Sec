import axios, { AxiosRequestConfig, InternalAxiosRequestConfig, AxiosHeaders } from 'axios';
import { useAuth } from '../context/auth-context';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add authentication token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const authHook = useAuth();
      const session = authHook?.session;
      
      if (session?.access_token) {
        config.headers = new AxiosHeaders({
          ...config.headers,
          Authorization: `Bearer ${session.access_token}`
        });
      }
      return config;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('Unauthorized access. Please login.');
      // You might want to redirect to login page here
    }
    return Promise.reject(error);
  }
);

export const api = {
  // Network IDS endpoints
  analyzeNetwork: (data: any) => apiClient.post('/api/v1/network/analyze', data),
  
  // DDoS Detection endpoints
  detectDDoS: (data: any) => apiClient.post('/api/v1/ddos/detect', data),
  
  // Malicious Content endpoints
  analyzeContent: (data: any) => apiClient.post('/api/v1/content/analyze', data),
  
  // Model Management endpoints
  deployModel: (data: any) => apiClient.post('/api/v1/models/deploy', data),
  getModelStatus: (modelId: string) => apiClient.get(`/api/v1/models/status/${modelId}`),
  
  // Dashboard endpoints
  get: (endpoint: string, params?: any) => apiClient.get(endpoint, { params }),
};

export default apiClient;
