/* eslint-disable no-nested-ternary */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable no-plusplus */
/* eslint-disable no-restricted-syntax */
// src/sections/receipts/receipt-create-dialog.tsx

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  TextField,
  MenuItem,
  Typography,
  Divider,
  IconButton,
  Autocomplete,
  Alert,
  Grid,
  Card,
  Box,
  Chip,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Iconify from 'src/components/iconify';
import type { ReceiptCreatePayload, ReceiptType } from 'src/api/receipts';
import { listWorkCycles } from 'src/api/workcycle';
import { enqueueSnackbar } from 'src/components/snackbar';
import { listWarehouses } from 'src/api/warehouse';
import { listItems } from 'src/api/items';
import { listFunds } from 'src/api/funds';
import { listPartners } from 'src/api/partners';
import { formatMoney, parseMoneyToNumber } from 'src/utils/format-number';

function fmt(v: any) {
  const s = v === null || v === undefined ? '' : String(v);
  return s.trim() ? s : '-';
}

function n(v: any, fb = 0) {
  const x = Number(v);
  return Number.isFinite(x) ? x : fb;
}

const money = new Intl.NumberFormat('vi-VN');

type Props = {
  open: boolean;
  onClose: VoidFunction;
  onSubmit: (payload: ReceiptCreatePayload) => Promise<void>;
};

type LineForm = {
  item_id?: number | null;
  description?: string;
  qty: number;
  unit?: string;

  // ⚠️ unit_price ở UI của bạn đang dùng như "TỔNG TIỀN DÒNG (trước VAT)"
  unit_price?: number; // number để tính toán + submit
  unit_price_text?: string; // string để hiển thị có dấu phân tách

  vat_percent?: number;
};

type StockReceiptMode = 'NHAP_KHO' | 'XUAT_KHO' | 'NHAP_LAI' | 'TRA_NCC';
type SubtypeMode = 'THEM' | 'XUAT' | 'NHAP_LAI' | 'TRA_NCC';

const MODE_OPTIONS = [
  { value: 'NHAP_KHO', label: 'Phiếu nhập kho (mua từ nhà phân phối)' },
  { value: 'XUAT_KHO', label: 'Phiếu xuất kho (cho công việc)' },
  { value: 'NHAP_LAI', label: 'Phiếu nhập lại (trả từ công việc về kho)' },
  { value: 'TRA_NCC', label: 'Phiếu trả nhà cung cấp (xuất kho + hoàn tiền vào quỹ)' },
];

const SUBTYPE_OPTIONS = [
  { value: 'THEM', label: 'Thêm' },
  { value: 'XUAT', label: 'Xuất' },
  { value: 'NHAP_LAI', label: 'Nhập lại' },
  { value: 'TRA_NCC', label: 'Trả NCC' },
];

function makeEmptyLine(): LineForm {
  return {
    item_id: null,
    description: '',
    qty: 1,
    unit: '',
    unit_price: 0,
    unit_price_text: '0',
    vat_percent: 0,
  };
}

