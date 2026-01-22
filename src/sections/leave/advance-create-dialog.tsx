/* eslint-disable arrow-body-style */
import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  TextField,
  Typography,
  Alert,
} from '@mui/material';
import { createAdvance } from 'src/api/advance';
import { useSnackbar } from 'src/components/snackbar';
import { formatMoney, parseMoneyToNumber } from 'src/utils/format-number';

type Props = {
  open: boolean;
  onClose: VoidFunction;
  onCreated?: VoidFunction;
};

function toISODateInput(d = new Date()) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function AdvanceCreateDialog({ open, onClose, onCreated }: Props) {
  const { enqueueSnackbar } = useSnackbar();

  const [receiptDate, setReceiptDate] = useState(toISODateInput());
  const [amount, setAmount] = useState<number>(0);
  const [reason, setReason] = useState('Ứng lương');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>('');

  useEffect(() => {
    if (!open) return;
    setReceiptDate(toISODateInput());
    setAmount(0);
    setReason('Ứng lương');
    setErr('');
    setLoading(false);
  }, [open]);

  const canSubmit = useMemo(() => {
    return receiptDate && Number.isFinite(Number(amount)) && Number(amount) > 0 && !loading;
  }, [receiptDate, amount, loading]);

  const onSubmit = async () => {
    try {
      setErr('');
      setLoading(true);

      const res = await createAdvance({
        request_date: new Date(receiptDate).toISOString(),
        amount: Number(amount),
        reason: reason?.trim() || 'Ứng lương',
      });

      if (!res.ok) throw new Error(res.message || 'Tạo phiếu thất bại');

      enqueueSnackbar('Đã tạo phiếu ứng lương', { variant: 'success' });
      onClose();
      onCreated?.();
    } catch (e: any) {
      setErr(e.message || 'Tạo phiếu thất bại');
      enqueueSnackbar(e.message || 'Tạo phiếu thất bại', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Tạo phiếu ứng lương</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {err && <Alert severity="error">{err}</Alert>}

          <TextField
            label="Ngày ứng"
            type="date"
            value={receiptDate}
            onChange={(e) => setReceiptDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />

          <TextField
            label="Số tiền"
            value={formatMoney(amount)}
            onChange={(e) => setAmount(parseMoneyToNumber(e.target.value))}
            inputProps={{ inputMode: 'numeric' }}
            fullWidth
          />

          <TextField
            label="Lý do"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            fullWidth
            multiline
            minRows={2}
          />

          <Typography variant="body2" color="text.secondary">
            Phiếu sẽ ở trạng thái <b>Chờ duyệt</b>.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Huỷ
        </Button>
        <Button variant="contained" onClick={onSubmit} disabled={!canSubmit}>
          Tạo phiếu
        </Button>
      </DialogActions>
    </Dialog>
  );
}
