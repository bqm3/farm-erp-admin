'use client';

import { useEffect, useMemo, useState } from 'react';
// @mui
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';

type Props = {
  open: boolean;
  loading?: boolean;
  data: any;
  onClose: VoidFunction;
  onSubmit: (payload: any) => Promise<void> | void;
};

export default function DepartmentEditDialog({ open, loading, data, onClose, onSubmit }: Props) {
  const [form, setForm] = useState({ code: '', name: '', manager_user_id: '' });

  useEffect(() => {
    if (data) {
      setForm({
        code: data.code || '',
        name: data.name || '',
        manager_user_id: data.manager_user_id ? String(data.manager_user_id) : '',
      });
    }
  }, [data]);
  const users = useMemo(() => data?.employees || [], [data]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Cập nhật trang trại</DialogTitle>

      <DialogContent dividers>
        {loading && (
          <Stack alignItems="center" sx={{ py: 4 }}>
            <CircularProgress />
          </Stack>
        )}

        {!loading && (
          <Stack spacing={2.5} mt={1}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Mã"
                value={form.code}
                onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Tên"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Manager User ID"
                value={form.manager_user_id}
                onChange={(e) => setForm((p) => ({ ...p, manager_user_id: e.target.value }))}
                fullWidth
              />
            </Stack>

            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Quản lý hiện tại: {data?.manager?.full_name || data?.manager?.username || 'Chưa gán'}
            </Typography>

            <Divider />

            <Typography variant="subtitle1">
              Danh sách nhân sự trong trang trại ({users.length})
            </Typography>

            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Username</TableCell>
                  <TableCell>Họ tên</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((u: any) => (
                  <TableRow key={u.id}>
                    <TableCell>{u.id}</TableCell>
                    <TableCell>{u.username}</TableCell>
                    <TableCell>{u.full_name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.role}</TableCell>
                  </TableRow>
                ))}
                {!users.length && (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ color: 'text.secondary' }}>
                      Không có nhân sự
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Đóng
        </Button>
        <Button
          variant="contained"
          onClick={() =>
            onSubmit({
              code: form.code,
              name: form.name,
              manager_user_id: form.manager_user_id ? Number(form.manager_user_id) : null,
            })
          }
          disabled={loading}
        >
          Lưu
        </Button>
      </DialogActions>
    </Dialog>
  );
}
