/* eslint-disable react-hooks/exhaustive-deps */
import orderBy from 'lodash/orderBy';
import { useCallback, useEffect, useMemo, useState } from 'react';

import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';

import { paths } from 'src/routes/paths';
import Iconify from 'src/components/iconify';
import EmptyContent from 'src/components/empty-content';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import axiosInstance from 'src/utils/axios';
import { Button } from '@mui/material';

// -------------------- TYPES --------------------
export type IUserLite = {
  id: number;
  username: string;
  full_name: string;
  roles?: string[]; // optional nếu API có trả
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
  employeeCount: number;
  manager: IUserLite | null;

  // optional nếu API trả members để show role chi tiết
  members?: IUserLite[];
};

type IListResponse = {
  page: number;
  limit: number;
  total: number;
  data: IDepartmentItem[];
};

const API_URL = '/api/departments';
type SortKey = 'latest' | 'oldest' | 'name_asc' | 'name_desc';

function pickRoleLabel(roles?: string[]) {
  const rs = (roles || []).map((x) => String(x).toUpperCase());
  if (rs.includes('ADMIN')) return { label: 'Admin', color: 'error' as const };
  if (rs.includes('MANAGER')) return { label: 'Quản lý', color: 'info' as const };
  if (rs.includes('STAFF')) return { label: 'Nhân viên', color: 'default' as const };
  if (rs.length) return { label: rs.join(', '), color: 'default' as const };
  return { label: '-', color: 'default' as const };
}

export function DepartmentUserListView() {
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const [sortBy, setSortBy] = useState<SortKey>('latest');
  const [search, setSearch] = useState('');

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
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="latest">Mới nhất</MenuItem>
            <MenuItem value="oldest">Cũ nhất</MenuItem>
            <MenuItem value="name_asc">Tên A→Z</MenuItem>
            <MenuItem value="name_desc">Tên Z→A</MenuItem>
          </Select>
        </Stack>
      </Stack>

      {notFound && <EmptyContent title="No Data" filled sx={{ py: 10 }} />}

      {/* READ-ONLY LIST */}
      <Stack spacing={2}>
        {dataFiltered.map((d) => {
          const mgrRole = pickRoleLabel(d.manager?.roles);

          return (
            <Card key={d.id} variant="outlined" sx={{ p: 2 }}>
              <Stack spacing={1}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1}
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                  justifyContent="space-between"
                >
                  <Stack spacing={0.2} sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle1" noWrap>
                      {d.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>
                      Code: {d.code}
                    </Typography>
                  </Stack>

                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Chip
                      size="small"
                      variant="outlined"
                      color={d.isDelete ? 'warning' : 'success'}
                      label={d.isDelete ? 'Đã xoá' : 'Đang hoạt động'}
                    />
                    <Chip size="small" color="info" variant="outlined" label={`Nhân viên: ${d.employeeCount ?? 0}`} />
                  </Stack>
                </Stack>

                <Divider />

                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  spacing={1}
                  justifyContent="space-between"
                  alignItems={{ xs: 'flex-start', md: 'center' }}
                >
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Quản lý:
                    </Typography>
                    <Typography variant="body2">
                      {d.manager?.full_name || 'Chưa gán'}
                    </Typography>

                    {/* ✅ role của manager (nếu API có roles) */}
                    {d.manager?.full_name && (
                      <Chip size="small" color={mgrRole.color} label={`Role: ${mgrRole.label}`} />
                    )}
                  </Stack>

                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Cập nhật: {d.updated_at ? new Date(d.updated_at).toLocaleString() : '-'}
                  </Typography>
                </Stack>

                {/* OPTIONAL: nếu API trả members[] thì show role theo user */}
                {Array.isArray(d.members) && d.members.length > 0 && (
                  <>
                    <Divider />
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {d.members.slice(0, 12).map((u) => {
                        const rr = pickRoleLabel(u.roles);
                        return (
                          <Chip
                            key={u.id}
                            size="small"
                            variant="outlined"
                            color={rr.color}
                            label={`${u.full_name} (${rr.label})`}
                          />
                        );
                      })}
                      {d.members.length > 12 && (
                        <Chip size="small" variant="outlined" label={`+${d.members.length - 12} người`} />
                      )}
                    </Stack>
                  </>
                )}
              </Stack>
            </Card>
          );
        })}
      </Stack>

      {/* pagination đơn giản (nếu bạn đã có component phân trang riêng thì thay ở đây) */}
      {totalPages > 1 && (
        <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 2 }}>
          <Button
            size="small"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Trước
          </Button>
          <Chip size="small" label={`${page}/${totalPages}`} />
          <Button
            size="small"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Sau
          </Button>
        </Stack>
      )}
    </Container>
  );
}
