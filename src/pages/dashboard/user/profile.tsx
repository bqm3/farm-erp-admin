/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';
import {
  Card,
  Stack,
  Container,
  Typography,
  TextField,
  Button,
  Divider,
  Alert,
} from '@mui/material';
import { useSnackbar } from 'src/components/snackbar';
import { apiGetMe, apiUpdateMe, apiChangeMyPassword } from 'src/api/user';
import { useSettingsContext } from 'src/components/settings';
import { formatMoney } from 'src/utils/format-number';

export default function ProfileView() {
  const settings = useSettingsContext();
  const { enqueueSnackbar } = useSnackbar();

  const [me, setMe] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    address: '',
    dob: '',
    cccd: '',
  });

  const [pwd, setPwd] = useState({ old_password: '', new_password: '' });
  const [err, setErr] = useState<string>('');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await apiGetMe();
        setMe(data);
        setForm({
          full_name: data.full_name || '',
          phone: data.phone || '',
          email: data.email || '',
          address: data.address || '',
          dob: data.dob ? String(data.dob).slice(0, 10) : '',
          cccd: data.cccd || '',
        });
      } catch (e: any) {
        setErr(e?.message || 'Không tải được thông tin');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onSave = async () => {
    try {
      setErr('');
      setLoading(true);
      const data = await apiUpdateMe({
        full_name: form.full_name,
        phone: form.phone,
        email: form.email,
        address: form.address,
        dob: form.dob || null,
        cccd: form.cccd,
      });
      setMe(data);
      enqueueSnackbar('Cập nhật thông tin thành công', { variant: 'success' });
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || 'Cập nhật thất bại');
    } finally {
      setLoading(false);
    }
  };

  const onChangePassword = async () => {
    try {
      setErr('');
      if (!pwd.old_password || !pwd.new_password) {
        setErr('Vui lòng nhập mật khẩu cũ và mật khẩu mới');
        return;
      }
      setLoading(true);
      await apiChangeMyPassword(pwd.old_password, pwd.new_password);
      enqueueSnackbar('Đổi mật khẩu thành công', { variant: 'success' });
      setPwd({ old_password: '', new_password: '' });
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || 'Đổi mật khẩu thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth={settings.themeStretch ? false : 'md'}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Thông tin cá nhân
      </Typography>

      {!!err && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {err}
        </Alert>
      )}

      <Stack spacing={2}>
        <Card sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Typography variant="h6">Thông tin</Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="Tài khoản" value={me?.username || ''} fullWidth disabled />
              <TextField
                label="Vai trò"
                value={(me?.roles || []).join(', ') || 'STAFF'}
                fullWidth
                disabled
                helperText="Bạn không thể tự sửa role"
              />
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Họ tên"
                value={form.full_name}
                onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Số điện thoại"
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                fullWidth
              />
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                fullWidth
              />
              <TextField
                label="CCCD"
                value={form.cccd}
                onChange={(e) => setForm((p) => ({ ...p, cccd: e.target.value }))}
                fullWidth
              />
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Ngày sinh"
                type="date"
                value={form.dob}
                onChange={(e) => setForm((p) => ({ ...p, dob: e.target.value }))}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Địa chỉ"
                value={form.address}
                onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                fullWidth
                multiline
                minRows={2}
              />
            </Stack>

            <Stack direction="row" justifyContent="flex-end">
              <Button variant="contained" onClick={onSave} disabled={loading}>
                Lưu thay đổi
              </Button>
            </Stack>

            <Divider sx={{ my: 1 }} />

            <Typography variant="body2" color="text.secondary">
              Lương
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Lương cơ bản"
                value={formatMoney(Number(me?.salary_base))}
                fullWidth
                disabled
              />
              <TextField label="Trạng thái" value={me?.status ?? ''} fullWidth disabled />
            </Stack>
          </Stack>
        </Card>

        <Card sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Typography variant="h6">Đổi mật khẩu</Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Mật khẩu cũ"
                type="password"
                value={pwd.old_password}
                onChange={(e) => setPwd((p) => ({ ...p, old_password: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Mật khẩu mới"
                type="password"
                value={pwd.new_password}
                onChange={(e) => setPwd((p) => ({ ...p, new_password: e.target.value }))}
                fullWidth
              />
            </Stack>

            <Stack direction="row" justifyContent="flex-end">
              <Button variant="outlined" onClick={onChangePassword} disabled={loading}>
                Đổi mật khẩu
              </Button>
            </Stack>

            <Alert severity="info">Bạn không thể tự xoá tài khoản. Nếu cần, liên hệ Admin.</Alert>
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}
