import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Pagination,
  Chip,
} from '@mui/material';
import { useSnackbar } from 'src/components/snackbar';
import { listFundLedgers } from 'src/api/funds';
import type { FundRow } from 'src/api/funds';
import { fDateTime } from 'src/utils/format-time';

type FundLedgerRow = {
  id: number;
  action?: string; // THU/CHI/DIEU_CHINH...
  amount?: any;
  balance_before?: any;
  balance_after?: any;
  note?: string;
  created_at?: string;
  created_by?: number;
  creator: any;
};

type Props = {
  open: boolean;
  onClose: () => void;
  fund: FundRow | null;
};

function n(v: any, fb = 0) {
  const x = Number(String(v ?? '').replaceAll(',', ''));
  return Number.isFinite(x) ? x : fb;
}

function fmtMoney(v: any) {
  const x = n(v, 0);
  return x.toLocaleString('vi-VN');
}

function statusChip(s: string) {
  const k = String(s || '').toUpperCase();
  if (k === 'THU') return <Chip label="Thu" size="small" color="success" />;
  if (k === 'CHI') return <Chip label="Chi" size="small" color="warning" />;
  if (k === 'DIEU_CHINH') return <Chip label="Điều chỉnh" size="small" color="info" />;
  if (k === 'TU_CHOI') return <Chip label="Từ chối" size="small" color="warning" />;
  if (k === 'DA_CHOT') return <Chip label="Đã chốt" size="small" />;
  return <Chip label={s} size="small" />;
}

export default function FundLedgerDialog({ open, onClose, fund }: Props) {
  const { enqueueSnackbar } = useSnackbar();

  const [rows, setRows] = useState<FundLedgerRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;
  const [loading, setLoading] = useState(false);

  const pageCount = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total]);

  const fetchLedgers = useCallback(async () => {
    if (!fund?.id) return;
    setLoading(true);
    try {
      const res = await listFundLedgers({ id: fund.id, page, limit });

      // res: { fund, data, paging }
      setRows(res.data || []);
      setTotal(res?.total || 0);
    } catch (e: any) {
      enqueueSnackbar(e?.message || 'Load ledgers failed', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar, fund?.id, page]);

  // reset page when opening fund changes
  useEffect(() => {
    if (open) setPage(1);
  }, [open, fund?.id]);

  useEffect(() => {
    if (open) fetchLedgers();
  }, [open, fetchLedgers]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>Lịch sử quỹ</DialogTitle>

      <DialogContent>
        <Stack spacing={1} sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            Quỹ: <b>{fund?.name}</b> — Số dư hiện tại: <b>{fmtMoney(fund?.balance)}</b>
          </Typography>
        </Stack>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell width={140}>Loại</TableCell>
                <TableCell width={160} align="right">
                  Số tiền
                </TableCell>
                <TableCell width={170} align="right">
                  Trước
                </TableCell>
                <TableCell width={170} align="right">
                  Sau
                </TableCell>
                <TableCell>Ghi chú</TableCell>
                <TableCell width={180}>Thời gian</TableCell>
                <TableCell width={150}>Người tạo</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell>{statusChip(`${r.action}`) || '-'}</TableCell>
                  <TableCell align="right">{fmtMoney(r.amount)}</TableCell>
                  <TableCell align="right">{fmtMoney(r.balance_before)}</TableCell>
                  <TableCell align="right">{fmtMoney(r.balance_after)}</TableCell>
                  <TableCell>{r.note || '-'}</TableCell>
                  <TableCell>{r.created_at ? fDateTime(r.created_at) : '-'}</TableCell>
                  <TableCell>{r?.creator?.full_name}</TableCell>
                </TableRow>
              ))}

              {!rows.length && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, opacity: 0.7 }}>
                    {loading ? 'Đang tải...' : 'Chưa có lịch sử'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
          <Pagination
            count={pageCount}
            page={page}
            onChange={(_, v) => setPage(v)}
            color="primary"
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
}
