/* eslint-disable no-nested-ternary */
/* eslint-disable react-hooks/exhaustive-deps */
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
  Divider,
  Typography,
  Autocomplete,
  Box,
} from '@mui/material';
import { enqueueSnackbar } from 'src/components/snackbar';

import type { ReceiptCreatePayload } from 'src/api/receipts';
import { getWorkCycle } from 'src/api/workcycle';
import { listFunds } from 'src/api/funds';
import { listPartners } from 'src/api/partners';
import { formatNumber, parseMoneyToNumber } from 'src/utils/format-number';

type Props = {
  open: boolean;
  onClose: VoidFunction;
  workCycleId: number;
  onSubmit: (payload: ReceiptCreatePayload) => Promise<void>;
};

type Subtype = 'THU_HOACH' | 'BAN';

const SUBTYPE_OPTIONS: { value: Subtype; label: string }[] = [
  { value: 'THU_HOACH', label: 'Xuất chuồng / Thu hoạch' },
  { value: 'BAN', label: 'Bán' },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: 'CASH', label: 'Tiền mặt' },
  { value: 'BANK', label: 'Chuyển khoản' },
  { value: 'OTHER', label: 'Khác' },
];

type FundOpt = { id: number; name: string };
type PartnerOpt = {
  id: number;
  name?: string;
  phone?: string;
};

function todayStr() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}
function n(v: any, fb = 0) {
  const x = Number(v);
  return Number.isFinite(x) ? x : fb;
}
function money2(v: number) {
  return Math.round((v + Number.EPSILON) * 100) / 100;
}

