/* eslint-disable no-nested-ternary */
/* eslint-disable @typescript-eslint/no-shadow */

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
  Typography,
  Divider,
} from '@mui/material';
import { useSnackbar } from 'src/components/snackbar';
import { createTask, type TaskType } from 'src/api/task';

type Props = {
  open: boolean;
  onClose: VoidFunction;
  cycleId: number;
  onCreated?: VoidFunction; // callback refresh list
  user: any;
};

const TASK_TYPE_OPTIONS: { value: TaskType; label: string }[] = [
  { value: 'GENERAL', label: 'Thường ngày' },
  { value: 'QUANTITY_UPDATE', label: 'Thay đổi số lượng' },
  { value: 'EXPENSE', label: 'Chi phí' },
];

function todayISO() {
  const d = new Date();
  // yyyy-mm-dd
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function WorkCycleTaskCreateDialog({ open, onClose, cycleId, onCreated , user}: Props) {
  const { enqueueSnackbar } = useSnackbar();

  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [taskType, setTaskType] = useState<TaskType>('GENERAL');
  const [dueDate, setDueDate] = useState<string>(todayISO());

  const canSubmit = useMemo(() => title.trim().length > 0 && !!cycleId, [title, cycleId]);

  useEffect(() => {
    if (!open) return;

    // reset form mỗi lần mở
    setTitle('');
    setDescription('');
    setTaskType('GENERAL');
    setDueDate(todayISO());
  }, [open]);

  const handleSubmit = async () => {
    if (!canSubmit) {
      enqueueSnackbar('Vui lòng nhập tiêu đề', { variant: 'warning' });
      return;
    }

    const payload: any = {
      cycle_id: Number(cycleId),
      title: title.trim(),
      description: description.trim() ? description.trim() : null,
      task_type: taskType,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,

      // ✅ KHÔNG chọn người, không gửi assigned_to/assigned_by
      assigned_to: user.id,
      // assigned_by: null,
    };

    try {
      setLoading(true);
      await createTask(payload);
      enqueueSnackbar('Đã tạo công việc', { variant: 'success' });
      onClose();
      onCreated?.();
    } catch (e: any) {
      enqueueSnackbar(e?.message || 'Tạo công việc thất bại', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Tạo công việc</DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Không cần chọn người giao/nhận — hệ thống sẽ tự lấy mặc định theo người tạo.
          </Typography>

          <Divider />

          <TextField
            label="Tiêu đề"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            required
            fullWidth
          />

          <TextField
            label="Mô tả"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            minRows={3}
          />

          <TextField
            select
            label="Loại công việc"
            value={taskType}
            onChange={(e) => setTaskType(e.target.value as TaskType)}
            fullWidth
          >
            {TASK_TYPE_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Hạn hoàn thành"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Hủy
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading || !canSubmit}>
          Tạo
        </Button>
      </DialogActions>
    </Dialog>
  );
}
