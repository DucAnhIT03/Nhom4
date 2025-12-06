// File cấu hình thư viện gọi api tới server
import axios from 'axios';

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  timeout: 10000,
});

// Request interceptor
instance.interceptors.request.use(
  (config) => {
    // Thêm token vào header nếu có
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
instance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Xử lý lỗi chung
    if (error.response?.status === 401) {
      // Xử lý khi token hết hạn
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default instance;
export { instance as axiosInstance };
