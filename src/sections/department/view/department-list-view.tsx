import orderBy from 'lodash/orderBy';
import { useCallback, useEffect, useMemo, useState } from 'react';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import Iconify from 'src/components/iconify';
import EmptyContent from 'src/components/empty-content';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import axiosInstance from 'src/utils/axios';
import { updateDepartment } from 'src/api/department';
import { getUsersAndManagersByFarm } from 'src/api/user';
import { useSnackbar } from 'src/components/snackbar';

import DepartmentList from '../department-list';
import DepartmentEditDialog from '../department-edit-dialog';
import DepartmentCreateDialog from '../department-create-dialog';

// -------------------- TYPES --------------------
export type IUserLite = {
  id: number;
  username: string;
  full_name: string;
};

export type IDepartmentItem = {
  id: number;
  farm_id: number;
  code: string;
  name: string;
  manager_user_id: number | null;
  isDelete: boolean;
  created_at: string;
  updated_at: string;
  memberCount: number;
  manager: IUserLite | null;
};

type IListResponse = {
  page: number;
  limit: number;
  total: number;
  data: IDepartmentItem[];
};

const API_URL = '/api/departments';
type SortKey = 'latest' | 'oldest' | 'name_asc' | 'name_desc';

export function DepartmentListView() {
  const { enqueueSnackbar } = useSnackbar();

  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const [sortBy, setSortBy] = useState<SortKey>('latest');
  const [search, setSearch] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [current, setCurrent] = useState<any>(null);
  const [currentIdDepartment, setCurrentIdDepartment] = useState<number | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState<IListResponse>({
    page: 1,
    limit: 20,
    total: 0,
    data: [],
  });

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(resp.total / resp.limit)),
    [resp.total, resp.limit]
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search: search.trim(),
        sort: sortBy,
      });

      const r = await axiosInstance.get(`${API_URL}?${qs.toString()}`);
      setResp(r.data);
    } catch (e) {
      console.error(e);
      setResp((prev) => ({ ...prev, total: 0, data: [] }));
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, sortBy]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openEdit = useCallback(async (id: number) => {
    setEditLoading(true);
    setEditOpen(true);
    setCurrentIdDepartment(id);

    try {
      // 1) lấy detail khu vực
      const deptRes = await axiosInstance.get(`${API_URL}/${id}`);
      const dept = deptRes.data?.data ?? deptRes.data;

      // 2) lấy users + managers theo farm
      // farm_id phải có trong dept
      const farmRes = await getUsersAndManagersByFarm(Number(dept.farm_id));

      // 3) attach list vào current để dialog dùng
      setCurrent({
        ...dept,
        users: farmRes.data?.users ?? [],
        managers: farmRes.data?.managers ?? [],
        farm: farmRes.data?.farm ?? null,
      });
    } catch (e) {
      console.error(e);
      setCurrent(null);
    } finally {
      setEditLoading(false);
    }
  }, []);

  const closeEdit = useCallback(() => {
    setEditOpen(false);
    setCurrent(null);
    setCurrentIdDepartment(null);
  }, []);

  const handleSubmit = useCallback(
    async (payload: any) => {
      if (!currentIdDepartment) return;

      await updateDepartment(currentIdDepartment, payload);
      enqueueSnackbar('Cập nhật khu vực thành công', { variant: 'success' });

      fetchData();
      closeEdit();
    },
    [currentIdDepartment, enqueueSnackbar, fetchData, closeEdit]
  );

  const openCreate = useCallback(() => setCreateOpen(true), []);
  const closeCreate = useCallback(() => setCreateOpen(false), []);

  const submitCreate = useCallback(
    async (payload: any) => {
      setCreateLoading(true);
      try {
        await axiosInstance.post(API_URL, payload);
        setCreateOpen(false);
        fetchData();
      } finally {
        setCreateLoading(false);
      }
    },
    [fetchData]
  );

  const dataFiltered = useMemo(() => {
    let input = [...(resp.data || [])];
    const q = search.trim().toLowerCase();
    if (q) input = input.filter((x) => `${x.code} ${x.name}`.toLowerCase().includes(q));

    switch (sortBy) {
      case 'latest':
        input = orderBy(input, [(x) => new Date(x.created_at).getTime()], ['desc']);
        break;
      case 'oldest':
        input = orderBy(input, [(x) => new Date(x.created_at).getTime()], ['asc']);
        break;
      case 'name_asc':
        input = orderBy(input, ['name'], ['asc']);
        break;
      case 'name_desc':
        input = orderBy(input, ['name'], ['desc']);
        break;
      default:
        break;
    }
    return input;
  }, [resp.data, search, sortBy]);

  const notFound = !loading && dataFiltered.length === 0;

  return (
    <Container maxWidth={false}>
      <CustomBreadcrumbs
        heading="Danh sách khu vực"
        links={[{ name: 'Dashboard', href: paths.dashboard.root }, { name: 'Khu vực' }]}
        action={
          <Button
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={openCreate}
          >
            Tạo khu vực
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {/* Filters */}
      <Stack
        spacing={2}
        direction={{ xs: 'column', md: 'row' }}
        alignItems={{ xs: 'stretch', md: 'center' }}
        justifyContent="space-between"
        sx={{ mb: { xs: 3, md: 4 } }}
      >
        <TextField
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          placeholder="Tìm theo mã / tên khu vực..."
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="eva:search-fill" />
              </InputAdornment>
            ),
          }}
        />

        <Stack direction="row" spacing={1} flexShrink={0} alignItems="center">
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Sắp xếp:
          </Typography>
          <Select
            size="small"
            value={sortBy}
            onChange={(e) => {
              setPage(1);
              setSortBy(e.target.value as SortKey);
            }}
          >
            <MenuItem value="latest">Mới nhất</MenuItem>
            <MenuItem value="oldest">Cũ nhất</MenuItem>
            <MenuItem value="name_asc">Tên A→Z</MenuItem>
            <MenuItem value="name_desc">Tên Z→A</MenuItem>
          </Select>
        </Stack>
      </Stack>

      {notFound && <EmptyContent title="No Data" filled sx={{ py: 10 }} />}

      <DepartmentList
        farms={dataFiltered}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        onEditRow={openEdit}
      />

      <DepartmentEditDialog
        open={editOpen}
        loading={editLoading}
        data={current}
        onClose={closeEdit}
        onSubmit={handleSubmit}
      />

      <DepartmentCreateDialog
        open={createOpen}
        loading={createLoading}
        onClose={closeCreate}
        onSubmit={submitCreate}
      />
    </Container>
  );
}
