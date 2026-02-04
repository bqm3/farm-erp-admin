/* eslint-disable react/no-unescaped-entities */
/* eslint-disable no-plusplus */
/* eslint-disable arrow-body-style */
/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
  TextField,
  MenuItem,
  Divider,
  IconButton,
  Tooltip,
  CircularProgress,
  Box,
  Collapse,
  Paper,
  Card,
  CardContent,
  Grid,
} from '@mui/material';

import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';
import type { FundRow } from 'src/api/funds';
import { fDateTime } from 'src/utils/format-time';

import {
  listFundLedgers,
  exportFundLedgersExcel,
  type FundLedgerRow,
  type ListFundLedgerParams,
} from 'src/api/fund_ledger';

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

function actionChip(s?: string) {
  const k = String(s || '').toUpperCase();
  if (k === 'THU') return <Chip label="Thu" size="small" color="success" />;
  if (k === 'CHI') return <Chip label="Chi" size="small" color="warning" />;
  if (k === 'DIEU_CHINH') return <Chip label="Điều chỉnh" size="small" color="info" />;
  if (k === 'HOAN_TAC') return <Chip label="Hoàn tác" size="small" color="default" />;
  return <Chip label={s || '-'} size="small" variant="outlined" />;
}

function statusChip(status?: string) {
  const k = String(status || '').toUpperCase();

  if (k === 'NHAP') return <Chip label="Nháp" size="small" variant="outlined" />;
  if (k === 'CHO_DUYET') return <Chip label="Chờ duyệt" size="small" color="warning" variant="outlined" />;
  if (k === 'DA_DUYET') return <Chip label="Đã duyệt" size="small" color="success" />;
  if (k === 'DA_CHOT') return <Chip label="Đã chốt" size="small" color="success" />;
  if (k === 'TU_CHOI') return <Chip label="Từ chối" size="small" color="error" variant="outlined" />;
  if (k === 'HUY') return <Chip label="Đã huỷ" size="small" color="default" variant="outlined" />;

  return <Chip label={status || '-'} size="small" variant="outlined" />;
}

function moneyColor(r: any) {
  const act = String(r?.action || '').toUpperCase();
  const amt = n(r?.amount, 0);

  // Thu/hoàn tác: xanh. Chi: đỏ.
  if (act === 'THU') return 'success.main';
  if (act === 'CHI') return 'error.main';

  // Điều chỉnh: dựa theo dấu amount
  if (act === 'DIEU_CHINH') {
    if (amt > 0) return 'success.main';
    if (amt < 0) return 'error.main';
    return 'text.primary';
  }

  // fallback
  return amt >= 0 ? 'success.main' : 'error.main';
}

function moneySign(r: any) {
  const act = String(r?.action || '').toUpperCase();
  const amt = n(r?.amount, 0);

  if (act === 'CHI') return '-';
  if (act === 'THU') return '+';

  // DIEU_CHINH/HOAN_TAC: theo dấu
  if (amt > 0) return '+';
  if (amt < 0) return '-';
  return '';
}


function smallChip(label?: string, color?: any) {
  const v = String(label || '').trim();
  if (!v) return <Chip label="-" size="small" variant="outlined" />;
  return <Chip label={v} size="small" variant="outlined" color={color} />;
}

