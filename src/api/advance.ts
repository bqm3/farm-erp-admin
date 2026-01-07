import axiosInstance from 'src/utils/axios';

export type AdvanceStatus = 'SUBMITTED' | 'APPROVED' | 'REJECTED';

export type AdvanceRow = {
  id: number;
  code: string;
  receipt_date: string;
  month: number;
  year: number;
  status: AdvanceStatus;
  note?: string | null;
  amount: number;
  employee?: { id: number; username: string; full_name: string };
};

export async function listAdvances(params: {
  page?: number;
  pageSize?: number;
  status?: AdvanceStatus | '';
  month?: number;
  year?: number;
  q?: string;
}) {
  const res = await axiosInstance.get('/api/advance', { params });
  return res.data as {
    ok: boolean;
    data: { page: number; pageSize: number; total: number; rows: AdvanceRow[] };
  };
}

export async function approveAdvance(id: number) {
  const res = await axiosInstance.post(`/api/advance/${id}/approve`);
  return res.data as { ok: boolean; message?: string };
}

export async function rejectAdvance(id: number, reason: string) {
  const res = await axiosInstance.post(`/api/advance/${id}/reject`, { reason });
  return res.data as { ok: boolean; message?: string };
}
