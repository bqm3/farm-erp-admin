/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unneeded-ternary */
// src/sections/receipts/view/receipt-list-view.tsx

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
} from '@mui/material';
import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';
import {
  listReceipts,
  createReceipt,
  approveReceipt,
  createReceiptChangeRequest,
  type Receipt,
  type ReceiptCreatePayload,
} from 'src/api/receipts';

import ReceiptCreateDialog from '../receipt-create-dialog';
import ReceiptDetailDialog from '../receipt-detail-dialog';
import ReceiptChangeRequestDialog from '../receipt-change-request-dialog';

// ===== Helpers =====
function toInt(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

type Props = {
  // Nếu bạn đã có hook auth, bạn truyền roles vào.
  // Còn không, cứ để rỗng và set tạm roles cứng để test.
  roles?: string[];
};

export default function ReceiptListView({ roles = [] }: Props) {
  const { enqueueSnackbar } = useSnackbar();

  const isAdmin = roles.includes('ADMIN');

  const [loading, setLoading] = useState(false);

  // filters
  const [qCode, setQCode] = useState<string>('');
  const [type, setType] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [workCycleId, setWorkCycleId] = useState<string>('');
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');

  // paging
  const [page, setPage] = useState(1);
  const limit = 20;

  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  // dialogs
  const [openCreate, setOpenCreate] = useState(false);
  const [openDetail, setOpenDetail] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);

  const [openCR, setOpenCR] = useState(false);
  const [crReceiptId, setCrReceiptId] = useState<number | null>(null);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await listReceipts({
        page,
        limit,
        code: qCode?.trim() ? qCode.trim() : undefined,
        type: type ? (type as any) : undefined,
        status: status ? (status as any) : undefined,
        work_cycle_id: workCycleId ? workCycleId : undefined,
        from: from || undefined,
        to: to || undefined,
      });
      setRows(res.data || []);
      setTotal(toInt(res.total, 0));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenDetail = (id: number) => {
    setDetailId(id);
    setOpenDetail(true);
  };

  const handleSubmitCreate = async (payload: ReceiptCreatePayload) => {
  try {
    await createReceipt(payload);
    enqueueSnackbar('Tạo phiếu thành công', { variant: 'success' });
    await fetchData();
  } catch (err: any) {
    enqueueSnackbar(err?.message || 'Có lỗi xảy ra', { variant: 'error' });
  }
};

  const handleApprove = async (id: number) => {
  if (!window.confirm('Approve receipt và apply vào kho?')) return;

  try {
    await approveReceipt(id);
    enqueueSnackbar('Duyệt phiếu thành công', { variant: 'success' });
    await fetchData();
  } catch (err: any) {
    enqueueSnackbar(err?.message || 'Có lỗi xảy ra', { variant: 'error' });
  }
};

  const handleOpenCR = async (receiptId: number) => {
    setCrReceiptId(receiptId);
    setOpenCR(true);
  };

  const handleSubmitCR = async (payload: {
    request_type: any;
    reason: string;
    proposed_payload?: any;
  }) => {
    if (!crReceiptId) return;
    await createReceiptChangeRequest(crReceiptId, payload);
    await fetchData();
  };

  const renderStatus = (s: string) => {
    if (s === 'SUBMITTED') return <Chip size="small" label="Đăng ký" color="info" />;
    if (s === 'APPROVED') return <Chip size="small" label="Đồng ý" color="success" />;
    if (s === 'REJECTED') return <Chip size="small" label="Từ chối" color="error" />;
    return <Chip size="small" label={s} color="info" />;
  };

  const getTypeLabel = (t?: string | null) => {
  if (t === 'INCOME') return <Chip size="small" label="Thu nhập / Nhập" color="success" />;
  if (t === 'EXPENSE') return <Chip size="small" label="Chi phí / Xuất" color="warning" />;
  return <Chip size="small" label={t} color="default" />;
};

const getSourceLabel = (s?: string | null) => {
  if (s === 'WAREHOUSE')  return <Chip size="small" label='Kho' color="secondary" />;
  if (s === 'OUTSIDE') return <Chip size="small" label='Ngoài' color="primary" />;
  return <Chip size="small" label={s} color="default" />;
};

const getPaymentLabel = (p?: string | null) => {
  if (p === 'CASH') return 'Tiền mặt';
  if (p === 'BANK') return 'Chuyển khoản';
  if (p === 'CARD') return 'Thẻ';
  // if (p === 'DEBT') return 'Công nợ';
  return p || '-';
};

  return (
    <Container maxWidth="xl">
      <Stack spacing={2}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h4">Biên lai</Typography>

          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              startIcon={<Iconify icon="eva:plus-fill" />}
              onClick={() => setOpenCreate(true)}
            >
              Tạo phiếu
            </Button>
          </Stack>
        </Stack>

        <Card sx={{ p: 2 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
             <TextField
              label="Tìm theo mã (code)"
              value={qCode}
              onChange={(e) => setQCode(e.target.value)}
              sx={{ width: 220 }}
            />
            <TextField
              select
              label="Loại"
              value={type}
              onChange={(e) => setType(e.target.value)}
              sx={{ width: 200 }}
            >
              <MenuItem value="">Tất cả</MenuItem>
              <MenuItem value="INCOME">Thu nhập</MenuItem>
              <MenuItem value="EXPENSE">Chi phí</MenuItem>
            </TextField>

            <TextField
              select
              label="Trạng thái"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              sx={{ width: 220 }}
            >
              <MenuItem value="">Tất cả</MenuItem>
              <MenuItem value="SUBMITTED">Đăng ký</MenuItem>
              <MenuItem value="APPROVED">Phê duyệt</MenuItem>
              <MenuItem value="REJECTED">Từ chối</MenuItem>
            </TextField>
            <TextField
              type="date"
              label="Từ ngày"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              sx={{ width: 180 }}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              type="date"
              label="Đến ngày"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              sx={{ width: 180 }}
              InputLabelProps={{ shrink: true }}
            />

            <Button
              variant="outlined"
              startIcon={<Iconify icon="eva:search-fill" />}
              onClick={() => {
                setPage(1);
                fetchData();
              }}
              disabled={loading}
            >
              Lọc
            </Button>

            <Button
              color="inherit"
              onClick={() => {
                setType('');
                setStatus('');
                setWorkCycleId('');
                setFrom('');
                setTo('');
                setPage(1);
              }}
            >
              Reset
            </Button>
          </Stack>
        </Card>

        <Card>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell width={180}>Code</TableCell>
                  <TableCell width={120}>Loại</TableCell>
                  <TableCell width={140}>Nguồn</TableCell>
                  <TableCell width={160}>Thanh toán</TableCell>
                  <TableCell width={120}>Ngày</TableCell>
                  <TableCell width={140}>Trạng thái</TableCell>
                  <TableCell>Người tạo</TableCell>
                  <TableCell width={160} align="right">
                    Hành động
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {rows.map((r) => {
                   const typeLabel = getTypeLabel(r?.type);
    const sourceLabel = getSourceLabel(r?.source);
    const paymentLabel = getPaymentLabel(r?.payment_method);
                  return (
                   
                  
                  <TableRow key={r.id} hover>
                    <TableCell>{r.code}</TableCell>
                    <TableCell>{typeLabel}</TableCell>
                    <TableCell>{sourceLabel}</TableCell>
                    <TableCell>{paymentLabel}</TableCell>
                    <TableCell>{r.receipt_date}</TableCell>
                    <TableCell>{renderStatus(r.status)}</TableCell>
                    <TableCell>{r.employee?.full_name || r.employee_id}</TableCell>

                    <TableCell align="right">
                      <Stack direction="row" justifyContent="flex-end">
                        <Tooltip title="Xem chi tiết">
                          <IconButton onClick={() => handleOpenDetail(r.id)}>
                            <Iconify icon="eva:eye-outline" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Tạo yêu cầu sửa/hủy">
                          <IconButton onClick={() => handleOpenCR(r.id)}>
                            <Iconify icon="eva:edit-2-outline" />
                          </IconButton>
                        </Tooltip>

                        {isAdmin && r.status !== 'APPROVED' && (
                          <Tooltip color='success' title="Duyệt (áp vào kho)">
                            <IconButton color="success" onClick={() => handleApprove(r.id)}>
                              <Iconify icon="eva:checkmark-circle-2-outline" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                  )
                })}

                {!rows.length && (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 5 }}>
                      <Typography sx={{ color: 'text.secondary' }}>
                        {loading ? 'Đang tải...' : 'Không có dữ liệu'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Stack direction="row" justifyContent="flex-end" sx={{ p: 2 }}>
            <Pagination page={page} count={totalPages} onChange={(_, p) => setPage(p)} />
          </Stack>
        </Card>
      </Stack>

      {/* Create */}
      <ReceiptCreateDialog
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        onSubmit={handleSubmitCreate}
      />

      {/* Detail */}
      <ReceiptDetailDialog
        open={openDetail}
        onClose={() => setOpenDetail(false)}
        receiptId={detailId}
        canApprove={isAdmin}
        onApprove={handleApprove}
        canCreateChangeRequest
        onCreateChangeRequest={handleOpenCR}
      />

      {/* Change Request */}
      <ReceiptChangeRequestDialog
        open={openCR}
        onClose={() => setOpenCR(false)}
        onSubmit={handleSubmitCR}
      />
    </Container>
  );
}
