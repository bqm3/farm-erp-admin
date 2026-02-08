/* eslint-disable no-nested-ternary */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Card,
  Stack,
  Typography,
  TextField,
  MenuItem,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Chip,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from '@mui/material';
import { enqueueSnackbar } from 'src/components/snackbar';
import Iconify from 'src/components/iconify';
import {
  approveReceipt,
  rejectReceipt,
  createReceipt,
  getReceiptsByWorkCycle,
  type ReceiptRow,
} from 'src/api/receipts';

import ReceiptImportDialog from './receipt-import-dialog';
import ReceiptHarvestSoldDialog from './receipt-harvest-sold-dialog';

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'CHO_DUYET', label: 'Chờ duyệt' },
  { value: 'DA_DUYET', label: 'Đã duyệt' },
  { value: 'TU_CHOI', label: 'Từ chối' },
  { value: 'DA_CHOT', label: 'Đã chốt' },
  { value: 'HUY', label: 'Hủy' },
];

const STATUS_LABEL: Record<string, string> = {
  NHAP: 'Nhập',
  HUY: 'Hủy',
  CHO_DUYET: 'Chờ duyệt',
  DA_DUYET: 'Đã duyệt',
  TU_CHOI: 'Từ chối',
  DA_CHOT: 'Đã chốt',
};

const TYPE_LABEL: Record<string, string> = {
  CHI: 'Nhập / Tăng',
  THU: 'Xuất / Giảm',
};

const SOURCE_LABEL: Record<string, string> = {
  BEN_NGOAI: 'Bên ngoài',
  KHO: 'Kho',
};

// subtype
const SUBTYPE_LABEL: Record<string, string> = {
  IMPORT: 'Nhập giống',
  INCREASE: 'Tăng',
  THEM: 'Thêm',
  BORN: 'Sinh',
  ADJUST_IN: 'Điều chỉnh tăng',
  XUAT: 'Xuất',
  HARVEST: 'Xuất chuồng / Thu hoạch',
  SOLD: 'Bán',
  NHAP_LAI: 'Nhập lại',
  DEATH: 'Chết / Hao hụt',
  DECREASE: 'Giảm',
  ADJUST_OUT: 'Điều chỉnh giảm',
  THU_HOACH: 'Xuất chuồng / Thu hoạch',
};

function labelOf(map: Record<string, string>, v: any) {
  const k = String(v || '').toUpperCase();
  return map[k] || (v ?? '');
}

function formatDateVN(v: any) {
  if (!v) return '';
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split('-');
    return `${d}/${m}/${y}`;
  }
  const dt = new Date(s);
  if (Number.isNaN(dt.getTime())) return s;
  const dd = String(dt.getDate()).padStart(2, '0');
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const yy = dt.getFullYear();
  return `${dd}/${mm}/${yy}`;
}

function displayWarehouse(r: any) {
  const w = r?.warehouse;
  if (!w) return '—';
  const code = w.code ? ` (${w.code})` : '';
  return `${w.name || '—'}${code}`;
}

function displayFund(r: any) {
  const f = r?.fund;
  if (!f) return '—';
  // ví dụ: VCB (CHUYEN_KHOAN)
  const t = f.fund_type ? ` (${f.fund_type})` : '';
  return `${f.name || '—'}${t}`;
}

function displayCreator(r: any) {
  const u = r?.creator;
  if (!u) return '—';
  const un = u.username ? ` (${u.username})` : '';
  return `${u.full_name || '—'}${un}`;
}

function displayPartner(r: any) {
  const p = r?.partner;
  if (!p) return '—';
  const phone = p.phone ? ` (${p.phone})` : '';
  return `${p.name || p.name || '—'}${phone}`;
}

function displayTask(r: any) {
  const t = r?.task;
  if (!t) return '—';
  return t.name || t.title || t.code || '—';
}

function displaySpecies(sp: any) {
  if (!sp) return '';
  // tùy backend có field gì thì ưu tiên name/code
  const name = sp.name || sp.species_name || sp.title || '';
  const code = sp.code || sp.species_code || '';
  if (name && code) return `${name} (${code})`;
  return name || code || '';
}

