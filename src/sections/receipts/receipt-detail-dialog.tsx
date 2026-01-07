// src/sections/receipts/receipt-detail-dialog.tsx

import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  Divider,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  CircularProgress,
} from '@mui/material';
import type { Receipt } from 'src/api/receipts';
import { getReceiptDetail } from 'src/api/receipts';

type Props = {
  open: boolean;
  onClose: VoidFunction;
  receiptId?: number | null;

  canApprove?: boolean;
  onApprove?: (id: number) => Promise<void>;

  canCreateChangeRequest?: boolean;
  onCreateChangeRequest?: (id: number) => Promise<void>;
};

export default function ReceiptDetailDialog({
  open,
  onClose,
  receiptId,
  canApprove,
  onApprove,
  canCreateChangeRequest,
  onCreateChangeRequest,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Receipt | null>(null);
  const [err, setErr] = useState<string>('');

  const statusColor = useMemo(() => {
    const s = data?.status;
    if (s === 'APPROVED') return 'success';
    if (s === 'REJECTED') return 'error';
    return 'warning';
  }, [data?.status]);

  const statusLabel = useMemo(() => {
    const s = data?.status;
    if (s === 'SUBMITTED') return 'Yêu cầu';
    if (s === 'APPROVED') return 'Đã duyệt';
    if (s === 'REJECTED') return 'Từ chối';
    return s || '-';
  }, [data?.status]);

  const typeLabel = useMemo(() => {
    const t = data?.type;
    if (t === 'INCOME') return 'Thu nhập/ Nhập';
    if (t === 'EXPENSE') return 'Chi phí/ Xuất';
    return t || '-';
  }, [data?.type]);

  const sourceLabel = useMemo(() => {
    const t = data?.source;
    if (t === 'WAREHOUSE') return 'Kho';
    if (t === 'OUTSIDE') return 'Ngoài';
    return t || '';
  }, [data?.source]);

  const paymentLabel = useMemo(() => {
    const p = data?.payment_method;
    if (p === 'CASH') return 'Tiền mặt';
    if (p === 'BANK') return 'Chuyển khoản';
    if (p === 'CARD') return 'Thẻ';
    return p || '-';
  }, [data?.payment_method]);

  useEffect(() => {
    const run = async () => {
      if (!open || !receiptId) return;
      try {
        setErr('');
        setLoading(true);
        const r = await getReceiptDetail(receiptId);
        setData(r);
      } catch (e: any) {
        setErr(e?.message || 'Lỗi tải chi tiết');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [open, receiptId]);

  const handleApprove = async () => {
    if (!data?.id || !onApprove) return;
    await onApprove(data.id);
    // tải lại chi tiết
    const r = await getReceiptDetail(data.id);
    setData(r);
  };

  const handleCreateCR = async () => {
    if (!data?.id || !onCreateChangeRequest) return;
    await onCreateChangeRequest(data.id);
    // không bắt buộc reload
  };

  const workCycleText =
    (data as any)?.cycle?.code || (data as any)?.cycle?.name
      ? `${(data as any)?.cycle?.code || ''}${(data as any)?.cycle?.name ? ` - ${(data as any)?.cycle?.name}` : ''}`
      : '-';

  const warehouseText =
    (data as any)?.warehouse?.code || (data as any)?.warehouse?.name
      ? `${(data as any)?.warehouse?.code || ''}${(data as any)?.warehouse?.name ? ` - ${(data as any)?.warehouse?.name}` : ''}`
      : '-';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Chi tiết phiếu</DialogTitle>

      <DialogContent>
        {loading && (
          <Stack alignItems="center" sx={{ py: 4 }}>
            <CircularProgress />
          </Stack>
        )}

        {!loading && err && <Typography color="error">{err}</Typography>}

        {!loading && data && (
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between">
              <Stack spacing={0.5}>
                <Typography variant="h6">{data.code}</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {typeLabel} • {sourceLabel} • {paymentLabel}
                </Typography>
              </Stack>

              <Stack alignItems={{ xs: 'flex-start', md: 'flex-end' }} spacing={0.5}>
                <Chip label={statusLabel} color={statusColor as any} />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Ngày: {data.receipt_date} • Tháng: {data.month}/{data.year}
                </Typography>
              </Stack>
            </Stack>

            <Divider />

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <Stack sx={{ flex: 1 }} spacing={0.5}>
                <Typography variant="subtitle2">Nhân viên</Typography>
                <Typography variant="body2">
                  {data.employee?.full_name || '-'} ({data.employee?.username || '-'})
                </Typography>
              </Stack>

              <Stack sx={{ flex: 1 }} spacing={0.5}>
                <Typography variant="subtitle2">Người tạo</Typography>
                <Typography variant="body2">
                  {data.creator?.full_name || '-'} ({data.creator?.username || '-'})
                </Typography>
              </Stack>

              <Stack sx={{ flex: 1 }} spacing={0.5}>
                <Typography variant="subtitle2">Chu kỳ công việc</Typography>
                <Typography variant="body2">{workCycleText}</Typography>
              </Stack>

              <Stack sx={{ flex: 1 }} spacing={0.5}>
                <Typography variant="subtitle2">Kho</Typography>
                <Typography variant="body2">{warehouseText}</Typography>
              </Stack>
            </Stack>

            {data.note && (
              <Stack spacing={0.5}>
                <Typography variant="subtitle2">Ghi chú</Typography>
                <Typography variant="body2">{data.note}</Typography>
              </Stack>
            )}

            <Divider />

            <Typography variant="subtitle1">Chi tiết</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell width={110}>Mã hàng</TableCell>
                  <TableCell>Tên / Mô tả</TableCell>
                  <TableCell align="right" width={120}>
                    Số lượng
                  </TableCell>
                  <TableCell align="right" width={120}>
                    Đơn giá
                  </TableCell>
                  <TableCell align="right" width={90}>
                    VAT (%)
                  </TableCell>
                  <TableCell align="right" width={140}>
                    Trước thuế
                  </TableCell>
                  <TableCell align="right" width={140}>
                    Tiền VAT
                  </TableCell>
                  <TableCell align="right" width={140}>
                    Thành tiền
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {(data.lines || []).map((ln: any) => (
                  <TableRow key={ln.id}>
                    <TableCell>{ln.item?.code || ln.item_id || '-'}</TableCell>
                    <TableCell>{ln.item?.name || ln.description || '-'}</TableCell>
                    <TableCell align="right">{Number(ln.qty || 0)}</TableCell>
                    <TableCell align="right">{Number(ln.price || 0).toLocaleString()}</TableCell>
                    <TableCell align="right">{Number(ln.vat_percent || 0)}</TableCell>
                    <TableCell align="right">{Number(ln.amount_before_tax || 0).toLocaleString()}</TableCell>
                    <TableCell align="right">{Number(ln.vat_amount || 0).toLocaleString()}</TableCell>
                    <TableCell align="right">{Number(ln.amount_total || 0).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        {data?.id && canCreateChangeRequest && (
          <Button onClick={handleCreateCR}>Tạo yêu cầu sửa / hủy</Button>
        )}

        {data?.id && canApprove && data.status !== 'APPROVED' && (
          <Button variant="contained" onClick={handleApprove}>
            Duyệt (áp vào kho)
          </Button>
        )}

        <Button onClick={onClose}>Đóng</Button>
      </DialogActions>
    </Dialog>
  );
}
