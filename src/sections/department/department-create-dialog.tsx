/* eslint-disable consistent-return */
/* eslint-disable arrow-body-style */

import { useEffect, useMemo, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';

import Iconify from 'src/components/iconify';
import axiosInstance from 'src/utils/axios';

type Props = {
  open: boolean;
  loading?: boolean;
  onClose: VoidFunction;
  onSubmit: (payload: {
    farm_id: number;
    code: string;
    name: string;
    manager_user_id?: number | null;
  }) => Promise<void> | void;
};

type User = { id: number; username: string; full_name: string; email?: string };
type Farm = { id: number; code?: string; name: string };

export default function DepartmentCreateDialog({ open, loading, onClose, onSubmit }: Props) {
  const [error, setError] = useState<string>('');

  const [farmId, setFarmId] = useState<number | ''>('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [managerId, setManagerId] = useState<number | ''>('');

  const [loadingMeta, setLoadingMeta] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);

  const canSubmit = useMemo(() => {
    return Boolean(farmId) && code.trim().length > 0 && name.trim().length > 0 && !loading && !loadingMeta;
  }, [farmId, code, name, loading, loadingMeta]);

  useEffect(() => {
    if (!open) return;

    // reset form mỗi lần mở
    setError('');
    setFarmId('');
    setCode('');
    setName('');
    setManagerId('');

    // load farms + users
    (async () => {
      setLoadingMeta(true);
      try {
        const [rFarms, rUsers] = await Promise.all([
          axiosInstance.get('/api/farms?limit=200&page=1'),
          axiosInstance.get('/api/users'),
        ]);

        // farms: bạn đang trả { ok:true, data:[...] } hoặc {data:[...]} => normalize
        const farmsData = rFarms.data?.data ?? rFarms.data?.rows ?? rFarms.data ?? [];
        setFarms(Array.isArray(farmsData) ? farmsData : []);

        const usersData = rUsers.data?.data ?? rUsers.data ?? [];
        setUsers(Array.isArray(usersData) ? usersData : []);
      } catch (e: any) {
        setError(e?.response?.data?.message || e?.message || 'Không load được dữ liệu farms/users');
      } finally {
        setLoadingMeta(false);
      }
    })();
  }, [open]);

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  const handleSubmit = async () => {
    setError('');

    if (!farmId) return setError('Vui lòng chọn Farm');
    if (!code.trim()) return setError('Vui lòng nhập code');
    if (!name.trim()) return setError('Vui lòng nhập name');

    const payload = {
      farm_id: Number(farmId),
      code: code.trim(),
      name: name.trim(),
      manager_user_id: managerId === '' ? null : Number(managerId),
    };

    try {
      await onSubmit(payload);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Tạo thất bại');
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Tạo khu vực</DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Stack spacing={2} mt={1}>
          <TextField
            select
            label="Farm"
            value={farmId}
            onChange={(e) => setFarmId(e.target.value === '' ? '' : Number(e.target.value))}
            disabled={loading || loadingMeta}
            helperText="Chọn trang trại cha (farm_id)"
          >
            <MenuItem value="">-- Chọn farm --</MenuItem>
            {farms.map((f) => (
              <MenuItem key={f.id} value={f.id}>
                {f.name} {f.code ? `(${f.code})` : ''}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={loading || loadingMeta}
            placeholder="VD: DEPART-V1-03"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="mdi:identifier" />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            label="Tên khu vực"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading || loadingMeta}
            placeholder="VD: Trang trại 03 - Khu vực 1"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="solar:home-bold" />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            select
            label="Quản lý (tuỳ chọn)"
            value={managerId}
            onChange={(e) => setManagerId(e.target.value === '' ? '' : Number(e.target.value))}
            disabled={loading || loadingMeta}
            helperText="Danh sách user đã lọc loại ADMIN"
          >
            <MenuItem value="">-- Chưa gán --</MenuItem>
            {users.map((u) => (
              <MenuItem key={u.id} value={u.id}>
                {u.full_name} (@{u.username})
              </MenuItem>
            ))}
          </TextField>

          {loadingMeta && (
            <Stack direction="row" spacing={1} alignItems="center">
              <CircularProgress size={18} />
              <span>Đang tải farms/users...</span>
            </Stack>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} color="inherit" disabled={loading}>
          Huỷ
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!canSubmit}>
          {loading ? 'Đang tạo...' : 'Tạo'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
