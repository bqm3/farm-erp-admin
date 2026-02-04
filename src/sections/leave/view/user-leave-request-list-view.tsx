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
  Box,
  Divider,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

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
import LeaveCreateDialog from '../leave-create-dialog';
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
  // if (t === 'SICK') return 'Nghỉ ốm';
  return t || '-';
}

type Props = {
  // quyền duyệt/từ chối: admin/accountant... (user thường = false)
  canApprove?: boolean;
  canReject?: boolean;

  // quyền tạo đơn: user thường = true
  canCreate?: boolean;
};

function LeaveCardItem({
  r,
  showActions,
  canApprove,
  canReject,
  onApprove,
  onReject,
}: {
  r: LeaveRequest;
  showActions: boolean;
  canApprove: boolean;
  canReject: boolean;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
}) {
  const employeeText =
    r.employee?.full_name || r.employee?.email || r.employee?.code || `#${r.employee_id}`;

  const canAct = r.status === 'PENDING';

  return (
    <Card variant="outlined" sx={{ p: 1.5 }}>
      <Stack spacing={1}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
          <Stack spacing={0.25} sx={{ minWidth: 0 }}>
            <Typography variant="subtitle2" noWrap title={employeeText}>
              {employeeText}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {typeLabel(r.leave_type)}
            </Typography>
          </Stack>

          {statusChip(r.status)}
        </Stack>

        <Divider />

        <Stack direction="row" spacing={2} justifyContent="space-between">
          <Stack>
            <Typography variant="caption" color="text.secondary">
              Từ ngày
            </Typography>
            <Typography variant="body2">{fmtDate(r.from_date)}</Typography>
          </Stack>
          <Stack>
            <Typography variant="caption" color="text.secondary">
              Đến ngày
            </Typography>
            <Typography variant="body2">{fmtDate(r.to_date)}</Typography>
          </Stack>
          <Stack alignItems="flex-end">
            <Typography variant="caption" color="text.secondary">
              Số ngày
            </Typography>
            <Typography variant="body2">
              <b>{Number(r.total_days)}</b>
            </Typography>
          </Stack>
        </Stack>

        <Stack spacing={0.25}>
          <Typography variant="caption" color="text.secondary">
            Lý do
          </Typography>
          <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
            {r.reason || '-'}
          </Typography>
        </Stack>

        {showActions && (
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button
              size="small"
              color="success"
              variant="contained"
              startIcon={<Iconify icon="solar:check-circle-bold" />}
              disabled={!canApprove || !canAct}
              onClick={() => onApprove(r.id)}
            >
              Duyệt
            </Button>

            <Button
              size="small"
              color="error"
              variant="outlined"
              startIcon={<Iconify icon="solar:close-circle-bold" />}
              disabled={!canReject || !canAct}
              onClick={() => onReject(r.id)}
            >
              Từ chối
            </Button>
          </Stack>
        )}
      </Stack>
    </Card>
  );
}

export default function LeaveRequestListView({
  canApprove = false,
  canReject = false,
  canCreate = true, // ✅ user role: chỉ tạo mới
}: Props) {
  const { enqueueSnackbar } = useSnackbar();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

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

  const showActions = canApprove || canReject; // ✅ user role => false => không thấy action

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
    const res = await rejectLeaveRequest(rejectId, { note });
    if (!res?.ok) throw new Error(res?.error || 'Từ chối thất bại');
    enqueueSnackbar('Đã từ chối đơn', { variant: 'success' });
    fetchData();
  };

  return (
    <Container maxWidth="xl">
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1.5}
        alignItems={{ md: 'center' }}
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Typography variant="h4">Đơn nghỉ phép</Typography>

        <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              onClick={() => setCreateOpen(true)}
              startIcon={<Iconify icon="solar:add-circle-bold" />}
            >
              Tạo đơn
            </Button>

          <Button
            variant="outlined"
            onClick={fetchData}
            startIcon={<Iconify icon="solar:refresh-bold" />}
            disabled={loading}
          >
            Tải lại
          </Button>
        </Stack>
      </Stack>

      {/* Filters */}
      <Card sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
          <TextField
            label="Tìm kiếm"
            placeholder="Tên / email / mã nhân viên..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            fullWidth
            size='small'
          />
          <TextField
            label="Từ ngày"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 170 }}
            size='small'
          />
          <TextField
            label="Đến ngày"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 170 }}
            size='small'
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

      {/* List */}
      <Card sx={{ position: 'relative' }}>
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

        {/* ✅ Mobile: Card list */}
        {isMobile ? (
          <Box sx={{ p: 2 }}>
            <Stack spacing={1.5}>
              {rows.map((r) => (
                <LeaveCardItem
                  key={r.id}
                  r={r}
                  showActions={showActions}
                  canApprove={canApprove}
                  canReject={canReject}
                  onApprove={handleApprove}
                  onReject={openReject}
                />
              ))}

              {!loading && rows.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ py: 3 }} align="center">
                  Không có dữ liệu
                </Typography>
              )}
            </Stack>
          </Box>
        ) : (
          /* ✅ Desktop: Table */
          <TableContainer>
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
                  {showActions && <TableCell align="right">Thao tác</TableCell>}
                </TableRow>
              </TableHead>

              <TableBody>
                {rows.map((r) => {
                  const employeeText =
                    r.employee?.full_name ||
                    r.employee?.email ||
                    r.employee?.code ||
                    `#${r.employee_id}`;

                  const canAct = r.status === 'PENDING';

                  return (
                    <TableRow key={r.id} hover>
                      <TableCell>{employeeText}</TableCell>
                      <TableCell>{typeLabel(r.leave_type)}</TableCell>
                      <TableCell>{fmtDate(r.from_date)}</TableCell>
                      <TableCell>{fmtDate(r.to_date)}</TableCell>
                      <TableCell>{Number(r.total_days)}</TableCell>
                      <TableCell sx={{ maxWidth: 320 }}>
                        <Typography variant="body2" noWrap title={r.reason || ''}>
                          {r.reason || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>{statusChip(r.status)}</TableCell>

                      {showActions && (
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
                      )}
                    </TableRow>
                  );
                })}

                {!loading && rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={showActions ? 8 : 7}>
                      <Typography variant="body2" color="text.secondary" sx={{ py: 3 }} align="center">
                        Không có dữ liệu
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Tổng: <b>{count}</b>
          </Typography>

          <Pagination page={page} count={totalPages} onChange={(_, v) => setPage(v)} color="primary" />
        </Stack>
      </Card>

      {/* dialogs */}
      <LeaveRejectDialog
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        requestId={rejectId}
        onSubmit={handleRejectSubmit}
      />

      <LeaveCreateDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        // ✅ user chỉ tạo cho mình => false
        canCreateForOthers={false}
        onCreated={fetchData}
      />
    </Container>
  );
}
