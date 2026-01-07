// src/sections/leave/leave-balance-edit-dialog.tsx
import { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, TextField, Typography } from '@mui/material';
import type { LeaveBalanceRow } from 'src/api/leave';

type Props = {
  open: boolean;
  onClose: VoidFunction;
  row?: LeaveBalanceRow | null;
  onSubmit: (totalDays: number) => Promise<void>;
};

export default function LeaveBalanceEditDialog({ open, onClose, row, onSubmit }: Props) {
  const [totalDays, setTotalDays] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) setTotalDays(Number(row?.total_days || 0));
  }, [open, row]);

  const handleSave = async () => {
    setSubmitting(true);
    try {
      await onSubmit(Number(totalDays));
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Cập nhật phép năm</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Nhân viên: <b>{row?.employee?.full_name || row?.employee?.email || row?.employee?.code || `#${row?.employee_id}`}</b> — Năm: <b>{row?.year}</b>
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Sử dụng: <b>{row?.used_days ?? 0}</b> | Còn hiện tại: <b>{row?.remaining_days ?? 0}</b>
          </Typography>

          <TextField
            type="number"
            label="Tổng ngày phép"
            value={totalDays}
            onChange={(e) => setTotalDays(Number(e.target.value))}
            inputProps={{ min: 0 }}
            helperText="Hệ thống sẽ tự tính phép tồn = tổng - sử dụng"
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>Đóng</Button>
        <Button variant="contained" onClick={handleSave} disabled={submitting}>Lưu</Button>
      </DialogActions>
    </Dialog>
  );
}
