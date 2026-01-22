// src/api/advance.ts
import axiosInstance from 'src/utils/axios';

export type AdvanceStatus = 'SUBMITTED' | 'APPROVED' | 'REJECTED';

export type AdvanceRow = {
  id: number;
  code: string;
  request_date: string;
  amount: number;
  reason?: string | null;
  status: AdvanceStatus;
  employee_id: number;
  employee?: { id: number; username?: string; full_name?: string };
};

export async function listAdvances(params: {
  page: number;
  pageSize: number;
  status?: AdvanceStatus | '';
  q?: string;
}) {
  const res = await axiosInstance.get('/api/salary-advances', { params });
  return res.data as { ok: boolean; message?: string; data: { rows: AdvanceRow[]; total: number } };
}

export async function createAdvance(payload: {
  request_date: string; // ISO or yyyy-MM-dd
  amount: number;
  reason?: string;
}) {
  const res = await axiosInstance.post('/api/salary-advances', payload);
  return res.data as { ok: boolean; message?: string; data: AdvanceRow };
}

export async function approveAdvance(id: number) {
  const res = await axiosInstance.post(`/api/salary-advances/${id}/approve`);
  return res.data as { ok: boolean; message?: string; data: AdvanceRow };
}

export async function rejectAdvance(id: number, reason: string) {
  const res = await axiosInstance.post(`/api/salary-advances/${id}/reject`, { reason });
  return res.data as { ok: boolean; message?: string; data: AdvanceRow };
}