export default function ReceiptTHU_HOACHSoldDialog({
  open,
  onClose,
  workCycleId,
  onSubmit,
}: Props) {
  const [submitting, setSubmitting] = useState(false);

  const [cycle, setCycle] = useState<any>(null);
  const [loadingCycle, setLoadingCycle] = useState(false);

  // ✅ subtype
  const [subtype, setSubtype] = useState<Subtype>('THU_HOACH');

  // ✅ fund
  const [funds, setFunds] = useState<FundOpt[]>([]);
  const [fund_id, setFundId] = useState<string>(''); // required

  // ✅ partner optional
  const [partners, setPartners] = useState<PartnerOpt[]>([]);
  const [partner_id, setPartnerId] = useState<number | null>(null);

  // ✅ payment method (không bắt buộc theo BE, nhưng bạn có thể lưu)
  const [payment_method, setPaymentMethod] = useState<string>('CASH');

  const [receipt_date, setReceiptDate] = useState<string>(todayStr());
  const [note, setNote] = useState<string>('');

  // line fields: nhập tổng tiền trước VAT
  const [qty, setQty] = useState<number>(1);
  const [totalBeforeTax, setTotalBeforeTax] = useState<number>(0);
  const [vatPercent, setVatPercent] = useState<number>(0);
  const [description, setDescription] = useState<string>('');

  const speciesId = cycle?.species_id ?? cycle?.species?.id ?? null;
  const speciesName =
    cycle?.species?.name || cycle?.species_name || (cycle?.species ? cycle.species.name : '') || '';

  const computed = useMemo(() => {
    const q = n(qty, 0);
    const total = n(totalBeforeTax, 0);
    const vat = n(vatPercent, 0);

    const amount_before_tax = total;
    const vat_amount = (amount_before_tax * vat) / 100;
    const amount_total = amount_before_tax + vat_amount;
    const unit_price = q > 0 ? amount_before_tax / q : 0;

    return {
      amount_before_tax: money2(amount_before_tax),
      vat_amount: money2(vat_amount),
      amount_total: money2(amount_total),
      unit_price: money2(unit_price),
    };
  }, [qty, totalBeforeTax, vatPercent]);

  const canSubmit = useMemo(() => {
    if (!workCycleId) return false;
    if (!receipt_date) return false;
    if (!fund_id) return false;
    if (!speciesId) return false;
    if (!payment_method) return false;
    if (n(qty, 0) <= 0) return false;
    if (n(totalBeforeTax, 0) < 0) return false;
    if (n(vatPercent, 0) < 0) return false;
    return true;
  }, [
    workCycleId,
    receipt_date,
    fund_id,
    speciesId,
    payment_method,
    qty,
    totalBeforeTax,
    vatPercent,
  ]);

  const fetchCycle = useCallback(async () => {
    if (!workCycleId) return;
    setLoadingCycle(true);
    try {
      const res = await getWorkCycle(workCycleId);
      setCycle(res.data ?? res);
    } catch (e: any) {
      enqueueSnackbar(e?.message || 'Không load được work cycle', { variant: 'error' });
    } finally {
      setLoadingCycle(false);
    }
  }, [workCycleId]);

  const fetchFunds = useCallback(async () => {
    try {
      const res: any = await listFunds({ page: 1, limit: 200 });
      const rows: FundOpt[] = res?.rows ?? res?.data ?? [];
      setFunds(rows);

      // auto select fund đầu tiên nếu chưa chọn
      setFundId((prev) => prev || (rows?.[0]?.id ? String(rows[0].id) : ''));
    } catch (e: any) {
      enqueueSnackbar(e?.message || 'Không load được quỹ', { variant: 'error' });
      setFunds([]);
    }
  }, []);

  const fetchPartners = useCallback(async () => {
    try {
      const res: any = await listPartners({ page: 1, limit: 200 });
      const rows: PartnerOpt[] = res?.rows ?? res?.data ?? [];
      setPartners(rows);
    } catch (e: any) {
      enqueueSnackbar(e?.message || 'Không load được đối tác', { variant: 'warning' });
      setPartners([]);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    fetchCycle();
    fetchFunds();
    fetchPartners();
  }, [open, fetchCycle, fetchFunds, fetchPartners]);

  // auto fill description theo subtype + species
  useEffect(() => {
    if (!open) return;
    const base = subtype === 'THU_HOACH' ? 'Xuất chuồng / Thu hoạch' : 'Bán';
    const sp = speciesName ? ` - ${speciesName}` : '';
    const dft = `${base}${sp}`;
    setDescription((prev) => (prev?.trim() ? prev : dft));
  }, [open, subtype, speciesName]);

  const selectedPartner = useMemo(() => {
    if (!partner_id) return null;
    return partners.find((p) => p.id === partner_id) ?? null;
  }, [partner_id, partners]);

  // helper render value
  const fmt = (v: any) =>
    v === null || v === undefined || String(v).trim() === '' ? '—' : String(v);

  const handleSubmit = async () => {
    try {
      if (!fund_id) {
        enqueueSnackbar('Vui lòng chọn quỹ (fund)', { variant: 'error' });
        return;
      }
      if (!speciesId) {
        enqueueSnackbar('Work cycle chưa có species_id', { variant: 'error' });
        return;
      }
      if (n(qty, 0) <= 0) {
        enqueueSnackbar('Số lượng phải > 0', { variant: 'error' });
        return;
      }
      if (n(totalBeforeTax, 0) < 0) {
        enqueueSnackbar('Tổng tiền không hợp lệ', { variant: 'error' });
        return;
      }
      if (n(vatPercent, 0) < 0) {
        enqueueSnackbar('VAT% không hợp lệ', { variant: 'error' });
        return;
      }

      const desc =
        (description || '').trim() ||
        `${subtype === 'THU_HOACH' ? 'Xuất chuồng / Thu hoạch' : 'Bán'}${
          speciesName ? ` - ${speciesName}` : ''
        }`;

      const q = n(qty, 0);
      const total = n(totalBeforeTax, 0);
      const unitPrice = q > 0 ? total / q : 0;

      const payload: ReceiptCreatePayload = {
        type: 'THU',
        subtype, // THU_HOACH | SOLD
        fund_id: Number(fund_id),

        // payment_method, // optional (BE có thể ignore)
        source: 'BEN_NGOAI',
        warehouse_id: null,

        receipt_date,
        work_cycle_id: workCycleId,
        partner_id: partner_id ?? null,
        note: note?.trim() || null,

        lines: [
          {
            species_id: Number(speciesId),
            item_id: null,
            description: desc,
            qty: Number(qty),
            unit: null,
            unit_price: Number(unitPrice),
            vat_percent: Number(vatPercent || 0),
          } as any,
        ],
      } as any;

      setSubmitting(true);
      await onSubmit(payload);
      onClose();
    } catch (e: any) {
      enqueueSnackbar(e?.message || 'Tạo phiếu thất bại', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {subtype === 'THU_HOACH' ? 'Tạo phiếu xuất chuồng / thu hoạch' : 'Tạo phiếu bán'} • #
        {speciesName}
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField label="Loại" value="Thu" fullWidth disabled />
            <TextField
              select
              label="Loại phụ"
              value={subtype}
              onChange={(e) => setSubtype(e.target.value as Subtype)}
              fullWidth
            >
              {SUBTYPE_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              type="date"
              label="Ngày"
              value={receipt_date}
              onChange={(e) => setReceiptDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              select
              label="Quỹ tiền"
              value={fund_id}
              onChange={(e) => setFundId(e.target.value)}
              fullWidth
            >
              {funds.map((f) => (
                <MenuItem key={f.id} value={f.id}>
                  {f.name}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Giống/loài"
              value={loadingCycle ? 'Đang tải...' : speciesName}
              fullWidth
              disabled
            />
          </Stack>

          {/* partner optional */}
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
            renderInput={(params) => <TextField {...params} label="Nhà cung cấp - tuỳ chọn" />}
          />

          {/* ✅ HIỂN THỊ CHI TIẾT KHI ĐÃ CHỌN */}
          {selectedPartner && (
            <Box
              sx={{
                mt: 1,
                p: 1.5,
                borderRadius: 1,
                border: (theme) => `1px solid ${theme.palette.divider}`,
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

                {/* Nếu API partner của bạn có thêm các field này thì hiện luôn */}
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

          <Divider />

          <Typography variant="subtitle1">Chi tiết</Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Số lượng"
              type="number"
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              inputProps={{ min: 0, step: 1 }}
              fullWidth
              required
            />
            <TextField
              label="Tổng tiền hóa đơn (trước VAT)"
              value={formatNumber(Number(totalBeforeTax))}
              onChange={(e) => {
                const num = parseMoneyToNumber(e.target.value);
                setTotalBeforeTax(num);
              }}
              inputProps={{ inputMode: 'numeric' }}
              helperText="VD: 10,000,000"
              fullWidth
              required
            />
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="VAT %"
              type="number"
              value={vatPercent}
              onChange={(e) => setVatPercent(Number(e.target.value))}
              inputProps={{ min: 0, step: 1 }}
              fullWidth
            />
            <TextField
              label="Đơn giá (tự tính)"
              value={formatNumber(Number(computed.unit_price))}
              fullWidth
              disabled
            />
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Tiền VAT"
              value={formatNumber(Number(computed.vat_amount))}
              fullWidth
              disabled
            />
            <TextField
              label="Tổng tiền (sau VAT)"
              value={formatNumber(Number(computed.amount_total))}
              fullWidth
              disabled
            />
          </Stack>

          <TextField
            label="Miêu tả (bắt buộc)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
          />

          <TextField
            label="Ghi chú"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            fullWidth
            multiline
            minRows={2}
          />

          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Phiếu tạo ra sẽ ở trạng thái <b>CHO_DUYET</b>.
          </Typography>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Hủy
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={submitting || !canSubmit}>
          Tạo phiếu
        </Button>
      </DialogActions>
    </Dialog>
  );
}
