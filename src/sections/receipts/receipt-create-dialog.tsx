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
  unit_price?: number;
  vat_percent?: number;
};

type StockReceiptMode = 'NHAP_KHO' | 'XUAT_KHO';
type SubtypeMode = 'THEM' | 'XUAT';

const MODE_OPTIONS: { value: StockReceiptMode; label: string }[] = [
  { value: 'NHAP_KHO', label: 'Phiếu nhập kho' },
  { value: 'XUAT_KHO', label: 'Phiếu xuất kho' },
];

const SUBTYPE_OPTIONS: { value: SubtypeMode; label: string }[] = [
  { value: 'THEM', label: 'Thêm' },
  { value: 'XUAT', label: 'Xuất' },
];

export default function ReceiptCreateDialog({ open, onClose, onSubmit }: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [submitting, setSubmitting] = useState(false);

  const [mode, setMode] = useState<StockReceiptMode>('NHAP_KHO');
  const [subtype, setSubtype] = useState<SubtypeMode>('THEM');

  const type: ReceiptType = useMemo(() => (mode === 'NHAP_KHO' ? 'CHI' : 'THU'), [mode]);

  useEffect(() => {
    if (mode === 'NHAP_KHO') setSubtype('THEM');
    else setSubtype('XUAT');
  }, [mode]);

  const isNhapKho = mode === 'NHAP_KHO';
  const isXuatKho = mode === 'XUAT_KHO';

  const [fund_id, setFundId] = useState<string>('');
  const [funds, setFunds] = useState<{ id: number; name: string }[]>([]);

  const [warehouse_id, setWarehouseId] = useState<string>('');
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
    { item_id: null, description: '', qty: 1, unit: '', unit_price: 0, vat_percent: 0 },
  ]);

  // ✅ Khi chuyển sang xuất kho thì bỏ fund_id (không cần)
  useEffect(() => {
    if (isXuatKho) setFundId('');
  }, [isXuatKho]);

  const handleAddLine = () => {
    setLines((prev) => [
      ...prev,
      { item_id: null, description: '', qty: 1, unit: '', unit_price: 0, vat_percent: 0 },
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
      if (!receipt_date) {
        alert('receipt_date là bắt buộc');
        return;
      }

      // ✅ Nhập kho mới cần quỹ
      if (isNhapKho && !fund_id) {
        alert('Phiếu nhập kho bắt buộc chọn quỹ (fund_id)');
        return;
      }

      if (!warehouse_id) {
        alert('warehouse_id (Kho hàng) là bắt buộc');
        return;
      }

      if (isXuatKho && !work_cycle_id) {
        alert('Phiếu xuất kho bắt buộc chọn Công việc (work_cycle)');
        return;
      }

      if (!lines.length) {
        alert('lines phải có ít nhất 1 dòng');
        return;
      }

      for (let i = 0; i < lines.length; i++) {
        const l = lines[i];
        if (!l.item_id) {
          alert(`Dòng #${i + 1}: Chưa chọn Item`);
          return;
        }
        const qty = Number(l.qty || 0);
        if (!(qty > 0)) {
          alert(`Dòng #${i + 1}: Số lượng phải > 0`);
          return;
        }

        // ✅ Nhập kho bắt buộc có đơn giá > 0
        if (isNhapKho) {
          const up = Number(l.unit_price || 0);
          if (!(up > 0)) {
            alert(`Dòng #${i + 1}: Nhập kho bắt buộc đơn giá (unit_price) > 0`);
            return;
          }
        }
      }

      setSubmitting(true);

      const payload: any = {
        type, // NHAP_KHO=CHI, XUAT_KHO=THU
        subtype, // THEM | XUAT
        fund_id: isNhapKho ? Number(fund_id) : null,

        source: 'KHO',
        warehouse_id: Number(warehouse_id),
        receipt_date,
        work_cycle_id: work_cycle_id ? Number(work_cycle_id) : null,
        note: note || null,

        lines: lines.map((l) => ({
          line_kind: 'GIONG',
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
  }, [fetchWorkCycles, fetchFunds, fetchWarehouses, fetchItems]);

  const headerChip = isNhapKho ? (
    <Chip size="small" color="warning" label="Nhập kho" />
  ) : (
    <Chip size="small" color="success" label="Xuất kho" />
  );

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 },
      }}
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
          {/* Top fields */}
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
                  helperText={isNhapKho ? 'Nhập kho = THEM' : 'Xuất kho = XUAT'}
                >
                  {SUBTYPE_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  label="Quỹ tiền"
                  value={fund_id}
                  onChange={(e) => setFundId(e.target.value)}
                  fullWidth
                  disabled={isXuatKho}
                  required={isNhapKho}
                  error={isNhapKho && !fund_id}
                  helperText={isXuatKho ? 'Xuất kho không trừ quỹ' : 'Chọn quỹ để ghi nhận chi phí nhập kho'}
                >
                  {isXuatKho ? (
                    <MenuItem value="">
                      <em>-- Không cần quỹ --</em>
                    </MenuItem>
                  ) : null}

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
                  label={`Công việc ${isXuatKho ? ' *' : ''}`}
                  value={work_cycle_id}
                  onChange={(e) => setWorkCycleId(e.target.value)}
                  fullWidth
                  required={isXuatKho}
                  error={isXuatKho && !work_cycle_id}
                  helperText={isXuatKho ? 'Xuất kho bắt buộc chọn work cycle' : ' '}
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

              <Grid item xs={12}>
                <TextField
                  label="Ghi chú"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  fullWidth
                  placeholder="VD: Nhập cám đợt 1, xuất giống cho chuồng A..."
                />
              </Grid>

              {isXuatKho && (
                <Grid item xs={12}>
                  <Alert severity="info">
                    Phiếu <b>xuất kho</b> không trừ quỹ tiền. Phiếu xuất kho bắt buộc chọn công việc.
                  </Alert>
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

              // ===== MOBILE: each line in a card =====
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
                            label="Giá tiền"
                            type="number"
                            value={l.unit_price ?? 0}
                            onChange={(e) =>
                              handleChangeLine(idx, { unit_price: Number(e.target.value) })
                            }
                            fullWidth
                            disabled={isXuatKho}
                            helperText={isXuatKho ? 'Xuất kho: giá vốn tính khi duyệt' : ' '}
                          />
                        </Grid>

                        <Grid item xs={5}>
                          <TextField
                            label="VAT %"
                            type="number"
                            value={l.vat_percent ?? 0}
                            onChange={(e) =>
                              handleChangeLine(idx, { vat_percent: Number(e.target.value) })
                            }
                            fullWidth
                            disabled={isXuatKho}
                          />
                        </Grid>
                      </Grid>
                    </Stack>
                  </Card>
                );
              }

              // ===== DESKTOP: row layout =====
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
                        renderInput={(params) => (
                          <TextField {...params} label="Item" fullWidth />
                        )}
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
                        label="Giá tiền"
                        type="number"
                        value={l.unit_price ?? 0}
                        onChange={(e) => handleChangeLine(idx, { unit_price: Number(e.target.value) })}
                        sx={{ width: 170 }}
                        disabled={isXuatKho}
                        helperText={isXuatKho ? 'Xuất kho: tính khi duyệt' : ' '}
                      />

                      <TextField
                        label="VAT %"
                        type="number"
                        value={l.vat_percent ?? 0}
                        onChange={(e) => handleChangeLine(idx, { vat_percent: Number(e.target.value) })}
                        sx={{ width: 110 }}
                        disabled={isXuatKho}
                      />
                    </Stack>
                  </Stack>
                </Card>
              );
            })}
          </Stack>

          {/* bottom spacing */}
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
