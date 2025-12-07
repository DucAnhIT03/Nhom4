import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface UploadResponse {
  publicId: string;
  url: string;
}

// Lấy token từ localStorage
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Tạo axios instance với token
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

// Thêm interceptor để tự động thêm token
axiosInstance.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const uploadFile = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axiosInstance.post<UploadResponse>('/upload/single', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 300000, // 5 phút cho upload (file audio có thể lớn)
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percentCompleted);
      }
    },
  });
  return response.data;
};

export const uploadMultipleFiles = async (files: File[]): Promise<UploadResponse[]> => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });

  const response = await axiosInstance.post<UploadResponse[]>('/upload/multiple', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const deleteFile = async (publicId: string): Promise<void> => {
  await axiosInstance.delete('/upload', {
    data: { publicId },
  });
};


