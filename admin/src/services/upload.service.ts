import axios from '../apis/axios';

export interface UploadResponse {
  publicId: string;
  url: string;
}

export const uploadFile = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post<UploadResponse>('/upload/single', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const uploadMultipleFiles = async (files: File[]): Promise<UploadResponse[]> => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });

  const response = await axios.post<UploadResponse[]>('/upload/multiple', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const deleteFile = async (publicId: string): Promise<void> => {
  await axios.delete('/upload', {
    data: { publicId },
  });
};

