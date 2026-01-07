/* eslint-disable arrow-body-style */
// src/sections/warehouse/movement-create-dialog.tsx
import { useMemo, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Stack, TextField, MenuItem, Autocomplete
} from '@mui/material';
import type { Item } from 'src/api/items';

type Props = {
  open: boolean;
  onClose: VoidFunction;
  onSubmit: (payload: {
    warehouse_id: number;
    item_id: number;
    direction: 'IN' | 'OUT';
    qty: number;
    unit_cost?: number; // chỉ IN
    note: string;       // bắt buộc
  }) => Promise<void>;
  items: Item[];
  warehouses: { id: number; code: string; name: string }[];
};

export default function MovementCreateDialog({ open, onClose, onSubmit, items, warehouses }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [warehouseId, setWarehouseId] = useState<number | ''>('');
  const [item, setItem] = useState<Item | null>(null);
  const [direction, setDirection] = useState<'IN' | 'OUT'>('IN');
  const [qty, setQty] = useState<number>(1);
  const [unitCost, setUnitCost] = useState<number>(0);
  const [note, setNote] = useState<string>('');

  const disabled = useMemo(() => {
    return !warehouseId || !item?.id || !(qty > 0) || !note.trim() || submitting;
  }, [warehouseId, item, qty, note, submitting]);

  const handleSubmit = async () => {
    if (!warehouseId || !item?.id) return;
    setSubmitting(true);
    try {
      await onSubmit({
        warehouse_id: Number(warehouseId),
        item_id: item.id,
        direction,
        qty: Number(qty),
        unit_cost: direction === 'IN' ? Number(unitCost || 0) : undefined,
        note: note.trim(),
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Điều chỉnh tồn kho</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            select
            label="Kho"
            value={warehouseId}
            onChange={(e) => setWarehouseId(Number(e.target.value))}
          >
            {warehouses.map((wh) => (
              <MenuItem key={wh.id} value={wh.id}>
                {wh.code} - {wh.name}
              </MenuItem>
            ))}
          </TextField>

          <Autocomplete
            options={items}
            value={item}
            onChange={(_, v) => setItem(v)}
            isOptionEqualToValue={(o, v) => o.id === v.id}
            getOptionLabel={(o) => `${o.code ? `${o.code} - ` : ''}${o.name}`}
            renderInput={(params) => <TextField {...params} label="Hàng hoá" />}
          />

          <TextField
            select
            label="Hướng điều chỉnh"
            value={direction}
            onChange={(e) => setDirection(e.target.value as 'IN' | 'OUT')}
          >
            <MenuItem value="IN">Tăng tồn (IN)</MenuItem>
            <MenuItem value="OUT">Giảm tồn (OUT)</MenuItem>
          </TextField>

          <TextField
            label="Số lượng"
            type="number"
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
            inputProps={{ min: 1, step: '1' }}
          />

          <TextField
            label="Đơn giá (chỉ khi tăng tồn)"
            type="number"
            value={unitCost}
            onChange={(e) => setUnitCost(Number(e.target.value))}
            disabled={direction !== 'IN'}
            inputProps={{ min: 0, step: '0.01' }}
          />

          <TextField
            label="Lý do điều chỉnh"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            multiline
            minRows={2}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit" disabled={submitting}>Huỷ</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={disabled}>
          Xác nhận
        </Button>
      </DialogActions>
    </Dialog>
  );
}
