import axiosInstance from 'src/utils/axios';

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type LeaveType = 'PAID' | 'UNPAID' | 'SICK';

export type MonthUserRow = {
  employee_id: number;
  username: string;
  full_name: string;
  department_id?: number | null;
  work_days_per_month?: number;
  total_checkin_days: number;
  present_days: number;
  late_days: number;
  total_overtime_hours: number;
  total_overtime_amount: number;
  department: any;
};

export type AttendanceRow = {
  id: number;
  employee_id: number;
  farm_id: number;
  date: string; // YYYY-MM-DD
  check_in_time?: string; // ISO
  status?: string; // PRESENT/...
  note?: string;
  employee: any
};

export type AttendanceDailyItem = {
  date: string; // YYYY-MM-DD
  attendance: null | {
    id: number;
    check_in_time: string; // ISO
    status: 'PRESENT' | 'LATE' | 'ABSENT';
    overtime_hours: number;
    overtime_rate_id: number | null;
    overtime_amount: number;
    note: string | null;
  };
  leave?: any | null; // nếu bạn bật includeLeave
};

export type LeaveRequestRow = {
  id: number;
  leave_type: LeaveType;
  from_date: string; // YYYY-MM-DD
  to_date: string;   // YYYY-MM-DD
  total_days: number;
  reason?: string | null;
  status: LeaveStatus;
  reviewed_by?: number | null;
  reviewed_at?: string | null;
};

export type SalaryAdvanceStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type SalaryAdvanceRow = {
  id: number;
  request_date: string; // YYYY-MM-DD
  amount: number;
  reason?: string | null;
  status: SalaryAdvanceStatus;
  approved_by?: number | null;
  approved_at?: string | null;
};

export type PayrollSummary = {
  month: number;
  year: number;

  salary_base: number;            // từ User.salary_base
  work_days_per_month: number;    // từ User.work_days_per_month
  total_checkin_days: number;     // attendance count

  overtime_hours: number;
  overtime_amount: number;

  // các khoản admin có thể chỉnh
  bonus_amount: number;
  penalty_amount: number;
  allowance_amount: number;

  // tổng ứng lương (approved / pending…)
  advance_approved_amount: number;
  advance_pending_amount: number;

  gross_amount: number;   // tổng thu nhập
  net_amount: number;     // thực nhận (gross - advance_approved - penalty,... tuỳ rule)
};

export type PayrollLogRow = {
  id: number;
  employee_id: number;
  month: number;
  year: number;
  action_type: 'BONUS' | 'DEDUCTION' | 'ALLOWANCE' | 'OT_ADJUST' | 'SALARY_ADJUST' | string;
  amount: number;
  before_value: number;
  after_value: number;
  delta?: number;
  reason?: string | null;
  created_at?: string;
  created_by?: number;
  created_by_user?: { id: number; username?: string; full_name?: string } | null;
};

export async function listAttendances(params: {
  month: number;
  year: number;
  employee_id?: number | null;
}) {
  const res = await axiosInstance.get('/api/attendance', { params });
  return res.data as { ok: boolean; data: AttendanceRow[] };
}

export async function checkInAttendance(payload?: { employee_id?: number; note?: string }) {
  const res = await axiosInstance.post('/api/attendance/check-in', payload || {});
  return res.data as { ok: boolean; data: AttendanceRow };
}

export async function helpCheckInAttendance(payload: { employee_id: number; date: string; note: string }) {
  const res = await axiosInstance.post('/api/attendance/help-check-in', payload);
  return res.data as { ok: boolean; data: AttendanceRow };
}



// gợi ý: API lấy danh sách nhân viên mà viewer được xem
export type UserOption = { id: number; full_name: string; username?: string; code?: string };

export async function listAttendanceUsers() {
  const res = await axiosInstance.get('/api/users');
  return res.data as { ok: boolean; data: UserOption[] };
}

export async function getMonthUsers(month: number, year: number) {
  const res = await axiosInstance.get('/api/attendance/month-users', { params: { month, year } });
  return res.data as { ok: boolean; data: { month: number; year: number; users: MonthUserRow[] } };
}

