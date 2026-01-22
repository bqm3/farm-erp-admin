/* eslint-disable consistent-return */
import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  TextField,
  MenuItem,
  Alert,
  Divider,
  Typography,
} from '@mui/material';

import { createLeaveRequest, type LeaveType } from 'src/api/leave';
import axiosInstance from 'src/utils/axios';

type Props = {
  open: boolean;
  onClose: VoidFunction;
  canCreateForOthers?: boolean; // admin/accountant
  onCreated?: VoidFunction;
};

function diffDaysInclusive(from: string, to: string) {
  const a = new Date(from);
  const b = new Date(to);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
  const ms = 24 * 60 * 60 * 1000;
  const aa = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const bb = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return Math.floor((bb - aa) / ms) + 1;
}

function normText(v?: any) {
  return String(v || '').trim().toLowerCase();
}

export default function LeaveCreateDialog({
  open,
  onClose,
  canCreateForOthers = false,
  onCreated,
}: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [leaveType, setLeaveType] = useState<LeaveType>('PAID');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [reason, setReason] = useState('');

  // only for admin/accountant
  const [employeeQ, setEmployeeQ] = useState('');
  const [employees, setEmployees] = useState<any[]>([]);
  const [employeeId, setEmployeeId] = useState<number | ''>('');

  // 0.5 or integer days
  const [totalDays, setTotalDays] = useState<number>(1);

  // range days (info only)
  const rangeDays = useMemo(() => {
    if (!from || !to) return 0;
    return diffDaysInclusive(from, to);
  }, [from, to]);

  const filteredEmployees = useMemo(() => {
    if (!canCreateForOthers) return [];
    const q = normText(employeeQ);
    if (!q) return employees || [];
    return (employees || []).filter((u) => {
      const hay = [
        u?.full_name,
        u?.name,
        u?.email,
        u?.code,
        u?.phone,
        u?.id,
      ]
        .map(normText)
        .join(' ');
      return hay.includes(q);
    });
  }, [employees, employeeQ, canCreateForOthers]);

  useEffect(() => {
    if (!open) return;
    setError(null);
  }, [open]);

  useEffect(() => {
    if (!open || !canCreateForOthers) return;

    let mounted = true;
    (async () => {
      try {
        const res = await axiosInstance.get('/api/users');
        const apiUsers = res.data?.data ?? [];
        if (mounted) setEmployees(apiUsers || []);
      } catch {
        // ignore
      }
    })();

    return () => {
      mounted = false;
    };
  }, [open, canCreateForOthers]);

  // --- helpers: apply rules for half-day ---
  const applyHalfDayRule = useCallback(
    (nextTotalDays: number, nextFrom?: string, nextTo?: string) => {
      // If user selects 0.5, force to_date = from_date, disable to_date editing
      if (nextTotalDays === 0.5) {
        const f = nextFrom ?? from;
        if (f) {
          setTo(f);
        } else if (nextTo) {
          // if no from yet, but have to, align from with to
          setFrom(nextTo);
        }
      }
    },
    [from]
  );

  const reset = () => {
    setLeaveType('PAID');
    setFrom('');
    setTo('');
    setReason('');
    setEmployeeQ('');
    setEmployees([]);
    setEmployeeId('');
    setTotalDays(1);
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleChangeTotalDays = (v: number) => {
    setTotalDays(v);
    setError(null);
    applyHalfDayRule(v);
  };

  const handleChangeFrom = (v: string) => {
    setFrom(v);
    setError(null);
    if (totalDays === 0.5) {
      setTo(v); // keep same day
    }
  };

  const handleChangeTo = (v: string) => {
    if (totalDays === 0.5) return; // locked
    setTo(v);
    setError(null);
  };

  const validate = () => {
    if (!from) throw new Error('Vui lòng chọn Từ ngày');
    if (!to) throw new Error('Vui lòng chọn Đến ngày');

    if (canCreateForOthers && !employeeId) {
      throw new Error('Vui lòng chọn nhân viên');
    }

    if (totalDays === 0.5) {
      if (from !== to) throw new Error('Nghỉ 0.5 ngày thì Từ ngày phải bằng Đến ngày');
      return;
    }

    // totalDays is integer day options; enforce range match so dữ liệu sạch
    const rd = rangeDays;
    if (rd <= 0) throw new Error('Khoảng ngày không hợp lệ');
    if (totalDays !== rd) {
      throw new Error(`Số ngày (${totalDays}) không khớp khoảng chọn (${rd}). Hãy chỉnh lại ngày hoặc số ngày.`);
    }
  };

  const submit = async () => {
    setError(null);
    try {
      validate();
      setSubmitting(true);

      const payload: any = {
        leave_type: leaveType,
        from_date: from,
        to_date: to,
        total_days: totalDays,
        reason: reason?.trim() ? reason.trim() : undefined,
      };

      if (canCreateForOthers) payload.employee_id = employeeId;

      const res = await createLeaveRequest(payload);
      if (!res?.ok) throw new Error(res?.message || 'Tạo đơn thất bại');

      onCreated?.();
      handleClose();
    } catch (e: any) {
      setError(e?.message || 'Tạo đơn thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedEmployeeText = useMemo(() => {
    if (!employeeId) return '';
    const u = (employees || []).find((x) => Number(x?.id) === Number(employeeId));
    if (!u) return `#${employeeId}`;
    return u?.full_name || u?.name || u?.email || `#${u.id}`;
  }, [employeeId, employees]);

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Tạo đơn nghỉ phép</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          {canCreateForOthers && (
            <Stack spacing={1.5}>
              <Typography variant="subtitle2">Nhân viên</Typography>

              <TextField
                label="Tìm nhân viên"
                value={employeeQ}
                onChange={(e) => setEmployeeQ(e.target.value)}
                placeholder="Tên / email / mã / sđt..."
                fullWidth
              />

              <TextField
                label="Chọn nhân viên"
                value={employeeId}
                onChange={(e) => setEmployeeId(Number(e.target.value) || '')}
                select
                fullWidth
                helperText={employeeId ? `Đang chọn: ${selectedEmployeeText}` : ''}
              >
                <MenuItem value="">-- Chọn nhân viên --</MenuItem>
                {filteredEmployees.map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.full_name || u.name || u.email || `#${u.id}`}
                  </MenuItem>
                ))}
              </TextField>

              <Divider />
            </Stack>
          )}

          <Stack spacing={1.5}>
            <Typography variant="subtitle2">Thông tin nghỉ</Typography>

            <TextField
              label="Loại nghỉ"
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value as LeaveType)}
              select
              fullWidth
            >
              <MenuItem value="PAID">Nghỉ phép (có lương)</MenuItem>
              <MenuItem value="UNPAID">Nghỉ không lương</MenuItem>
              <MenuItem value="SICK">Nghỉ ốm</MenuItem>
            </TextField>

            <TextField
              label="Số ngày"
              value={totalDays}
              onChange={(e) => handleChangeTotalDays(Number(e.target.value))}
              select
              fullWidth
              helperText={totalDays === 0.5 ? 'Nửa ngày: hệ thống sẽ tự ép Đến ngày = Từ ngày' : ''}
            >
              <MenuItem value={0.5}>0.5 ngày</MenuItem>
              <MenuItem value={1}>1 ngày</MenuItem>
              <MenuItem value={2}>2 ngày</MenuItem>
              <MenuItem value={3}>3 ngày</MenuItem>
              <MenuItem value={4}>4 ngày</MenuItem>
              <MenuItem value={5}>5 ngày</MenuItem>
            </TextField>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Từ ngày"
                type="date"
                value={from}
                onChange={(e) => handleChangeFrom(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />

              <TextField
                label="Đến ngày"
                type="date"
                value={to}
                onChange={(e) => handleChangeTo(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
                disabled={totalDays === 0.5}
              />
            </Stack>

            <TextField
              label="Số ngày theo khoảng chọn"
              value={rangeDays || 0}
              disabled
              fullWidth
              helperText={
                totalDays === 0.5
                  ? 'Nửa ngày không cần quan tâm khoảng chọn (vì chỉ 1 ngày)'
                  : 'Nếu số ngày không khớp, hãy chỉnh ngày hoặc số ngày'
              }
            />

            <TextField
              label="Lý do"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              multiline
              minRows={3}
              fullWidth
            />
          </Stack>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={submitting}>
          Hủy
        </Button>
        <Button variant="contained" onClick={submit} disabled={submitting}>
          Tạo đơn
        </Button>
      </DialogActions>
    </Dialog>
  );
}
