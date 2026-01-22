/* eslint-disable arrow-body-style */
/* eslint-disable no-nested-ternary */
// src/sections/work-cycle/work-cycle-quantity-dialog.tsx

import { useEffect, useMemo, useState } from 'react';
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
import { listQuantityUpdateTasks, type TaskLite } from 'src/api/task';

type Props = {
  open: boolean;
  onClose: VoidFunction;
  onSubmit: (payload: UpdateQuantityPayload) => Promise<void>;
  cycleId: number;
};

const CHANGE_TYPES: QuantityChangeType[] = ['TANG', 'GIAM', 'SINH', 'CHET'];

const CHANGE_TYPE_LABEL: Record<QuantityChangeType, string> = {
  TANG: 'Tăng',
  GIAM: 'Giảm',
  SINH: 'Sinh',
  CHET: 'Chết',
  THU_HOACH: '',
  BAN: '',
  THEM: '',
};

export default function WorkCycleQuantityDialog({ open, onClose, onSubmit, cycleId }: Props) {
  const [tasks, setTasks] = useState<TaskLite[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  const [form, setForm] = useState<UpdateQuantityPayload>({
    change_type: 'TANG',
    quantity_change: 0,
    reason: '',
    log_date: '',
    task_id: null,
  });

  useEffect(() => {
    const run = async () => {
      if (!open) return;
      setLoadingTasks(true);
      try {
        const res = await listQuantityUpdateTasks({ cycle_id: cycleId, status: 'OPEN,PENDING' });
        setTasks(res.data || []);
      } finally {
        setLoadingTasks(false);
      }
    };
    run();
  }, [open, cycleId]);

  const canSubmit = useMemo(() => {
    return Number(form.quantity_change) > 0 && !!form.change_type;
  }, [form]);

  const handleChange = (key: keyof UpdateQuantityPayload) => (e: any) => {
    const v = e.target.value;
    setForm((prev: any) => ({
      ...prev,
      [key]:
        key === 'quantity_change'
          ? Number(v)
          : key === 'task_id'
          ? v === ''
            ? null
            : Number(v)
          : (v as any),
    }));
  };

  const handleSubmit = async () => {
    await onSubmit({
      ...form,
      reason: String(form.reason || '').trim(),
      log_date: new Date().toString(),
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Cập nhật số lượng</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {/* NEW: select task QUANTITY_UPDATE */}
          <TextField
            select
            label="Task QUANTITY_UPDATE (tuỳ chọn)"
            value={form.task_id ?? ''}
            onChange={handleChange('task_id')}
            disabled={loadingTasks}
            helperText={loadingTasks ? 'Đang tải task...' : 'Chọn task để gắn log (nếu có)'}
          >
            <MenuItem value="">(Không chọn)</MenuItem>
            {tasks.map((t) => (
              <MenuItem key={t.id} value={t.id}>
                #{t.id} - {t.title} ({t.status})
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Loại thay đổi"
            value={form.change_type}
            onChange={handleChange('change_type')}
          >
            {CHANGE_TYPES.map((t) => (
              <MenuItem key={t} value={t}>
                {CHANGE_TYPE_LABEL[t]}
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

          <TextField label="Lý do" value={form.reason} onChange={handleChange('reason')} />
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
