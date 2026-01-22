/* eslint-disable react/jsx-no-bind */
import { useMemo, useState } from 'react';
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
import { useSnackbar } from 'src/components/snackbar';
import { adjustFund, type FundAdjustPayload, type FundRow } from 'src/api/funds';
import { formatMoney, parseMoneyToNumber } from 'src/utils/format-number';

type Props = {
  open: boolean;
  onClose: () => void;
  fund: FundRow | null;
  direction: 'IN' | 'OUT';
  onDone: () => Promise<void>;
};

export default function FundAdjustDialog({ open, onClose, fund, direction, onDone }: Props) {
  const { enqueueSnackbar } = useSnackbar();
  const title = useMemo(
    () => (direction === 'IN' ? 'Nạp tiền vào quỹ' : 'Chi tiền từ quỹ'),
    [direction]
  );

  const [amount, setAmount] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!fund?.id) return;
    if (!note.trim()) {
      enqueueSnackbar('Vui lòng nhập note', { variant: 'warning' });
      return;
    }
    const payload: FundAdjustPayload = { direction, amount, note };
    setLoading(true);
    try {
      await adjustFund(fund.id, payload);
      enqueueSnackbar('Ghi sổ thành công', { variant: 'success' });
      onClose();
      setAmount('');
      setNote('');
      await onDone();
    } catch (e: any) {
      enqueueSnackbar(e?.message || 'Adjust failed', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            Quỹ: <b>{fund?.name}</b> — Số dư hiện tại: <b>{String(fund?.balance ?? '-')}</b>
          </Typography>

          <TextField
            label="Quỹ cơ bản (VND)"
            value={formatMoney(Number(amount))}
            onChange={(e) => {
              const num = parseMoneyToNumber(e.target.value);
              setAmount(`${num}`);
            }}
            inputProps={{ inputMode: 'numeric' }} // bật bàn phím số trên mobile
            helperText="VD: 10,000,000"
            fullWidth
          />

          <TextField
            label="Note (bắt buộc)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            fullWidth
            multiline
            minRows={2}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose}>
          Hủy
        </Button>
        <Button disabled={loading} variant="contained" onClick={submit}>
          Xác nhận
        </Button>
      </DialogActions>
    </Dialog>
  );
}
