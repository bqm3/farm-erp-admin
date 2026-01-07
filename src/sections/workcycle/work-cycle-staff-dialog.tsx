/* eslint-disable arrow-body-style */

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  TextField,
  MenuItem,
  Select,
  Checkbox,
  ListItemText,
  InputLabel,
  FormControl,
} from '@mui/material';

type StaffItem = {
  id: number;
  full_name: string;
};

type Props = {
  open: boolean;
  onClose: VoidFunction;
  employees: StaffItem[];
  onSubmit: (payload: { staff_ids: number[]; note?: string }) => Promise<void>;
};

export default function WorkCycleStaffDialog({
  open,
  onClose,
  employees,
  onSubmit,
}: Props) {
  const [staffIds, setStaffIds] = useState<number[]>([]);
  const [note, setNote] = useState('');

  const canSubmit = staffIds.length > 0;

  const handleSubmit = async () => {
    await onSubmit({ staff_ids: staffIds, note: note.trim() });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Gắn staff làm việc</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <FormControl fullWidth required>
            <InputLabel>Nhân viên</InputLabel>
            <Select
              multiple
              value={staffIds}
              label="Nhân viên"
              onChange={(e) => setStaffIds(e.target.value as number[])}
              renderValue={(selected) =>
                employees
                  .filter((u) => selected.includes(u.id))
                  .map((u) => u.full_name)
                  .join(', ')
              }
            >
              {employees.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  <Checkbox checked={staffIds.includes(user.id)} />
                  <ListItemText primary={user.full_name} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Ghi chú"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Huỷ
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!canSubmit}
        >
          Lưu
        </Button>
      </DialogActions>
    </Dialog>
  );
}
