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

export interface Subscription {
  id: number;
  userId: number;
  plan: 'FREE' | 'PRENIUM';
  startTime: string;
  endTime: string;
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
  createdAt: string;
  updatedAt: string;
}

export const getUserSubscription = async (userId: number): Promise<Subscription | null> => {
  try {
    const response = await axiosInstance.get<Subscription[]>(`/subscriptions/user/${userId}`);
    const subscriptions = response.data;
    
    // Lấy subscription active gần nhất
    const activeSubscription = subscriptions
      .filter(sub => sub.status === 'ACTIVE' && sub.plan === 'PRENIUM')
      .sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime())[0];
    
    if (activeSubscription) {
      // Kiểm tra xem subscription còn hạn không
      const endTime = new Date(activeSubscription.endTime);
      const now = new Date();
      if (endTime > now) {
        return activeSubscription;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching user subscription:', error);
    return null;
  }
};

export const isUserPremium = async (userId: number): Promise<boolean> => {
  const subscription = await getUserSubscription(userId);
  return subscription !== null;
};

