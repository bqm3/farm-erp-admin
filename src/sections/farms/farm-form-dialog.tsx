/* eslint-disable react/jsx-no-bind */
// src/sections/farm/farm-form-dialog.tsx
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
import { useSnackbar } from 'src/components/snackbar';
import type { FarmRow, FarmStatus } from 'src/api/farm';

type Props = {
  open: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  initial?: FarmRow | null;
  onSubmit: (payload: any) => Promise<void>;
};

const STATUS_OPTIONS: { value: FarmStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Đang hoạt động' },
  { value: 'INACTIVE', label: 'Ngưng hoạt động' },
];

export default function FarmFormDialog({ open, onClose, mode, initial, onSubmit }: Props) {
  const { enqueueSnackbar } = useSnackbar();

  const isEdit = mode === 'edit';

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<FarmStatus>('ACTIVE');
  const [managerUserId, setManagerUserId] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    setCode(initial?.code || '');
    setName(initial?.name || '');
    setAddress(initial?.address || '');
    setPhone(initial?.phone || '');
    setEmail(initial?.email || '');
    setStatus((initial?.status as FarmStatus) || 'ACTIVE');
    setManagerUserId(initial?.manager_user_id ? String(initial.manager_user_id) : '');
  }, [open, initial]);

  const canSubmit = useMemo(() => {
    if (!name.trim()) return false;
    if (!isEdit && !code.trim()) return false;
    return true;
  }, [name, code, isEdit]);

  async function handleSubmit() {
    if (!canSubmit) return;

    const payload: any = {
      name: name.trim(),
      address: address.trim() || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      status,
      manager_user_id: managerUserId ? Number(managerUserId) : null,
    };
    if (!isEdit) payload.code = code.trim();

    try {
      setSaving(true);
      await onSubmit(payload);
      enqueueSnackbar(isEdit ? 'Cập nhật farm thành công' : 'Tạo farm thành công', { variant: 'success' });
      onClose();
    } catch (e: any) {
      enqueueSnackbar(e?.message || 'Có lỗi xảy ra', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEdit ? 'Sửa dự án' : 'Tạo dự án'}</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {!isEdit && (
            <TextField
              label="Mã dự án"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="FARM-002"
              fullWidth
            />
          )}

          <TextField label="Tên dự án" value={name} onChange={(e) => setName(e.target.value)} fullWidth />

          <TextField label="Địa chỉ" value={address} onChange={(e) => setAddress(e.target.value)} fullWidth />

          <TextField label="SĐT" value={phone} onChange={(e) => setPhone(e.target.value)} fullWidth />

          <TextField label="Email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />

          <TextField
            select
            label="Trạng thái"
            value={status}
            onChange={(e) => setStatus(e.target.value as FarmStatus)}
            fullWidth
          >
            {STATUS_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>

          {/* <TextField
            label="Manager user id"
            value={managerUserId}
            onChange={(e) => setManagerUserId(e.target.value)}
            fullWidth
            placeholder="VD: 5"
          /> */}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="inherit" disabled={saving}>
          Huỷ
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!canSubmit || saving}>
          {isEdit ? 'Lưu' : 'Tạo'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
