/* eslint-disable react/jsx-no-bind */
// src/sections/farm/farm-list-view.tsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Container,
  Card,
  Stack,
  TextField,
  MenuItem,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Pagination,
  Button,
  Chip,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useSnackbar } from 'src/components/snackbar';

import {
  createFarm,
  deleteFarm,
  listFarms,
  updateFarm,
  type FarmRow,
  type FarmStatus,
} from 'src/api/farm';
import { selectFarm } from 'src/api/session';
import axiosInstance, { endpoints } from 'src/utils/axios';
import { setSession } from 'src/auth/context/jwt/utils';

import FarmFormDialog from './farm-form-dialog';

function statusChip(s?: FarmStatus) {
  if (s === 'ACTIVE') return <Chip label="HOẠT ĐỘNG" size="small" color="success" />;
  if (s === 'INACTIVE') return <Chip label="ĐÓNG" size="small" color="default" />;
  return <Chip label="N/A" size="small" />;
}

export default function FarmListView({ canEdit = false }: { canEdit?: boolean }) {
  const { enqueueSnackbar } = useSnackbar();

  const [rows, setRows] = useState<FarmRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');

  const [loading, setLoading] = useState(false);

  // dialogs
  const [openForm, setOpenForm] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [current, setCurrent] = useState<FarmRow | null>(null);

  const [openDelete, setOpenDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  const [activeFarm, setActiveFarm] = useState<{ id: number; name: string; code?: string } | null>(
    null
  );

  useEffect(() => {
    const raw = sessionStorage.getItem('activeFarm');
    if (raw) {
      try {
        setActiveFarm(JSON.parse(raw));
      } catch {
        // ignore
      }
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await listFarms({
        search: search || undefined,
        status: status || undefined,
        page,
        limit,
      });
      setRows(res.data || []);
      setTotal(res.total || 0);
    } catch (e: any) {
      enqueueSnackbar(e?.message || 'Không tải được danh sách farm', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar, search, status, page, limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setFormMode('create');
    setCurrent(null);
    setOpenForm(true);
  };

  const openEdit = (r: FarmRow) => {
    setFormMode('edit');
    setCurrent(r);
    setOpenForm(true);
  };

  const openDeleteConfirm = (r: FarmRow) => {
    setCurrent(r);
    setOpenDelete(true);
  };

  async function handleSubmit(payload: any) {
    if (formMode === 'create') {
      await createFarm(payload);
    } else if (current?.id) {
      await updateFarm(current.id, payload);
    }
    await fetchData();
  }

  async function handleDelete() {
    if (!current?.id) return;
    try {
      setDeleting(true);
      await deleteFarm(current.id);
      enqueueSnackbar('Xóa farm thành công', { variant: 'success' });
      setOpenDelete(false);
      setCurrent(null);
      await fetchData();
    } catch (e: any) {
      enqueueSnackbar(e?.message || 'Xóa thất bại', { variant: 'error' });
    } finally {
      setDeleting(false);
    }
  }

  async function handleEnterFarm(r: FarmRow) {
    try {
      await selectFarm(r.id);

      // ✅ Lưu farm đang active để UI hiển thị
      const next = { id: r.id, name: r.name, code: r.code };
      sessionStorage.setItem('activeFarm', JSON.stringify(next));
      setActiveFarm(next);

      // (tuỳ bạn) gọi me để refresh session nếu cần
      const storedToken = sessionStorage.getItem('accessToken');
      await axiosInstance.get(endpoints.auth.me, {
        headers: { Authorization: `Bearer ${storedToken}` },
      });

      enqueueSnackbar(`Đã vào farm: ${r.name}`, { variant: 'success' });
    } catch (e: any) {
      enqueueSnackbar(e?.message || 'Không vào được farm', { variant: 'error' });
    }
  }

  return (
    <>
      <Stack spacing={2}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="h5">Quản lý dự án</Typography>

            {activeFarm && (
              <Chip
                size="small"
                color="primary"
                variant="outlined"
                label={`Đang ở: ${activeFarm.name}${
                  activeFarm.code ? ` (${activeFarm.code})` : ''
                }`}
              />
            )}
          </Stack>

          {canEdit && (
            <Button variant="contained" onClick={openCreate}>
              Tạo dự án
            </Button>
          )}
        </Stack>

        <Card sx={{ p: 2 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              label="Tìm kiếm"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="code / name / address..."
              fullWidth
            />

            <TextField
              select
              label="Trạng thái"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="">Tất cả</MenuItem>
              <MenuItem value="ACTIVE">Hoạt động</MenuItem>
              <MenuItem value="INACTIVE">Đóng</MenuItem>
            </TextField>

            <Button
              variant="outlined"
              color="inherit"
              disabled={loading}
              onClick={() => fetchData()}
              sx={{ minWidth: 120 }}
            >
              Lọc
            </Button>
          </Stack>
        </Card>

        <Card>
          <TableContainer sx={{ maxHeight: 640 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell width={90}>ID</TableCell>
                  <TableCell width={140}>Code</TableCell>
                  <TableCell>Tên</TableCell>
                  <TableCell>Địa chỉ</TableCell>
                  <TableCell width={120}>Status</TableCell>
                  <TableCell width={300}>Thao tác</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell>{r.id}</TableCell>
                    <TableCell>{r.code}</TableCell>
                    <TableCell>{r.name}</TableCell>
                    <TableCell>{r.address || '-'}</TableCell>
                    <TableCell>{statusChip(r.status)}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Button size="small" variant="contained" onClick={() => handleEnterFarm(r)}>
                          Vào farm
                        </Button>

                        {canEdit && (
                          <>
                            <Button size="small" variant="outlined" onClick={() => openEdit(r)}>
                              Sửa
                            </Button>
                            <Button
                              size="small"
                              color="error"
                              variant="outlined"
                              onClick={() => openDeleteConfirm(r)}
                            >
                              Xóa
                            </Button>
                          </>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}

                {!rows.length && (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Typography sx={{ py: 3 }} align="center" color="text.secondary">
                        Không có dữ liệu
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Stack direction="row" justifyContent="flex-end" sx={{ p: 2 }}>
            <Pagination
              page={page}
              count={totalPages}
              onChange={(_, p) => setPage(p)}
              color="primary"
            />
          </Stack>
        </Card>
      </Stack>

      {/* Create/Edit */}
      <FarmFormDialog
        open={openForm}
        onClose={() => setOpenForm(false)}
        mode={formMode}
        initial={current}
        onSubmit={handleSubmit}
      />

      {/* Delete confirm */}
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Xóa farm</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn chắc chắn muốn xóa farm <b>{current?.name}</b>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)} color="inherit" disabled={deleting}>
            Huỷ
          </Button>
          <Button onClick={handleDelete} variant="contained" color="error" disabled={deleting}>
            Xóa
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
