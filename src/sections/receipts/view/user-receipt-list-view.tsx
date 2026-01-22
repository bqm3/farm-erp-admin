/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unneeded-ternary */
// src/sections/receipts/view/receipt-list-view.tsx

import { useEffect, useMemo, useState } from 'react';
import {
  Container,
  Card,
  Stack,
  Button,
  TextField,
  Pagination,
  Typography,
  MenuItem,
  IconButton,
  Tooltip,
  Chip,
  Grid,
  Divider,
  Box,
} from '@mui/material';
import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';
import { listReceipts, createReceipt, type ReceiptCreatePayload } from 'src/api/receipts';

import { fDate } from 'src/utils/format-time';
import ReceiptCreateDialog from '../receipt-create-dialog';
import ReceiptDetailDialog from '../receipt-detail-dialog';

// ===== Helpers =====
function toInt(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

type Props = {
  roles?: string[];
};

export default function ReceiptUserListView({ roles = [] }: Props) {
  const { enqueueSnackbar } = useSnackbar();

  // User: được tạo phiếu, không duyệt/sửa/xóa
  const canCreate = true;
  const canApprove = roles.includes('ADMIN'); // giữ để truyền vào detail nếu sau này cần (ở đây user view nên false)

  const [loading, setLoading] = useState(false);

  // filters
  const [qCode, setQCode] = useState<string>('');
  const [type, setType] = useState<string>('');
  const [status, setStatus] = useState<string>('');
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
        from: from || undefined,
        to: to || undefined,
      });
      setRows(res.data || []);
      setTotal(toInt(res.total, 0));
    } catch (err: any) {
      enqueueSnackbar(err?.message || 'Không tải được dữ liệu', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page]);

  const handleOpenDetail = (id: number) => {
    setDetailId(id);
    setOpenDetail(true);
  };

  const handleSubmitCreate = async (payload: ReceiptCreatePayload) => {
    try {
      await createReceipt(payload);
      enqueueSnackbar('Tạo phiếu thành công. Vui lòng chờ phê duyệt.', { variant: 'success' });
      setOpenCreate(false);
      setPage(1);
      // fetch lại ngay
      setTimeout(fetchData, 0);
    } catch (err: any) {
      enqueueSnackbar(err?.message || 'Có lỗi xảy ra', { variant: 'error' });
    }
  };

  const renderStatus = (s: string) => {
    if (s === 'CHO_DUYET') return <Chip size="small" label="Chờ duyệt" color="warning" />;
    if (s === 'DA_DUYET') return <Chip size="small" label="Đã duyệt" color="success" />;
    if (s === 'TU_CHOI') return <Chip size="small" label="Từ chối" color="error" />;
    return <Chip size="small" label={s} color="info" />;
  };

  const getTypeLabel = (t?: string | null) => {
    if (t === 'THU') return <Chip size="small" label="Thu / Xuất" color="success" />;
    if (t === 'CHI') return <Chip size="small" label="Chi / Nhập" color="warning" />;
    return <Chip size="small" label={t || '-'} color="default" />;
  };

  const getSubtypeLabel = (t?: string | null) => {
    const map: Record<string, string> = {
      THU_HOACH: 'Thu hoạch / Bán',
      TANG: 'Tăng',
      THEM: 'Thêm',
      HARVEST: 'Thu hoạch',
      IMPORT: 'Thêm',
      SINH: 'Sinh',
      THU: 'Thu',
      NHAP: 'Nhập',
      GIAM: 'Giảm',
      CHI: 'Chi',
      SOLD: 'Bán',
      XUAT: 'Xuất',
      BAN: 'Bán',
      CHET: 'Chết',
    };
    const label = t ? map[t] || t : '-';
    return <Chip size="small" label={label} color="info" />;
  };

  const getSourceLabel = (s?: string | null) => {
    if (s === 'KHO') return <Chip size="small" label="Kho" color="secondary" />;
    if (s === 'BEN_NGOAI') return <Chip size="small" label="Ngoài" color="primary" />;
    return <Chip size="small" label={s || '-'} color="default" />;
  };

  const getPaymentLabel = (p?: string | null) => {
    if (p === 'CASH') return 'Tiền mặt';
    if (p === 'BANK') return 'Chuyển khoản';
    if (p === 'CARD') return 'Thẻ';
    return p || '-';
  };

  return (
    <Container maxWidth="xl">
      <Stack spacing={2}>
        {/* Header */}
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1.5}
          alignItems={{ xs: 'stretch', md: 'center' }}
          justifyContent="space-between"
        >
          <Typography variant="h4">Phiếu nhập kho</Typography>

          {canCreate && (
            <Button
              variant="contained"
              startIcon={<Iconify icon="eva:plus-fill" />}
              onClick={() => setOpenCreate(true)}
            >
              Tạo phiếu
            </Button>
          )}
        </Stack>

        {/* Filters (mobile-friendly) */}
        <Card sx={{ p: 2 }}>
          <Grid container spacing={1.5}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Tìm theo mã (code)"
                value={qCode}
                onChange={(e) => setQCode(e.target.value)}
                size="small"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                select
                label="Loại"
                value={type}
                size="small"
                onChange={(e) => setType(e.target.value)}
              >
                <MenuItem value="">Tất cả</MenuItem>
                <MenuItem value="THU">Thu nhập</MenuItem>
                <MenuItem value="CHI">Chi phí</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6} md={2.5}>
              <TextField
                fullWidth
                select
                size="small"
                label="Trạng thái"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <MenuItem value="">Tất cả</MenuItem>
                <MenuItem value="DANG_KY">Đăng ký</MenuItem>
                <MenuItem value="DA_DUYET">Phê duyệt</MenuItem>
                <MenuItem value="TU_CHOI">Từ chối</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                type="date"
                label="Từ ngày"
                size="small"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                type="date"
                label="Đến ngày"
                size="small"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12}>
              <Stack direction="row" spacing={1} justifyContent="flex-end">
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
                    setQCode('');
                    setType('');
                    setStatus('');
                    setFrom('');
                    setTo('');
                    setPage(1);
                    setTimeout(fetchData, 0);
                  }}
                >
                  Reset
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Card>

        {/* List by cards */}
        <Stack spacing={1.5}>
          {rows.map((r) => {
            const typeLabel = getTypeLabel(r?.type);
            const subtypeLabel = getSubtypeLabel(r?.subtype ?? r?.type);
            const sourceLabel = getSourceLabel(r?.source);
            const paymentLabel = getPaymentLabel(r?.payment_method);

            return (
              <Card key={r.id} sx={{ p: 2 }}>
                <Stack spacing={1}>
                  {/* Top line */}
                  <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle1" noWrap>
                        {r.code}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Ngày: {fDate(r.receipt_date)} • Người tạo: {r.employee?.full_name || r.employee_id}
                      </Typography>
                    </Box>

                    <Stack direction="row" spacing={1} alignItems="center" flexShrink={0}>
                      {renderStatus(r.status)}
                      <Tooltip title="Xem chi tiết">
                        <IconButton onClick={() => handleOpenDetail(r.id)}>
                          <Iconify icon="eva:eye-outline" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>

                  <Divider />

                  {/* Chips */}
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    {typeLabel}
                    {subtypeLabel}
                    {sourceLabel}
                    <Chip size="small" label={`TT: ${paymentLabel}`} variant="outlined" />
                  </Stack>
                </Stack>
              </Card>
            );
          })}

          {!rows.length && (
            <Card sx={{ p: 4 }}>
              <Typography align="center" sx={{ color: 'text.secondary' }}>
                {loading ? 'Đang tải...' : 'Không có dữ liệu'}
              </Typography>
            </Card>
          )}
        </Stack>

        {/* Pagination */}
        <Stack direction="row" justifyContent="flex-end" sx={{ pb: 1 }}>
          <Pagination
            page={page}
            count={totalPages}
            onChange={(_, p) => setPage(p)}
            disabled={loading}
          />
        </Stack>
      </Stack>

      {/* Create */}
      <ReceiptCreateDialog
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        onSubmit={handleSubmitCreate}
      />

      {/* Detail (user chỉ xem + chờ duyệt) */}
      <ReceiptDetailDialog
        open={openDetail}
        onClose={() => setOpenDetail(false)}
        receiptId={detailId}
        canApprove={false}
        canCreateChangeRequest={false}
      />
    </Container>
  );
}
