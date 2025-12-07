import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Tạo axios instance với interceptor để xử lý 401 errors
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor để xử lý lỗi 401 (Unauthorized)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && error.config.url !== '/auth/login' && error.config.url !== '/auth/register' && error.config.url !== '/auth/verify-otp') {
      // Token không hợp lệ hoặc đã hết hạn, xóa token và redirect về trang đăng nhập
      localStorage.clear();
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export interface RegisterDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface VerifyOtpDto {
  email: string;
  otp: string;
}

export interface LoginResponse {
  accessToken: string;
}

export interface RegisterResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
}

export const register = async (data: RegisterDto): Promise<RegisterResponse> => {
  const response = await axiosInstance.post<RegisterResponse>('/auth/register', data);
  return response.data;
};

export const verifyOtp = async (data: VerifyOtpDto): Promise<LoginResponse> => {
  const response = await axiosInstance.post<LoginResponse>('/auth/verify-otp', data);
  return response.data;
};

export const login = async (data: LoginDto): Promise<LoginResponse> => {
  const response = await axiosInstance.post<LoginResponse>('/auth/login', data);
  return response.data;
};

export interface UserProfile {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  age?: number;
  nationality?: string;
  role?: string;
}

export const getCurrentUser = async (): Promise<UserProfile> => {
  const token = localStorage.getItem('token');
  if (!token) {
    // Nếu không có token, redirect về trang đăng nhập
    localStorage.clear();
    window.location.href = "/";
    throw new Error('No token found');
  }
  const response = await axiosInstance.get<UserProfile>('/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

