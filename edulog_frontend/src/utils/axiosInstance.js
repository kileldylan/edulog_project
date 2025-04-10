import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token expiration check function
const isTokenExpired = (tokenTimestamp) => {
  if (!tokenTimestamp) return true;
  const now = new Date().getTime();
  const tokenAge = now - tokenTimestamp;
  // token expires after 30 minutes (1800000 ms)
  return tokenAge > 1800000; 
};

// Add request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('access_token');
    const tokenTimestamp = parseInt(sessionStorage.getItem('token_timestamp'));
    
    // Check if token exists and is not expired
    if (token && !isTokenExpired(tokenTimestamp)) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // Token expired or doesn't exist
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('token_timestamp');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = sessionStorage.getItem('refresh_token');
        const response = await axios.post(`${API_BASE_URL}/token/refresh/`, { 
          refresh: refreshToken 
        });
        
        // Store new token and timestamp
        sessionStorage.setItem('access_token', response.data.access);
        sessionStorage.setItem('token_timestamp', new Date().getTime());
        
        originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Clear all auth data if refresh fails
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('refresh_token');
        sessionStorage.removeItem('token_timestamp');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Helper function to set tokens with timestamp
export const setAuthTokens = (access, refresh) => {
  sessionStorage.setItem('access_token', access);
  sessionStorage.setItem('refresh_token', refresh);
  sessionStorage.setItem('token_timestamp', new Date().getTime());
};

export default axiosInstance;