/* eslint-disable react/jsx-no-bind */
import { useEffect, useMemo, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Stack, TextField, MenuItem, Divider, Typography
} from '@mui/material';
import type { FundCreatePayload, FundRow, FundType } from 'src/api/funds';

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: FundCreatePayload) => Promise<void>;
  initial?: FundRow | null;
};

const FUND_TYPES: { value: FundType; label: string }[] = [
  { value: 'TIEN_MAT', label: 'Tiền mặt' },
  { value: 'CHUYEN_KHOAN', label: 'Chuyển khoản / Ngân hàng' },
];

export default function FundUpsertDialog({ open, onClose, onSubmit, initial }: Props) {
  const isEdit = !!initial?.id;

  const [fundType, setFundType] = useState<FundType>('TIEN_MAT');
  const [name, setName] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountNo, setBankAccountNo] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    setFundType((initial?.fund_type as FundType) || 'CASH');
    setName(initial?.name || '');
    setBankName(initial?.bank_name || '');
    setBankAccountName(initial?.bank_account_name || '');
    setBankAccountNo(initial?.bank_account_no || '');
    setNote(initial?.note || '');
  }, [open, initial]);

  const showBankFields = useMemo(() => fundType === 'CHUYEN_KHOAN', [fundType]);

  async function handleSubmit() {
    if (!name.trim()) return;

    const payload: FundCreatePayload = {
      fund_type: fundType,
      name: name.trim(),
      bank_name: showBankFields ? (bankName || null) : null,
      bank_account_name: showBankFields ? (bankAccountName || null) : null,
      bank_account_no: showBankFields ? (bankAccountNo || null) : null,
      note: note || null,
    };

    setSaving(true);
    try {
      await onSubmit(payload);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEdit ? 'Cập nhật Quỹ tiền' : 'Tạo Quỹ tiền'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            select
            label="Loại quỹ"
            value={fundType}
            onChange={(e) => setFundType(e.target.value as FundType)}
            fullWidth
          >
            {FUND_TYPES.map((o) => (
              <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
            ))}
          </TextField>

          <TextField
            label="Tên quỹ"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            required
          />

          {showBankFields && (
            <>
              <Divider />
              <Typography variant="subtitle2">Thông tin ngân hàng</Typography>

              <TextField
                label="Tên ngân hàng"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                fullWidth
              />
              <TextField
                label="Chủ tài khoản"
                value={bankAccountName}
                onChange={(e) => setBankAccountName(e.target.value)}
                fullWidth
              />
              <TextField
                label="Số tài khoản"
                value={bankAccountNo}
                onChange={(e) => setBankAccountNo(e.target.value)}
                fullWidth
              />
            </>
          )}

          <TextField
            label="Ghi chú"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            fullWidth
            multiline
            minRows={2}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving} color="inherit">Hủy</Button>
        <Button onClick={handleSubmit} disabled={saving || !name.trim()} variant="contained">
          {isEdit ? 'Lưu' : 'Tạo'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
