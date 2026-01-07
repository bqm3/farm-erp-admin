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
} from 'src/api/attendance';

type Props = {
  open: boolean;
  onClose: VoidFunction;
  employeeId?: number | null;
  month: number;
  year: number;
};

function statusChip(status: string) {
  if (status === 'PRESENT') return <Chip label="Có mặt" color="success" size="small" />;
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

function fmtDate(d?: string | null) {
  if (!d) return '-';
  try {
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString('vi-VN');
  } catch {
    return d || '-';
  }
}

function typeLabel(t?: string) {
  if (t === 'PAID') return 'Nghỉ phép (có lương)';
  if (t === 'UNPAID') return 'Nghỉ không lương';
  if (t === 'SICK') return 'Nghỉ ốm';
  return t || '-';
}

function TabPanel(props: { value: number; index: number; children: any }) {
  const { value, index, children } = props;
  if (value !== index) return null;
  return <Box sx={{ pt: 2 }}>{children}</Box>;
}

export default function AttendanceDetailDialog({ open, onClose, employeeId, month, year }: Props) {
  const { enqueueSnackbar } = useSnackbar();

  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState(0);

  const [employee, setEmployee] = useState<any>(null);
  const [days, setDays] = useState<AttendanceDailyItem[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequestRow[]>([]);
  const [advances, setAdvances] = useState<SalaryAdvanceRow[]>([]);
  const [payroll, setPayroll] = useState<PayrollSummary | any>(null);
  const [closing, setClosing] = useState<any>(null);

  const [canEdit, setCanEdit] = useState<boolean>(false);

  const [edit, setEdit] = useState({
    salary_base: 0,
    overtime_amount: 0,
    bonus_amount: 0,
    allowance_amount: 0,
    penalty_amount: 0,
  });
  const [saving, setSaving] = useState(false);

  const title = useMemo(() => {
    const name = employee?.full_name || employee?.username || employeeId || '';
    return `Chi tiết tháng ${month}/${year} - ${name}`;
  }, [employee?.full_name, employee?.username, employeeId, month, year]);

  // ✅ Đã chốt thật sự khi có closed_at
  const isClosed = Boolean(closing?.closed_at);

  const loadDetail = useCallback(async () => {
    if (!open || !employeeId) return;
    try {
      setLoading(true);
      const res = await getUserMonthDetail(employeeId, month, year);

      setEmployee(res.data.employee);
      setDays(res.data.days || []);
      setLeaves(res.data.leave_requests || []);
      setAdvances(res.data.salary_advances || []);
      setPayroll(res.data.payroll || null);
      setClosing(res.data.closing || null);

      setCanEdit(Boolean(res.data.can_edit));

      const p = res.data.payroll;
      if (p) {
        setEdit({
          salary_base: n(p.salary_base, 0),
          overtime_amount: n(p.overtime_amount, 0),
          bonus_amount: n(p.bonus_amount, 0),
          allowance_amount: n(p.allowance_amount, 0),
          penalty_amount: n(p.penalty_amount, 0),
        });
      }
    } catch (e: any) {
      enqueueSnackbar(e?.message || 'Lỗi tải chi tiết tháng', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [employeeId, enqueueSnackbar, month, open, year]);

  useEffect(() => {
    setTab(0);
    if (open) loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, employeeId, month, year]);

  const onSavePayroll = useCallback(async () => {
    if (!employeeId) return;
    try {
      setSaving(true);
      const res = await updateUserPayroll(employeeId, {
        month,
        year,
        salary_base: n(edit.salary_base, 0),
        overtime_amount: n(edit.overtime_amount, 0),
        bonus_amount: n(edit.bonus_amount, 0),
        allowance_amount: n(edit.allowance_amount, 0),
        penalty_amount: n(edit.penalty_amount, 0),
      });

      if (res?.ok) {
        enqueueSnackbar(res?.message || 'Đã cập nhật bảng lương tháng', { variant: 'success' });
        await loadDetail();
      } else {
        enqueueSnackbar(res?.message || 'Cập nhật thất bại', { variant: 'error' });
      }
    } catch (e: any) {
      enqueueSnackbar(e?.message || 'Lỗi cập nhật bảng lương', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  }, [employeeId, edit, enqueueSnackbar, loadDetail, month, year]);

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

  // ✅ Preview đúng công thức prorate (theo effective_work_days)
  const computedPreview = useMemo(() => {
    if (!payroll) return null;

    const salaryBase = n(edit.salary_base, payroll.salary_base);
    const otAmount = n(edit.overtime_amount, payroll.overtime_amount);
    const bonus = n(edit.bonus_amount, payroll.bonus_amount);
    const allowance = n(edit.allowance_amount, payroll.allowance_amount);
    const penalty = n(edit.penalty_amount, payroll.penalty_amount);

    const wd = n(payroll.work_days_per_month, 0);
    const eff = n(payroll.effective_work_days, 0);
    const dailyRate = wd > 0 ? salaryBase / wd : 0;
    const salaryByDays = dailyRate * eff;

    const gross = salaryByDays + otAmount + bonus + allowance - penalty;
    const net = gross - n(payroll.advance_approved_amount, 0);

    return { dailyRate, salaryByDays, gross, net };
  }, [edit, payroll]);

  // ✅ Cảnh báo backend chưa tính effective_work_days
  const effectiveWarn = useMemo(() => {
    if (!payroll) return null;
    if (n(payroll.total_checkin_days, 0) > 0 && n(payroll.effective_work_days, 0) === 0) {
      return 'Đang có check-in nhưng effective_work_days = 0. Backend cần tính effective_work_days (PRESENT/LATE + nghỉ phép có lương).';
    }
    return null;
  }, [payroll]);

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
            {/* Header summary */}
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
              <Box>
                <Typography variant="subtitle1">{employee?.full_name || '-'}</Typography>
                <Typography variant="body2" color="text.secondary">
                  @{employee?.username || '-'} • Lương cơ bản: {money(employee?.salary_base)}
                </Typography>
              </Box>

              <Box flexGrow={1} />

              {isClosed ? (
                <Chip
                  label={`Đã chốt (${closing?.closed_at ? new Date(closing.closed_at).toLocaleString() : ''})`}
                  color="success"
                />
              ) : (
                <Chip label="Chưa chốt" color="warning" />
              )}
            </Stack>

            {/* ✅ Mini summary payroll */}
            {payroll ? (
              <Grid container spacing={1}>
                <Grid item xs={12} md={3}>
                  <MiniStat label="Ngày công hiệu lực" value={`${n(payroll.effective_work_days)}/${n(payroll.work_days_per_month)}`} />
                </Grid>
                <Grid item xs={12} md={3}>
                  <MiniStat
                    label="Nghỉ có lương"
                    value={`${n(payroll.paid_leave_days) + n(payroll.sick_leave_days)} ngày`}
                    // sub={`PAID ${n(payroll.paid_leave_days)} • SICK ${n(payroll.sick_leave_days)}`}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <MiniStat label="Đơn giá ngày" value={money(payroll.daily_rate)} />
                </Grid>
                <Grid item xs={12} md={3}>
                  <MiniStat label="Lương theo ngày công" value={money(payroll.salary_by_days)} />
                </Grid>
              </Grid>
            ) : null}

            {effectiveWarn ? (
              <Alert severity="warning">{effectiveWarn}</Alert>
            ) : null}

            <Divider />

            <Tabs value={tab} onChange={(_, v) => setTab(v)}>
              <Tab label="Chấm công theo ngày" />
              <Tab label={`Đơn nghỉ (${leaves.length})`} />
              <Tab label={`Ứng lương (${advances.length})`} />
              <Tab label="Lương & Tổng hợp" />
            </Tabs>

            {/* TAB Chấm công theo ngày */}
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
                    <TableCell width={120} align="right">Tăng ca (giờ)</TableCell>
                    <TableCell width={160} align="right">Tăng ca (tiền)</TableCell>
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

            {/* TAB đơn nghỉ */}
            <TabPanel value={tab} index={1}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell width={200}>Loại</TableCell>
                    <TableCell width={130}>Từ</TableCell>
                    <TableCell width={130}>Đến</TableCell>
                    <TableCell width={120} align="right">Số ngày</TableCell>
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

            {/* TAB 2 */}
            <TabPanel value={tab} index={2}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell width={200}>Ngày yêu cầu</TableCell>
                    <TableCell width={160} align="right">Số tiền</TableCell>
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

            {/* TAB 3 */}
            <TabPanel value={tab} index={3}>
              {!payroll ? (
                <Alert severity="warning">Chưa có dữ liệu tổng hợp lương.</Alert>
              ) : (
                <Stack spacing={2}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <CardBlock title="Ngày công & thống kê">
                        <Row label="Ngày check-in" value={`${n(payroll.total_checkin_days)}`} />
                        <Row label="Có mặt" value={`${n(payroll.present_days)}`} />
                        <Row label="Đi trễ" value={`${n(payroll.late_days)}`} />
                        <Divider sx={{ my: 1 }} />
                        <Row label="Nghỉ có lương (PAID)" value={`${n(payroll.paid_leave_days)} ngày`} />
                        <Row label="Nghỉ ốm (SICK)" value={`${n(payroll.sick_leave_days)} ngày`} />
                        <Row label="Nghỉ không lương (UNPAID)" value={`${n(payroll.unpaid_leave_days)} ngày`} />
                        <Divider sx={{ my: 1 }} />
                        <Row label="Ngày công hiệu lực" value={`${n(payroll.effective_work_days)} / ${n(payroll.work_days_per_month)}`} />
                        <Row label="Đơn giá ngày" value={money(payroll.daily_rate)} />
                        <Row label="Lương theo ngày công" value={money(payroll.salary_by_days)} />
                      </CardBlock>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <CardBlock title="Tiền lương">
                        <Row label="Tăng ca (tiền)" value={money(payroll.overtime_amount)} />
                        <Row label="Thưởng" value={money(payroll.bonus_amount)} />
                        <Row label="Phụ cấp" value={money(payroll.allowance_amount)} />
                        <Row label="Phạt" value={money(payroll.penalty_amount)} />
                        <Divider sx={{ my: 1 }} />
                        <Row label="Ứng lương (đã duyệt)" value={money(payroll.advance_approved_amount)} />
                        <Row label="Ứng lương (chờ duyệt)" value={money(payroll.advance_pending_amount)} />
                        <Divider sx={{ my: 1 }} />
                        <Row label="Gross (hệ thống)" value={money(payroll.gross_amount)} />
                        <Row label="Net (hệ thống)" value={money(payroll.net_amount)} />
                        <Divider sx={{ my: 1 }} />
                        <Row label="Gross (hiện tại)" value={computedPreview ? money(computedPreview.gross) : '-'} />
                        <Row label="Net (hiện tại)" value={computedPreview ? money(computedPreview.net) : '-'} />
                      </CardBlock>
                    </Grid>
                  </Grid>

                  <CardBlock title="Công thức tính (preview)">
                    <Typography variant="body2" color="text.secondary">
                      Lương hiện tại = (Lương cơ bản / ngày làm việc mỗi tháng) * ngày làm việc thực tế
                      <br />
                      Lương thực tế = Lương cơ bản + tăng ca + thưởng + phụ cấp - phạt - ứng lương đã duyệt
                    </Typography>
                  </CardBlock>

                  <Divider />

                  <CardBlock
                    title="Chỉnh sửa (Admin)"
                    subtitle={
                      canEdit
                        ? isClosed
                          ? 'Tháng đã chốt: đang khóa chỉnh sửa'
                          : 'Có thể chỉnh'
                        : 'Bạn không có quyền chỉnh'
                    }
                  >
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <TextField
                          label="Lương cơ bản"
                          fullWidth
                          disabled={!canEdit || isClosed}
                          value={edit.salary_base}
                          onChange={(e) => setEdit((p) => ({ ...p, salary_base: n(e.target.value) }))}
                        />
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <TextField
                          label="Tăng ca (tiền)"
                          fullWidth
                          disabled={!canEdit || isClosed}
                          value={edit.overtime_amount}
                          onChange={(e) => setEdit((p) => ({ ...p, overtime_amount: n(e.target.value) }))}
                        />
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <TextField
                          label="Thưởng"
                          fullWidth
                          disabled={!canEdit || isClosed}
                          value={edit.bonus_amount}
                          onChange={(e) => setEdit((p) => ({ ...p, bonus_amount: n(e.target.value) }))}
                        />
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <TextField
                          label="Phụ cấp"
                          fullWidth
                          disabled={!canEdit || isClosed}
                          value={edit.allowance_amount}
                          onChange={(e) => setEdit((p) => ({ ...p, allowance_amount: n(e.target.value) }))}
                        />
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <TextField
                          label="Phạt"
                          fullWidth
                          disabled={!canEdit || isClosed}
                          value={edit.penalty_amount}
                          onChange={(e) => setEdit((p) => ({ ...p, penalty_amount: n(e.target.value) }))}
                        />
                      </Grid>

                      <Grid item xs={12} md={4} />

                      <Grid item xs={12}>
                        <Stack direction="row" spacing={2} justifyContent="flex-end">
                          <Button variant="contained" onClick={onSavePayroll} disabled={!canEdit || isClosed || saving}>
                            Lưu thay đổi
                          </Button>
                        </Stack>
                      </Grid>
                    </Grid>
                  </CardBlock>
                </Stack>
              )}
            </TabPanel>
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

// ✅ NEW: nhỏ gọn cho header
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
