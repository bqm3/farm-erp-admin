// src/api/leave.ts

import axiosInstance from "src/utils/axios";

export type LeaveType = 'PAID' | 'UNPAID' | 'SICK' | string;
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | string;

export type LeaveRequest = {
  id: number;
  employee_id: number;
  leave_type: LeaveType;
  from_date: string; // ISO
  to_date: string; // ISO
  total_days: number;
  reason?: string | null;

  status: LeaveStatus;
  reviewed_by?: number | null;
  reviewed_at?: string | null;

  employee?: {
    id: number;
    full_name?: string;
    name?: string;
    email?: string;
    code?: string;
  };
};

export type ListLeaveRequestsParams = {
  q?: string; // tìm theo tên/email/mã... (tuỳ backend)
  status?: LeaveStatus | '';
  leave_type?: LeaveType | '';
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
  page?: number;
  pageSize?: number;
};

export async function listLeaveRequests(params: ListLeaveRequestsParams) {
  const res = await axiosInstance.get('/api/leave/requests', { params });
  return res.data as {
    ok: boolean;
    rows: LeaveRequest[];
    count: number;
    page: number;
    pageSize: number;
  };
}

export type LeaveBalanceRow = {
  id: number;
  employee_id: number;
  year: number;
  total_days: number;
  used_days: number;
  remaining_days: number;

  employee?: { id: number; full_name?: string; email?: string; code?: string };
};

export type ListLeaveBalancesParams = {
  year?: number;
  q?: string;
  employee_id?: number;
  page?: number;
  pageSize?: number;
};


export async function approveLeaveRequest(id: number) {
  const res = await axiosInstance.post(`/api/leave/requests/${id}/approve`);
  return res.data as { ok: boolean; data?: any; error?: string };
}

export async function rejectLeaveRequest(id: number, payload?: { note?: string }) {
  const res = await axiosInstance.post(`/api/leave/requests/${id}/reject`, payload || {});
  return res.data as { ok: boolean; data?: any; error?: string };
}

export async function listLeaveBalances(params: ListLeaveBalancesParams) {
  const res = await axiosInstance.get('/api/leave/balances', { params });
  return res.data as {
    ok: boolean;
    rows: LeaveBalanceRow[];
    count: number;
    page: number;
    pageSize: number;
    error?: string;
  };
}

export async function updateLeaveBalance(id: number, payload: { total_days: number }) {
  const res = await axiosInstance.patch(`/api/leave/balances/${id}`, payload);
  return res.data as { ok: boolean; data?: LeaveBalanceRow; error?: string };
}

export async function initLeaveBalances(payload: {
  year: number;
  annual_days?: number;
  carry_over?: boolean;
  carry_over_max?: number;
}) {
  const res = await axiosInstance.post('/api/leave/balances/init', payload);
  return res.data as { ok: boolean; data?: any; error?: string };
}