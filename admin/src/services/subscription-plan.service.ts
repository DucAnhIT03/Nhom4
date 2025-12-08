import axios from '../apis/axios';

export interface SubscriptionPlan {
  id: number;
  planName: string;
  price: number;
  durationDay: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubscriptionPlanDto {
  planName: string;
  price: number;
  durationDay: number;
  description?: string;
}

export interface UpdateSubscriptionPlanDto {
  planName?: string;
  price?: number;
  durationDay?: number;
  description?: string;
}

export interface QuerySubscriptionPlanDto {
  page?: number;
  limit?: number;
  search?: string;
}

export interface SubscriptionPlanResponse {
  data: SubscriptionPlan[];
  total: number;
  page: number;
  limit: number;
}

export const getSubscriptionPlans = async (query?: QuerySubscriptionPlanDto) => {
  const response = await axios.get<SubscriptionPlanResponse>('/subscription-plans', {
    params: query,
  });
  return response.data;
};

export const getSubscriptionPlanById = async (id: number) => {
  const response = await axios.get<SubscriptionPlan>(`/subscription-plans/${id}`);
  return response.data;
};

export const createSubscriptionPlan = async (data: CreateSubscriptionPlanDto) => {
  const response = await axios.post<SubscriptionPlan>('/subscription-plans', data);
  return response.data;
};

export const updateSubscriptionPlan = async (id: number, data: UpdateSubscriptionPlanDto) => {
  const response = await axios.patch<SubscriptionPlan>(`/subscription-plans/${id}`, data);
  return response.data;
};

export const deleteSubscriptionPlan = async (id: number) => {
  const response = await axios.delete(`/subscription-plans/${id}`);
  return response.data;
};

