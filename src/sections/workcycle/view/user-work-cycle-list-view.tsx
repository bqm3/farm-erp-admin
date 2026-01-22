// src/sections/work-cycle/view/work-cycle-list-view.tsx

import { useCallback, useEffect, useState } from 'react';
import {
  Container,
  Card,
  Stack,
  Button,
  TextField,
  Pagination,
  Typography,
  Grid,
  Divider,
  IconButton,
  Tooltip,
  Box,
} from '@mui/material';
import Iconify from 'src/components/iconify';
import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';
import Label from 'src/components/label';

import {
  listWorkCycles,
  createWorkCycle,
  updateWorkCycle,
  type WorkCycle,
  type WorkCycleCreatePayload,
} from 'src/api/workcycle';
import { useAuthContext } from 'src/auth/hooks';
import { useSnackbar } from 'src/components/snackbar';

import WorkCycleEditDialog from '../work-cycle-edit-dialog';

function InfoRow({ label, value }: { label: string; value: any }) {
  return (
    <Stack direction="row" spacing={1} sx={{ minWidth: 0 }}>
      <Typography variant="body2" sx={{ color: 'text.secondary', flexShrink: 0 }}>
        {label}:
      </Typography>
      <Typography
        variant="body2"
        sx={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
      >
        {value ?? '-'}
      </Typography>
    </Stack>
  );
}

export default function WorkCycleListView() {
  const router = useRouter();
  const { user } = useAuthContext();
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

  const handleView = (id: number) => {
    router.push(paths.dashboard.workcycle?.detail_user?.(String(id)) || `/dashboard/work-cycles/${id}/user`);
  };

  return (
    <Container maxWidth="xl">
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5">Danh sách công việc của {user?.full_name}</Typography>
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

      {/* ✅ Mobile-first: card list */}
      <Grid container spacing={2}>
        {rows.map((r) => {
          const isOpen = r.status === 'OPEN';
          const deptText = r.department
            ? `${r.department.code} - ${r.department.name}`
            : r.department_id;
          const speciesText = r.species ? r.species.name : r.species_id;

          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={r.id}>
              <Card sx={{ p: 2 }}>
                <Stack spacing={1.25}>
                  <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle1" noWrap>
                        {r.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>
                        {r.code}
                      </Typography>
                    </Box>

                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Label color={isOpen ? 'success' : 'warning'}>
                        {isOpen ? 'Đang hoạt động' : 'Đã đóng'}
                      </Label>

                      <Tooltip title="Chi tiết">
                        <IconButton onClick={() => handleView(r.id)} size="small">
                          <Iconify icon="solar:eye-bold" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>

                  <Divider />

                  <Stack spacing={0.75}>
                    <InfoRow label="Khu vực" value={deptText} />
                    <InfoRow label="Giống/loài" value={speciesText} />
                    <InfoRow label="Số lượng" value={Number(r.current_quantity) || 0} />
                  </Stack>

                  <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ pt: 0.5 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => handleView(r.id)}
                      startIcon={<Iconify icon="solar:eye-bold" />}
                    >
                      Chi tiết
                    </Button>
                  </Stack>
                </Stack>
              </Card>
            </Grid>
          );
        })}

        {rows.length === 0 && !loading && (
          <Grid item xs={12}>
            <Card sx={{ p: 4 }}>
              <Typography align="center">Không có dữ liệu</Typography>
            </Card>
          </Grid>
        )}
      </Grid>

      <Stack alignItems="flex-end" sx={{ py: 2 }}>
        <Pagination page={page} count={totalPages} onChange={(_, p) => setPage(p)} />
      </Stack>

      <WorkCycleEditDialog
        open={openEdit}
        onClose={handleCloseEdit}
        onSubmit={handleSubmit}
        initial={editing}
      />
    </Container>
  );
}