function displayLineItemWithSpecies(ln: any) {
  const it = ln?.item;
  const sp = ln?.species;

  const itName = it ? it.name || it.code || it.sku || '' : '';
  const itCode = it?.code && it?.name ? it.code : ''; // tránh lặp nếu name đã là code
  const itemText = itName
    ? itCode
      ? `${itName} (${itCode})`
      : itName
    : ln?.item_id
    ? `#${ln.item_id}`
    : '—';

  const spText = displaySpecies(sp);

  // Nếu có species thì gộp chung
  if (spText) return `${itemText} • ${spText}`;
  return itemText;
}

const TYPE_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'CHI', label: 'Nhập / Tăng' },
  { value: 'THU', label: 'Xuất / Giảm' },
];

function n(v: any, fb = 0) {
  const x = Number(v);
  return Number.isFinite(x) ? x : fb;
}

function receiptAmountTotal(r: any) {
  const c = n(r?.computed?.amount_total, 0);
  if (c > 0) return c;

  const t = n(r?.total_amount, 0);
  if (t > 0) return t;

  return 0;
}

function receiptAmountBeforeTax(r: any) {
  const c = n(r?.computed?.amount_before_tax, 0);
  if (c > 0) return c;

  return 0;
}

function receiptVatAmount(r: any) {
  const c = n(r?.computed?.vat_amount, 0);
  if (c > 0) return c;
  return 0;
}

function statusChip(s: string) {
  const k = String(s || '').toUpperCase();
  if (k === 'CHO_DUYET') return <Chip label="Chờ duyệt" size="small" color="info" />;
  if (k === 'DA_DUYET') return <Chip label="Đã duyệt" size="small" color="success" />;
  if (k === 'TU_CHOI') return <Chip label="Từ chối" size="small" color="warning" />;
  if (k === 'DA_CHOT') return <Chip label="Đã chốt" size="small" />;
  if (k === 'HUY') return <Chip label="Hủy" size="small" />;
  return <Chip label={STATUS_LABEL[k] || s} size="small" />;
}

function money(v: any) {
  const x = Number(v || 0);
  return x.toLocaleString('vi-VN');
}

