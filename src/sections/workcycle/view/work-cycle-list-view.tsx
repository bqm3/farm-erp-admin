// src/sections/work-cycle/view/work-cycle-list-view.tsx

import { useCallback, useEffect, useState } from 'react';
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
  IconButton,
  Tooltip,
  TableContainer,
  Pagination,
  Typography,
} from '@mui/material';
import Iconify from 'src/components/iconify';
import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';

import {
  listWorkCycles,
  createWorkCycle,
  updateWorkCycle,
  deleteWorkCycle,
  type WorkCycle,
  type WorkCycleCreatePayload,
} from 'src/api/workcycle';

import { useSnackbar } from 'src/components/snackbar';

import WorkCycleEditDialog from '../work-cycle-edit-dialog';

export default function WorkCycleListView() {
  const router = useRouter();

  const { enqueueSnackbar } = useSnackbar();

  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const [rows, setRows] = useState<WorkCycle[]>([]);
  const [total, setTotal] = useState(0);

  const [openEdit, setOpenEdit] = useState(false);
  const [editing, setEditing] = useState<WorkCycle | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listWorkCycles({ page, limit, search });
      setRows(res.data || []);
      setTotal(res.total || 0);
    } catch (err: any) {
      enqueueSnackbar(err?.message || 'Load failed!', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, enqueueSnackbar]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenCreate = () => {
    setEditing(null);
    setOpenEdit(true);
  };

  const handleOpenEdit = (row: WorkCycle) => {
    setEditing(row);
    setOpenEdit(true);
  };

  const handleCloseEdit = () => setOpenEdit(false);

  const handleSubmit = async (payload: WorkCycleCreatePayload) => {
    try {
      if (editing?.id) {
        await updateWorkCycle(editing.id, payload);
        enqueueSnackbar('Thay đổi thành công!', { variant: 'success' });
      } else {
        await createWorkCycle(payload);
        enqueueSnackbar('Tạo mới thành công!', { variant: 'success' });
      }
      setOpenEdit(false);
      await fetchData();
    } catch (err: any) {
      enqueueSnackbar(err?.message || 'Lưu thất bại!', { variant: 'error' });
    }
  };

  const handleDelete = async (id: number) => {
    const ok = window.confirm('Xoá chu kỳ làm việc này?');
    if (!ok) return;

    try {
      await deleteWorkCycle(id);
      enqueueSnackbar('Xoá thành công!', { variant: 'success' });
      await fetchData();
    } catch (err: any) {
      enqueueSnackbar(err?.message || 'Xoá thất bại!', { variant: 'error' });
    }
  };

  const handleView = (id: number) => {
    router.push(paths.dashboard.workcycle?.details?.(String(id)) || `/dashboard/work-cycles/${id}`);
  };

  return (
    <Container maxWidth="xl">
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5">Danh sách chuồng / Work Cycles</Typography>

        <Button
          variant="contained"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={handleOpenCreate}
        >
          Tạo chuồng
        </Button>
      </Stack>

      <Card sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
          <TextField
            fullWidth
            label="Tìm kiếm (code/name/...)"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <Button variant="outlined" onClick={fetchData} disabled={loading}>
            Lọc
          </Button>
        </Stack>
      </Card>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Code</TableCell>
                <TableCell>Tên</TableCell>
                <TableCell>Khu vực</TableCell>
                <TableCell>Giống/loài</TableCell>
                <TableCell align="right">Số lượng</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell width={140} align="right">
                  Hành động
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell>{r.code}</TableCell>
                  <TableCell>{r.name}</TableCell>
                  <TableCell>
                    {r.department ? `${r.department.code} - ${r.department.name}` : r.department_id}
                  </TableCell>
                  <TableCell>{r.species ? r.species.name : r.species_id}</TableCell>
                  <TableCell align="right">{r.current_quantity}</TableCell>
                  <TableCell>{r.status}</TableCell>

                  <TableCell align="right">
                    <Tooltip title="Chi tiết">
                      <IconButton onClick={() => handleView(r.id)}>
                        <Iconify icon="solar:eye-bold" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Sửa">
                      <IconButton onClick={() => handleOpenEdit(r)}>
                        <Iconify icon="solar:pen-bold" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Xoá">
                      <IconButton color="error" onClick={() => handleDelete(r.id)}>
                        <Iconify icon="solar:trash-bin-trash-bold" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}

              {rows.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    Không có dữ liệu
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Stack alignItems="flex-end" sx={{ py: 2 }}>
          <Pagination page={page} count={totalPages} onChange={(_, p) => setPage(p)} />
        </Stack>
      </Card>

      <WorkCycleEditDialog
        open={openEdit}
        onClose={handleCloseEdit}
        onSubmit={handleSubmit}
        initial={editing}
      />
    </Container>
  );
}
