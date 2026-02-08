import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Pagination,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Chip,
} from '@mui/material';

import Iconify from 'src/components/iconify';
import { formatNumber, formatVND, fPercent } from 'src/utils/format-number';
import {
  listItemLedger,
  exportItemLedgerExcel,
  type WarehouseStock,
  type WarehouseMovement,
} from 'src/api/warehouse';

function toYMD(d?: Date | null) {
  if (!d) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

type Props = {
  open: boolean;
  warehouseId: number;
  stock: WarehouseStock | null;
  onClose: () => void;
};

export default function ItemLedgerDialog({ open, warehouseId, stock, onClose }: Props) {
  const itemId = stock?.item_id || 0;

  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [rows, setRows] = useState<WarehouseMovement[]>([]);
  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');

  const [expandedId, setExpandedId] = useState<number | false>(false);

  const title = useMemo(() => {
    const name = stock?.item?.name || '';
    const code = stock?.item?.code ? `${stock.item.code} - ` : '';
    return `${code}${name}`.trim() || `Vật tư #${itemId}`;
  }, [stock, itemId]);

  const pageCount = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total]);

  const fetch = useCallback(async () => {
    if (!open || !warehouseId || !itemId) return;

    setLoading(true);
    try {
      const res = await listItemLedger({
        warehouse_id: warehouseId,
        item_id: itemId,
        from: from || undefined,
        to: to || undefined,
        page,
        pageSize,
      });
      setRows(res.rows || []);
      setTotal(res.count || 0);

      // reset expand when paging/filter
      setExpandedId(false);
    } finally {
      setLoading(false);
    }
  }, [open, warehouseId, itemId, from, to, page]);

  useEffect(() => {
    if (!open) return;

    setRows([]);
    setTotal(0);
    setPage(1);

    // default 30 days
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - 30);
    now.setDate(now.getDate() + 30);

    setFrom(toYMD(start));
    setTo(toYMD(now));
  }, [open, itemId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const onExport = useCallback(async () => {
    if (!warehouseId || !itemId) return;

    setExporting(true);
    try {
      await exportItemLedgerExcel({
        warehouse_id: warehouseId,
        item_id: itemId,
        from: from || undefined,
        to: to || undefined,
      });
    } finally {
      setExporting(false);
    }
  }, [warehouseId, itemId, from, to]);

  const onToggle = (id: number) => (_: any, isExpanded: boolean) => {
    setExpandedId(isExpanded ? id : false);
  };

  const viType = (m: any) => m?.vi?.type || m?.receipt?.type || '-';
  const viSubtype = (m: any) => m?.vi?.subtype || m?.receipt?.subtype || '-';
  const viDirection = (m: any) => m?.vi?.direction || (m.direction === 'IN' ? 'Nhập' : 'Xuất');

  const timeText = (m: any) => {
    const dt = m?.created_at || m?.createdAt;
    return dt ? new Date(dt as any).toLocaleString('vi-VN') : '-';
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>Lịch sử thu/chi - {title}</DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2} mt={1}>
          {/* Filter */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <TextField
              type="date"
              label="Từ ngày"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setPage(1);
              }}
              InputLabelProps={{ shrink: true }}
              sx={{ width: 200 }}
            />
            <TextField
              type="date"
              label="Đến ngày"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setPage(1);
              }}
              InputLabelProps={{ shrink: true }}
              sx={{ width: 200 }}
            />
            <Button
              variant="outlined"
              startIcon={<Iconify icon="solar:refresh-bold" />}
              onClick={fetch}
              disabled={loading}
            >
              Lọc
            </Button>

            <Button
              variant="contained"
              startIcon={<Iconify icon="solar:export-bold" />}
              onClick={onExport}
              disabled={!total || exporting}
            >
              {exporting ? 'Đang export...' : 'Xuất Excel'}
            </Button>

            {(loading || exporting) && <CircularProgress size={20} />}
          </Stack>

          {/* Accordion list */}
          {!rows.length && !loading ? (
            <Typography variant="body2" color="text.secondary">
              Không có dữ liệu
            </Typography>
          ) : (
            <Stack spacing={1}>
              {rows.map((m) => {
                const r: any = (m as any).receipt || {};
                const fundName = r?.fund?.name || '-';
                const partnerName = r?.partner?.name || r?.partner?.name || '-';
                const cycleName = r?.cycle?.name || r?.cycle?.code || '-';
                const employeeName = r?.employee?.full_name || r?.employee?.username || '-';
                const creatorName = r?.creator?.full_name || r?.creator?.username || '-';

                return (
                  <Accordion key={(m as any).id} expanded={expandedId === (m as any).id} onChange={onToggle((m as any).id)}>
                    <AccordionSummary expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}>
                      <Stack
                        direction={{ xs: 'column', md: 'row' }}
                        spacing={2}
                        alignItems={{ xs: 'flex-start', md: 'center' }}
                        sx={{ width: '100%' }}
                      >
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 340 }}>
                          <Chip
                            size="small"
                            label={viType(m)}
                            color={(r?.type === 'CHI') ? 'error' : 'success'}
                            variant="outlined"
                          />
                          <Chip size="small" label={viSubtype(m)} variant="outlined" />
                          <Chip size="small" label={viDirection(m)} variant="outlined" />
                        </Stack>

                        <Typography sx={{ flex: 1 }} variant="body2">
                          <b>{r?.code || '-'}</b> • {timeText(m)}
                        </Typography>

                        <Stack direction="row" spacing={2} alignItems="center">
                          <Typography variant="body2">
                            SL: <b>{formatNumber((m as any).qty || 0)}</b>
                          </Typography>
                          <Typography variant="body2">
                            ĐG: <b>{formatVND((m as any).unit_price || 0)}</b>
                          </Typography>
                          <Typography variant="body2">
                            VAT: <b>{fPercent((m as any).vat_percent || 0)}</b>
                          </Typography>
                          <Typography variant="body2">
                            Tổng: <b>{formatVND((m as any).amount_total || 0)}</b>
                          </Typography>
                        </Stack>
                      </Stack>
                    </AccordionSummary>

                    <AccordionDetails>
                      <Stack spacing={1.5}>
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                          <Typography variant="body2" sx={{ minWidth: 220 }}>
                            <b>Quỹ:</b> {fundName}
                          </Typography>
                          <Typography variant="body2" sx={{ minWidth: 220 }}>
                            <b>Đối tác:</b> {partnerName}
                          </Typography>
                          <Typography variant="body2" sx={{ minWidth: 260 }}>
                            <b>Vụ/lứa:</b> {cycleName}
                          </Typography>
                        </Stack>

                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                          <Typography variant="body2" sx={{ minWidth: 220 }}>
                            <b>Nhân viên:</b> {employeeName}
                          </Typography>
                          <Typography variant="body2" sx={{ minWidth: 220 }}>
                            <b>Người tạo:</b> {creatorName}
                          </Typography>
                          <Typography variant="body2" sx={{ minWidth: 260 }}>
                            <b>Ghi chú:</b> {r?.note || '-'}
                          </Typography>
                        </Stack>

                        <Divider />

                        <Typography variant="subtitle2">Chi tiết dòng phiếu</Typography>

                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell width={60}>#</TableCell>
                                <TableCell>Hàng hoá</TableCell>
                                <TableCell width={90} align="right">SL</TableCell>
                                <TableCell width={130} align="right">Đơn giá</TableCell>
                                <TableCell width={90} align="right">VAT</TableCell>
                                <TableCell width={150} align="right">Tổng</TableCell>
                                <TableCell width={220}>Mô tả</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {(r?.lines || []).map((ln: any) => (
                                <TableRow key={ln.id}>
                                  <TableCell>{ln.line_no ?? ''}</TableCell>
                                  <TableCell>
                                    {(ln?.item?.code ? `${ln.item.code} - ` : '') + (ln?.item?.name || '')}
                                  </TableCell>
                                  <TableCell align="right">{formatNumber(ln.qty || 0)}</TableCell>
                                  <TableCell align="right">{formatVND(ln.unit_price || 0)}</TableCell>
                                  <TableCell align="right">{fPercent(ln.vat_percent || 0)}</TableCell>
                                  <TableCell align="right">{formatVND(ln.amount_total || 0)}</TableCell>
                                  <TableCell>{ln.description || '-'}</TableCell>
                                </TableRow>
                              ))}

                              {(!r?.lines || !r.lines.length) && (
                                <TableRow>
                                  <TableCell colSpan={7}>
                                    <Typography variant="body2" color="text.secondary">
                                      Không có dòng chi tiết
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Stack>
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </Stack>
          )}

          {/* Paging */}
          <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Tổng: {total}
            </Typography>
            <Pagination page={page} onChange={(_, p) => setPage(p)} count={pageCount} color="primary" />
          </Stack>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
}
