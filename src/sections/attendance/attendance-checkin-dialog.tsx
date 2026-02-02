import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  TextField,
  MenuItem,
  Typography,
  CircularProgress,
} from '@mui/material';
import { useSnackbar } from 'src/components/snackbar';
import { helpCheckInAttendanceRange, type UserOption } from 'src/api/attendance';

function toYmd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

type Props = {
  open: boolean;
  onClose: () => void;
  users: UserOption[];
  defaultEmployeeId?: number | null;
  onSuccess?: () => void;
};

export default function AttendanceCheckInDialog({
  open,
  onClose,
  users,
  defaultEmployeeId = null,
  onSuccess,
}: Props) {
  const { enqueueSnackbar } = useSnackbar();

  const [employeeId, setEmployeeId] = useState<number | ''>('');
  const [fromDate, setFromDate] = useState<string>(''); // YYYY-MM-DD
  const [toDate, setToDate] = useState<string>('');     // YYYY-MM-DD
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setEmployeeId(defaultEmployeeId ?? '');
      const today = toYmd(new Date());
      setFromDate(today);
      setToDate(today);
      setNote('');
    }
  }, [open, defaultEmployeeId]);

  const selectedUser = useMemo(
    () => users.find((u) => u.id === Number(employeeId)),
    [users, employeeId]
  );

  const canSubmit =
    Boolean(employeeId) &&
    Boolean(fromDate) &&
    Boolean(toDate) &&
    note.trim().length > 0 &&
    fromDate <= toDate; // string YYYY-MM-DD so sánh được

  const handleSubmit = async () => {
    if (!canSubmit) {
      enqueueSnackbar('Vui lòng chọn nhân viên, chọn từ ngày → đến ngày và nhập lý do!', { variant: 'warning' });
      return;
    }

    setSaving(true);
    try {
      const res = await helpCheckInAttendanceRange({
        employee_id: Number(employeeId),
        from_date: fromDate,
        to_date: toDate,
        note: note.trim(),
        // strict: false, // nếu muốn: gặp ngày đã có thì bỏ qua
      });

      enqueueSnackbar(
        `Chấm công hộ thành công: tạo ${res.data.created} ngày, bỏ qua ${res.data.skipped} ngày.`,
        { variant: 'success' }
      );

      onClose();
      onSuccess?.();
    } catch (err: any) {
      enqueueSnackbar(err?.message || 'Chấm công thất bại!', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Chấm công hộ (nhiều ngày)</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            select
            fullWidth
            label="Chọn nhân viên"
            value={employeeId}
            onChange={(e) => setEmployeeId(Number(e.target.value))}
          >
            {users.map((u) => (
              <MenuItem key={u.id} value={u.id}>
                {u.full_name} {u.username ? `(${u.username})` : ''}
              </MenuItem>
            ))}
          </TextField>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              fullWidth
              label="Từ ngày"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="Đến ngày"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              error={Boolean(fromDate && toDate && fromDate > toDate)}
              helperText={fromDate && toDate && fromDate > toDate ? 'Đến ngày phải >= Từ ngày' : ' '}
            />
          </Stack>

          {selectedUser && (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Bạn đang chấm công hộ: <b>{selectedUser.full_name}</b>
            </Typography>
          )}

          <TextField
            fullWidth
            label="Lý do (bắt buộc)"
            placeholder="VD: Nhân viên quên check-in, đi công tác, ... "
            value={note}
            onChange={(e) => setNote(e.target.value)}
            multiline
            minRows={3}
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="inherit" disabled={saving}>
          Đóng
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!canSubmit || saving}
          startIcon={saving ? <CircularProgress size={18} /> : undefined}
        >
          Xác nhận
        </Button>
      </DialogActions>
    </Dialog>
  );
}
