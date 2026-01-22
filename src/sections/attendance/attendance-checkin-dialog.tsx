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
import { helpCheckInAttendance, type UserOption } from 'src/api/attendance';

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
  const [date, setDate] = useState<string>(''); // YYYY-MM-DD
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setEmployeeId(defaultEmployeeId ?? '');
      setDate(toYmd(new Date())); // mặc định hôm nay
      setNote('');
    }
  }, [open, defaultEmployeeId]);

  const selectedUser = useMemo(
    () => users.find((u) => u.id === Number(employeeId)),
    [users, employeeId]
  );

  const canSubmit = Boolean(employeeId) && Boolean(date) && note.trim().length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) {
      enqueueSnackbar('Vui lòng chọn nhân viên, chọn ngày và nhập lý do (note)!', { variant: 'warning' });
      return;
    }

    setSaving(true);
    try {
      await helpCheckInAttendance({
        employee_id: Number(employeeId),
        date,
        note: note.trim(),
      });
      enqueueSnackbar('Chấm công hộ thành công!', { variant: 'success' });
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
      <DialogTitle>Chấm công hộ</DialogTitle>

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

          <TextField
            fullWidth
            label="Ngày chấm công"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />

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
