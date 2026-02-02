// src/api/payroll.ts
import axiosInstance from 'src/utils/axios';

export type PayrollMonthRow = {
  month: number;
  year: number;
  is_closed: boolean;
  payroll: {
    net_amount: number;
    gross_amount: number;
    effective_work_days: number;
    overtime_hours: number;
    overtime_amount: number;
    bonus_amount: number;
    allowance_amount: number;
    penalty_amount: number;
    advance_approved_amount: number;
  };
};

export async function getEmployeePayrollRange(employeeId: number, params: {
  fromMonth: number; fromYear: number; toMonth: number; toYear: number;
}) {
  const res = await axiosInstance.get(`/api/attendance/employees/${employeeId}/payroll-range`, { params });
  return res.data?.data as {
    employee: any;
    range: any;
    months: PayrollMonthRow[];
    total_net_amount: number;
    total_gross_amount: number;
  };
}
