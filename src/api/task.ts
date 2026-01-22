import axiosInstance from 'src/utils/axios';

export type TaskStatus = 'PENDING' | 'OPEN' | 'IN_PROGRESS' | 'DONE' | 'CLOSED' | 'REJECTED';
export type TaskType = 'QUANTITY_UPDATE' | 'GENERAL' | 'EXPENSE';

export type TaskRow = {
  id: number;
  cycle_id: number;
  title: string;
  description?: string | null;
  task_type: 'GENERAL' | 'QUANTITY_UPDATE' | 'EXPENSE';
  assigned_to: number;
  assigned_by: number;
  created_by: number;
  due_date?: string | null;
  status: TaskStatus;
  approved_by?: number | null;
  approved_at?: string | null;
  rejected_by?: number | null;
  rejected_at?: string | null;
  reject_reason?: string | null;
  closed_by?: number | null;
  closed_at?: string | null;
};

export type TaskLite = {
  id: number;
  title: string;
  status: string;
  task_type: 'GENERAL' | 'QUANTITY_UPDATE' | 'EXPENSE';
};

export async function listTasks(params: {
  cycle_id?: number;
  status?: string; // "PENDING,OPEN"
  page?: number;
  limit?: number;
}) {
  const res = await axiosInstance.get('/api/tasks', { params });
  return res.data as { ok: boolean; data: TaskRow[]; count: number; page: number; limit: number };
}

export async function createTask(payload: {
  cycle_id: number;
  assigned_to: number;
  title: string;
  description?: string;
  due_date?: string;
  task_type?: 'GENERAL' | 'QUANTITY_UPDATE' | 'EXPENSE';
}) {
  const res = await axiosInstance.post('/api/tasks', payload);
  return res.data;
}

export async function approveTask(taskId: number) {
  const res = await axiosInstance.patch(`/api/tasks/${taskId}/approve`);
  return res.data;
}

export async function rejectTask(taskId: number, reason?: string) {
  const res = await axiosInstance.patch(`/api/tasks/${taskId}/reject`, { reason });
  return res.data;
}

export async function listQuantityUpdateTasks(params: { cycle_id: number; status?: string }) {
  const res = await axiosInstance.get('/api/tasks', {
    params: {
      cycle_id: params.cycle_id,
      task_type: 'QUANTITY_UPDATE',
      status: params.status || 'OPEN,PENDING', // tuỳ bạn muốn lọc gì
      limit: 100,
      page: 1,
    },
  });

  return res.data as { data: TaskLite[]; count: number; page: number; limit: number };
}

export async function closeTask(taskId: number) {
  const res = await axiosInstance.post(`/api/tasks/${taskId}/close`);
  return res.data;
}