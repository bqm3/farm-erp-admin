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
  OutlinedInput,
  Checkbox,
  ListItemText,
} from '@mui/material';
import axiosInstance from 'src/utils/axios';

const ROLE_OPTIONS = ['ACCOUNTANT', 'MANAGER', 'STAFF'];

type Props = {
  open: boolean;
  onClose: () => void;
  onUpdated?: () => void;
  userId: string | number | null;
  initialRow?: any; // truyền row hiện tại để đỡ gọi GET detail (tuỳ bạn)
};

function parseMoneyToNumber(s: string) {
  const cleaned = (s || '').replace(/[^\d]/g, '');
  return cleaned ? Number(cleaned) : 0;
}

function formatMoney(n: number) {
  return (Number.isFinite(n) ? n : 0).toLocaleString('vi-VN');
}

export default function UserEditDialog({ open, onClose, onUpdated, userId, initialRow }: Props) {
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [form, setForm] = useState<any>(null);

  const setField = (key: string, value: any) => setForm((p: any) => ({ ...p, [key]: value }));

  // load departments + load user detail (hoặc dùng initialRow)
  useEffect(() => {
    if (!open || !userId) return;

    (async () => {
      // 1) load departments (fail cũng kệ)
      try {
        const depsRes = await axiosInstance.get('/api/departments', {
          params: { page: 1, limit: 1000 },
        });
        const depList = depsRes.data?.data ?? depsRes.data?.data?.data ?? [];
        setDepartments(Array.isArray(depList) ? depList : []);
      } catch (e) {
        console.error('Load departments failed', e);
        setDepartments([]);
      }

      // 2) load user form
      try {
        const hasSalary = initialRow?.salary_base !== undefined && initialRow?.salary_base !== null;

        if (initialRow && hasSalary) {
          setForm({
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
            department_id: Number(initialRow.department_id || 1),
            roles:
              (initialRow.roles || []).map((r: any) => (typeof r === 'string' ? r : r.code)) || [],
          });
          return;
        }

        const res = await axiosInstance.get(`/api/users/${userId}`);
        const u = res.data?.data;

        setForm({
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
          department_id: Number(u.department_id || 1),
          roles: (u.roles || []).map((r: any) => r.code),
        });
      } catch (e) {
        console.error('Load user detail failed', e);
        setForm(null);
      }
    })();
  }, [open, userId, initialRow]);

  // reset form khi đóng
  useEffect(() => {
    if (!open) setForm(null);
  }, [open]);

  const canSubmit = useMemo(() => {
    if (!form) return false;
    return form.username && form.full_name && form.email && form.phone;
  }, [form]);

  const handleSubmit = async () => {
    if (!form || !userId) return;
    try {
      setLoading(true);

      // nếu password rỗng thì không gửi (để backend khỏi đổi password)
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
        status: form.status, // ACTIVE/BANNED
        work_days_per_month: Number(form.work_days_per_month),
        department_id: Number(form.department_id),
        roles: form.roles,
      };

      if (form.password?.trim()) payload.password = form.password.trim();

      await axiosInstance.put(`/api/users/${userId}`, payload);

      onClose();
      onUpdated?.();
    } catch (e: any) {
      alert(e?.message || 'Cập nhật nhân viên thất bại');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  console.log('form.salary_base', form);

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle>Cập nhật nhân viên</DialogTitle>

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
                  label="Mật khẩu (để trống nếu không đổi)"
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
                  <MenuItem value="FULLTIME">FULLTIME</MenuItem>
                  <MenuItem value="PARTTIME">PARTTIME</MenuItem>
                  <MenuItem value="CONTRACT">CONTRACT</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Lương cơ bản"
                  value={formatMoney(form.salary_base)} // hiển thị đẹp
                  onChange={(e) => {
                    const num = parseMoneyToNumber(e.target.value);
                    setField('salary_base', num); // state vẫn number
                  }}
                  inputProps={{ inputMode: 'numeric' }} // bật bàn phím số trên mobile
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
                <TextField
                  select
                  label="Phòng ban / Trang trại"
                  value={form.department_id}
                  onChange={(e) => setField('department_id', Number(e.target.value))}
                  fullWidth
                >
                  {departments.map((d) => (
                    <MenuItem key={d.id} value={d.id}>
                      {d.name}
                      {d.manager?.full_name ? ` — QL: ${d.manager.full_name}` : ''}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Chức vụ</InputLabel>
                  <Select
                    multiple
                    value={form.roles}
                    onChange={(e) => setField('roles', e.target.value as string[])}
                    input={<OutlinedInput label="Chức vụ" />}
                    renderValue={(selected) => (selected as string[]).join(', ')}
                  >
                    {ROLE_OPTIONS.map((role) => (
                      <MenuItem key={role} value={role}>
                        <Checkbox checked={form.roles.indexOf(role) > -1} />
                        <ListItemText primary={role} />
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
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || !canSubmit || !form}
        >
          {loading ? 'Đang lưu...' : 'Cập nhật'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
