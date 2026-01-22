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
  listAdvances,
  approveAdvance,
  rejectAdvance,
  type AdvanceRow,
  type AdvanceStatus,
} from 'src/api/advance';
import AdvanceCreateDialog from '../advance-create-dialog';

function statusChip(s: AdvanceStatus) {
  if (s === 'SUBMITTED') return <Chip label="Chờ duyệt" size="small" color="info" />;
  if (s === 'APPROVED') return <Chip label="Đã duyệt" size="small" color="success" />;
  return <Chip label="Từ chối" size="small" color="error" />;
}

export default function AdvanceListView({ canApprove }: { canApprove?: boolean }) {
  const { enqueueSnackbar } = useSnackbar();

  const [createOpen, setCreateOpen] = useState(false);

  const [rows, setRows] = useState<AdvanceRow[]>([]);
  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [status, setStatus] = useState<AdvanceStatus | ''>('');
  const [q, setQ] = useState('');

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [selected, setSelected] = useState<AdvanceRow | null>(null);

  const [approveOpen, setApproveOpen] = useState(false);
  const [approveRow, setApproveRow] = useState<AdvanceRow | null>(null);

  const loadData = useCallback(async () => {
    const res = await listAdvances({ page, pageSize, status, q });
    if (!res.ok) throw new Error('Load failed');
    setRows(res.data.rows);
    setTotal(res.data.total);
  }, [page, pageSize, status, q]);

  useEffect(() => {
    loadData().catch((e) => enqueueSnackbar(e.message, { variant: 'error' }));
  }, [loadData, enqueueSnackbar]);

  const pageCount = useMemo(() => Math.ceil(total / pageSize), [total, pageSize]);

  const onApprove = (r: AdvanceRow) => {
    setApproveRow(r);
    setApproveOpen(true);
  };

  const onConfirmApprove = async () => {
    if (!approveRow) return;
    try {
      const res = await approveAdvance(approveRow.id);
      if (!res.ok) throw new Error(res.message || 'Duyệt thất bại');
      enqueueSnackbar('Đã duyệt', { variant: 'success' });
      setApproveOpen(false);
      setApproveRow(null);
      loadData();
    } catch (e: any) {
      enqueueSnackbar(e.message, { variant: 'error' });
    }
  };

  const onOpenReject = (r: AdvanceRow) => {
    setSelected(r);
    setRejectReason('');
    setRejectOpen(true);
  };

  const onReject = async () => {
    if (!selected) return;
    try {
      const res = await rejectAdvance(selected.id, rejectReason || 'Không đạt');
      if (!res.ok) throw new Error(res.message || 'Từ chối thất bại');
      enqueueSnackbar('Đã từ chối', { variant: 'success' });
      setRejectOpen(false);
      loadData();
    } catch (e: any) {
      enqueueSnackbar(e.message, { variant: 'error' });
    }
  };

  return (
    <Container maxWidth="xl">
      <Stack spacing={2}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h4">Ứng lương</Typography>

          {/* Staff cũng thấy nút tạo; admin/HR vẫn có thể tạo nếu bạn muốn */}
          <Button variant="contained" onClick={() => setCreateOpen(true)}>
            Tạo phiếu
          </Button>
        </Stack>

        <Card sx={{ p: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Tìm kiếm"
              placeholder="Mã phiếu / ghi chú"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              fullWidth
            />
            <TextField
              select
              label="Trạng thái"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as any);
                setPage(1);
              }}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="">Tất cả</MenuItem>
              <MenuItem value="SUBMITTED">Chờ duyệt</MenuItem>
              <MenuItem value="APPROVED">Đã duyệt</MenuItem>
              <MenuItem value="REJECTED">Từ chối</MenuItem>
            </TextField>
          </Stack>
        </Card>

        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Mã</TableCell>
                  <TableCell>Nhân viên</TableCell>
                  <TableCell>Ngày</TableCell>
                  <TableCell align="right">Số tiền</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell>Ghi chú</TableCell>
                  <TableCell align="right">Thao tác</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell>{r.code}</TableCell>
                    <TableCell>{r.employee?.full_name || '-'}</TableCell>
                    <TableCell>{new Date(r.request_date).toLocaleDateString()}</TableCell>
                    <TableCell align="right">{Number(r.amount || 0).toLocaleString()}</TableCell>
                    <TableCell>{statusChip(r.status)}</TableCell>
                    <TableCell>{r.reason || '-'}</TableCell>
                    <TableCell align="right">
                      {canApprove && r.status === 'SUBMITTED' ? (
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button
                            size="small"
                            color="success"
                            variant="contained"
                            onClick={() => onApprove(r)}
                          >
                            Duyệt
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            variant="outlined"
                            onClick={() => onOpenReject(r)}
                          >
                            Từ chối
                          </Button>
                        </Stack>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <Typography sx={{ p: 2 }} color="text.secondary">
                        Không có dữ liệu
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Stack alignItems="flex-end" sx={{ py: 2 }}>
            <Pagination count={pageCount} page={page} onChange={(_, v) => setPage(v)} />
          </Stack>
        </Card>

        <AdvanceCreateDialog
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onCreated={() => loadData()}
        />

        <Dialog
          open={approveOpen}
          onClose={() => {
            setApproveOpen(false);
            setApproveRow(null);
          }}
          fullWidth
          maxWidth="xs"
        >
          <DialogTitle>Xác nhận duyệt</DialogTitle>
          <DialogContent>
            <Typography sx={{ mt: 1 }}>
              Bạn có chắc muốn <b>duyệt</b> phiếu <b>{approveRow?.code}</b> với số tiền{' '}
              <b>{Number(approveRow?.amount || 0).toLocaleString()}</b> không?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setApproveOpen(false);
                setApproveRow(null);
              }}
            >
              Huỷ
            </Button>
            <Button color="success" variant="contained" onClick={onConfirmApprove}>
              Xác nhận duyệt
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle>Từ chối ứng lương</DialogTitle>
          <DialogContent>
            <TextField
              label="Lý do"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              fullWidth
              multiline
              minRows={3}
              sx={{ mt: 1 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRejectOpen(false)}>Huỷ</Button>
            <Button color="error" variant="contained" onClick={onReject}>
              Từ chối
            </Button>
          </DialogActions>
        </Dialog>
      </Stack>
    </Container>
  );
}
