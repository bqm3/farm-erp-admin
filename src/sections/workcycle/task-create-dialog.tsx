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
  MenuItem,
} from '@mui/material';

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    title: string;
    description?: string;
    due_date?: string;
    task_type?: 'GENERAL' | 'QUANTITY_UPDATE' | 'EXPENSE';
    assigned_to: number;
  }) => Promise<void> | void;
  employees: any[]; // department members
};

export default function TaskCreateDialog({ open, onClose, onSubmit, employees }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [taskType, setTaskType] = useState<'GENERAL' | 'QUANTITY_UPDATE' | 'EXPENSE'>('GENERAL');
  const [dueDate, setDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState<number | ''>('');

  useEffect(() => {
    if (!open) return;
    setTitle('');
    setDescription('');
    setTaskType('GENERAL');
    setDueDate('');
    setAssignedTo('');
  }, [open]);

  const canSubmit = useMemo(() => {
    return title.trim().length > 0 && assignedTo !== '';
  }, [title, assignedTo]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Tạo task mới</DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            label="Tiêu đề"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
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
            label="Loại task"
            value={taskType}
            onChange={(e) => setTaskType(e.target.value as any)}
            fullWidth
          >
            <MenuItem value="GENERAL">Tổng quan</MenuItem>
            <MenuItem value="QUANTITY_UPDATE">Thay đổi số lượng</MenuItem>
            <MenuItem value="EXPENSE">Chi phí</MenuItem>
          </TextField>

          <TextField
            label="Hạn"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            select
            label="Giao cho"
            value={assignedTo}
            onChange={(e) => setAssignedTo(Number(e.target.value))}
            fullWidth
            required
          >
            {(employees || []).map((u: any) => (
              <MenuItem key={u.id} value={u.id}>
                {u.full_name || u.username} ({u.username})
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Hủy
        </Button>
        <Button
          disabled={!canSubmit}
          onClick={() =>
            onSubmit({
              title: title.trim(),
              description: description.trim() || undefined,
              due_date: dueDate || undefined,
              task_type: taskType,
              assigned_to: assignedTo as number,
            })
          }
          variant="contained"
        >
          Tạo
        </Button>
      </DialogActions>
    </Dialog>
  );
}
