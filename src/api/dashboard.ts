// src/api/dashboard.ts
import axiosInstance from 'src/utils/axios';

export type DashboardEmployee = {
  id: number;
  full_name?: string;
  name?: string;
  email?: string | null;
  phone?: string | null;
  dob?: string | null;
  birth_date?: string | null;
  department?: { id: number; name: string } | null;
  roles: any[];
};

export type DashboardSummary = {
  farm_id?: number;
  period?: {
    month: number;
    year: number;
    from?: string;
    to_exclusive?: string;
    today?: string;
  };
  birthdays: {
    today: DashboardEmployee[];
    this_month: DashboardEmployee[];
    today_count: number;
    this_month_count: number;
  };
  stats: {
    tasks_created_in_month: number;
    receipts_created_in_month: number;
    total_employees: number;
    total_departments: number;
  };
};

export async function getDashboardSummary(params?: { month?: number; year?: number }) {
  const res = await axiosInstance.get('/api/dashboard/summary', { params });
  // res.data = { ok: true, data: DashboardSummary }
  return res.data?.data as DashboardSummary;
}
