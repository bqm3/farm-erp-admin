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
  MenuItem,
} from '@mui/material';
import { createAdvance } from 'src/api/advance';
import { useSnackbar } from 'src/components/snackbar';
import { formatMoney, parseMoneyToNumber } from 'src/utils/format-number';

// ✅ thêm api list nhân viên
import { fetchUsersForChat } from 'src/api/user';

type Mode = 'SELF' | 'FOR_OTHER';

type Props = {
  open: boolean;
  onClose: VoidFunction;
  onCreated?: VoidFunction;
  mode?: Mode; // ✅
};

function toISODateInput(d = new Date()) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function AdvanceCreateDialog({ open, onClose, onCreated, mode = 'SELF' }: Props) {
  const { enqueueSnackbar } = useSnackbar();

  const [receiptDate, setReceiptDate] = useState(toISODateInput());
  const [amount, setAmount] = useState<number>(0);
  const [reason, setReason] = useState('Ứng lương');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>('');

  // ✅ chỉ dùng khi mode FOR_OTHER
  const [employees, setEmployees] = useState<any[]>([]);
  const [employeeId, setEmployeeId] = useState<string>('');
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  useEffect(() => {
    if (!open) return;

    setReceiptDate(toISODateInput());
    setAmount(0);
    setReason('Ứng lương');
    setErr('');
    setLoading(false);

    // reset chọn nhân viên khi mở dialog tạo hộ
    if (mode === 'FOR_OTHER') {
      setEmployeeId('');
      setEmployees([]);
      setLoadingEmployees(true);

      fetchUsersForChat()
        .then((res) => {
          if (!res) throw new Error('Không tải được danh sách nhân viên');
          setEmployees(res);
        })
        .catch((e: any) => {
          enqueueSnackbar(e.message || 'Không tải được danh sách nhân viên', { variant: 'error' });
        })
        .finally(() => setLoadingEmployees(false));
    }
  }, [open, mode, enqueueSnackbar]);

  const canSubmit = useMemo(() => {
    const baseOk = receiptDate && Number.isFinite(Number(amount)) && Number(amount) > 0 && !loading;

    if (mode === 'FOR_OTHER') {
      return baseOk && !!employeeId && !loadingEmployees;
    }
    return baseOk;
  }, [receiptDate, amount, loading, mode, employeeId, loadingEmployees]);

  const onSubmit = async () => {
    try {
      setErr('');
      setLoading(true);

      const payload: any = {
        request_date: new Date(receiptDate).toISOString(),
        amount: Number(amount),
        reason: reason?.trim() || 'Ứng lương',
      };

      // ✅ thêm employee_id khi tạo hộ
      if (mode === 'FOR_OTHER') {
        payload.employee_id = employeeId;
      }

      const res = await createAdvance(payload);
      if (!res.ok) throw new Error(res.message || 'Tạo phiếu thất bại');

      enqueueSnackbar(
        mode === 'FOR_OTHER' ? 'Đã tạo phiếu ứng lương hộ' : 'Đã tạo phiếu ứng lương',
        { variant: 'success' }
      );

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
      <DialogTitle>{mode === 'FOR_OTHER' ? 'Ứng lương hộ' : 'Tạo phiếu ứng lương'}</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {err && <Alert severity="error">{err}</Alert>}

          {/* ✅ chọn nhân viên */}
          {mode === 'FOR_OTHER' && (
            <TextField
              select
              label="Nhân viên"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              fullWidth
              disabled={loadingEmployees}
              helperText={loadingEmployees ? 'Đang tải danh sách...' : ''}
            >
              <MenuItem value="">-- Chọn nhân viên --</MenuItem>
              {employees.map((u) => (
                <MenuItem key={u.id} value={u.id}>
                  {u.full_name}
                  {u.code ? ` (${u.code})` : ''}
                </MenuItem>
              ))}
            </TextField>
          )}

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
          {mode === 'FOR_OTHER' ? 'Tạo phiếu hộ' : 'Tạo phiếu'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
