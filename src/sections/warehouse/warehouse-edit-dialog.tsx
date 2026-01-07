import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, TextField, MenuItem } from '@mui/material';
import type { Warehouse, WarehouseStatus } from 'src/api/warehouse';

type Props = {
  open: boolean;
  onClose: VoidFunction;
  onSubmit: (payload: { code: string; name: string; status: WarehouseStatus }) => Promise<void>;
  initial?: Warehouse | null;
};

export default function WarehouseEditDialog({ open, onClose, onSubmit, initial }: Props) {
  const isEdit = Boolean(initial?.id);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<WarehouseStatus>('ACTIVE');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setCode(initial?.code || '');
    setName(initial?.name || '');
    setStatus((initial?.status as WarehouseStatus) || 'ACTIVE');
  }, [initial, open]);

  const disabled = useMemo(() => !code.trim() || !name.trim() || submitting, [code, name, submitting]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit({ code: code.trim(), name: name.trim(), status });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEdit ? 'Cập nhật kho' : 'Tạo kho mới'}</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Mã kho" value={code} onChange={(e) => setCode(e.target.value)} />
          <TextField label="Tên kho" value={name} onChange={(e) => setName(e.target.value)} />
          <TextField select label="Trạng thái" value={status} onChange={(e) => setStatus(e.target.value as WarehouseStatus)}>
            <MenuItem value="ACTIVE">Hoạt động</MenuItem>
            <MenuItem value="INACTIVE">Không hoạt động</MenuItem>
          </TextField>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Huỷ
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={disabled}>
          Lưu
        </Button>
      </DialogActions>
    </Dialog>
  );
}
