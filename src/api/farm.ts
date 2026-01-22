// src/api/farms.ts
import axiosInstance from 'src/utils/axios';

export type FarmStatus = 'ACTIVE' | 'INACTIVE';

export type FarmRow = {
  id: number;
  code: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  status?: FarmStatus;
  manager_user_id?: number | null;

  // nếu backend include manager object:
  manager?: { id: number; full_name?: string; username?: string } | null;

  createdAt?: string;
  updatedAt?: string;
};

export type FarmListResponse = {
  ok: true;
  data: FarmRow[];
  page: number;
  limit: number;
  total: number;
};

export async function listFarms(params?: {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const res = await axiosInstance.get<FarmListResponse>('/api/farms', { params });
  return res.data || [];
}

export type FarmCreatePayload = {
  code: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  manager_user_id?: number | null;
};

export async function createFarm(payload: FarmCreatePayload) {
  const res = await axiosInstance.post('/api/farms', payload);
  return res.data;
}

export type FarmUpdatePayload = Partial<{
  code: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  status: FarmStatus;
  manager_user_id: number | null;
}>;

export async function updateFarm(id: number | string, payload: FarmUpdatePayload) {
  const res = await axiosInstance.put(`/api/farms/${id}`, payload);
  return res.data;
}

export async function deleteFarm(id: number | string) {
  const res = await axiosInstance.delete(`/api/farms/${id}`);
  return res.data;
}
