// src/sections/leave/leave-reject-dialog.tsx
import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

type Props = {
  open: boolean;
  onClose: VoidFunction;
  onSubmit: (note: string) => Promise<void>;
  requestId?: number | null;
};

export default function LeaveRejectDialog({ open, onClose, onSubmit, requestId }: Props) {
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) setNote('');
  }, [open]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit(note.trim());
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Từ chối đơn nghỉ</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Đơn ID: <b>{requestId ?? '-'}</b>
          </Typography>

          <TextField
            label="Lý do từ chối"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            multiline
            minRows={3}
            placeholder="Nhập lý do (tuỳ chọn)"
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Đóng
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
          Từ chối
        </Button>
      </DialogActions>
    </Dialog>
  );
}
