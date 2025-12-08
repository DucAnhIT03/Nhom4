import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor để thêm token vào header
axiosInstance.interceptors.request.use(
  (config) => {
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

// Interceptor để xử lý lỗi 401
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export interface SubscriptionPlan {
  id: number;
  planName: string;
  price: number;
  durationDay: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionPlanResponse {
  data: SubscriptionPlan[];
  total: number;
  page: number;
  limit: number;
}

export const getSubscriptionPlans = async () => {
  const response = await axiosInstance.get<SubscriptionPlanResponse>('/subscription-plans');
  return response.data;
};

export const getSubscriptionPlanById = async (id: number) => {
  const response = await axiosInstance.get<SubscriptionPlan>(`/subscription-plans/${id}`);
  return response.data;
};

