/* eslint-disable react/no-unescaped-entities */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-continue */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-nested-ternary */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  Divider,
  Tabs,
  Tab,
  Box,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Chip,
  TextField,
  Grid,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';

import { useSnackbar } from 'src/components/snackbar';
import {
  getUserMonthDetail,
  updateUserPayroll,
  closeUserAttendance,
  reopenUserAttendance,
  type LeaveRequestRow,
  type SalaryAdvanceRow,
  type AttendanceDailyItem,
  type PayrollSummary,
  getPayrollLogs,
  type PayrollLogRow,
  addPayrollAdjustment,
} from 'src/api/attendance';
import { useAuthContext } from 'src/auth/hooks';

type Props = {
  open: boolean;
  onClose: VoidFunction;
  employeeId?: number | null;
  month: number;
  year: number;
};

function logTypeLabel(t?: string) {
  if (t === 'BONUS') return 'Thưởng';
  if (t === 'DEDUCTION') return 'Phạt';
  if (t === 'ALLOWANCE') return 'Phụ cấp';
  if (t === 'OT_ADJUST') return 'Điều chỉnh OT';
  if (t === 'SALARY_ADJUST') return 'Điều chỉnh lương cơ bản';
  return t || '-';
}

function statusChip(status: string) {
  if (status === 'PRESENT') return <Chip label="Có mặt" color="success" size="small" />;
  if (status === 'HELP') return <Chip label="Chấm hộ" color="info" size="small" />;
  if (status === 'LATE') return <Chip label="Đi trễ" color="warning" size="small" />;
  if (status === 'ABSENT') return <Chip label="Vắng" color="error" size="small" />;
  if (status === 'APPROVED') return <Chip label="Đã duyệt" color="success" size="small" />;
  if (status === 'PENDING') return <Chip label="Chờ duyệt" color="warning" size="small" />;
  if (status === 'REJECTED') return <Chip label="Từ chối" color="error" size="small" />;
  return <Chip label={status || ''} size="small" />;
}

function fmtTime(iso?: string | null) {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleString();
}

function n(v: any, fallback = 0) {
  const num = Number(v);
  return Number.isFinite(num) ? num : fallback;
}

function money(v: any) {
  return n(v, 0).toLocaleString();
}

function typeLabel(t?: string) {
  if (t === 'PAID') return 'Nghỉ phép (có lương)';
  if (t === 'UNPAID') return 'Nghỉ không lương';
  // if (t === 'SICK') return 'Nghỉ ốm';
  return t || '-';
}

function TabPanel(props: { value: number; index: number; children: any }) {
  const { value, index, children } = props;
  if (value !== index) return null;
  return <Box sx={{ pt: 2 }}>{children}</Box>;
}

function sumAdjustments(preview: any, base: any) {
  // +/- lấy theo basePayroll
  const ot = n(base?.overtime_amount);
  const bonus = n(base?.bonus_amount);
  const allowance = n(base?.allowance_amount);
  const plus = ot + bonus + allowance;

  const penalty = n(base?.penalty_amount);
  const advanceApproved = n(base?.advance_approved_amount);
  const minus = penalty + advanceApproved;

  // lương theo ngày công lấy theo preview
  const salaryByDays = n(preview?.salary_by_days);

  const netExpected = salaryByDays + plus - minus;

  return { ot, bonus, allowance, penalty, advanceApproved, plus, minus, salaryByDays, netExpected };
}

function summarizeLogs(rows: PayrollLogRow[]) {
  const byType: Record<string, number> = {};
  let totalDeltaNet = 0;

  for (const r of rows || []) {
    const t = r.action_type || 'UNKNOWN';
    byType[t] = (byType[t] || 0) + n((r as any).delta_field ?? r.amount);
    totalDeltaNet += n((r as any).delta_net);
  }

  return { byType, totalDeltaNet };
}

