import axiosInstance from 'src/utils/axios';

export type ISpecies = {
  id: number;
  code: string;
  name: string;
  isDelete?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type SpeciesListRes = {
  page: number;
  pageSize: number;
  total: number;
  data: ISpecies[];
};

export async function apiListSpecies(params: { page?: number; pageSize?: number; search?: string }) {
  const res = await axiosInstance.get<SpeciesListRes>('/api/species', { params });
  return res.data;
}

export async function apiGetSpecies(id: number) {
  const res = await axiosInstance.get<ISpecies>(`/api/species/${id}`);
  return res.data;
}

export async function apiCreateSpecies(payload: { code: string; name: string }) {
  const res = await axiosInstance.post<ISpecies>('/api/species', payload);
  return res.data;
}

export async function apiUpdateSpecies(id: number, payload: { name: string }) {
  const res = await axiosInstance.put<ISpecies>(`/api/species/${id}`, payload);
  return res.data;
}

export async function apiDeleteSpecies(id: number) {
  const res = await axiosInstance.delete(`/api/species/${id}`);
  return res.data;
}

export async function apiRestoreSpecies(id: number) {
  const res = await axiosInstance.post<ISpecies>(`/api/species/${id}/restore`);
  return res.data;
}
