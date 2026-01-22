/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useMemo, useState } from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import Iconify from 'src/components/iconify';
import axiosInstance from 'src/utils/axios';

type Props = {
  id: string;
};

type Employee = {
  id: number;
  username: string;
  full_name: string;
  email: string;
  phone?: string;
  status?: 'ACTIVE' | 'INACTIVE' | string;
  roles?: string[]; // ✅ thêm
};

const roleLabel = (roles?: string[]) => {
  const rs = (roles || []).map((x) => String(x).toUpperCase());
  if (rs.includes('ADMIN')) return { label: 'Admin', color: 'error' as const };
  if (rs.includes('MANAGER')) return { label: 'Quản lý', color: 'info' as const };
  if (rs.includes('STAFF')) return { label: 'Nhân viên', color: 'default' as const };
  if (rs.length) return { label: rs.join(', '), color: 'default' as const };
  return { label: '-', color: 'default' as const };
};

type Department = {
  id: number;
  farm_id: number;
  code: string;
  name: string;
  manager_user_id?: number | null;
  isDelete: boolean;
  created_at?: string;
  updated_at?: string;
  manager?: { id: number; full_name: string } | null;
  members?: Employee[];
};

const statusColor = (s?: string) => {
  if (!s) return 'default' as const;
  if (s === 'ACTIVE') return 'success' as const;
  if (s === 'INACTIVE') return 'warning' as const;
  return 'default' as const;
};

export default function DepartmentUserDetailPage({ id }: Props) {
  const theme = useTheme();
  const isSmDown = useMediaQuery(theme.breakpoints.down('sm'));
  const [loading, setLoading] = useState(true);
  const [resp, setResp] = useState<any>(null);

  // table state
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        const r = await axiosInstance.get(`/api/departments/${id}`);
        if (mounted) setResp(r.data);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [id]);

  const dept: Department | null = resp?.data ?? null;
  const members: any[] = dept?.members ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return members.filter((e) => {
      const okStatus = status === 'ALL' ? true : (e.status || '') === status;
      if (!okStatus) return false;

      if (!q) return true;

      const hay = [e.username, e.full_name, e.email, e.phone || '', String(e.id)]
        .join(' ')
        .toLowerCase();

      return hay.includes(q);
    });
  }, [members, search, status]);

  const paged = useMemo(() => {
    const start = page * rowsPerPage;
    const end = start + rowsPerPage;
    return filtered.slice(start, end);
  }, [filtered, page, rowsPerPage]);

  useEffect(() => {
    // khi filter/search đổi thì reset page
    setPage(0);
  }, [search, status]);

  if (loading) {
    return (
      <Container sx={{ py: 4 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <CircularProgress size={18} />
          <Typography>Loading...</Typography>
        </Stack>
      </Container>
    );
  }

  if (!dept) {
    return (
      <Container sx={{ py: 4 }}>
        <Typography>Không tìm thấy dữ liệu phòng ban/trang trại.</Typography>
      </Container>
    );
  }

  return (
    <Container sx={{ py: 4 }}>
      {/* Header */}
      <Stack spacing={0.5} sx={{ mb: 2.5 }}>
        <Typography variant="h4">{dept.name}</Typography>

        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <Chip size="small" label={`Code: ${dept.code}`} />
          <Chip
            size="small"
            variant="outlined"
            label={`Quản lý: ${dept.manager?.full_name || 'Chưa gán'}`}
          />
          <Chip
            size="small"
            color="info"
            variant="outlined"
            label={`Nhân viên: ${members.length}`}
          />
        </Stack>
      </Stack>

      {/* Info card */}
      <Card sx={{ mb: 2.5 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Thông tin
          </Typography>

          <Divider sx={{ mb: 2 }} />

          <Stack spacing={1}>
            <Stack direction="row" spacing={1}>
              <Typography sx={{ width: 120, color: 'text.secondary' }}>Trạng thái</Typography>
              <Chip
                size="small"
                color={dept.isDelete ? 'warning' : 'success'}
                label={dept.isDelete ? 'Đã xoá' : 'Đang hoạt động'}
              />
            </Stack>

            {dept.created_at && (
              <Stack direction="row" spacing={1}>
                <Typography sx={{ width: 120, color: 'text.secondary' }}>Ngày tạo</Typography>
                <Typography>{new Date(dept.created_at).toLocaleString()}</Typography>
              </Stack>
            )}

            {dept.updated_at && (
              <Stack direction="row" spacing={1}>
                <Typography sx={{ width: 120, color: 'text.secondary' }}>Ngày chỉnh sửa</Typography>
                <Typography>{new Date(dept.updated_at).toLocaleString()}</Typography>
              </Stack>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* members table */}
      <Card>
        <CardContent sx={{ pb: 1 }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={1.5}
            alignItems={{ xs: 'stretch', md: 'center' }}
            justifyContent="space-between"
          >
            <Typography variant="subtitle1">Danh sách nhân viên</Typography>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              sx={{ width: { xs: '100%', md: 520 } }}
            >
              <TextField
                size="small"
                fullWidth
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên, username, email, sđt..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="eva:search-fill" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                size="small"
                select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                sx={{ minWidth: 160 }}
              >
                <MenuItem value="ALL">Tất cả</MenuItem>
                <MenuItem value="ACTIVE">Hoạt động</MenuItem>
                <MenuItem value="INACTIVE">Không hoạt động</MenuItem>
              </TextField>
            </Stack>
          </Stack>
        </CardContent>

        <Divider />

        <TableContainer>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={1.5}
            alignItems={{ xs: 'stretch', md: 'center' }}
            justifyContent="space-between"
          >
            <Typography variant="subtitle1">Danh sách nhân viên</Typography>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              sx={{ width: { xs: '100%', md: 560 } }}
            >
              <TextField
                size="small"
                fullWidth
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên, username, email, sđt..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="eva:search-fill" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                size="small"
                select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                sx={{ minWidth: { xs: '100%', sm: 180 } }}
              >
                <MenuItem value="ALL">Tất cả</MenuItem>
                <MenuItem value="ACTIVE">Hoạt động</MenuItem>
                <MenuItem value="INACTIVE">Không hoạt động</MenuItem>
              </TextField>
            </Stack>
          </Stack>
        </TableContainer>

        <TablePagination
          component="div"
          count={filtered.length}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
          rowsPerPageOptions={[5, 10, 20, 50]}
          labelRowsPerPage="Hiển thị"
          sx={{
            '.MuiTablePagination-toolbar': {
              flexWrap: 'wrap',
              gap: 1,
              justifyContent: { xs: 'center', sm: 'flex-end' },
            },
          }}
        />
      </Card>
    </Container>
  );
}
