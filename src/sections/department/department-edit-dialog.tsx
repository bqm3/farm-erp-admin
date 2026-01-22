/* eslint-disable no-nested-ternary */

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
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import OutlinedInput from '@mui/material/OutlinedInput';
import Checkbox from '@mui/material/Checkbox';
import ListItemText from '@mui/material/ListItemText';

type Props = {
  open: boolean;
  loading?: boolean;
  data: any;
  onClose: VoidFunction;
  onSubmit: (payload: any) => Promise<void> | void;
};

function toInt(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export default function DepartmentEditDialog({ open, loading, data, onClose, onSubmit }: Props) {
  // form cơ bản
  const [form, setForm] = useState({ code: '', name: '' });

  // manager + members
  const [managerId, setManagerId] = useState<string>('');
  const [memberIds, setMemberIds] = useState<number[]>([]);

  const users = useMemo(() => data?.users || data?.employees || data?.members || [], [data]);

  useEffect(() => {
    if (!data) return;

    setForm({
      code: data.code || '',
      name: data.name || '',
    });

    setManagerId(data.manager_user_id ? String(data.manager_user_id) : '');

    // members hiện tại (nên trả từ API: data.members hoặc data.employees_in_department)
    const currentMembers =
      data.members ||
      data.department_users ||
      data.departmentUsers ||
      data.employees_in_department ||
      data.department_members ||
      [];

    // currentMembers có thể là [{id,...}] hoặc [{user_id,...}] -> normalize:
    const ids = Array.isArray(currentMembers)
      ? currentMembers
          .map((x: any) => (x?.id ? Number(x.id) : x?.user_id ? Number(x.user_id) : null))
          .filter((x: any) => Number.isFinite(x))
      : [];

    setMemberIds(ids as number[]);
  }, [data]);

  // helper render label
  const userLabel = (u: any) => u?.full_name || u?.username || `User#${u?.id}`;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Cập nhật khu vực</DialogTitle>

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
            </Stack>

            {/* Manager select */}
            <TextField
              select
              label="Manager"
              value={managerId}
              onChange={(e) => setManagerId(e.target.value)}
              fullWidth
              helperText="Chọn 1 người làm quản lý"
            >
              <MenuItem value="">
                <em>Chưa gán</em>
              </MenuItem>
              {(data?.managers?.length ? data.managers : []).map((u: any) => (
                <MenuItem key={u.id} value={String(u.id)}>
                  {userLabel(u)}
                </MenuItem>
              ))}
            </TextField>

            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Quản lý hiện tại: {data?.manager?.full_name || data?.manager?.username || 'Chưa gán'}
            </Typography>

            {/* Members multi-select */}
            <FormControl fullWidth>
              <InputLabel id="members-label">Nhân sự trong phòng ban</InputLabel>
              <Select
                labelId="members-label"
                multiple
                value={memberIds}
                onChange={(e) => {
                  const v = e.target.value as any;
                  setMemberIds(typeof v === 'string' ? v.split(',').map((x) => Number(x)) : v);
                }}
                input={<OutlinedInput label="Nhân sự trong phòng ban" />}
                renderValue={(selected) => {
                  const ids = selected as number[];
                  const names = ids
                    .map((id) => users.find((u: any) => Number(u.id) === Number(id)))
                    .filter(Boolean)
                    .map((u: any) => userLabel(u));
                  return names.join(', ');
                }}
              >
                {users.map((u: any) => {
                  const id = Number(u.id);
                  const checked = memberIds.includes(id);
                  return (
                    <MenuItem key={u.id} value={id}>
                      <Checkbox checked={checked} />
                      <ListItemText primary={userLabel(u)} secondary={u?.email} />
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>

            <Divider />

            <Typography variant="subtitle1">
              Danh sách nhân sự khu vực ({memberIds.length})
            </Typography>

            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Tài khoản</TableCell>
                  <TableCell>Họ tên</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Số điện thoại</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {memberIds
                  .map((id) => users.find((u: any) => Number(u.id) === Number(id)))
                  .filter(Boolean)
                  .map((u: any) => (
                    <TableRow key={u.id}>
                      <TableCell>{u.username}</TableCell>
                      <TableCell>{u.full_name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>{u.phone}</TableCell>
                    </TableRow>
                  ))}

                {!memberIds.length && (
                  <TableRow>
                    <TableCell colSpan={4} sx={{ color: 'text.secondary' }}>
                      Chưa chọn nhân sự
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
              manager_user_id: managerId ? toInt(managerId) : null,
              user_ids: memberIds, // ✅ danh sách member để backend sync
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
