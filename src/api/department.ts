// src/api/department.ts
import axiosInstance from "src/utils/axios";


export type PagingResp<T> = {
  ok: boolean;
  data: T[];
  page: number;
  limit: number;
  total: number;
};

export async function listDepartment( params: { page?: number; limit?: number; search?: string }) {
  const res = await axiosInstance.get<PagingResp<any>>(`/api/departments`, { params });
  return res.data;
}

export async function fetchDepartmentById(id: number) {
  const res = await axiosInstance.get<{ ok: boolean; data: any }>(`/api/departments/${id}`);
  return res.data;
}

export async function updateDepartment(id: number, payload: any) {
  const res = await axiosInstance.put(`/api/departments/${id}`, payload);
  return res.data; // { message, data }
}