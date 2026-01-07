import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, TextField, Autocomplete } from '@mui/material';
import type { Item } from 'src/api/items';
import type { WarehouseStock } from 'src/api/warehouse';
import { formatNumber } from 'src/utils/format-number';

type Props = {
  open: boolean;
  onClose: VoidFunction;
  onSubmit: (payload: { item_id: number; qty: number }) => Promise<void>;
  items: Item[];
  initialStock?: WarehouseStock | null;
};

export default function StockSetQtyDialog({ open, onClose, onSubmit, items, initialStock }: Props) {
  const [submitting, setSubmitting] = useState(false);

  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [qty, setQty] = useState<number>(0);

  useEffect(() => {
    if (initialStock?.item_id) {
      const found = items.find((x) => x.id === initialStock.item_id) || null;
      setSelectedItem(found);
      setQty(Number(initialStock.qty || 0));
    } else {
      setSelectedItem(null);
      setQty(0);
    }
  }, [initialStock, items, open]);

  const disabled = useMemo(() => !selectedItem?.id || submitting, [selectedItem, submitting]);

  const handleSubmit = async () => {
    if (!selectedItem?.id) return;
    setSubmitting(true);
    try {
      await onSubmit({ item_id: selectedItem.id, qty: Number(qty || 0) });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Thiết lập số lượng tồn</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Autocomplete
            options={items}
            value={selectedItem}
            onChange={(_, v) => setSelectedItem(v)}
            getOptionLabel={(o) => `${o.code ? `${o.code} - ` : ''}${o.name}`}
            renderInput={(params) => <TextField {...params} label="Chọn hàng hoá" />}
          />

          <TextField
            label="Số lượng tồn"
            type="number"
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
            helperText={`Hiển thị: ${formatNumber(qty || 0)}`}
            inputProps={{ min: 0, step: '1' }}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Huỷ
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={disabled}>
          Lưu
        </Button>
      </DialogActions>
    </Dialog>
  );
}