export default function ReceiptCreateDialog({ open, onClose, onSubmit }: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [submitting, setSubmitting] = useState(false);

  const [mode, setMode] = useState<StockReceiptMode>('NHAP_KHO');
  const [subtype, setSubtype] = useState<SubtypeMode>('THEM');

  const type: ReceiptType = useMemo(() => {
    if (mode === 'NHAP_LAI') return 'CHI';
    if (mode === 'NHAP_KHO') return 'CHI';
    if (mode === 'XUAT_KHO') return 'THU';
    if (mode === 'TRA_NCC') return 'THU';
    return 'CHI';
  }, [mode]);

  useEffect(() => {
    if (mode === 'NHAP_KHO') setSubtype('THEM');
    else if (mode === 'XUAT_KHO') setSubtype('XUAT');
    else if (mode === 'NHAP_LAI') setSubtype('NHAP_LAI');
    else if (mode === 'TRA_NCC') setSubtype('TRA_NCC');
  }, [mode]);

  const isNhapKho = mode === 'NHAP_KHO';
  const isXuatKho = mode === 'XUAT_KHO';
  const isNhapLai = mode === 'NHAP_LAI';
  const isTraNcc = mode === 'TRA_NCC';

  // ===== Header rules (đồng bộ backend) =====
  const fundRequired = isNhapKho || isTraNcc;
  const partnerRequired = isTraNcc;
  const workCycleRequired = isXuatKho || isNhapLai;

  const [fund_id, setFundId] = useState<string>('');
  const [funds, setFunds] = useState<{ id: number; name: string }[]>([]);

  const [warehouse_id, setWarehouseId] = useState<string>('');
  const [work_cycle_id, setWorkCycleId] = useState<string>('');
  const [workCycles, setWorkCycles] = useState<{ id: number; code: string; name: string }[]>([]);
  const [warehouses, setWarehouses] = useState<{ id: number; code: string; name: string }[]>([]);
  const [items, setItems] = useState<any[]>([]);

  const [note, setNote] = useState<string>('');
  const [lines, setLines] = useState<LineForm[]>([makeEmptyLine()]);

  const [partner_id, setPartnerId] = useState<number | null>(null);
  const [partners, setPartners] = useState<any[]>([]);

  const selectedPartner = useMemo(
    () => partners.find((p) => p.id === partner_id) || null,
    [partners, partner_id]
  );

  const fetchPartners = useCallback(async () => {
    try {
      const res = await listPartners({ page: 1, limit: 200 });
      const data = (res?.data ?? res ?? []) as any[];
      setPartners(data);
    } catch (err: any) {
      enqueueSnackbar(err?.message || 'Load partners failed!', { variant: 'error' });
    }
  }, []);

  const [receipt_date, setReceiptDate] = useState<string>(() => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  });

  // helper: update line money from input text
  const applyMoneyInput = useCallback((idx: number, raw: string) => {
    const num = parseMoneyToNumber(raw);
    const formatted = formatMoney(num);
    setLines((prev) =>
      prev.map((l, i) =>
        i === idx
          ? {
              ...l,
              unit_price: num,
              unit_price_text: formatted,
            }
          : l
      )
    );
  }, []);

  const handleAddLine = () => setLines((prev) => [...prev, makeEmptyLine()]);
  const handleRemoveLine = (idx: number) => setLines((prev) => prev.filter((_, i) => i !== idx));

  const handleChangeLine = (idx: number, patch: Partial<LineForm>) => {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  };

  const findItemById = useCallback(
    (id?: number | null) => items.find((x) => x.id === id) || null,
    [items]
  );

  // Clear fields khi switch mode
  useEffect(() => {
    // partner: chỉ giữ khi NHAP_KHO / TRA_NCC
    if (!isNhapKho && !isTraNcc) setPartnerId(null);

    // fund: chỉ dùng khi NHAP_KHO / TRA_NCC
    if (isXuatKho || isNhapLai) setFundId('');

    // workcycle: TRA_NCC không dùng
    if (isTraNcc) setWorkCycleId('');

    // XUAT_KHO / NHAP_LAI: không cho nhập tiền, reset tiền/vat về 0 để tránh submit nhầm
    if (isXuatKho || isNhapLai) {
      setLines((prev) =>
        prev.map((l) => ({
          ...l,
          unit_price: 0,
          unit_price_text: '0',
          vat_percent: 0,
        }))
      );
    }
  }, [isXuatKho, isNhapLai, isNhapKho, isTraNcc]);

  // ===== Quick totals (chỉ meaningful khi có nhập tiền) =====
  const totals = useMemo(() => {
    const totalQty = lines.reduce((s, l) => s + Math.abs(n(l.qty, 0)), 0);
    const beforeVat = lines.reduce((s, l) => s + n(l.unit_price, 0), 0);
    const vatAmount = lines.reduce((s, l) => s + (n(l.unit_price, 0) * n(l.vat_percent, 0)) / 100, 0);
    const total = beforeVat + vatAmount;

    return { totalQty, beforeVat, vatAmount, total };
  }, [lines]);

  const headerChip = useMemo(() => {
    if (isNhapKho) return <Chip size="small" color="warning" label="Nhập kho" />;
    if (isXuatKho) return <Chip size="small" color="success" label="Xuất kho" />;
    if (isNhapLai) return <Chip size="small" color="info" label="Nhập lại" />;
    return <Chip size="small" color="secondary" label="Trả NCC" />;
  }, [isNhapKho, isXuatKho, isNhapLai]);

  const subtypeHelper = useMemo(() => {
    if (isNhapKho) return 'Nhập kho = THEM';
    if (isXuatKho) return 'Xuất kho = XUAT';
    if (isNhapLai) return 'Nhập lại = NHAP_LAI';
    return 'Trả NCC = TRA_NCC';
  }, [isNhapKho, isXuatKho, isNhapLai]);

  const fetchWorkCycles = useCallback(async () => {
    try {
      const res = await listWorkCycles({ page: 1, limit: 100 });
      setWorkCycles(res.data || []);
    } catch (err: any) {
      enqueueSnackbar(err?.message || 'Load workcycles failed!', { variant: 'error' });
    }
  }, []);

  const fetchWarehouses = useCallback(async () => {
    try {
      const res = await listWarehouses({ q: undefined, status: undefined, page: 1, pageSize: 200 });
      setWarehouses(res.rows);
    } catch (err: any) {
      enqueueSnackbar(err?.message || 'Load warehouses failed!', { variant: 'error' });
    }
  }, []);

  const fetchItems = useCallback(async () => {
    try {
      const res = await listItems();
      setItems(res);
    } catch (err: any) {
      enqueueSnackbar(err?.message || 'Load items failed!', { variant: 'error' });
    }
  }, []);

  const fetchFunds = useCallback(async () => {
    try {
      const res = await listFunds({ page: 1, limit: 200 });
      setFunds(res.data || []);
    } catch (err: any) {
      enqueueSnackbar(err?.message || 'Load funds failed!', { variant: 'error' });
    }
  }, []);

  useEffect(() => {
    fetchWorkCycles();
    fetchFunds();
    fetchWarehouses();
    fetchItems();
    fetchPartners();
  }, [fetchWorkCycles, fetchFunds, fetchWarehouses, fetchItems, fetchPartners]);

  // ===== UI helpers =====
  const showPartnerBox = isNhapKho || isTraNcc;
  const allowInputMoney = isNhapKho || isTraNcc;
  const disableMoneyField = !allowInputMoney;
  const disableVat = isXuatKho || isNhapLai;

  const handleSubmit = async () => {
    try {
      if (!receipt_date) {
        alert('Ngày là bắt buộc');
        return;
      }

      if (!warehouse_id) {
        alert('Bắt buộc chọn kho');
        return;
      }

      if (fundRequired && !fund_id) {
        alert('Phiếu này bắt buộc chọn quỹ');
        return;
      }

      if (partnerRequired && !partner_id) {
        alert('Trả NCC bắt buộc chọn Nhà cung cấp');
        return;
      }

      if (workCycleRequired && !work_cycle_id) {
        alert('Phiếu này bắt buộc chọn Công việc');
        return;
      }

      for (let i = 0; i < lines.length; i++) {
        const l = lines[i];

        if (!l.item_id) {
          alert(`Dòng #${i + 1}: Chưa chọn Item`);
          return;
        }

        const q = Number(l.qty || 0);
        if (!(q > 0)) {
          alert(`Dòng #${i + 1}: Số lượng phải > 0`);
          return;
        }

        if (isNhapKho || isTraNcc) {
          const lineTotalBeforeVat = Number(l.unit_price || 0);
          if (!(lineTotalBeforeVat > 0)) {
            alert(`Dòng #${i + 1}: Bắt buộc nhập Tổng tiền dòng (trước VAT) > 0`);
            return;
          }
        }
      }

      setSubmitting(true);

      const payload: any = {
        type,
        subtype,
        fund_id: fundRequired ? Number(fund_id) : null,
        partner_id: (isNhapKho || isTraNcc) && partner_id ? Number(partner_id) : null,
        work_cycle_id: workCycleRequired ? Number(work_cycle_id) : null,
        source: 'KHO',
        warehouse_id: Number(warehouse_id),
        receipt_date,
        note: note || null,
        lines: lines.map((l) => ({
          line_kind: l.item_id ? 'VAT_TU' :'GIONG',
          item_id: l.item_id ? Number(l.item_id) : null,
          description: l.description || null,
          qty: Number(l.qty || 0),
          unit: l.unit || null,
          unit_price: Number(l.unit_price || 0),
          vat_percent: Number(l.vat_percent || 0),
        })),
      };

      await onSubmit(payload as ReceiptCreatePayload);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          <Stack spacing={0.25} sx={{ minWidth: 0 }}>
            <Typography variant="h6" noWrap>
              Tạo phiếu kho
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }} noWrap>
              Nhập đầy đủ thông tin và gửi để chờ phê duyệt
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            {headerChip}
            <IconButton onClick={onClose} disabled={submitting}>
              <Iconify icon="eva:close-outline" />
            </IconButton>
          </Stack>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <Stack spacing={2}>
          <Card variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Grid container spacing={1.5}>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  label="Loại phiếu"
                  value={mode}
                  onChange={(e) => setMode(e.target.value as StockReceiptMode)}
                  fullWidth
                >
                  {MODE_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  label="Mã phụ"
                  value={subtype}
                  onChange={(e) => setSubtype(e.target.value as SubtypeMode)}
                  fullWidth
                  disabled
                  helperText={subtypeHelper}
                >
                  {SUBTYPE_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Quỹ tiền */}
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  label="Quỹ tiền"
                  value={fund_id}
                  onChange={(e) => setFundId(e.target.value)}
                  fullWidth
                  disabled={isXuatKho || isNhapLai}
                  required={fundRequired}
                  error={fundRequired && !fund_id}
                  helperText={
                    isXuatKho
                      ? 'Xuất kho: không động quỹ'
                      : isNhapLai
                      ? 'Nhập lại: không động quỹ (di chuyển nội bộ)'
                      : isTraNcc
                      ? 'Trả NCC: bắt buộc chọn quỹ để hoàn tiền'
                      : ' '
                  }
                >
                  {(isXuatKho || isNhapLai) && (
                    <MenuItem value="">
                      <em>-- Không cần quỹ --</em>
                    </MenuItem>
                  )}
                  {funds.map((f) => (
                    <MenuItem key={f.id} value={f.id}>
                      {f.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  type="date"
                  label="Ngày phiếu"
                  value={receipt_date}
                  onChange={(e) => setReceiptDate(e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  label="Kho hàng *"
                  value={warehouse_id}
                  onChange={(e) => setWarehouseId(e.target.value)}
                  fullWidth
                  error={!warehouse_id}
                  helperText={!warehouse_id ? 'Bắt buộc chọn kho' : ' '}
                >
                  {warehouses.map((wh) => (
                    <MenuItem key={wh.id} value={wh.id}>
                      {wh.code} - {wh.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  label={`Công việc ${workCycleRequired ? ' *' : ''}`}
                  value={work_cycle_id}
                  onChange={(e) => setWorkCycleId(e.target.value)}
                  fullWidth
                  required={workCycleRequired}
                  error={workCycleRequired && !work_cycle_id}
                  disabled={isTraNcc}
                  helperText={
                    isTraNcc
                      ? 'Trả NCC: không cần công việc'
                      : isXuatKho
                      ? 'Xuất kho bắt buộc chọn công việc'
                      : isNhapLai
                      ? 'Nhập lại bắt buộc chọn công việc (để biết trả từ đâu)'
                      : ' '
                  }
                >
                  <MenuItem value="">
                    <em>-- Không chọn --</em>
                  </MenuItem>
                  {workCycles.map((wc) => (
                    <MenuItem key={wc.id} value={wc.id}>
                      {wc.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Partner box */}
              {showPartnerBox && (
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    options={partners}
                    value={selectedPartner}
                    onChange={(_, v) => setPartnerId(v?.id ?? null)}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    getOptionLabel={(o) => {
                      const name = o.name || o.name || `Partner #${o.id}`;
                      const phone = o.phone ? ` (${o.phone})` : '';
                      return `${name}${phone}`;
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={isTraNcc ? 'Nhà cung cấp *' : 'Nhà cung cấp - tuỳ chọn'}
                        fullWidth
                        required={partnerRequired}
                        error={partnerRequired && !partner_id}
                        helperText={isTraNcc ? 'Trả NCC bắt buộc chọn nhà cung cấp' : ' '}
                      />
                    )}
                  />

                  {selectedPartner && (
                    <Box
                      sx={{
                        mt: 1,
                        p: 1.5,
                        borderRadius: 1,
                        border: (t) => `1px solid ${t.palette.divider}`,
                        bgcolor: 'background.neutral',
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Thông tin nhà cung cấp
                      </Typography>

                      <Stack spacing={0.75}>
                        <Typography variant="body2">
                          <b>Shop:</b> {fmt(selectedPartner.name || selectedPartner.name)}
                        </Typography>
                        <Typography variant="body2">
                          <b>SĐT:</b> {fmt(selectedPartner.phone)}
                        </Typography>
                        <Typography variant="body2">
                          <b>Địa chỉ:</b> {fmt((selectedPartner as any).address)}
                        </Typography>
                        <Typography variant="body2">
                          <b>Loại:</b> {fmt((selectedPartner as any).partner_type)}
                        </Typography>

                        <Divider sx={{ my: 1 }} />

                        <Typography variant="body2">
                          <b>Ngân hàng:</b> {fmt((selectedPartner as any).bank_name)}
                        </Typography>
                        <Typography variant="body2">
                          <b>Số TK:</b> {fmt((selectedPartner as any).bank_account_no)}
                        </Typography>
                        <Typography variant="body2">
                          <b>Chủ TK:</b> {fmt((selectedPartner as any).bank_account_name)}
                        </Typography>
                        <Typography variant="body2">
                          <b>Ghi chú:</b> {fmt((selectedPartner as any).note)}
                        </Typography>
                      </Stack>
                    </Box>
                  )}
                </Grid>
              )}

              <Grid item xs={12} md={showPartnerBox ? 6 : 12}>
                <TextField
                  label="Ghi chú"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  fullWidth
                  placeholder="VD: Nhập cám đợt 1, xuất giống cho chuồng A, trả lại 20 bao dư thừa..."
                />
              </Grid>

              {isNhapKho && (
                <Grid item xs={12}>
                  <Alert severity="info">
                    Phiếu <b>NHẬP KHO</b> là mua từ nhà phân phối: bắt buộc chọn <b>Quỹ</b>, mỗi dòng
                    bắt buộc nhập <b>Tổng tiền dòng (trước VAT)</b>.
                  </Alert>
                </Grid>
              )}

              {isXuatKho && (
                <Grid item xs={12}>
                  <Alert severity="info">
                    Phiếu <b>Xuất kho</b> không động quỹ (di chuyển nội bộ). Bắt buộc chọn công việc.
                    Giá vốn được tính khi duyệt.
                  </Alert>
                </Grid>
              )}

              {isNhapLai && (
                <Grid item xs={12}>
                  <Alert severity="info">
                    <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                      Phiếu <b>NHẬP LẠI</b> - Trả vật tư dư thừa từ công việc về kho
                    </Typography>
                    <Typography variant="body2">
                      • VD: Xuất 100 bao → dùng 80 → trả lại 20 bao
                      <br />• <b>Không động quỹ:</b> tiền đã trả lúc mua
                      <br />• Khi duyệt: Tồn kho <b>+20</b> • Công việc <b>-20</b> • Quỹ <b>KHÔNG ĐỔI</b>
                      <br />• Giá vốn tự động: lấy theo giá trung bình kho
                    </Typography>
                  </Alert>
                </Grid>
              )}

              {isTraNcc && (
                <Grid item xs={12}>
                  <Alert severity="warning">
                    <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                      Phiếu <b>TRẢ NHÀ CUNG CẤP</b>
                    </Typography>
                    <Typography variant="body2">
                      • Bắt buộc chọn <b>Quỹ</b> để hoàn tiền và chọn <b>Nhà cung cấp</b>
                      <br />• Mỗi dòng bắt buộc nhập <b>Tổng tiền dòng (trước VAT)</b>
                      <br />• Khi duyệt: Kho <b>giảm</b> theo số lượng • Quỹ <b>tăng</b> theo số tiền hoàn
                    </Typography>
                  </Alert>
                </Grid>
              )}

              {(isNhapKho || isTraNcc) && (
                <Grid item xs={12}>
                  <Card variant="outlined" sx={{ borderRadius: 2, p: 1.5 }}>
                    <Stack
                      direction={{ xs: 'column', md: 'row' }}
                      spacing={1}
                      alignItems={{ xs: 'flex-start', md: 'center' }}
                      justifyContent="space-between"
                    >
                      <Typography variant="subtitle2">Tổng hợp nhanh</Typography>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <Typography variant="body2">
                          <b>Tổng SL:</b> {money.format(totals.totalQty)}
                        </Typography>
                        <Typography variant="body2">
                          <b>Trước VAT:</b> {money.format(Math.round(totals.beforeVat))}
                        </Typography>
                        <Typography variant="body2">
                          <b>VAT:</b> {money.format(Math.round(totals.vatAmount))}
                        </Typography>
                        <Typography variant="body2">
                          <b>Tổng:</b> {money.format(Math.round(totals.total))}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Card>
                </Grid>
              )}
            </Grid>
          </Card>

          {/* Lines */}
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack spacing={0.25}>
              <Typography variant="subtitle1">Chi tiết hàng hoá</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {isMobile ? 'Mỗi dòng là một thẻ, kéo xuống để nhập' : 'Bạn có thể thêm nhiều dòng'}
              </Typography>
            </Stack>

            <Button startIcon={<Iconify icon="eva:plus-fill" />} onClick={handleAddLine}>
              Thêm dòng
            </Button>
          </Stack>

          <Stack spacing={1.5}>
            {lines.map((l, idx) => {
              const selected = findItemById(l.item_id ?? null);

              const moneyHelper = isXuatKho
                ? 'Xuất: giá vốn tính khi duyệt'
                : isNhapLai
                ? 'Nhập lại: giá vốn tự động'
                : isTraNcc
                ? 'Bắt buộc nhập: số tiền hoàn * dòng'
                : 'Giá tiền * số lượng';

              // ===== Mobile =====
              if (isMobile) {
                return (
                  <Card key={idx} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                    <Stack spacing={1.25}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Typography variant="subtitle2">Dòng #{idx + 1}</Typography>

                        <IconButton
                          color="error"
                          onClick={() => handleRemoveLine(idx)}
                          disabled={lines.length === 1}
                        >
                          <Iconify icon="eva:trash-2-outline" />
                        </IconButton>
                      </Stack>

                      <Autocomplete
                        options={items}
                        value={selected}
                        onChange={(_, v) => {
                          handleChangeLine(idx, {
                            item_id: v?.id ?? null,
                            unit: v?.unit ?? l.unit ?? '',
                          });
                        }}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                        getOptionLabel={(o) => `${o.code ? `${o.code} - ` : ''}${o.name}`}
                        renderInput={(params) => (
                          <TextField {...params} label="Chọn hàng hoá (Item)" fullWidth />
                        )}
                      />

                      <TextField
                        label="Miêu tả"
                        value={l.description ?? ''}
                        onChange={(e) => handleChangeLine(idx, { description: e.target.value })}
                        fullWidth
                      />

                      <Grid container spacing={1.25}>
                        <Grid item xs={6}>
                          <TextField
                            label="Số lượng"
                            type="number"
                            value={l.qty}
                            onChange={(e) => handleChangeLine(idx, { qty: Number(e.target.value) })}
                            fullWidth
                            inputProps={{ min: 0 }}
                          />
                        </Grid>

                        <Grid item xs={6}>
                          <TextField
                            label="Đơn vị"
                            value={l.unit ?? ''}
                            onChange={(e) => handleChangeLine(idx, { unit: e.target.value })}
                            fullWidth
                          />
                        </Grid>

                        <Grid item xs={7}>
                          <TextField
                            label="Tổng tiền dòng (trước VAT)"
                            value={l.unit_price_text ?? formatMoney(l.unit_price ?? 0)}
                            onChange={(e) => applyMoneyInput(idx, e.target.value)}
                            onBlur={() =>
                              handleChangeLine(idx, {
                                unit_price_text: formatMoney(n(l.unit_price, 0)),
                              })
                            }
                            inputProps={{ inputMode: 'numeric' }}
                            fullWidth
                            disabled={disableMoneyField}
                            required={isNhapKho || isTraNcc}
                            helperText={moneyHelper}
                          />
                        </Grid>

                        <Grid item xs={5}>
                          <TextField
                            label="VAT %"
                            type="number"
                            value={l.vat_percent ?? 0}
                            onChange={(e) => handleChangeLine(idx, { vat_percent: Number(e.target.value) })}
                            fullWidth
                            disabled={disableVat}
                          />
                        </Grid>
                      </Grid>
                    </Stack>
                  </Card>
                );
              }

              // ===== Desktop =====
              return (
                <Card key={idx} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                  <Stack spacing={1}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Typography variant="subtitle2">Dòng #{idx + 1}</Typography>
                      <IconButton
                        color="error"
                        onClick={() => handleRemoveLine(idx)}
                        disabled={lines.length === 1}
                      >
                        <Iconify icon="eva:trash-2-outline" />
                      </IconButton>
                    </Stack>

                    <Divider />

                    <Stack direction="row" spacing={1.25} alignItems="center" flexWrap="nowrap">
                      <Autocomplete
                        options={items}
                        value={selected}
                        onChange={(_, v) => {
                          handleChangeLine(idx, {
                            item_id: v?.id ?? null,
                            unit: v?.unit ?? l.unit ?? '',
                          });
                        }}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                        getOptionLabel={(o) => `${o.code ? `${o.code} - ` : ''}${o.name}`}
                        renderInput={(params) => <TextField {...params} label="Item" fullWidth />}
                        sx={{ flex: 2 }}
                      />

                      <TextField
                        label="Miêu tả"
                        value={l.description ?? ''}
                        onChange={(e) => handleChangeLine(idx, { description: e.target.value })}
                        fullWidth
                        sx={{ flex: 2 }}
                      />

                      <TextField
                        label="Số lượng"
                        type="number"
                        value={l.qty}
                        onChange={(e) => handleChangeLine(idx, { qty: Number(e.target.value) })}
                        sx={{ width: 120 }}
                        inputProps={{ min: 0 }}
                      />

                      <TextField
                        label="Đơn vị"
                        value={l.unit ?? ''}
                        onChange={(e) => handleChangeLine(idx, { unit: e.target.value })}
                        sx={{ width: 120 }}
                      />

                      <TextField
                        label="Tổng tiền dòng (trước VAT)"
                        value={l.unit_price_text ?? formatMoney(l.unit_price ?? 0)}
                        onChange={(e) => applyMoneyInput(idx, e.target.value)}
                        onBlur={() =>
                          handleChangeLine(idx, {
                            unit_price_text: formatMoney(n(l.unit_price, 0)),
                          })
                        }
                        inputProps={{ inputMode: 'numeric' }}
                        sx={{ width: 240 }}
                        disabled={disableMoneyField}
                        required={isNhapKho || isTraNcc}
                        helperText={moneyHelper}
                      />

                      <TextField
                        label="VAT %"
                        type="number"
                        value={l.vat_percent ?? 0}
                        onChange={(e) => handleChangeLine(idx, { vat_percent: Number(e.target.value) })}
                        sx={{ width: 110 }}
                        disabled={disableVat}
                      />
                    </Stack>
                  </Stack>
                </Card>
              );
            })}
          </Stack>

          <Box sx={{ height: 4 }} />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={submitting} color="inherit">
          Hủy
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
          Tạo phiếu
        </Button>
      </DialogActions>
    </Dialog>
  );
}
