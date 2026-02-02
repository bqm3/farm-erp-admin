/* eslint-disable no-nested-ternary */
import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Stack,
  TextField,
  MenuItem,
  Divider,
  Typography,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import axiosInstance from 'src/utils/axios';

type Mode = 'create' | 'edit';

type Props = {
  open: boolean;
  onClose: () => void;
  onDone?: () => void;
  mode: Mode;

  // edit
  userId?: string | number | null;
  initialRow?: any; // optional
};

const ROLE_OPTIONS = ['ACCOUNTANT', 'MANAGER', 'STAFF'] as const;

const ROLE_LABEL_VI: Record<(typeof ROLE_OPTIONS)[number], string> = {
  ACCOUNTANT: 'Kế toán',
  MANAGER: 'Quản lý',
  STAFF: 'Nhân viên',
};

function parseMoneyToNumber(s: string) {
  const cleaned = (s || '').replace(/[^\d]/g, '');
  return cleaned ? Number(cleaned) : 0;
}

function formatMoney(n: number) {
  return (Number.isFinite(n) ? n : 0).toLocaleString('vi-VN');
}

export default function UserUpsertDialog({
  open,
  onClose,
  onDone,
  mode,
  userId,
  initialRow,
}: Props) {
  const isEdit = mode === 'edit';

  const [loading, setLoading] = useState(false);
  const [farms, setFarms] = useState<any[]>([]);
  const [form, setForm] = useState<any>(null);

  const setField = (key: string, value: any) => setForm((p: any) => ({ ...p, [key]: value }));

  // init form when open
  useEffect(() => {
    if (!open) return;

    // form default
    setForm({
      username: '',
      password: '',
      full_name: '',
      phone: '',
      email: '',
      address: '',
      dob: '',
      cccd: '',
      employment_type: 'FULLTIME',
      salary_base: 0,
      status: 'ACTIVE',
      work_days_per_month: 26,
      role: 'STAFF', // ✅ chỉ 1 role
    });
  }, [open]);

  // load farms
  useEffect(() => {
    if (!open) return;

    (async () => {
      try {
        const rFarms = await axiosInstance.get('/api/farms', {
          params: { page: 1, limit: 1000 },
        });
        const farmsData = rFarms.data?.rows ?? rFarms.data ?? [];
        setFarms(Array.isArray(farmsData) ? farmsData : []);
      } catch (e) {
        console.error('Load farms failed', e);
        setFarms([]);
      }
    })();
  }, [open]);

  // load user detail for edit
  useEffect(() => {
    if (!open || !isEdit) return;
    if (!userId) return;

    (async () => {
      try {
        // ưu tiên dùng initialRow nếu có đủ field
        const hasSalary = initialRow?.salary_base !== undefined && initialRow?.salary_base !== null;
        if (initialRow && hasSalary) {
          const roleFromRow =
            (initialRow.roles || [])
              .map((r: any) => (typeof r === 'string' ? r : r.code))
              .find((x: any) => ROLE_OPTIONS.includes(x)) || 'STAFF';

          setForm((p: any) => ({
            ...p,
            id: initialRow.id,
            username: initialRow.username || '',
            password: '',
            full_name: initialRow.full_name || initialRow.name || '',
            phone: initialRow.phone || initialRow.phoneNumber || '',
            email: initialRow.email || '',
            address: initialRow.address || '',
            dob: (initialRow.dob || '').slice(0, 10),
            cccd: initialRow.cccd || '',
            employment_type: initialRow.employment_type || 'FULLTIME',
            salary_base: Number(initialRow.salary_base || 0),
            status: (initialRow.status || 'ACTIVE').toUpperCase(),
            work_days_per_month: Number(initialRow.work_days_per_month || 26),
            farm_id: Number(initialRow.farm_id || 1),
            role: roleFromRow,
          }));
          return;
        }

        const res = await axiosInstance.get(`/api/users/${userId}`);
        const u = res.data?.data;

        const roleFromApi =
          (u.roles || []).map((r: any) => r.code).find((x: any) => ROLE_OPTIONS.includes(x)) ||
          'STAFF';

        setForm((p: any) => ({
          ...p,
          id: u.id,
          username: u.username || '',
          password: '',
          full_name: u.full_name || '',
          phone: u.phone || '',
          email: u.email || '',
          address: u.address || '',
          dob: (u.dob || '').slice(0, 10),
          cccd: u.cccd || '',
          employment_type: u.employment_type || 'FULLTIME',
          salary_base: Number(u.salary_base || 0),
          status: (u.status || 'ACTIVE').toUpperCase(),
          work_days_per_month: Number(u.work_days_per_month || 26),
          farm_id: Number(u.farm_id || 1),
          role: roleFromApi,
        }));
      } catch (e) {
        console.error('Load user detail failed', e);
        // vẫn giữ form default, chỉ báo lỗi
      }
    })();
  }, [open, isEdit, userId, initialRow]);

  // reset when close
  useEffect(() => {
    if (!open) {
      setForm(null);
      setFarms([]);
    }
  }, [open]);

  const canSubmit = useMemo(() => {
    if (!form) return false;
    if (!form.username || !form.full_name || !form.phone) return false;
    if (!isEdit && !form.password?.trim()) return false; // create bắt buộc password
    return true;
  }, [form, isEdit]);

  const handleSubmit = async () => {
    if (!form) return;
    if (isEdit && !userId) return;

    try {
      setLoading(true);

      // payload chung
      const payload: any = {
        username: form.username,
        full_name: form.full_name,
        phone: form.phone,
        email: form.email,
        address: form.address,
        dob: form.dob,
        cccd: form.cccd,
        employment_type: form.employment_type,
        salary_base: Number(form.salary_base),
        status: form.status, // ACTIVE/INACTIVE
        work_days_per_month: Number(form.work_days_per_month),
        farm_id: Number(form.farm_id),
        roles: [form.role], // ✅ backend vẫn nhận roles array
      };

      // password:
      // - create: bắt buộc
      // - edit: chỉ gửi nếu nhập
      if (form.password?.trim()) payload.password = form.password.trim();

      if (isEdit) {
        await axiosInstance.put(`/api/users/${userId}`, payload);
      } else {
        await axiosInstance.post('/api/users', payload);
      }

      onClose();
      onDone?.();
    } catch (e: any) {
      alert(e?.message || (isEdit ? 'Cập nhật nhân viên thất bại' : 'Tạo nhân viên thất bại'));
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const title = isEdit ? 'Cập nhật nhân viên' : 'Thêm mới nhân viên';

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle>{title}</DialogTitle>

      <DialogContent>
        {!form ? (
          <Typography sx={{ mt: 2 }}>Đang tải dữ liệu...</Typography>
        ) : (
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="subtitle2">Thông tin tài khoản</Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Tài khoản"
                  value={form.username}
                  onChange={(e) => setField('username', e.target.value)}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label={isEdit ? 'Mật khẩu (để trống nếu không đổi)' : 'Mật khẩu'}
                  type="password"
                  value={form.password}
                  onChange={(e) => setField('password', e.target.value)}
                  fullWidth
                />
              </Grid>
            </Grid>

            <Divider />

            <Typography variant="subtitle2">Thông tin cá nhân</Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Họ tên"
                  value={form.full_name}
                  onChange={(e) => setField('full_name', e.target.value)}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Ngày sinh"
                  type="date"
                  value={form.dob}
                  onChange={(e) => setField('dob', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="SĐT"
                  value={form.phone}
                  onChange={(e) => setField('phone', e.target.value)}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Email"
                  value={form.email}
                  onChange={(e) => setField('email', e.target.value)}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Địa chỉ"
                  value={form.address}
                  onChange={(e) => setField('address', e.target.value)}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="CCCD"
                  value={form.cccd}
                  onChange={(e) => setField('cccd', e.target.value)}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  label="Trạng thái"
                  value={form.status}
                  onChange={(e) => setField('status', e.target.value)}
                  fullWidth
                >
                  <MenuItem value="ACTIVE">Hoạt động</MenuItem>
                  <MenuItem value="INACTIVE">Không hoạt động</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            <Divider />

            <Typography variant="subtitle2">Công việc</Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  label="Hình thức"
                  value={form.employment_type}
                  onChange={(e) => setField('employment_type', e.target.value)}
                  fullWidth
                >
                  <MenuItem value="FULLTIME">Toàn thời gian</MenuItem>
                  <MenuItem value="PARTTIME">Bán thời gian</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Lương cơ bản"
                  value={formatMoney(form.salary_base)}
                  onChange={(e) => setField('salary_base', parseMoneyToNumber(e.target.value))}
                  inputProps={{ inputMode: 'numeric' }}
                  helperText="VD: 10,000,000"
                  fullWidth
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Ngày công / tháng"
                  type="number"
                  value={form.work_days_per_month}
                  onChange={(e) => setField('work_days_per_month', e.target.value)}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Chức vụ</InputLabel>
                  <Select
                    value={form.role}
                    label="Chức vụ"
                    onChange={(e) => setField('role', e.target.value)}
                  >
                    {ROLE_OPTIONS.map((role) => (
                      <MenuItem key={role} value={role}>
                        {ROLE_LABEL_VI[role]}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Hủy
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading || !canSubmit}>
          {loading ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Tạo mới'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