function useDebouncedValue<T>(value: T, delayMs = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

type Filters = {
  q: string;
  action: string;
  refType: string;
  hasReceipt: '' | '1' | '0';
  from: string;
  to: string;
  minAmount: string;
  maxAmount: string;
  sort: string;
};

const DEFAULT_FILTERS: Filters = {
  q: '',
  action: '',
  refType: '',
  hasReceipt: '',
  from: '',
  to: '',
  minAmount: '',
  maxAmount: '',
  sort: 'id:DESC',
};

function saveBlob(blob: Blob, fileName: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

// Component hiển thị chi tiết Receipt
function ReceiptDetailCard({ receipt }: { receipt: any }) {
  if (!receipt) return null;

  return (
    <Card variant="outlined" sx={{ mt: 1, backgroundColor: 'action.hover' }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Grid container spacing={2}>
          {/* Thông tin cơ bản */}
          <Grid item xs={12} md={6}>
            <Stack spacing={1}>
              <Typography variant="subtitle2" color="text.secondary">
                Thông tin phiếu
              </Typography>
              <Stack direction="row" spacing={1}>
                <Typography variant="body2" sx={{ minWidth: 100 }}>
                  Mã phiếu:
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  {receipt.code}
                </Typography>
              </Stack>
              {receipt.subtype && (
                <Stack direction="row" spacing={1}>
                  <Typography variant="body2" sx={{ minWidth: 100 }}>
                    Loại phụ:
                  </Typography>
                  <Typography variant="body2">{receipt.subtype}</Typography>
                </Stack>
              )}
              <Stack direction="row" spacing={1}>
                <Typography variant="body2" sx={{ minWidth: 100 }}>
                  Ngày:
                </Typography>
                <Typography variant="body2">{receipt.receipt_date}</Typography>
              </Stack>
              <Stack direction="row" spacing={1}>
                <Typography variant="body2" sx={{ minWidth: 100 }}>
                  Tổng tiền:
                </Typography>
                <Typography variant="body2" fontWeight={700} color="primary">
                  {fmtMoney(receipt.total_amount)}
                </Typography>
              </Stack>
            </Stack>
          </Grid>

          {/* Thông tin liên quan */}
          <Grid item xs={12} md={6}>
            <Stack spacing={1}>
              <Typography variant="subtitle2" color="text.secondary">
                Thông tin liên quan
              </Typography>
              {receipt.warehouse && (
                <Stack direction="row" spacing={1}>
                  <Typography variant="body2" sx={{ minWidth: 100 }}>
                    Kho:
                  </Typography>
                  <Typography variant="body2">{receipt.warehouse.name}</Typography>
                </Stack>
              )}
              {receipt.partner && (
                <Stack direction="row" spacing={1}>
                  <Typography variant="body2" sx={{ minWidth: 100 }}>
                    Đối tác:
                  </Typography>
                  <Typography variant="body2">{receipt.partner.name}</Typography>
                </Stack>
              )}
              {receipt.employee && (
                <Stack direction="row" spacing={1}>
                  <Typography variant="body2" sx={{ minWidth: 100 }}>
                    Nhân viên:
                  </Typography>
                  <Typography variant="body2">{receipt.employee.full_name}</Typography>
                </Stack>
              )}
              {receipt.note && (
                <Stack direction="row" spacing={1}>
                  <Typography variant="body2" sx={{ minWidth: 100 }}>
                    Ghi chú:
                  </Typography>
                  <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                    {receipt.note}
                  </Typography>
                </Stack>
              )}
            </Stack>
          </Grid>

          {/* Chi tiết dòng */}
          {receipt.lines && receipt.lines.length > 0 && (
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Chi tiết dòng ({receipt.lines.length})
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                   <TableRow>
  <TableCell width={50} />
  <TableCell sx={{ fontWeight: 700 }} width={120}>
    Hành động
  </TableCell>

  <TableCell sx={{ fontWeight: 700 }} width={160} align="right">
    Số tiền
  </TableCell>

  <TableCell sx={{ fontWeight: 700 }} width={210}>
    Phiếu
  </TableCell>

  <TableCell sx={{ fontWeight: 700 }} width={150}>
    Trạng thái
  </TableCell>

  <TableCell sx={{ fontWeight: 700 }} width={520}>
    Ghi chú
  </TableCell>

  <TableCell sx={{ fontWeight: 700 }} width={170}>
    Thời gian
  </TableCell>

  <TableCell sx={{ fontWeight: 700 }} width={170}>
    Người tạo
  </TableCell>
</TableRow>

                  </TableHead>
                  <TableBody>
                    {receipt.lines.map((line: any) => {
                      const itemOrSpecies = line.item || line.species;
                      return (
                        <TableRow key={line.id} hover>
                          <TableCell>{line.line_no}</TableCell>
                          <TableCell>
                            {itemOrSpecies ? (
                              <Stack spacing={0.25}>
                                <Typography variant="body2" fontWeight={600}>
                                  {itemOrSpecies.code}
                                </Typography>
                                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                  {itemOrSpecies.name}
                                </Typography>
                              </Stack>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                              {line.description || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">{fmtMoney(line.qty)}</TableCell>
                          <TableCell align="right">{fmtMoney(line.unit_price)}</TableCell>
                          <TableCell align="right">{line.vat_percent}%</TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight={700}>
                              {fmtMoney(line.amount_total)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
}

export default function FundLedgerDialog({ open, onClose, fund }: Props) {
  const { enqueueSnackbar } = useSnackbar();

  const [rows, setRows] = useState<FundLedgerRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;

  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const debouncedQ = useDebouncedValue(filters.q, 450);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [summary, setSummary] = useState<any>(null);

  const pageCount = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total]);

  const params = useMemo<ListFundLedgerParams>(
    () => ({
      fundId: fund?.id || 0,
      page,
      limit,
      q: debouncedQ?.trim() || '',
      action: filters.action || '',
      refType: filters.refType || '',
      hasReceipt: filters.hasReceipt || '',
      from: filters.from || '',
      to: filters.to || '',
      minAmount: filters.minAmount || '',
      maxAmount: filters.maxAmount || '',
      sort: filters.sort || 'id:DESC',
    }),
    [
      fund?.id,
      page,
      limit,
      debouncedQ,
      filters.action,
      filters.refType,
      filters.hasReceipt,
      filters.from,
      filters.to,
      filters.minAmount,
      filters.maxAmount,
      filters.sort,
    ]
  );

  const lastReqId = useRef(0);

  const fetchLedgers = useCallback(async () => {
    if (!open || !fund?.id) return;

    const reqId = ++lastReqId.current;
    setLoading(true);

    try {
      const res = await listFundLedgers(params);
      if (reqId !== lastReqId.current) return;

      setRows(res.data || []);
      setTotal(res.total || 0);
      setSummary(res.summary || null);
    } catch (e: any) {
      enqueueSnackbar(e?.message || 'Load ledgers failed', { variant: 'error' });
    } finally {
      if (reqId === lastReqId.current) setLoading(false);
    }
  }, [open, fund?.id, params]);

  useEffect(() => {
    if (!open) return;
    setPage(1);
    setRows([]);
    setTotal(0);
    setShowAdvanced(false);
    setExpandedRow(null);
    setSummary(null);
  }, [open, fund?.id]);

  useEffect(() => {
    if (!open) return;
    setPage(1);
  }, [
    open,
    debouncedQ,
    filters.action,
    filters.refType,
    filters.hasReceipt,
    filters.from,
    filters.to,
    filters.minAmount,
    filters.maxAmount,
    filters.sort,
  ]);

  useEffect(() => {
    if (open) fetchLedgers();
  }, [open, fetchLedgers]);

  const handleClearFilters = () => setFilters(DEFAULT_FILTERS);

  const handleExport = async () => {
    if (!fund?.id) return;

    setExporting(true);
    try {
      const blob = await exportFundLedgersExcel({
        ...params,
        page: 1,
        limit: 5000,
      });

      const safeFundName = String(fund?.name || 'fund')
        .replaceAll(/[\\/:*?"<>|]/g, '_')
        .slice(0, 80);

      saveBlob(blob, `fund-ledgers-${safeFundName}-${new Date().toISOString().slice(0, 10)}.xlsx`);
      enqueueSnackbar('Xuất Excel thành công', { variant: 'success' });
    } catch (e: any) {
      enqueueSnackbar(e?.message || 'Xuất Excel thất bại', { variant: 'error' });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xl">
      <DialogTitle sx={{ pb: 1.25 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Stack spacing={0.25}>
            <Typography variant="h6">Lịch sử quỹ</Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Quỹ: <b>{fund?.name || '-'}</b> • Số dư: <b>{fmtMoney(fund?.balance)}</b>
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <Tooltip title="Tải lại">
              <span>
                <IconButton onClick={fetchLedgers} disabled={loading || !fund?.id}>
                  <Iconify icon="eva:refresh-fill" />
                </IconButton>
              </span>
            </Tooltip>

            <Button
              onClick={handleExport}
              disabled={exporting || !fund?.id}
              variant="contained"
              startIcon={
                exporting ? <CircularProgress size={18} /> : <Iconify icon="eva:download-fill" />
              }
            >
              Xuất Excel
            </Button>

            <Tooltip title="Đóng">
              <IconButton onClick={onClose}>
                <Iconify icon="eva:close-fill" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </DialogTitle>

      <DialogContent>
        {/* Filters */}
        <Paper variant="outlined" sx={{ p: 1.25, mb: 1.5, borderRadius: 2 }}>
          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1} alignItems="stretch">
            <TextField
              size="small"
              label="Tìm kiếm"
              value={filters.q}
              onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value }))}
              placeholder="note / mã phiếu / người tạo..."
              fullWidth
              InputProps={{
                startAdornment: <Iconify icon="eva:search-fill" sx={{ mr: 1, opacity: 0.65 }} />,
                endAdornment: filters.q ? (
                  <IconButton size="small" onClick={() => setFilters((p) => ({ ...p, q: '' }))}>
                    <Iconify icon="eva:close-circle-fill" />
                  </IconButton>
                ) : null,
              }}
            />

            <TextField
              size="small"
              select
              label="Hành động"
              value={filters.action}
              onChange={(e) => setFilters((p) => ({ ...p, action: e.target.value }))}
              sx={{ minWidth: 120 }}
            >
              <MenuItem value="">Tất cả</MenuItem>
              <MenuItem value="THU">THU</MenuItem>
              <MenuItem value="CHI">CHI</MenuItem>
              <MenuItem value="DIEU_CHINH">DIEU_CHINH</MenuItem>
              <MenuItem value="HOAN_TAC">HOAN_TAC</MenuItem>
            </TextField>

            <TextField
              size="small"
              select
              label="Có phiếu?"
              value={filters.hasReceipt}
              onChange={(e) => setFilters((p) => ({ ...p, hasReceipt: e.target.value as any }))}
              sx={{ minWidth: 140 }}
            >
              <MenuItem value="">Tất cả</MenuItem>
              <MenuItem value="1">Có phiếu</MenuItem>
              <MenuItem value="0">Không có</MenuItem>
            </TextField>

            <TextField
              size="small"
              select
              label="Sắp xếp"
              value={filters.sort}
              onChange={(e) => setFilters((p) => ({ ...p, sort: e.target.value }))}
              sx={{ minWidth: 190 }}
            >
              <MenuItem value="id:DESC">Mới nhất</MenuItem>
              <MenuItem value="id:ASC">Cũ nhất</MenuItem>
              <MenuItem value="created_at:DESC">Thời gian mới</MenuItem>
              <MenuItem value="created_at:ASC">Thời gian cũ</MenuItem>
              <MenuItem value="amount:DESC">Tiền giảm dần</MenuItem>
              <MenuItem value="amount:ASC">Tiền tăng dần</MenuItem>
            </TextField>

            <Button
              size="small"
              variant="outlined"
              color="inherit"
              onClick={() => setShowAdvanced((p) => !p)}
              startIcon={
                <Iconify icon={showAdvanced ? 'eva:chevron-up-fill' : 'eva:chevron-down-fill'} />
              }
              sx={{ whiteSpace: 'nowrap', minWidth: 140 }}
            >
              Nâng cao
            </Button>

            <Button
              size="small"
              variant="outlined"
              color="inherit"
              onClick={handleClearFilters}
              disabled={loading}
              startIcon={<Iconify icon="eva:trash-2-fill" />}
              sx={{ whiteSpace: 'nowrap', minWidth: 140 }}
            >
              Reset
            </Button>
          </Stack>

          <Collapse in={showAdvanced}>
            <Divider sx={{ my: 1.25 }} />
            <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1} alignItems="stretch">
              <TextField
                size="small"
                label="Từ ngày"
                value={filters.from}
                onChange={(e) => setFilters((p) => ({ ...p, from: e.target.value }))}
                placeholder="dd/mm/yyyy"
                sx={{ minWidth: 160 }}
                inputProps={{ inputMode: 'numeric' }}
                helperText="Ví dụ: 01/02/2026"
              />

              <TextField
                size="small"
                label="Đến ngày"
                value={filters.to}
                onChange={(e) => setFilters((p) => ({ ...p, to: e.target.value }))}
                placeholder="dd/mm/yyyy"
                sx={{ minWidth: 160 }}
                inputProps={{ inputMode: 'numeric' }}
                helperText="Ví dụ: 28/02/2026"
              />

              {/* <TextField
                size="small"
                label="Min"
                value={filters.minAmount}
                onChange={(e) => setFilters((p) => ({ ...p, minAmount: e.target.value }))}
                sx={{ minWidth: 140 }}
                inputProps={{ inputMode: 'numeric' }}
              />

              <TextField
                size="small"
                label="Max"
                value={filters.maxAmount}
                onChange={(e) => setFilters((p) => ({ ...p, maxAmount: e.target.value }))}
                sx={{ minWidth: 140 }}
                inputProps={{ inputMode: 'numeric' }}
              /> */}
            </Stack>
          </Collapse>
        </Paper>

        {summary?.totalsByAction && (
          <Paper variant="outlined" sx={{ p: 1.25, mb: 1.5, borderRadius: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              {Object.entries(summary.totalsByAction).map(([act, v]: any) => (
                <Chip
                  key={act}
                  variant="outlined"
                  label={`${act}: ${fmtMoney(v?.total || 0)} (${v?.count || 0})`}
                  sx={{ mb: 0.5 }}
                />
              ))}

              <Box sx={{ flexGrow: 1 }} />

              <Typography variant="subtitle2">
                Tổng: <b>{fmtMoney(summary.grandTotal || 0)}</b>
              </Typography>
            </Stack>
          </Paper>
        )}

        {/* Table */}
        <TableContainer
          sx={{
            position: 'relative',
            borderRadius: 2,
            border: (theme) => `1px solid ${theme.palette.divider}`,
            maxHeight: '62vh',
          }}
        >
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell width={50} />
                <TableCell sx={{ fontWeight: 700 }} width={120}>
                  Hành động
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }} width={150} align="right">
                  Số tiền
                </TableCell>
                {/* <TableCell sx={{ fontWeight: 700 }} width={150} align="right">
                  Trước
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }} width={150} align="right">
                  Sau
                </TableCell> */}
                <TableCell sx={{ fontWeight: 700 }} width={190}>
                  Phiếu
                </TableCell>

                <TableCell sx={{ fontWeight: 700 }} width={150}>
                  Trạng thái
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Ghi chú</TableCell>
                <TableCell sx={{ fontWeight: 700 }} width={170}>
                  Thời gian
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }} width={170}>
                  Người tạo
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {rows.map((r, idx) => (
                <>
                  <TableRow
                    key={r.id}
                    hover
                    sx={{
                      '& td': { verticalAlign: 'top' },
                      backgroundColor: idx % 2 ? 'action.hover' : 'transparent',
                      cursor: r.receipt ? 'pointer' : 'default',
                    }}
                    onClick={() => {
                      if (r.receipt) {
                        setExpandedRow(expandedRow === r.id ? null : r.id);
                      }
                    }}
                  >
                    <TableCell>
                      {r.receipt && (
                        <IconButton size="small">
                          <Iconify
                            icon={
                              expandedRow === r.id
                                ? 'eva:chevron-down-fill'
                                : 'eva:chevron-right-fill'
                            }
                          />
                        </IconButton>
                      )}
                    </TableCell>
                    <TableCell>{actionChip(r.action)}</TableCell>

                   <TableCell align="right">
  <Typography
    variant="body2"
    sx={{
      fontWeight: 800,
      color: moneyColor(r),
      fontVariantNumeric: 'tabular-nums',
    }}
  >
    {moneySign(r)}
    {fmtMoney(r.amount)}
  </Typography>
</TableCell>


                    {/* <TableCell align="right" sx={{ opacity: 0.9 }}>
                      {fmtMoney(r.balance_before)}
                    </TableCell>
                    <TableCell align="right" sx={{ opacity: 0.9 }}>
                      {fmtMoney(r.balance_after)}
                    </TableCell> */}

                    <TableCell>
                      {r.receipt?.code ? (
                        <Stack spacing={0.25}>
                          <Typography variant="body2" sx={{ fontWeight: 800 }}>
                            {r.receipt.code}
                          </Typography>
                          {!!r.receipt?.subtype && (
                            <Typography variant="caption" sx={{ opacity: 0.75 }}>
                              {r.receipt.subtype}
                            </Typography>
                          )}
                        </Stack>
                      ) : (
                        <Typography variant="body2" sx={{ opacity: 0.7 }}>
                          -
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell>{r.receipt?.status ? statusChip(r.receipt.status) : '-'}</TableCell>


                    <TableCell>
  <Typography
    variant="body2"
    sx={{
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
      lineHeight: 1.35,
    }}
  >
    {r.note || '-'}
  </Typography>
</TableCell>


                    <TableCell>{r.created_at ? fDateTime(r.created_at) : '-'}</TableCell>
                    <TableCell>{r?.creator?.full_name || '-'}</TableCell>
                  </TableRow>

                  {/* Expanded row */}
                  {expandedRow === r.id && (
                    <TableRow>
                      <TableCell colSpan={8} sx={{ py: 0, px: 2 }}>
                        <Collapse in={expandedRow === r.id} timeout="auto" unmountOnExit>
                          <Box sx={{ py: 2 }}>
                            <ReceiptDetailCard receipt={r.receipt} />
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}

              {!rows.length && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6, opacity: 0.7 }}>
                    {loading ? 'Đang tải...' : 'Chưa có lịch sử'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {loading && (
            <Stack
              alignItems="center"
              justifyContent="center"
              sx={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(255,255,255,0.55)',
                backdropFilter: 'blur(2px)',
              }}
            >
              <CircularProgress />
            </Stack>
          )}
        </TableContainer>

        {/* Footer */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems="center"
          sx={{ mt: 1.5 }}
        >
          <Typography variant="body2" sx={{ opacity: 0.75 }}>
            Tổng: <b>{total.toLocaleString('vi-VN')}</b> dòng
          </Typography>

          <Pagination
            count={pageCount}
            page={page}
            onChange={(_, v) => setPage(v)}
            color="primary"
          />
        </Stack>

        <Box sx={{ mt: 1, opacity: 0.65 }}>
          <Typography variant="caption">
            Tip: Click vào dòng có phiếu để xem chi tiết. Bấm "Nâng cao" để lọc theo ngày & khoảng
            tiền.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
}