function qty(v: any) {
  const x = Number(v || 0);
  return x.toLocaleString('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: 3 });
}

export default function WorkCycleReceiptListView({
  workCycleId,
  canApprove = true,
}: {
  workCycleId: number;
  canApprove?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<ReceiptRow[]>([]);
  const [paging, setPaging] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  const [status, setStatus] = useState<string>('');
  const [type, setType] = useState<string>('');
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');

  const [openImport, setOpenImport] = useState(false);
  const [openReceiptHS, setOpenReceiptHS] = useState(false);

  const [confirmApprove, setConfirmApprove] = useState<{ open: boolean; row?: ReceiptRow }>({
    open: false,
  });
  const [confirmReject, setConfirmReject] = useState<{ open: boolean; row?: ReceiptRow }>({
    open: false,
  });
  const [rejectReason, setRejectReason] = useState<string>('');

  const [detail, setDetail] = useState<{ open: boolean; row?: ReceiptRow }>({ open: false });

  const openReject = (row: ReceiptRow) => {
    setRejectReason('');
    setConfirmReject({ open: true, row });
  };

  const openDetail = (row: ReceiptRow) => {
    setDetail({ open: true, row });
  };

  const fetchData = useCallback(async () => {
    if (!workCycleId) return;
    setLoading(true);
    try {
      const res = await getReceiptsByWorkCycle({
        work_cycle_id: workCycleId,
        page: paging.page,
        limit: paging.limit,
        status: status || undefined,
        type: type || undefined,
        from: from || undefined,
        to: to || undefined,
      });

      if (!res) throw new Error(res || 'Fetch failed');
      setRows(res.data || []);
      setPaging((p) => ({ ...p, ...res.paging }));
    } catch (e: any) {
      enqueueSnackbar(e?.message || 'Không tải được danh sách receipt', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [workCycleId, paging.page, paging.limit, status, type, from, to]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateImport = async (payload: any) => {
    try {
      const res = await createReceipt(payload);
      if (!res) throw new Error(res || 'Create lỗi');

      enqueueSnackbar('Tạo phiếu nhập giống thành công', { variant: 'success' });
      setPaging((p) => ({ ...p, page: 1 }));
      await fetchData();
    } catch (e: any) {
      enqueueSnackbar(e?.message || 'Tạo phiếu thất bại', { variant: 'error' });
    }
  };

  const handleCreateHarvestSold = async (payload: any) => {
    try {
      await createReceipt(payload);
      enqueueSnackbar('Tạo phiếu xuất / bán thành công', { variant: 'success' });
      await fetchData();
    } catch (e: any) {
      enqueueSnackbar(e?.message || 'Tạo phiếu thất bại', { variant: 'error' });
    }
  };

  const openApprove = (row: ReceiptRow) => setConfirmApprove({ open: true, row });

  const doApprove = async () => {
    const row = confirmApprove.row;
    if (!row) return;

    try {
      const res = await approveReceipt(row.id);
      if (res?.ok === false) throw new Error(res?.message || 'Approve failed');

      enqueueSnackbar('Duyệt phiếu thành công', { variant: 'success' });
      setConfirmApprove({ open: false });
      await fetchData();
    } catch (e: any) {
      enqueueSnackbar(e?.message || 'Duyệt phiếu thất bại', { variant: 'error' });
    }
  };

  const doReject = async () => {
    const row = confirmReject.row;
    if (!row) return;

    const reason = rejectReason.trim();
    if (!reason) {
      enqueueSnackbar('Phải nhập lý do từ chối', { variant: 'warning' });
      return;
    }

    try {
      const res = await rejectReceipt(row.id, { reason });
      if (res?.ok === false) throw new Error(res?.message || 'Reject failed');

      enqueueSnackbar('Từ chối phiếu thành công', { variant: 'success' });
      setConfirmReject({ open: false });
      await fetchData();
    } catch (e: any) {
      enqueueSnackbar(e?.message || 'Từ chối phiếu thất bại', { variant: 'error' });
    }
  };

  const detailRow = detail.row;
  const detailLines = detailRow?.lines || [];
  const computed = detailRow?.computed;

  return (
    <>
      <Stack spacing={2}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
          <Typography variant="h5">Danh sách Phiếu</Typography>
          <Stack direction="row" spacing={1}>
            <Button variant="contained" onClick={() => setOpenImport(true)}>
              Tạo phiếu nhập giống
            </Button>

            <Button
              variant="outlined"
              startIcon={<Iconify icon="mdi:receipt-text-outline" />}
              onClick={() => setOpenReceiptHS(true)}
            >
              Tạo phiếu xuất chuồng / bán
            </Button>
          </Stack>
        </Stack>

        <Card sx={{ p: 2 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
            <TextField
              select
              label="Trạng thái"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPaging((p) => ({ ...p, page: 1 }));
              }}
              sx={{ minWidth: 180 }}
            >
              {STATUS_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Loại"
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPaging((p) => ({ ...p, page: 1 }));
              }}
              sx={{ minWidth: 180 }}
            >
              {TYPE_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              type="date"
              label="Từ ngày"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setPaging((p) => ({ ...p, page: 1 }));
              }}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 170 }}
            />

            <TextField
              type="date"
              label="Đến ngày"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setPaging((p) => ({ ...p, page: 1 }));
              }}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 170 }}
            />

            <Stack direction="row" spacing={1} sx={{ ml: 'auto' }}>
              <Button
                variant="outlined"
                onClick={() => {
                  setStatus('');
                  setType('');
                  setFrom('');
                  setTo('');
                  setPaging((p) => ({ ...p, page: 1 }));
                }}
              >
                Làm mới
              </Button>
            </Stack>
          </Stack>
        </Card>

        <Card>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Mã</TableCell>
                  <TableCell>Ngày</TableCell>
                  <TableCell>Loại</TableCell>
                  <TableCell>Phân loại</TableCell>
                  <TableCell>Nguồn</TableCell>
                  <TableCell align="right">Số lượng</TableCell>
                  <TableCell align="right">Tổng tiền</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell align="right">Hành động</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {rows.map((r) => {
                  const statusKey = String(r.status || '').toUpperCase();

                  return (
                    <TableRow key={r.id} hover>
                      <TableCell>{r.code}</TableCell>
                      <TableCell>{formatDateVN(r.receipt_date)}</TableCell>
                      <TableCell>{labelOf(TYPE_LABEL, r.type)}</TableCell>
                      <TableCell>{labelOf(SUBTYPE_LABEL, r.subtype)}</TableCell>
                      <TableCell>{labelOf(SOURCE_LABEL, r.source)}</TableCell>

                      <TableCell align="right">{r.computed?.total_qty ?? ''}</TableCell>
                      <TableCell align="right"> {money(receiptAmountTotal(r))}</TableCell>
                      <TableCell>{statusChip(r.status)}</TableCell>

                      <TableCell align="right">
                        {canApprove && statusKey === 'CHO_DUYET' ? (
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              onClick={() => openApprove(r)}
                            >
                              Duyệt
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="warning"
                              onClick={() => openReject(r)}
                            >
                              Từ chối
                            </Button>
                            <Button size="small" variant="outlined" onClick={() => openDetail(r)}>
                              Chi tiết
                            </Button>
                          </Stack>
                        ) : (
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button size="small" variant="outlined" onClick={() => openDetail(r)}>
                              Xem chi tiết
                            </Button>
                          </Stack>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}

                {!loading && rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9}>
                      <Typography variant="body2" sx={{ p: 2, color: 'text.secondary' }}>
                        Không có dữ liệu
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}

                {loading && (
                  <TableRow>
                    <TableCell colSpan={9}>
                      <Typography variant="body2" sx={{ p: 2, color: 'text.secondary' }}>
                        Đang tải...
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Stack direction="row" justifyContent="flex-end" sx={{ p: 2 }}>
            <Pagination
              page={paging.page}
              count={paging.totalPages}
              onChange={(_, p) => setPaging((x) => ({ ...x, page: p }))}
            />
          </Stack>
        </Card>
      </Stack>

      {/* Create import dialog */}
      <ReceiptImportDialog
        open={openImport}
        onClose={() => setOpenImport(false)}
        workCycleId={workCycleId}
        onSubmit={handleCreateImport}
      />

      <ReceiptHarvestSoldDialog
        open={openReceiptHS}
        onClose={() => setOpenReceiptHS(false)}
        onSubmit={handleCreateHarvestSold}
        workCycleId={workCycleId}
      />

      {/* Confirm approve */}
      <Dialog open={confirmApprove.open} onClose={() => setConfirmApprove({ open: false })}>
        <DialogTitle>Xác nhận duyệt phiếu</DialogTitle>
        <DialogContent>
          <Typography>
            Duyệt phiếu <b>{confirmApprove.row?.code}</b> ?
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Sau khi duyệt, hệ thống sẽ apply vào Công Việc hoặc vào Kho.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmApprove({ open: false })}>Hủy</Button>
          <Button variant="contained" onClick={doApprove}>
            Duyệt
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm reject */}
      <Dialog
        open={confirmReject.open}
        onClose={() => setConfirmReject({ open: false })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Từ chối phiếu</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 1 }}>
            Từ chối phiếu <b>{confirmReject.row?.code}</b> ?
          </Typography>

          <TextField
            label="Lý do từ chối"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            fullWidth
            multiline
            minRows={2}
            placeholder="Nhập lý do (bắt buộc)"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmReject({ open: false })}>Hủy</Button>
          <Button variant="contained" color="error" onClick={doReject}>
            Từ chối
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={detail.open} onClose={() => setDetail({ open: false })} maxWidth="md" fullWidth>
        <DialogTitle>Chi tiết Phiếu</DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          {detailRow ? (
            <Stack spacing={2}>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={2}
                justifyContent="space-between"
              >
                <Stack spacing={0.5}>
                  <Typography variant="subtitle2">
                    Mã: <b>{detailRow.code}</b>
                  </Typography>
                  <Typography variant="body2">
                    Ngày: {formatDateVN(detailRow.receipt_date)}
                  </Typography>
                  <Typography variant="body2">
                    Loại: {labelOf(TYPE_LABEL, detailRow.type)} • Phân loại:{' '}
                    {labelOf(SUBTYPE_LABEL, detailRow.subtype)}
                  </Typography>
                </Stack>

                <Stack spacing={0.5} alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
                  <Typography variant="body2">
                    Trạng thái: {statusChip(detailRow.status)}
                  </Typography>
                  <Typography variant="body2">
                    Nguồn: {labelOf(SOURCE_LABEL, detailRow.source)} • Kho:{' '}
                    <b>{displayWarehouse(detailRow)}</b>
                  </Typography>

                  <Typography variant="body2">
                    Quỹ: <b>{displayFund(detailRow)}</b>
                  </Typography>

                  <Typography variant="body2">
                    Người tạo: <b>{displayCreator(detailRow)}</b>
                  </Typography>

                  <Typography variant="body2">
                    Đối tác: <b>{displayPartner(detailRow)}</b>
                  </Typography>

                  <Typography variant="body2">
                    Vụ/lứa: <b>{displayTask(detailRow)}</b>
                  </Typography>
                </Stack>
              </Stack>

              <Divider />

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <Card variant="outlined" sx={{ p: 1.5, flex: 1 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Tổng hợp
                  </Typography>
                  <Stack spacing={0.5}>
                    <Typography variant="body2">
                      Tổng số lượng: <b>{computed?.total_qty ?? 0}</b>
                    </Typography>
                    <Typography variant="body2">
                      Trước thuế: <b>{money(receiptAmountBeforeTax(detailRow))}</b>
                    </Typography>
                    <Typography variant="body2">
                      VAT: <b>{money(receiptVatAmount(detailRow))}</b>
                    </Typography>
                    <Typography variant="body2">
                      Tổng: <b>{money(receiptAmountTotal(detailRow))}</b>
                    </Typography>
                  </Stack>
                </Card>

                <Card variant="outlined" sx={{ p: 1.5, flex: 1 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Ghi chú
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {detailRow.note || '—'}
                  </Typography>
                </Card>
              </Stack>

              <Typography variant="subtitle2">Chi tiết dòng (lines)</Typography>

              <TableContainer component={Card} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Hàng hóa</TableCell>
                      <TableCell>Mô tả</TableCell>
                      <TableCell align="right">SL</TableCell>
                      <TableCell align="right">Đơn giá</TableCell>
                      <TableCell align="right">% VAT</TableCell>
                      <TableCell align="right">Trước thuế</TableCell>
                      <TableCell align="right">VAT</TableCell>
                      <TableCell align="right">Thành tiền</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {detailLines.map((ln: any, idx: number) => (
                      <TableRow key={ln.id ?? idx} hover>
                        <TableCell>{ln.line_no ?? idx + 1}</TableCell>
                        <TableCell>
                          <Typography variant="body2">{displayLineItemWithSpecies(ln)}</Typography>
                        </TableCell>

                        <TableCell sx={{ maxWidth: 280 }}>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                            {ln.description || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">{qty(ln.qty ?? 0)}</TableCell>
                        <TableCell align="right">{money(ln.unit_price ?? 0)}</TableCell>
                        <TableCell align="right">{money(ln.vat_percent ?? 0)}</TableCell>
                        <TableCell align="right">{money(ln.amount_before_tax ?? 0)}</TableCell>
                        <TableCell align="right">{money(ln.vat_amount ?? 0)}</TableCell>
                        <TableCell align="right">{money(ln.amount_total ?? 0)}</TableCell>
                      </TableRow>
                    ))}

                    {detailLines.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={10}>
                          <Typography variant="body2" sx={{ p: 1, color: 'text.secondary' }}>
                            Không có dòng chi tiết
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Stack>
          ) : (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Không có dữ liệu
            </Typography>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setDetail({ open: false })}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
