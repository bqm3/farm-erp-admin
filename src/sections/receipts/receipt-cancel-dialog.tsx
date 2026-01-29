// src/sections/receipt/receipt-cancel-dialog.tsx
import * as React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
} from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';

type Props = {
  open: boolean;
  receiptCode?: string;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void> | void;
};

export default function ReceiptCancelDialog({
  open,
  receiptCode,
  loading = false,
  onClose,
  onSubmit,
}: Props) {
  const [reason, setReason] = React.useState('');
  const [touched, setTouched] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    // reset mỗi lần mở
    setReason('');
    setTouched(false);
  }, [open]);

  const reasonTrim = reason.trim();
  const error = touched && !reasonTrim;

  const handleSubmit = async () => {
    setTouched(true);
    if (!reasonTrim) return;
    await onSubmit(reasonTrim);
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>Huỷ phiếu</DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
          {receiptCode ? (
            <>
              Bạn đang huỷ phiếu <b>{receiptCode}</b>. Thao tác này sẽ hoàn tác dữ liệu liên quan.
            </>
          ) : (
            <>Thao tác này sẽ hoàn tác dữ liệu liên quan.</>
          )}
        </Typography>

        <TextField
          autoFocus
          fullWidth
          label="Lý do huỷ (bắt buộc)"
          placeholder="Ví dụ: Nhập sai số lượng / nhầm chu kỳ / sai đối tác..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          onBlur={() => setTouched(true)}
          multiline
          minRows={3}
          error={error}
          helperText={error ? 'Vui lòng nhập lý do huỷ.' : ' '}
          disabled={loading}
          onKeyDown={(e) => {
            // Ctrl+Enter để submit nhanh
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Đóng
        </Button>
        <LoadingButton
          variant="contained"
          color="error"
          loading={loading}
          onClick={handleSubmit}
          disabled={!reasonTrim}
        >
          Xác nhận huỷ
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
