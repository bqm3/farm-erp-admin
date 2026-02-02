import { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Stack, CircularProgress
} from '@mui/material';
import { useSnackbar } from 'src/components/snackbar';
import { cancelHelpCheckIn } from 'src/api/attendance';

type Props = {
  open: boolean;
  onClose: () => void;
  attendanceId?: number | null;
  onSuccess?: () => void;
};

export default function AttendanceCancelHelpDialog({ open, onClose, attendanceId, onSuccess }: Props) {
  const { enqueueSnackbar } = useSnackbar();
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setReason('');
      setSaving(false);
    }
  }, [open]);

  const canSubmit = Boolean(attendanceId) && reason.trim().length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) {
      enqueueSnackbar('Vui lòng nhập lý do huỷ!', { variant: 'warning' });
      return;
    }
    setSaving(true);
    try {
      await cancelHelpCheckIn({ attendance_id: Number(attendanceId), reason: reason.trim() });
      enqueueSnackbar('Huỷ chấm công hộ thành công!', { variant: 'success' });
      onClose();
      onSuccess?.();
    } catch (err: any) {
      enqueueSnackbar(err?.message || 'Huỷ thất bại!', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Huỷ chấm công hộ</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            label="Lý do huỷ (bắt buộc)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            multiline
            minRows={3}
            placeholder="VD: chấm nhầm ngày / nhầm nhân viên..."
            autoFocus
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit" disabled={saving}>Đóng</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!canSubmit || saving}
          startIcon={saving ? <CircularProgress size={18} /> : undefined}
        >
          Xác nhận huỷ
        </Button>
      </DialogActions>
    </Dialog>
  );
}
