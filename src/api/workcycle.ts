// src/api//workcycle.ts
import axiosInstance from 'src/utils/axios';

export type WorkCycleStatus = 'OPEN' | 'CLOSED';

export type WorkCycle = {
  id: number;
  department_id: number;
  code: string;
  name: string;
  location?: string | null;
  species_id: number;
  initial_quantity: string; // "0.000"
  current_quantity: string; // "0.000"
  unit?: string | null;
  start_date: string; // "2026-01-01"
  end_date?: string | null;
  status: WorkCycleStatus;
  note?: string | null;
  created_by?: number | null;

  department?: {
    id: number;
    code: string;
    name: string;
    farm?: { id: number; code: string; name: string };
  };

  species?: { id: number; name: string };

  staffs?: any[];
};

export type PagingResp<T> = {
  ok: boolean;
  data: T[];
  page: number;
  limit: number;
  total: number;
};

export type WorkCycleCreatePayload = {
  code: string;
  department_id: number;
  species_id: number;
  start_date: string; // backend nhận dd/MM/yyyy hoặc yyyy-MM-dd? bạn đang gửi "01/01/2026"
  name: string;
  location?: string;
  status: WorkCycleStatus;
  created_by?: number;
};

export type WorkCycleUpdatePayload = Partial<Omit<WorkCycleCreatePayload, 'created_by'>> & {
  // tuỳ backend bạn
};

export type QuantityChangeType = 'INCREASE' | 'DECREASE';

export type UpdateQuantityPayload = {
  change_type: QuantityChangeType;
  quantity_change: number;
  reason?: string;
  log_date: string; // "2025-12-29" (yyyy-MM-dd)
  task_id?: number | null;
};

export type QuantityLog = {
  id: number;
  work_cycle_id: number;
  task_id: number | null;
  change_type: QuantityChangeType;
  quantity_before: string;
  quantity_change: string;
  quantity_after: string;
  reason: string | null;
  log_date: string;
  created_by: number;
  created_at: string;
  creator?: { id: number; username: string; full_name: string };
};

export type QuantityLogsResp = {
  ok: boolean;
  data: QuantityLog[];
  page: number;
  limit: number;
  total: number;
  summary?: any;
};

export type QuantityStatsResp = {
  ok: boolean;
  data: {
    cycle: {
      id: number;
      name: string;
      initial_quantity: string;
      current_quantity: string;
      unit: string | null;
    };
    period: { start_date: string; end_date: string };
    daily_stats: Array<{
      date: string;
      increase: number;
      decrease: number;
      net: number;
      quantity_end: number;
    }>;
  };
};

export async function listWorkCycles(params: { page?: number; limit?: number; search?: string }) {
  const res = await axiosInstance.get<PagingResp<WorkCycle>>('/api/work-cycles', { params });
  return res.data;
}

export async function getWorkCycle(id: number) {
  const res = await axiosInstance.get<{ ok: boolean; data: WorkCycle }>(`/api/work-cycles/${id}`);
  return res.data;
}

export async function createWorkCycle(payload: WorkCycleCreatePayload) {
  const res = await axiosInstance.post<{ ok: boolean; data: WorkCycle }>(`/api/work-cycles`, payload);
  return res.data;
}

export async function updateWorkCycle(id: number, payload: WorkCycleUpdatePayload) {
  const res = await axiosInstance.put<{ ok: boolean; data: WorkCycle }>(`/api/work-cycles/${id}`, payload);
  return res.data;
}

export async function deleteWorkCycle(id: number) {
  const res = await axiosInstance.delete<{ ok: boolean }>(`/api/work-cycles/${id}`);
  return res.data;
}

export async function restoreWorkCycle(id: number) {
  const res = await axiosInstance.post<{ ok: boolean; data: WorkCycle }>(`/api/work-cycles/${id}/restore`);
  return res.data;
}

export async function updateQuantity(id: number, payload: UpdateQuantityPayload) {
  const res = await axiosInstance.post<{ ok: boolean; data?: any }>(
    `/api/work-cycles/${id}/update-quantity`,
    payload
  );
  return res.data;
}

export async function attachStaff(id: number, payload: { staff_ids: number[]; note?: string }) {
  const res = await axiosInstance.post<{ ok: boolean; data?: any }>(`/api/work-cycles/${id}/staff`, payload);
  return res.data;
}

export async function getQuantityLogs(id: number, params: { page?: number; limit?: number } = {}) {
  const res = await axiosInstance.get<QuantityLogsResp>(`/api/work-cycles/${id}/quantity-logs`, { params });
  return res.data;
}

export async function getQuantityStats(
  id: number,
  params: { start_date: string; end_date: string } // querystring
) {
  const res = await axiosInstance.get<QuantityStatsResp>(`/api/work-cycles/${id}/quantity-stats`, { params });
  return res.data;
}


