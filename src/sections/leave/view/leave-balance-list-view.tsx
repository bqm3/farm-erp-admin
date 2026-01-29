// src/sections/leave/view/leave-balance-list-view.tsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Container,
  Card,
  Stack,
  Button,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Pagination,
  Typography,
  IconButton,
  Tooltip,
  CircularProgress,
} from '@mui/material';

import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';

import {
  listLeaveBalances,
  updateLeaveBalance,
  initLeaveBalances,
  type LeaveBalanceRow,
} from 'src/api/leave';
import LeaveBalanceEditDialog from '../leave-balance-edit-dialog';

function toInt(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

type Props = {
  canEdit?: boolean; // ADMIN/ACCOUNTANT
};

export default function LeaveBalanceListView({ canEdit = false }: Props) {
  const { enqueueSnackbar } = useSnackbar();

  const [loading, setLoading] = useState(false);

  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [rows, setRows] = useState<LeaveBalanceRow[]>([]);
  const [count, setCount] = useState(0);

  // edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState<LeaveBalanceRow | null>(null);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(count / pageSize)), [count]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listLeaveBalances({ year, q: q || undefined, page, pageSize });
      if (!res?.ok) throw new Error(res?.error || 'Không lấy được danh sách phép năm');
      setRows(res.rows || []);
      setCount(toInt(res.count, 0));
    } catch (err: any) {
      enqueueSnackbar(err?.message || 'Lỗi tải danh sách', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar, year, q, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [year, q]);

  const openEdit = (row: LeaveBalanceRow) => {
    setEditRow(row);
    setEditOpen(true);
  };

  const handleSubmitEdit = async (totalDays: number) => {
    if (!editRow) return;

    try {
      const res = await updateLeaveBalance(editRow.id, { total_days: totalDays });
      if (!res?.ok) throw new Error(res?.error || 'Cập nhật thất bại');
      enqueueSnackbar('Cập nhật thành công', { variant: 'success' });
      fetchData();
    } catch (err: any) {
      enqueueSnackbar(err?.message || 'Cập nhật thất bại', { variant: 'error' });
      throw err;
    }
  };

  return (
    <Container maxWidth="xl">
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h4">Phép năm</Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            color='warning'
            disabled={!canEdit || loading}
            startIcon={<Iconify icon="solar:add-circle-bold" />}
            onClick={async () => {
              try {
                const res = await initLeaveBalances({
                  year,
                  annual_days: 12,
                  carry_over: true,
                  carry_over_max: 3,
                });
                if (!res?.ok) throw new Error(res?.error || 'Thiết lập thất bại');
                enqueueSnackbar(
                  `Đã khởi tạo: thêm mới:${res.data.created} user, bỏ qua: ${res.data.skipped} user`,
                  { variant: 'success' }
                );
                fetchData();
              } catch (e: any) {
                enqueueSnackbar(e?.message || 'Thiết lập thất bại', { variant: 'error' });
              }
            }}
          >
            Khởi tạo phép năm
          </Button>
          
        </Stack>
      </Stack>

      <Card sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
          <TextField
            label="Năm"
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            sx={{ width: 160 }}
          />
          <TextField
            label="Tìm kiếm nhân viên"
            placeholder="Tên / email / mã..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            fullWidth
          />
          <Button sx={{width: 150}} color="inherit" variant="outlined" onClick={() => setQ('')}>
            Xóa tìm kiếm
          </Button>
          <Button
            sx={{width: 120}}
            variant="contained"
            color='primary'
            startIcon={<Iconify icon="solar:refresh-bold" />}
            onClick={fetchData}
            disabled={loading}
          >
            Tải lại
          </Button>
        </Stack>
      </Card>

      <Card>
        <TableContainer sx={{ position: 'relative' }}>
          {loading && (
            <Stack
              alignItems="center"
              justifyContent="center"
              sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.04)', zIndex: 2 }}
            >
              <CircularProgress />
            </Stack>
          )}

          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nhân viên</TableCell>
                <TableCell>Năm</TableCell>
                <TableCell align="right">Tổng</TableCell>
                <TableCell align="right">Sử dụng</TableCell>
                <TableCell align="right">Còn lại</TableCell>
                <TableCell align="right">Thao tác</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {rows.map((r) => {
                const empText =
                  r.employee?.full_name ||
                  r.employee?.email ||
                  r.employee?.code ||
                  `#${r.employee_id}`;

                return (
                  <TableRow key={r.id} hover>
                    <TableCell>{empText}</TableCell>
                    <TableCell>{r.year}</TableCell>
                    <TableCell align="right">{r.total_days}</TableCell>
                    <TableCell align="right">{Number(r.used_days)}</TableCell>
                    <TableCell align="right">{Number(r.remaining_days)}</TableCell>

                    <TableCell align="right">
                      <Tooltip title="Sửa tổng ngày">
                        <span>
                          <IconButton onClick={() => openEdit(r)} disabled={!canEdit}>
                            <Iconify icon="solar:pen-bold" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}

              {!loading && rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ py: 3 }}
                      align="center"
                    >
                      Không có dữ liệu
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Tổng: <b>{count}</b>
          </Typography>
          <Pagination page={page} count={totalPages} onChange={(_, v) => setPage(v)} />
        </Stack>
      </Card>

      <LeaveBalanceEditDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        row={editRow}
        onSubmit={handleSubmitEdit}
      />
    </Container>
  );
}
