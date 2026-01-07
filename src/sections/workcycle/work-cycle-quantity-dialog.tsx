/* eslint-disable arrow-body-style */
/* eslint-disable no-nested-ternary */
// src/sections/work-cycle/work-cycle-quantity-dialog.tsx

import { useMemo, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  TextField,
  MenuItem,
} from '@mui/material';
import type { QuantityChangeType, UpdateQuantityPayload } from 'src/api/workcycle';

type Props = {
  open: boolean;
  onClose: VoidFunction;
  onSubmit: (payload: UpdateQuantityPayload) => Promise<void>;
};

const CHANGE_TYPES: QuantityChangeType[] = ['INCREASE', 'DECREASE'];

export default function WorkCycleQuantityDialog({ open, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<UpdateQuantityPayload>({
    change_type: 'INCREASE',
    quantity_change: 0,
    reason: '',
    log_date: '',
    task_id: null,
  });

  const canSubmit = useMemo(() => {
    return form.log_date && Number(form.quantity_change) > 0 && !!form.change_type;
  }, [form]);

  const handleChange = (key: keyof UpdateQuantityPayload) => (e: any) => {
    const v = e.target.value;
    setForm((prev: any) => ({
      ...prev,
      [key]:
        key === 'quantity_change'
          ? Number(v)
          : key === 'task_id'
            ? (v === '' ? null : Number(v))
            : (v as any),
    }));
  };

  const handleSubmit = async () => {
    await onSubmit({
      ...form,
      reason: String(form.reason || '').trim(),
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Cập nhật số lượng</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField select label="Loại thay đổi" value={form.change_type} onChange={handleChange('change_type')}>
            {CHANGE_TYPES.map((t) => (
              <MenuItem key={t} value={t}>
                {t === 'INCREASE' ? 'Tăng' : t === 'DECREASE' ? 'Giảm' : t}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Số lượng thay đổi"
            type="number"
            
            value={form.quantity_change}
            onChange={handleChange('quantity_change')}
            required
          />

          <TextField
            label="Ngày ghi log (yyyy-MM-dd)"
            value={form.log_date}
            onChange={handleChange('log_date')}
            required
            placeholder="2025-12-29"
          />

          <TextField label="Lý do" value={form.reason} onChange={handleChange('reason')} />

          <TextField
            label="Task ID (tuỳ chọn)"
            value={form.task_id ?? ''}
            onChange={handleChange('task_id')}
            placeholder="để trống nếu không có"
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Huỷ
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!canSubmit}>
          Cập nhật
        </Button>
      </DialogActions>
    </Dialog>
  );
}
