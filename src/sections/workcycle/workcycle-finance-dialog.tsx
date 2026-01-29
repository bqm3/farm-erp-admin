/* eslint-disable no-nested-ternary */
// src/sections/workcycle/workcycle-finance-verbose-dialog.tsx
import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  TextField,
  Typography,
  Divider,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import { useSnackbar } from 'src/components/snackbar';
import { getWorkCycleFinanceSummary, type FinanceVerbose } from 'src/api/workcycle';

function money(n: any) {
  const x = Number(n);
  if (!Number.isFinite(x)) return '0';
  return x.toLocaleString('vi-VN');
}

function profitLabel(p: number) {
  if (p > 0) return { text: 'Lãi', color: 'success' as const };
  if (p < 0) return { text: 'Lỗ', color: 'error' as const };
  return { text: 'Hoà vốn', color: 'default' as const };
}

type Props = {
  open: boolean;
  onClose: () => void;
  workCycleId: number | string | any;
};

export default function WorkCycleFinanceVerboseDialog({ open, onClose, workCycleId }: Props) {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [data, setData] = useState<FinanceVerbose | null>(null);

  const pMeta = useMemo(() => profitLabel(Number(data?.totals?.profit || 0)), [data?.totals?.profit]);

  const load = async () => {
    try {
      setErr(null);
      setLoading(true);

      const res = await getWorkCycleFinanceSummary(workCycleId, {
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
      });

      if (!res.ok) throw new Error(res.message || 'Không lấy được tổng hợp tài chính');
      setData(res.data);
    } catch (e: any) {
      setErr(e?.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) load();
    if (!open) resetState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const resetState = () => {
  setFromDate('');
  setToDate('');
  setData(null);
  setErr(null);
  setLoading(false);
};

const handleClose = () => {
  resetState();
  onClose();
};

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>Tổng hợp thu/chi</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {/* Filters */}
          {/* Filters */}
<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
  <TextField
    type="date"
    label="Từ ngày"
    value={fromDate}
    onChange={(e) => setFromDate(e.target.value)}
    fullWidth
    InputLabelProps={{ shrink: true }}
    inputProps={{ max: toDate || undefined }}
  />

  <TextField
    type="date"
    label="Đến ngày"
    value={toDate}
    onChange={(e) => setToDate(e.target.value)}
    fullWidth
    InputLabelProps={{ shrink: true }}
    inputProps={{ min: fromDate || undefined }}
  />

  <Button variant="contained" onClick={load} disabled={loading} sx={{ minWidth: 150 }}>
    Lọc / Tải lại
  </Button>
</Stack>


          {err && <Alert severity="error">{err}</Alert>}

          {loading && (
            <Stack direction="row" spacing={1} alignItems="center">
              <CircularProgress size={18} />
              <Typography variant="body2">Đang tải dữ liệu...</Typography>
            </Stack>
          )}

          {/* Summary Cards */}
          {data && (
            <>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <Stack sx={{ flex: 1, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Tổng THU (+)
                  </Typography>
                  <Typography variant="h6">{money(data.totals.revenue)} đ</Typography>
                </Stack>

                <Stack sx={{ flex: 1, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Tổng CHI (-)
                  </Typography>
                  <Typography variant="h6">{money(data.totals.expense)} đ</Typography>
                </Stack>

                <Stack sx={{ flex: 1, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Kết quả
                  </Typography>

                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="h6">{money(data.totals.profit)} đ</Typography>
                    <Chip label={pMeta.text} color={pMeta.color} size="small" />
                  </Stack>

                  <Typography variant="caption" color="text.secondary">
                    Công thức: Lãi/Lỗ = THU - CHI
                  </Typography>
                </Stack>
              </Stack>

              <Divider />

              {/* + / - Flow summary */}
              <Typography variant="subtitle1">Cộng / trừ theo nhóm</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Nhóm</TableCell>
                    <TableCell align="center">Dấu</TableCell>
                    <TableCell align="right">Tổng tiền</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.by_flow.map((x) => (
                    <TableRow key={x.flow}>
                      <TableCell>{x.flow_vi}</TableCell>
                      <TableCell align="center">
                        <Chip label={x.sign} color={x.sign === '+' ? 'success' : 'warning'}  size="small" />
                      </TableCell>
                      <TableCell align="right">{money(x.total_amount)} đ</TableCell>
                    </TableRow>
                  ))}

                  <TableRow>
                    <TableCell>
                      <b>Kết quả</b>
                    </TableCell>
                    <TableCell align="center">
                      <Chip label="=" size="small" color='info'/>
                    </TableCell>
                    <TableCell align="right">
                      <b>{money(data.totals.profit)} đ</b>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <Divider />

              {/* Breakdown by subtype */}
              {/* <Typography variant="subtitle1">Chi tiết theo loại (subtype)</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Loại</TableCell>
                    <TableCell>Nhóm</TableCell>
                    <TableCell align="center">Dấu</TableCell>
                    <TableCell align="right">Số phiếu</TableCell>
                    <TableCell align="right">Tổng tiền</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(data.by_subtype || []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <Typography variant="body2" color="text.secondary">
                          Không có dữ liệu
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.by_subtype.map((x) => (
                      <TableRow key={`${x.subtype}-${x.flow}`}>
                        <TableCell>{x.subtype_vi}</TableCell>
                        <TableCell>{x.flow_vi}</TableCell>
                        <TableCell align="center">
                          <Chip label={x.sign} size="small" />
                        </TableCell>
                        <TableCell align="right">{x.count}</TableCell>
                        <TableCell align="right">{money(x.total_amount)} đ</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              <Divider /> */}

              {/* Receipts list = cộng trừ theo phiếu */}
              <Typography variant="subtitle1">Danh sách phiếu (cộng / trừ theo từng phiếu)</Typography>
             

              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Ngày</TableCell>
                    <TableCell>Mã phiếu</TableCell>
                    <TableCell>Nhóm</TableCell>
                    <TableCell>Nội dung</TableCell>
                    <TableCell align="center">Dấu</TableCell>
                    <TableCell align="right">Số tiền</TableCell>
                    <TableCell>Trạng thái</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(data.receipts || []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7}>
                        <Typography variant="body2" color="text.secondary">
                          Không có phiếu trong khoảng thời gian này
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.receipts.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{String(r.receipt_date).slice(0, 10)}</TableCell>
                        <TableCell>{r.code}</TableCell>
                        <TableCell>{r.flow_vi}</TableCell>
                        <TableCell>{r.subtype_vi}</TableCell>
                        <TableCell align="center">
                          <Chip label={r.sign} color={r.sign === '+' ? 'success' : 'warning'} size="small" />
                        </TableCell>
                        <TableCell align="right">{money(r.amount_total)} đ</TableCell>
                        <TableCell>
                          <Chip label={r.status === 'DA_DUYET' ? 'Đã duyệt' : 'Chưa duyệt'} color='success' size="small" />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              <Divider />

              {/* Quantity summary */}
              <Typography variant="subtitle1">Biến động số lượng</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Loại thay đổi</TableCell>
                    <TableCell align="right">Số lượng đơn</TableCell>
                    <TableCell align="right">Tổng thay đổi</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(data.quantity_summary || []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3}>
                        <Typography variant="body2" color="text.secondary">
                          Không có dữ liệu
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.quantity_summary.map((x, idx) => (
                      <TableRow key={`${x.change_type}-${idx}`}>
                        <TableCell>{x.change_type_vi}</TableCell>
                        <TableCell align="right">{x.count}</TableCell>
                        <TableCell align="right">{x.total_qty}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Đóng</Button>
      </DialogActions>
    </Dialog>
  );
}
