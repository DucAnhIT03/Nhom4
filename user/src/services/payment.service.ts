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

export const PaymentMethod = {
  PAYPAL: 'PAYPAL',
  CREDIT_CARD: 'CREDIT_CARD',
  MOMO: 'MOMO',
  ZALO_PAY: 'ZALO_PAY',
} as const;

export type PaymentMethod = typeof PaymentMethod[keyof typeof PaymentMethod];

export const PaymentStatus = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
} as const;

export type PaymentStatus = typeof PaymentStatus[keyof typeof PaymentStatus];

export interface CreatePaymentDto {
  userId: number;
  planId: number;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionId?: string;
}

export interface SubscriptionPlan {
  id: number;
  planName: string;
  price: number;
  durationDay: number;
  description?: string;
}

export interface Payment {
  id: number;
  userId: number;
  planId: number;
  transactionId?: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentDate: string;
  createdAt: string;
  updatedAt: string;
  plan?: SubscriptionPlan | null;
}

export const createPayment = async (data: CreatePaymentDto) => {
  const response = await axiosInstance.post<Payment>('/payments', data);
  return response.data;
};

export const getMyPayments = async () => {
  const response = await axiosInstance.get<Payment[]>('/payments/me');
  return response.data;
};

export interface CreateMomoPaymentDto {
  planId: number;
  amount: number;
  planName: string;
}

export interface MomoPaymentResponse {
  payUrl: string;
  orderId: string;
  planId: number;
  userId: number;
}

export const createMomoPayment = async (data: CreateMomoPaymentDto) => {
  const response = await axiosInstance.post<MomoPaymentResponse>('/payments/momo/create', data);
  return response.data;
};

