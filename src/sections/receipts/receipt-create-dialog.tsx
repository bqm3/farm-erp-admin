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
} from '@mui/material';
import Iconify from 'src/components/iconify';
import type { ReceiptCreatePayload, ReceiptType } from 'src/api/receipts';
import { listWorkCycles } from 'src/api/workcycle';
import { enqueueSnackbar } from 'src/components/snackbar';
import { listWarehouses } from 'src/api/warehouse';
import { listItems } from 'src/api/items';

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
  price?: number;
  vat_percent?: number;
};

// ----- OPTIONS -----
const PAYMENT_METHOD_OPTIONS = [
  { value: 'CASH', label: 'Tiền mặt' },
  { value: 'BANK', label: 'Chuyển khoản' },
  // { value: 'DEBT', label: 'Công nợ' },
];

const SOURCE_OPTIONS = [
  { value: 'WAREHOUSE', label: 'Kho hàng' },
  { value: 'CASH', label: 'Tiền mặt' },
];

export default function ReceiptCreateDialog({ open, onClose, onSubmit }: Props) {
  const [submitting, setSubmitting] = useState(false);

  const [type, setType] = useState<ReceiptType>('EXPENSE');
  const [subtype, setSubtype] = useState<string>('');
  const [payment_method, setPaymentMethod] = useState<string>('CASH');
  const [source, setSource] = useState<string>('WAREHOUSE');
  const [warehouse_id, setWarehouseId] = useState<string>(''); // simple input
  const [work_cycle_id, setWorkCycleId] = useState<string>('');
  const [workCycles, setWorkCycles] = useState<{ id: number; code: string; name: string }[]>([]);
  const [warehouses, setWarehouses] = useState<{ id: number; code: string; name: string }[]>([]);
  const [items, setItems] = useState<any[]>([]);

  const [receipt_date, setReceiptDate] = useState<string>(() => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  });
  const [note, setNote] = useState<string>('');

  const [lines, setLines] = useState<LineForm[]>([
    { item_id: null, description: '', qty: 1, unit: '', price: 0, vat_percent: 0 },
  ]);

  const requireWarehouse = useMemo(() => source === 'WAREHOUSE', [source]);

  const handleAddLine = () => {
    setLines((prev) => [
      ...prev,
      { item_id: null, description: '', qty: 1, unit: '', price: 0, vat_percent: 0 },
    ]);
  };

  const handleRemoveLine = (idx: number) => {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleChangeLine = (idx: number, patch: Partial<LineForm>) => {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  };

  const findItemById = useCallback(
    (id?: number | null) => items.find((x) => x.id === id) || null,
    [items]
  );

  const handleSubmit = async () => {
    try {
      if (!type || !payment_method || !source || !receipt_date) {
        alert('type, payment_method, source, receipt_date là bắt buộc');
        return;
      }
      if (!lines.length) {
        alert('lines phải có ít nhất 1 dòng');
        return;
      }
      if (requireWarehouse && !warehouse_id) {
        alert('warehouse_id là bắt buộc khi source=WAREHOUSE');
        return;
      }

      setSubmitting(true);

      const payload: ReceiptCreatePayload = {
        type,
        subtype: subtype || null,
        payment_method,
        source,
        warehouse_id: requireWarehouse ? Number(warehouse_id) : null,
        receipt_date,
        work_cycle_id: work_cycle_id ? Number(work_cycle_id) : null,
        note: note || null,
        lines: lines.map((l) => ({
          item_id: l.item_id ? Number(l.item_id) : null,
          description: l.description || null,
          qty: Number(l.qty || 0),
          unit: l.unit || null,
          price: l.price === undefined ? undefined : Number(l.price || 0),
          vat_percent: Number(l.vat_percent || 0),
        })),
      };

      await onSubmit(payload);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (source !== 'WAREHOUSE') setWarehouseId('');
  }, [source]);

  const fetchData = useCallback(async () => {
    try {
      const res = await listWorkCycles({ page: 1, limit: 100 });
      setWorkCycles(res.data || []);
    } catch (err: any) {
      enqueueSnackbar(err?.message || 'Load failed!', { variant: 'error' });
    }
  }, []);

  const fetchWarehouses = useCallback(async () => {
    try {
      const res = await listWarehouses({ q: undefined, status: undefined, page: 1, pageSize: 200 });
      setWarehouses(res.rows);
    } catch (err: any) {
      enqueueSnackbar(err?.message || 'Load failed!', { variant: 'error' });
    }
  }, []);

  const fetcItems = useCallback(async () => {
    try {
      const res = await listItems();
      setItems(res);
    } catch (err: any) {
      enqueueSnackbar(err?.message || 'Load failed!', { variant: 'error' });
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchWarehouses();
    fetcItems();
  }, [fetchData, fetchWarehouses, fetcItems]);

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Tạo phiếu (Receipt)</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              select
              label="Loại"
              value={type}
              onChange={(e) => setType(e.target.value as ReceiptType)}
              fullWidth
            >
              <MenuItem value="INCOME">Thu nhập/ Nhập</MenuItem>
              <MenuItem value="EXPENSE">Chi phí/ Xuất</MenuItem>
            </TextField>

            <TextField
              label="Loại phụ (Subtype)"
              value={subtype}
              onChange={(e) => setSubtype(e.target.value)}
              fullWidth
            />
          </Stack>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              select
              label="Phương thức thanh toán"
              value={payment_method}
              onChange={(e) => setPaymentMethod(e.target.value)}
              fullWidth
            >
              {PAYMENT_METHOD_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Nguồn tiền"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              fullWidth
            >
              {SOURCE_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              type="date"
              label="Ngày nhận"
              value={receipt_date}
              onChange={(e) => setReceiptDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              select
              label="Công việc (STAFF bắt buộc)"
              value={work_cycle_id}
              onChange={(e) => setWorkCycleId(e.target.value)}
              fullWidth
            >
              {workCycles.map((wc) => (
                <MenuItem key={wc.id} value={wc.id}>
                  {wc.name}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              select
              label="Kho hàng"
              value={warehouse_id}
              onChange={(e) => setWarehouseId(e.target.value)}
              fullWidth
              disabled={!requireWarehouse}
            >
              {warehouses.map((wh) => (
                <MenuItem key={wh.id} value={wh.id}>
                  {wh.code} - {wh.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              fullWidth
            />
          </Stack>

          <Divider />

          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="subtitle1">Chi tiết</Typography>
            <Button startIcon={<Iconify icon="eva:plus-fill" />} onClick={handleAddLine}>
              Thêm dòng
            </Button>
          </Stack>

          <Stack spacing={1.5}>
            {lines.map((l, idx) => {
              const selected = findItemById(l.item_id ?? null);

              return (
                <Stack
                  key={idx}
                  direction={{ xs: 'column', md: 'row' }}
                  spacing={1.5}
                  alignItems={{ xs: 'stretch', md: 'center' }}
                >
                  <Autocomplete
                    options={items}
                    value={selected}
                    onChange={(_, v) => {
                      // v là item được chọn hoặc null
                      handleChangeLine(idx, {
                        item_id: v?.id ?? null,
                        // ✅ optional: auto fill vài field cho tiện
                        unit: v?.unit ?? l.unit ?? '',
                        // description: v ? `${v.code ?? ''} ${v.name}`.trim() : (l.description ?? ''),
                        // price: v?.default_price ?? l.price ?? 0,
                      });
                    }}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    getOptionLabel={(o) => `${o.code ? `${o.code} - ` : ''}${o.name}`}
                    renderInput={(params) => <TextField {...params} label="Chọn hàng hoá (Item)" />}
                    sx={{ flex: 2 }}
                  />

                  <TextField
                    label="Miêu tả"
                    value={l.description ?? ''}
                    onChange={(e) => handleChangeLine(idx, { description: e.target.value })}
                    sx={{ flex: 2 }}
                  />

                  <TextField
                    label="Số lượng"
                    type="number"
                    value={l.qty}
                    onChange={(e) => handleChangeLine(idx, { qty: Number(e.target.value) })}
                    sx={{ width: 100 }}
                  />

                  <TextField
                    label="Đơn vị"
                    value={l.unit ?? ''}
                    onChange={(e) => handleChangeLine(idx, { unit: e.target.value })}
                    sx={{ width: 100 }}
                  />

                  <TextField
                    label="Giá tiền"
                    type="number"
                    value={l.price ?? 0}
                    onChange={(e) => handleChangeLine(idx, { price: Number(e.target.value) })}
                    sx={{ width: 150 }}
                  />

                  <TextField
                    label="VAT %"
                    type="number"
                    value={l.vat_percent ?? 0}
                    onChange={(e) => handleChangeLine(idx, { vat_percent: Number(e.target.value) })}
                    sx={{ width: 80 }}
                  />

                  <IconButton
                    color="error"
                    onClick={() => handleRemoveLine(idx)}
                    disabled={lines.length === 1}
                  >
                    <Iconify icon="eva:trash-2-outline" />
                  </IconButton>
                </Stack>
              );
            })}
          </Stack>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Hủy
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
          Tạo phiếu
        </Button>
      </DialogActions>
    </Dialog>
  );
}