export default function AttendanceDetailDialog({ open, onClose, employeeId, month, year }: Props) {
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuthContext();
  const isAdmin = Boolean(user?.roles?.includes?.('ADMIN') || user?.role === 'ADMIN');

  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState(0);

  const [employee, setEmployee] = useState<any>(null);
  const [days, setDays] = useState<AttendanceDailyItem[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequestRow[]>([]);
  const [advances, setAdvances] = useState<SalaryAdvanceRow[]>([]);
  const [payrollPreview, setPayrollPreview] = useState<PayrollSummary | any>(null);
  const [payrollClosing, setPayrollClosing] = useState<PayrollSummary | any>(null);
  const [payrollFinal, setPayrollFinal] = useState<PayrollSummary | any>(null);

  const [logs, setLogs] = useState<PayrollLogRow[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [closing, setClosing] = useState<any>(null);
  const [canEdit, setCanEdit] = useState<boolean>(false);

  // ✅ Form điều chỉnh mới: nhập số tiền muốn +/-
  const [adjustForm, setAdjustForm] = useState({
    action_type: 'BONUS' as 'BONUS' | 'DEDUCTION' | 'ALLOWANCE' | 'OT_ADJUST' | 'SALARY_ADJUST',
    amount: '',
    direction: 1, // +1 = cộng, -1 = trừ
    reason: '',
  });

  const [saving, setSaving] = useState(false);

  const title = useMemo(() => {
    const name = employee?.full_name || employee?.username || employeeId || '';
    return `Chi tiết tháng ${month}/${year} - ${name}`;
  }, [employee?.full_name, employee?.username, employeeId, month, year]);

  const isClosed = Boolean(closing?.closed_at);

  const loadDetail = useCallback(async () => {
    if (!open || !employeeId) return;
    try {
      setLoading(true);
      const res = await getUserMonthDetail(employeeId, month, year);
      const data = res.data;

      setEmployee(data.employee);
      setDays(data.days || []);
      setLeaves(data.leave_requests || []);
      setAdvances(data.salary_advances || []);
      setPayrollPreview(data.payroll_preview || null);
      setPayrollClosing(data.payroll_closing || null);
      setPayrollFinal(data.payroll_final || null);
      setClosing(data.closing || null);
      setCanEdit(Boolean(data.can_edit));
    } catch (e: any) {
      enqueueSnackbar(e?.message || 'Lỗi tải chi tiết tháng', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [employeeId, enqueueSnackbar, month, open, year]);

  useEffect(() => {
    setTab(0);
    if (open) loadDetail();
  }, [open, employeeId, month, year]);

  // ✅ Gửi điều chỉnh đơn giản: amount + direction
  const onSubmitAdjustment = useCallback(async () => {
    if (!employeeId) return;

    const amt = n(adjustForm.amount, 0);
    if (amt <= 0) {
      enqueueSnackbar('Số tiền phải > 0', { variant: 'error' });
      return;
    }

    try {
      setSaving(true);

      const res = await addPayrollAdjustment(employeeId, {
        month,
        year,
        action_type: adjustForm.action_type,
        amount: amt,
        direction: adjustForm.direction,
        reason: adjustForm.reason || null,
      });

      if (!res?.ok) {
        enqueueSnackbar(res?.message || 'Lưu thất bại', { variant: 'error' });
        return;
      }

      enqueueSnackbar('Đã ghi nhận điều chỉnh', { variant: 'success' });

      // Reset form
      setAdjustForm({
        action_type: 'BONUS',
        amount: '',
        direction: 1,
        reason: '',
      });

      await loadDetail();
      if (isAdmin && tab === 4) await loadLogs();
    } catch (e: any) {
      enqueueSnackbar(e?.message || 'Lỗi điều chỉnh', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  }, [employeeId, adjustForm, month, year, enqueueSnackbar, loadDetail, isAdmin, tab]);

  const onCloseAttendance = useCallback(async () => {
    if (!employeeId) return;
    try {
      const res = await closeUserAttendance(employeeId, month, year);
      if (res?.ok) {
        enqueueSnackbar(res?.message || 'Đã chốt chấm công cho nhân viên', { variant: 'success' });
        await loadDetail();
      } else {
        enqueueSnackbar(res?.message || 'Chốt thất bại', { variant: 'error' });
      }
    } catch (e: any) {
      enqueueSnackbar(e?.message || 'Lỗi chốt chấm công', { variant: 'error' });
    }
  }, [employeeId, enqueueSnackbar, loadDetail, month, year]);

  const onReopenAttendance = useCallback(async () => {
    if (!employeeId) return;
    try {
      const res = await reopenUserAttendance(employeeId, month, year);
      if (res?.ok) {
        enqueueSnackbar(res?.message || 'Đã mở chốt', { variant: 'success' });
        await loadDetail();
      } else {
        enqueueSnackbar(res?.message || 'Mở chốt thất bại', { variant: 'error' });
      }
    } catch (e: any) {
      enqueueSnackbar(e?.message || 'Lỗi mở chốt', { variant: 'error' });
    }
  }, [employeeId, enqueueSnackbar, loadDetail, month, year]);

  const effectiveWarn = useMemo(() => {
    const base = payrollPreview || payrollFinal;
    if (!base) return null;
    if (n(base.total_checkin_days, 0) > 0 && n(base.effective_work_days, 0) === 0) {
      return 'Đang có check-in nhưng effective_work_days = 0...';
    }
    return null;
  }, [payrollPreview, payrollFinal]);

  const loadLogs = useCallback(async () => {
    if (!employeeId || !isAdmin) return;
    try {
      setLogsLoading(true);
      const res = await getPayrollLogs(employeeId, month, year);
      setLogs(res?.data || []);
    } catch (e: any) {
      enqueueSnackbar(e?.message || 'Lỗi tải logs', { variant: 'error' });
    } finally {
      setLogsLoading(false);
    }
  }, [employeeId, enqueueSnackbar, isAdmin, month, year]);

  useEffect(() => {
    if (!open) return;
    if (isAdmin && tab === 4) {
      loadLogs();
    }
  }, [tab, open, isAdmin, loadLogs]);

  const basePayroll = payrollClosing || payrollFinal || payrollPreview;
  const previewPayroll = payrollPreview || basePayroll;

  const adjustPayroll = basePayroll || payrollPreview;

  const calc = useMemo(
    () => sumAdjustments(previewPayroll, adjustPayroll),
    [previewPayroll, adjustPayroll]
  );

  const logSum = useMemo(() => summarizeLogs(logs), [logs]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>{title}</DialogTitle>

      <DialogContent>
        {loading ? (
          <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
            <CircularProgress />
          </Stack>
        ) : (
          <Stack spacing={2}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              alignItems={{ md: 'center' }}
            >
              <Box>
                <Typography variant="subtitle1">{employee?.full_name || '-'}</Typography>
                 <Typography variant="body2" color="text.secondary">
                  @{employee?.username || '-'} • Lương cơ bản:{' '}
                  {money(previewPayroll?.salary_base ?? employee?.salary_base)}

                  {previewPayroll ? (
                    <>
                      {' '}
                      • Ngày công: {n(previewPayroll.effective_work_days)}/
                      {n(previewPayroll.work_days_per_month)} • Lương theo ngày:{' '}
                      {money(previewPayroll.salary_by_days)} 
                    </>
                  ) : null}
                </Typography>
              </Box>

              <Box flexGrow={1} />

               {isClosed ? (
                <Chip
                  label={`Đã chốt (${
                    closing?.closed_at ? new Date(closing.closed_at).toLocaleString() : ''
                  })`}
                  color="success"
                />
              ) : (
                <Chip label="Chưa chốt" color="warning" />
              )}
            </Stack>

           {previewPayroll ? (
              <Grid container spacing={1}>
                <Grid item xs={12} md={3}>
                  <MiniStat
                    label="Ngày công hiệu lực"
                    value={`${n(previewPayroll.effective_work_days)}/${n(
                      previewPayroll.work_days_per_month
                    )}`}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <MiniStat
                    label="Nghỉ có lương"
                    value={`${n(previewPayroll.paid_leave_days) + n(previewPayroll.sick_leave_days)} ngày`}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <MiniStat label="Đơn giá ngày" value={money(previewPayroll.daily_rate)} />
                </Grid>
                <Grid item xs={12} md={3}>
                  <MiniStat label="Lương theo ngày công" value={money(previewPayroll.salary_by_days)} />
                </Grid>
              </Grid>
            ) : null}

            {effectiveWarn ? <Alert severity="warning">{effectiveWarn}</Alert> : null}

            <Divider />

            <Tabs value={tab} onChange={(_, v) => setTab(v)}>
              <Tab label="Chấm công theo ngày" />
              <Tab label={`Đơn nghỉ (${leaves.length})`} />
              <Tab label={`Ứng lương (${advances.length})`} />
              <Tab label="Lương & Tổng hợp" />
              {isAdmin ? <Tab label={`Truy vết thay đổi (${logs.length})`} /> : null}
            </Tabs>

            {/* TAB 0: Chấm công */}
            <TabPanel value={tab} index={0}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Ngày không check-in sẽ để trống.
              </Alert>

              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell width={120}>Ngày</TableCell>
                    <TableCell width={140}>Trạng thái</TableCell>
                    <TableCell width={220}>Giờ check-in</TableCell>
                    <TableCell width={120} align="right">
                      Tăng ca (giờ)
                    </TableCell>
                    <TableCell width={160} align="right">
                      Tăng ca (tiền)
                    </TableCell>
                    <TableCell>Ghi chú</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {days.map((d) => {
                    const att = d.attendance;
                    return (
                      <TableRow key={d.date} hover>
                        <TableCell>{d.date}</TableCell>
                        <TableCell>{att ? statusChip(att.status) : ''}</TableCell>
                        <TableCell>{att ? fmtTime(att.check_in_time) : ''}</TableCell>
                        <TableCell align="right">{att ? n(att.overtime_hours) : ''}</TableCell>
                        <TableCell align="right">{att ? money(att.overtime_amount) : ''}</TableCell>
                        <TableCell>{att?.note || ''}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TabPanel>

            {/* TAB 1: Đơn nghỉ */}
            <TabPanel value={tab} index={1}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell width={200}>Loại</TableCell>
                    <TableCell width={130}>Từ</TableCell>
                    <TableCell width={130}>Đến</TableCell>
                    <TableCell width={120} align="right">
                      Số ngày
                    </TableCell>
                    <TableCell width={140}>Trạng thái</TableCell>
                    <TableCell>Lý do</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leaves.map((lr) => (
                    <TableRow key={lr.id} hover>
                      <TableCell>{typeLabel(lr.leave_type)}</TableCell>
                      <TableCell>{fmtTime(lr.from_date)} </TableCell>
                      <TableCell>{fmtTime(lr.to_date)} </TableCell>
                      <TableCell align="right">{n(lr.total_days)}</TableCell>
                      <TableCell>{statusChip(lr.status)}</TableCell>
                      <TableCell>{lr.reason || '-'}</TableCell>
                    </TableRow>
                  ))}
                  {leaves.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        Không có đơn nghỉ trong tháng
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabPanel>

            {/* TAB 2: Ứng lương */}
            <TabPanel value={tab} index={2}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell width={200}>Ngày yêu cầu</TableCell>
                    <TableCell width={160} align="right">
                      Số tiền
                    </TableCell>
                    <TableCell width={140}>Trạng thái</TableCell>
                    <TableCell>Lý do</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {advances.map((a) => (
                    <TableRow key={a.id} hover>
                      <TableCell>{fmtTime(a.request_date)}</TableCell>
                      <TableCell align="right">{money(a.amount)}</TableCell>
                      <TableCell>{statusChip(a.status)}</TableCell>
                      <TableCell>{a.reason || '-'}</TableCell>
                    </TableRow>
                  ))}
                  {advances.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                        Không có phiếu ứng lương trong tháng
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabPanel>

            {/* TAB 3: Lương */}
            <TabPanel value={tab} index={3}>
              {!previewPayroll ? (
                <Alert severity="warning">Chưa có dữ liệu tổng hợp lương.</Alert>
              ) : (
                <Stack spacing={2}>
                  <CardBlock title="Tổng hợp nhanh">
                    {/* ✅ salary_by_days dùng PREVIEW */}
                    <Row label="Lương theo ngày công" value={money(previewPayroll.salary_by_days)} />

                    {/* ✅ +/- dùng BASE */}
                    <Row label="Tổng cộng (+) OT + Thưởng + Phụ cấp" value={money(calc.plus)} />
                    <Row label="Tổng trừ (-) Phạt + Ứng lương đã duyệt" value={money(calc.minus)} />
                    <Divider sx={{ my: 1 }} />

                    {/* ✅ netExpected = preview.salary_by_days + plus - minus */}
                    <Row label="Lương điều chỉnh" value={money(calc.netExpected)} />

                  </CardBlock>

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <CardBlock title="Ngày công & thống kê">
                        {/* ✅ thống kê ngày dùng PREVIEW */}
                        <Row label="Ngày check-in" value={`${n(previewPayroll.total_checkin_days)}`} />
                        <Row label="Có mặt" value={`${n(previewPayroll.present_days)}`} />
                        <Row label="Đi trễ" value={`${n(previewPayroll.late_days)}`} />
                        <Divider sx={{ my: 1 }} />
                        <Row
                          label="Nghỉ có lương"
                          value={`${n(previewPayroll.paid_leave_days)} ngày`}
                        />
                        {/* <Row label="Nghỉ ốm" value={`${n(previewPayroll.sick_leave_days)} ngày`} /> */}
                        <Row
                          label="Nghỉ không lương"
                          value={`${n(previewPayroll.unpaid_leave_days)} ngày`}
                        />
                        <Divider sx={{ my: 1 }} />
                        <Row
                          label="Ngày công hiệu lực"
                          value={`${n(previewPayroll.effective_work_days)} / ${n(
                            previewPayroll.work_days_per_month
                          )}`}
                        />
                        <Row label="Đơn giá ngày" value={money(previewPayroll.daily_rate)} />
                        <Row label="Lương theo ngày công" value={money(previewPayroll.salary_by_days)} />
                      </CardBlock>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <CardBlock title="Tiền lương">
                        {/* ✅ tiền cơ bản + tiền lương dùng PREVIEW */}
                        <Row label="Lương cơ bản" value={money(previewPayroll.salary_base)} />

                        {/* ✅ các khoản +/- dùng BASE */}
                        <Row label="Tăng ca (tiền)" value={money(adjustPayroll?.overtime_amount)} />
                        <Row label="Thưởng" value={money(adjustPayroll?.bonus_amount)} />
                        <Row label="Phụ cấp" value={money(adjustPayroll?.allowance_amount)} />
                        <Row label="Phạt" value={money(adjustPayroll?.penalty_amount)} />
                        <Divider sx={{ my: 1 }} />
                        <Row
                          label="Ứng lương (đã duyệt)"
                          value={money(adjustPayroll?.advance_approved_amount)}
                        />
                        <Row
                          label="Ứng lương (chờ duyệt)"
                          value={money(adjustPayroll?.advance_pending_amount)}
                        />
                        <Divider sx={{ my: 1 }} />

                        <Row label="Lương hiện tại" value={money(previewPayroll.gross_amount)} />
                        <Row label="Lương thực tế" value={money(calc.netExpected)} />
                      </CardBlock>
                    </Grid>
                  </Grid>

                  <Divider />

                  <CardBlock
                    title="Điều chỉnh lương (Admin)"
                    subtitle={
                      canEdit
                        ? isClosed
                          ? 'Tháng đã chốt: đang khóa chỉnh sửa'
                          : 'Nhập số tiền muốn cộng/trừ'
                        : 'Bạn không có quyền chỉnh'
                    }
                  >
                    <Grid container spacing={2} mt={1}>
                      <Grid item xs={12} md={4}>
                        <FormControl fullWidth disabled={!canEdit || isClosed}>
                          <InputLabel>Loại điều chỉnh</InputLabel>
                          <Select
                            value={adjustForm.action_type}
                            label="Loại điều chỉnh"
                            onChange={(e) =>
                              setAdjustForm((p) => ({
                                ...p,
                                action_type: e.target.value as any,
                              }))
                            }
                          >
                            <MenuItem value="SALARY_ADJUST">Lương cơ bản</MenuItem>
                            <MenuItem value="OT_ADJUST">Tăng ca</MenuItem>
                            <MenuItem value="BONUS">Thưởng</MenuItem>
                            <MenuItem value="ALLOWANCE">Phụ cấp</MenuItem>
                            <MenuItem value="DEDUCTION">Phạt</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>

                      <Grid item xs={12} md={3}>
                        <TextField
                          label="Số tiền"
                          fullWidth
                          type="number"
                          disabled={!canEdit || isClosed}
                          value={adjustForm.amount}
                          onChange={(e) => setAdjustForm((p) => ({ ...p, amount: e.target.value }))}
                          helperText="Nhập số tiền muốn +/-"
                        />
                      </Grid>

                      <Grid item xs={12} md={2}>
                        <FormControl fullWidth disabled={!canEdit || isClosed}>
                          <InputLabel>Hành động</InputLabel>
                          <Select
                            value={adjustForm.direction}
                            label="Hành động"
                            onChange={(e) =>
                              setAdjustForm((p) => ({
                                ...p,
                                direction: Number(e.target.value),
                              }))
                            }
                          >
                            <MenuItem value={1}>Cộng (+)</MenuItem>
                            <MenuItem value={-1}>Trừ (-)</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>

                      <Grid item xs={12} md={3}>
                        <TextField
                          label="Lý do"
                          fullWidth
                          disabled={!canEdit || isClosed}
                          value={adjustForm.reason}
                          onChange={(e) => setAdjustForm((p) => ({ ...p, reason: e.target.value }))}
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <Stack direction="row" spacing={2} justifyContent="flex-end">
                          <Button
                            variant="contained"
                            onClick={onSubmitAdjustment}
                            disabled={!canEdit || isClosed || saving}
                          >
                            Ghi nhận điều chỉnh
                          </Button>
                        </Stack>
                      </Grid>
                    </Grid>

                    <Alert severity="info" sx={{ mt: 2 }}>
                      <strong>Ví dụ:</strong> Muốn trừ 50,000đ phụ cấp → Chọn "Phụ cấp", nhập 50000,
                      chọn "Trừ (-)". <br />
                      Muốn cộng 100,000đ thưởng → Chọn "Thưởng", nhập 100000, chọn "Cộng (+)".
                    </Alert>
                  </CardBlock>
                </Stack>
              )}
            </TabPanel>

            {/* TAB 4: Logs */}
            {isAdmin ? (
              <TabPanel value={tab} index={4}>
                {logsLoading ? (
                  <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
                    <CircularProgress />
                  </Stack>
                ) : (
                  <>
                    <CardBlock
                      title="Tổng hợp điều chỉnh (Admin)"
                      subtitle="Cộng dồn từ logs trong tháng"
                    >
                      <Grid container spacing={1} mt={0.5}>
                        <Grid item xs={12} md={3}>
                          <MiniStat label="Tác động ròng" value={money(logSum.totalDeltaNet)} />
                        </Grid>
                        <Grid item xs={12} md={9}>
                          <Stack direction="row" spacing={1} flexWrap="wrap">
                            {Object.entries(logSum.byType).map(([k, v]) => (
                              <Chip
                                key={k}
                                label={`${logTypeLabel(k)}: ${money(v)}`}
                                size="small"
                                variant="outlined"
                                sx={{ mb: 1 }}
                              />
                            ))}
                          </Stack>
                        </Grid>
                      </Grid>
                    </CardBlock>

                    <Divider sx={{ my: 2 }} />

                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell width={170}>Thời gian</TableCell>
                          <TableCell width={180}>Loại</TableCell>
                          <TableCell width={140} align="right">
                            Số tiền
                          </TableCell>
                          <TableCell width={140} align="right">
                            Trước
                          </TableCell>
                          <TableCell width={140} align="right">
                            Sau
                          </TableCell>
                          <TableCell width={180}>Người chỉnh</TableCell>
                          <TableCell>Lý do</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {logs.map((l) => (
                          <TableRow key={l.id} hover>
                            <TableCell>{fmtTime(l.created_at || null)}</TableCell>
                            <TableCell>{logTypeLabel(l.action_type)}</TableCell>
                            <TableCell align="right">{money(l.amount)}</TableCell>
                            <TableCell align="right">{money(l.before_value)}</TableCell>
                            <TableCell align="right">{money(l.after_value)}</TableCell>
                            <TableCell>
                              {l.created_by_user?.full_name ||
                                l.created_by_user?.username ||
                                l.created_by ||
                                '-'}
                            </TableCell>
                            <TableCell>{l.reason || '-'}</TableCell>
                          </TableRow>
                        ))}
                        {logs.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                              Chưa có lịch sử thay đổi trong tháng
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </>
                )}
              </TabPanel>
            ) : null}
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Stack direction="row" spacing={1} sx={{ width: '100%' }} justifyContent="space-between">
          <Stack direction="row" spacing={1}>
            {canEdit && !isClosed && (
              <Button color="warning" variant="contained" onClick={onCloseAttendance}>
                Chốt chấm công (nhân viên)
              </Button>
            )}
            {canEdit && isClosed && (
              <Button color="inherit" variant="outlined" onClick={onReopenAttendance}>
                Mở chốt
              </Button>
            )}
          </Stack>

          <Button onClick={onClose} variant="contained">
            Đóng
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}

/** UI helpers */
function CardBlock({ title, subtitle, children }: any) {
  return (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}>
      <Typography variant="subtitle1">{title}</Typography>
      {subtitle ? (
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      ) : null}
      <Box sx={{ mt: 1 }}>{children}</Box>
    </Box>
  );
}

function Row({ label, value }: { label: string; value: any }) {
  return (
    <Stack direction="row" justifyContent="space-between" sx={{ py: 0.5 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Stack>
  );
}

function MiniStat({ label, value, sub }: { label: string; value: any; sub?: string }) {
  return (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1.25 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="subtitle2" sx={{ lineHeight: 1.2 }}>
        {value}
      </Typography>
      {sub ? (
        <Typography variant="caption" color="text.secondary">
          {sub}
        </Typography>
      ) : null}
    </Box>
  );
}
