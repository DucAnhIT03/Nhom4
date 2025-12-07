import axios from '../apis/axios';

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  role?: string;
  roles?: Array<{ roleName: string }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserListResponse {
  data: User[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateUserDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  status?: string;
}

export const getUsers = async (page: number = 1, limit: number = 10, search?: string) => {
  const response = await axios.get<UserListResponse>('/users', {
    params: { page, limit, search },
  });
  return response.data;
};

export const getUserById = async (id: number) => {
  const response = await axios.get<User>(`/users/${id}`);
  return response.data;
};

export const createUser = async (data: CreateUserDto) => {
  const response = await axios.post<User>('/users', data);
  return response.data;
};

export const updateUser = async (id: number, data: UpdateUserDto) => {
  const response = await axios.put<User>(`/users/${id}`, data);
  return response.data;
};

export const deleteUser = async (id: number) => {
  const response = await axios.delete(`/users/${id}`);
  return response.data;
};

export const toggleUserStatus = async (id: number, status: 'ACTIVE' | 'BLOCKED') => {
  const response = await axios.put<User>(`/users/${id}/status`, { status });
  return response.data;
};

export interface Role {
  id: number;
  roleName: string;
  displayName: string;
}

export interface UpdateUserRolesDto {
  roles: string[];
}

export const getAllRoles = async () => {
  const response = await axios.get<Role[]>('/users/roles/all');
  return response.data;
};

export const updateUserRoles = async (id: number, roles: string[]) => {
  const response = await axios.put<User>(`/users/${id}/roles`, { roles });
  return response.data;
};

