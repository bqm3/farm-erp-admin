'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Alert,
} from '@mui/material';
import type { ISpecies } from 'src/api/species';
import { apiCreateSpecies, apiUpdateSpecies } from 'src/api/species';

type Props = {
  open: boolean;
  onClose: VoidFunction;
  onSuccess: VoidFunction;
  current?: ISpecies | null; // null => create, có => edit
};

export default function SpeciesEditDialog({ open, onClose, onSuccess, current }: Props) {
  const isEdit = !!current?.id;

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title = useMemo(() => (isEdit ? 'Cập nhật giống loài' : 'Thêm giống loài'), [isEdit]);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setSubmitting(false);

    if (isEdit && current) {
      setCode(current.code || '');
      setName(current.name || '');
    } else {
      setCode('');
      setName('');
    }
  }, [open, isEdit, current]);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);

      const payloadName = name.trim();
      if (!payloadName) throw new Error('NAME_REQUIRED');

      if (isEdit && current) {
        await apiUpdateSpecies(current.id, { name: payloadName });
      } else {
        const payloadCode = code.trim();
        if (!payloadCode) throw new Error('CODE_REQUIRED');
        await apiCreateSpecies({ code: payloadCode, name: payloadName });
      }

      onSuccess();
      onClose();
    } catch (e: any) {
      const msg = String(e?.message || '');
      if (msg.includes('CODE_EXISTS')) setError('Mã giống loài đã tồn tại.');
      else if (msg.includes('CODE_REQUIRED')) setError('Vui lòng nhập mã.');
      else if (msg.includes('NAME_REQUIRED')) setError('Vui lòng nhập tên.');
      else setError('Không thể lưu dữ liệu. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="Mã"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={isEdit} // thường không cho sửa code
            placeholder="VD: BO, DE, HEO..."
            fullWidth
          />

          <TextField
            label="Tên giống loài"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="VD: Bò sữa HF"
            fullWidth
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={submitting} color="inherit">
          Hủy
        </Button>
        <Button onClick={handleSubmit} disabled={submitting} variant="contained">
          {isEdit ? 'Cập nhật' : 'Tạo mới'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
