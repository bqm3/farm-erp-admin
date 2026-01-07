// src/sections/leave/view/leave-request-list-view.tsx
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
  MenuItem,
  IconButton,
  Tooltip,
  Chip,
  CircularProgress,
} from '@mui/material';
import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';

import {
  listLeaveRequests,
  approveLeaveRequest,
  rejectLeaveRequest,
  type LeaveRequest,
  type LeaveStatus,
  type LeaveType,
} from 'src/api/leave';

import LeaveRejectDialog from '../leave-reject-dialog';

// --- helpers ---
function toInt(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function fmtDate(d?: string | null) {
  if (!d) return '-';
  try {
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString('vi-VN');
  } catch {
    return d || '-';
  }
}

function statusChip(status?: string) {
  const s = status || '-';
  if (s === 'PENDING') return <Chip size="small" label="Chờ duyệt" />;
  if (s === 'APPROVED') return <Chip size="small" label="Đã duyệt" color="success" />;
  if (s === 'REJECTED') return <Chip size="small" label="Từ chối" color="error" />;
  return <Chip size="small" label={s} variant="outlined" />;
}

function typeLabel(t?: string) {
  if (t === 'PAID') return 'Nghỉ phép (có lương)';
  if (t === 'UNPAID') return 'Nghỉ không lương';
  if (t === 'SICK') return 'Nghỉ ốm';
  return t || '-';
}

type Props = {
  // Truyền từ auth context của bạn
  canApprove?: boolean; // requireAccountantOrAdmin
  canReject?: boolean; // requireAdmin
};

export default function LeaveRequestListView({ canApprove = false, canReject = false }: Props) {
  const { enqueueSnackbar } = useSnackbar();

  const [loading, setLoading] = useState(false);

  // filters
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<LeaveStatus | ''>('PENDING');
  const [leaveType, setLeaveType] = useState<LeaveType | ''>('');
  const [from, setFrom] = useState<string>(''); // YYYY-MM-DD
  const [to, setTo] = useState<string>(''); // YYYY-MM-DD

  // paging
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [rows, setRows] = useState<LeaveRequest[]>([]);
  const [count, setCount] = useState(0);

  // reject dialog
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectId, setRejectId] = useState<number | null>(null);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(count / pageSize)), [count]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listLeaveRequests({
        q: q || undefined,
        status: status || undefined,
        leave_type: leaveType || undefined,
        from: from || undefined,
        to: to || undefined,
        page,
        pageSize,
      });

      if (!res?.ok) throw new Error('Không lấy được danh sách đơn nghỉ');
      setRows(res.rows || []);
      setCount(toInt(res.count, 0));
    } catch (err: any) {
      enqueueSnackbar(err?.message || 'Lỗi tải danh sách', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar, q, status, leaveType, from, to, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // reset page khi đổi filter
  useEffect(() => {
    setPage(1);
  }, [q, status, leaveType, from, to]);

  const handleApprove = async (id: number) => {
    try {
      const res = await approveLeaveRequest(id);
      if (!res?.ok) throw new Error(res?.error || 'Duyệt thất bại');
      enqueueSnackbar('Duyệt đơn thành công', { variant: 'success' });
      fetchData();
    } catch (err: any) {
      enqueueSnackbar(err?.message || 'Duyệt thất bại', { variant: 'error' });
    }
  };

  const openReject = (id: number) => {
    setRejectId(id);
    setRejectOpen(true);
  };

  const handleRejectSubmit = async (note: string) => {
    if (!rejectId) return;
    const res = await rejectLeaveRequest(rejectId, { note }); // backend có thể ignore field note
    if (!res?.ok) throw new Error(res?.error || 'Từ chối thất bại');
    enqueueSnackbar('Đã từ chối đơn', { variant: 'success' });
    fetchData();
  };

  return (
    <Container maxWidth="xl">
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h4">Đơn nghỉ phép</Typography>
        <Button
          variant="outlined"
          onClick={fetchData}
          startIcon={<Iconify icon="solar:refresh-bold" />}
          disabled={loading}
        >
          Tải lại
        </Button>
      </Stack>

      <Card sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
          <TextField
            label="Tìm kiếm"
            placeholder="Tên / email / mã nhân viên..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            fullWidth
          />

          <TextField
            label="Trạng thái"
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            select
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">Tất cả</MenuItem>
            <MenuItem value="PENDING">Chờ duyệt</MenuItem>
            <MenuItem value="APPROVED">Đã duyệt</MenuItem>
            <MenuItem value="REJECTED">Từ chối</MenuItem>
          </TextField>

          <TextField
            label="Loại nghỉ"
            value={leaveType}
            onChange={(e) => setLeaveType(e.target.value as any)}
            select
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">Tất cả</MenuItem>
            <MenuItem value="PAID">Nghỉ phép (có lương)</MenuItem>
            <MenuItem value="UNPAID">Nghỉ không lương</MenuItem>
            <MenuItem value="SICK">Nghỉ ốm</MenuItem>
          </TextField>

          <TextField
            label="Từ ngày"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 170 }}
          />
          <TextField
            label="Đến ngày"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 170 }}
          />

          <Button
            sx={{ minWidth: 100 }}
            variant="contained"
            color="info"
            onClick={() => {
              setQ('');
              setStatus('');
              setLeaveType('');
              setFrom('');
              setTo('');
            }}
          >
            Xóa lọc
          </Button>
        </Stack>
      </Card>

      <Card>
        <TableContainer sx={{ position: 'relative' }}>
          {loading && (
            <Stack
              alignItems="center"
              justifyContent="center"
              sx={{
                position: 'absolute',
                inset: 0,
                bgcolor: 'rgba(0,0,0,0.04)',
                zIndex: 2,
              }}
            >
              <CircularProgress />
            </Stack>
          )}

          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nhân viên</TableCell>
                <TableCell>Loại nghỉ</TableCell>
                <TableCell>Từ ngày</TableCell>
                <TableCell>Đến ngày</TableCell>
                <TableCell>Số ngày</TableCell>
                <TableCell>Lý do</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell align="right">Thao tác</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {rows.map((r) => {
                const employeeText =
                  r.employee?.full_name || r.employee?.email || r.employee?.code || `#${r.employee_id}`;

                const canAct = r.status === 'PENDING';

                return (
                  <TableRow key={r.id} hover>
                    <TableCell>{employeeText}</TableCell>
                    <TableCell>{typeLabel(r.leave_type)}</TableCell>
                    <TableCell>{fmtDate(r.from_date)}</TableCell>
                    <TableCell>{fmtDate(r.to_date)}</TableCell>
                    <TableCell>{r.total_days}</TableCell>
                    <TableCell sx={{ maxWidth: 320 }}>
                      <Typography variant="body2" noWrap title={r.reason || ''}>
                        {r.reason || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>{statusChip(r.status)}</TableCell>

                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Tooltip title="Duyệt">
                          <span>
                            <IconButton
                              color="success"
                              disabled={!canApprove || !canAct}
                              onClick={() => handleApprove(r.id)}
                            >
                              <Iconify icon="solar:check-circle-bold" />
                            </IconButton>
                          </span>
                        </Tooltip>

                        <Tooltip title="Từ chối">
                          <span>
                            <IconButton
                              color="error"
                              disabled={!canReject || !canAct}
                              onClick={() => openReject(r.id)}
                            >
                              <Iconify icon="solar:close-circle-bold" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}

              {!loading && rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9}>
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

          <Pagination
            page={page}
            count={totalPages}
            onChange={(_, v) => setPage(v)}
            color="primary"
          />
        </Stack>
      </Card>

      <LeaveRejectDialog
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        requestId={rejectId}
        onSubmit={handleRejectSubmit}
      />
    </Container>
  );
}
