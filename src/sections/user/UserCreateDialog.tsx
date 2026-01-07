import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  Checkbox,
  ListItemText,
  Grid,
  Divider,
  Typography,
} from '@mui/material';
import axiosInstance from 'src/utils/axios';


type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

const ROLE_OPTIONS = ['ACCOUNTANT', 'MANAGER', 'STAFF'];

export default function UserCreateDialog({ open, onClose, onCreated }: Props) {
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);

  const [form, setForm] = useState({
    username: '',
    password: '',
    full_name: '',
    phone: '',
    email: '',
    address: '',
    dob: '', // yyyy-mm-dd
    cccd: '',
    employment_type: 'FULLTIME',
    salary_base: 0,
    status: 'ACTIVE',
    work_days_per_month: 26,
    department_id: 1,
    roles: ['STAFF'] as string[],
  });

  useEffect(() => {
    if (!open) return;

    (async () => {
      try {
        const res = await axiosInstance.get('/api/departments');
        const data = res.data.data;
        setDepartments(data);
      } catch (e) {
        console.error('Load departments failed', e);
      }
    })();
  }, [open]);

  const setField = (key: string, value: any) => setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // payload đúng format bạn đưa
      const payload = {
        ...form,
        salary_base: Number(form.salary_base),
        work_days_per_month: Number(form.work_days_per_month),
        department_id: Number(form.department_id),
      };

      await axiosInstance.post('/api/users', payload);

      onClose();
      onCreated?.();
    } catch (e: any) {
      // axiosInstance của bạn đã throw ra error.response.data
      alert(e?.message || 'Tạo nhân viên thất bại');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Thêm mới nhân viên</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {/* Thông tin tài khoản */}
          <Typography variant="subtitle2">Thông tin tài khoản</Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Username"
                value={form.username}
                onChange={(e) => setField('username', e.target.value)}
                fullWidth
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Password"
                type="password"
                value={form.password}
                onChange={(e) => setField('password', e.target.value)}
                fullWidth
              />
            </Grid>
          </Grid>

          <Divider />

          {/* Thông tin cá nhân */}
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

          {/* Công việc */}
          <Typography variant="subtitle2">Công việc</Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                select
                label="Loại nhân sự"
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
                type="number"
                value={form.salary_base}
                onChange={(e) => setField('salary_base', e.target.value)}
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
                <InputLabel>Roles</InputLabel>
                <Select
                  multiple
                  value={form.roles}
                  onChange={(e) => setField('roles', e.target.value as string[])}
                  input={<OutlinedInput label="Roles" />}
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
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Hủy
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Đang lưu...' : 'Tạo mới'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
