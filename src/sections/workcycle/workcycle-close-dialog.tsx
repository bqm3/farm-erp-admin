// src/sections/workcycle/workcycle-close-dialog.tsx
import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
  Alert,
  CircularProgress,
} from '@mui/material';
import { closeWorkCycle } from 'src/api/workcycle';
import { useSnackbar } from 'src/components/snackbar';

type Props = {
  open: boolean;
  onClose: () => void;
  workCycleId: number | string | any;
  onClosed?: () => void; // callback reload detail
};

export default function WorkCycleCloseDialog({ open, onClose, workCycleId, onClosed }: Props) {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleCloseCycle = async () => {
    try {
      setErr(null);
      setLoading(true);

      const res = await closeWorkCycle(workCycleId);
      if (!res.ok) throw new Error(res.message || 'Đóng work cycle thất bại');

      enqueueSnackbar('Đã đóng work cycle', { variant: 'success' });
      onClose();
      onClosed?.();
    } catch (e: any) {
      setErr(e?.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Đóng Work Cycle</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Alert severity="warning">
            Khi đóng Work Cycle, hệ thống sẽ chốt số liệu (snapshot). Không nên đóng nếu còn phiếu DRAFT/SUBMITTED.
          </Alert>

          {err && <Alert severity="error">{err}</Alert>}

          <Typography variant="body2">
            Bạn chắc chắn muốn đóng work cycle <b>#{workCycleId}</b>?
          </Typography>

          {loading && (
            <Stack direction="row" spacing={1} alignItems="center">
              <CircularProgress size={18} />
              <Typography variant="body2">Đang đóng...</Typography>
            </Stack>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Huỷ
        </Button>
        <Button variant="contained" color="error" onClick={handleCloseCycle} disabled={loading}>
          Xác nhận đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
}