export async function getUserDaily(employeeId: number, month: number, year: number) {
  const res = await axiosInstance.get(`/api/api/attendance/users/${employeeId}/daily` as any, {
    params: { month, year },
  });
  return res.data as {
    ok: boolean;
    data: {
      employee: { id: number; username: string; full_name: string; status: string };
      month: number;
      year: number;
      days: AttendanceDailyItem[];
    };
  };
}

/**
 * CHỐT CHẤM CÔNG
 * Ví dụ endpoint: POST /api/attendance/close
 * body: { month, year }
 */
export async function closeAttendance(params: {
  month: number;
  year: number;
  employeeIds?: number[];
  closeAll?: boolean;
}) {
  const res = await axiosInstance.post('/api/attendance/close', params);
  return res.data as {
    ok: boolean;
    message?: string;
    data?: { closedCount: number; total: number; errors?: { employeeId: number; message: string }[] };
  };
}

export async function getUserMonthDetail(employeeId: number, month: number, year: number) {
  //  GET /attendance/users/:id/month-detail?month&year
  const res = await axiosInstance.get(`/api/attendance/users/${employeeId}/month-detail` as any, {
    params: { month, year },
  });

  return res.data as {
    ok: boolean;
    data: {
      employee: { id: number; username: string; full_name: string; status: string; salary_base: number; work_days_per_month: number };
      month: number;
      year: number;

      days: AttendanceDailyItem[];
      leave_requests: LeaveRequestRow[];
      salary_advances: SalaryAdvanceRow[];

      payroll: PayrollSummary;
      payroll_preview: any;
      payroll_closing: any;
      payroll_final: any;

      closing: null | { id: number; month: number; year: number; closed_at: string; closed_by: number };
      can_edit: boolean;
    };
  };
}

/**
 * Admin cập nhật các khoản (bonus/penalty/allowance/otAmount/salaryBase override...)
 *  PUT /attendance/users/:id/payroll
 */
export async function updateUserPayroll(
  employeeId: number,
  payload: Partial<Pick<PayrollSummary,
    'bonus_amount' | 'penalty_amount' | 'allowance_amount' | 'overtime_amount' | 'salary_base'
  >> & { month: number; year: number }
) {
  const res = await axiosInstance.put(`/api/attendance/users/${employeeId}/payroll` as any, payload);
  return res.data as { ok: boolean; message?: string; data?: any };
}

/**
 * Chốt chấm công theo người theo tháng
 * Backend đề xuất: POST /attendance/users/:id/close
 */
export async function closeUserAttendance(employeeId: number, month: number, year: number) {
  const res = await axiosInstance.post(`/api/attendance/users/${employeeId}/close` as any, { month, year });
  return res.data as { ok: boolean; message?: string };
}

/**
 * Mở chốt (tuỳ bạn có cần)
 * Backend đề xuất: POST /attendance/users/:id/reopen
 */
export async function reopenUserAttendance(employeeId: number, month: number, year: number) {
  const res = await axiosInstance.post(`/api/attendance/users/${employeeId}/reopen` as any, { month, year });
  return res.data as { ok: boolean; message?: string };
}


export async function getPayrollLogs(employeeId: number, month: number, year: number) {
  const res = await axiosInstance.get(`/api/attendance/users/${employeeId}/payroll-logs`, {
    params: { month, year },
  });
  return res.data; // {ok, data}
}

export type PayrollAdjustmentPayload = {
  month: number;
  year: number;
  action_type: 'BONUS' | 'DEDUCTION' | 'ALLOWANCE' | 'OT_ADJUST' | 'SALARY_ADJUST';
  amount: number; // delta
  direction: any;
  reason?: string | null;
};

export async function addPayrollAdjustment(employeeId: number, payload: PayrollAdjustmentPayload) {
  const res = await axiosInstance.post(`/api/attendance/users/${employeeId}/payroll-adjustments`, payload);
  return res.data; // { ok, data, message? }
}