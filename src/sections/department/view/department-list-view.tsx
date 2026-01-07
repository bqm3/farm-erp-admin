'use client';

import orderBy from 'lodash/orderBy';
import { useCallback, useEffect, useMemo, useState } from 'react';
// @mui
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Typography from '@mui/material/Typography';
// routes
import { paths } from 'src/routes/paths';
// components
import Iconify from 'src/components/iconify';
import EmptyContent from 'src/components/empty-content';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';

import axiosInstance from 'src/utils/axios';

import FarmList from '../department-list';
import DepartmentEditDialog from '../department-edit-dialog';
import DepartmentCreateDialog from '../department-create-dialog';

// -------------------- TYPES --------------------
export type IFarmManager = {
  id: number;
  username: string;
  full_name: string;
};

export type IFarmItem = {
  id: number;
  farm_id: number;
  code: string;
  name: string;
  manager_user_id: number | null;
  isDelete: boolean;
  created_at: string;
  updated_at: string;
  employeeCount: number;
  manager: IFarmManager | null;
};

type IFarmListResponse = {
  page: number;
  limit: number;
  total: number;
  data: IFarmItem[];
};

// -------------------- CONFIG --------------------
const API_URL = '/api/departments';
type SortKey = 'latest' | 'oldest' | 'name_asc' | 'name_desc';

// -------------------- COMPONENT --------------------
export default function FarmListView() {
  // server state
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  // ui state
  const [sortBy, setSortBy] = useState<SortKey>('latest');
  const [search, setSearch] = useState('');

  // edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [current, setCurrent] = useState<any>(null);

  // create dialog ✅
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  // data state
  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState<IFarmListResponse>({
    page: 1,
    limit: 20,
    total: 0,
    data: [],
  });

  const totalPages = useMemo(() => Math.max(1, Math.ceil(resp.total / resp.limit)), [resp.total, resp.limit]);

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
    try {
      const r = await axiosInstance.get(`/api/departments/${id}`);
      // NOTE: endpoint detail của bạn đang trả { data: {...}, userCount: ... }
      setCurrent(r.data?.data ?? r.data);
    } finally {
      setEditLoading(false);
    }
  }, []);

  const closeEdit = useCallback(() => {
    setEditOpen(false);
    setCurrent(null);
  }, []);

  const submitEdit = useCallback(
    async (payload: any) => {
      if (!current?.id) return;
      const r = await axiosInstance.put(`/api/departments/${current.id}`, payload);
      setCurrent(r.data?.data ?? r.data);
      fetchData(); // ✅ refresh list
    },
    [current?.id, fetchData]
  );

  // create handlers ✅
  const openCreate = useCallback(() => setCreateOpen(true), []);
  const closeCreate = useCallback(() => setCreateOpen(false), []);

  const submitCreate = useCallback(
    async (payload: any) => {
      setCreateLoading(true);
      try {
        await axiosInstance.post(`/api/departments`, payload);
        setCreateOpen(false);
        fetchData(); // ✅ refresh list
      } finally {
        setCreateLoading(false);
      }
    },
    [fetchData]
  );

  // local fallback
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

  const handleSearchChange = useCallback((v: string) => {
    setPage(1);
    setSearch(v);
  }, []);

  const handleSortChange = useCallback((v: SortKey) => {
    setPage(1);
    setSortBy(v);
  }, []);

  const handlePageChange = useCallback((nextPage: number) => {
    setPage(nextPage);
  }, []);

  return (
    <Container maxWidth={false}>
      <CustomBreadcrumbs
        heading="Danh sách trang trại"
        links={[{ name: 'Dashboard', href: paths.dashboard.root }, { name: 'List' }]}
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
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent="space-between"
        sx={{ mb: { xs: 3, md: 4 } }}
      >
        <TextField
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Tìm theo mã / tên trang trại..."
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
          <Select size="small" value={sortBy} onChange={(e) => handleSortChange(e.target.value as SortKey)}>
            <MenuItem value="latest">Mới nhất</MenuItem>
            <MenuItem value="oldest">Cũ nhất</MenuItem>
            <MenuItem value="name_asc">Tên A→Z</MenuItem>
            <MenuItem value="name_desc">Tên Z→A</MenuItem>
          </Select>
        </Stack>
      </Stack>

      {notFound && <EmptyContent title="No Data" filled sx={{ py: 10 }} />}

      <FarmList
        farms={dataFiltered}
        page={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        onEditRow={openEdit}
      />

      <DepartmentEditDialog
        open={editOpen}
        loading={editLoading}
        data={current}
        onClose={closeEdit}
        onSubmit={submitEdit}
      />

      {/* ✅ Create dialog */}
      <DepartmentCreateDialog
        open={createOpen}
        loading={createLoading}
        onClose={closeCreate}
        onSubmit={submitCreate}
      />
    </Container>
  );
}
