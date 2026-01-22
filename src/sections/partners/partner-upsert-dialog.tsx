/* eslint-disable react/jsx-no-bind */
import { useEffect, useMemo, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Stack, TextField, MenuItem, Divider, Typography
} from '@mui/material';
import type { PartnerCreatePayload, PartnerRow, PartnerType } from 'src/api/partners';

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: PartnerCreatePayload) => Promise<void>;
  initial?: PartnerRow | null;
};

const PARTNER_TYPES: { value: PartnerType; label: string }[] = [
  { value: 'KHACH_HANG', label: 'Khách hàng' },
  { value: 'NHA_CUNG_CAP', label: 'Nhà cung cấp' },
  { value: 'NHA_PHAN_PHOI', label: 'Nhà phân phối' },
];

export default function PartnerUpsertDialog({ open, onClose, onSubmit, initial }: Props) {
  const isEdit = !!initial?.id;

  const [partnerType, setPartnerType] = useState<PartnerType>('KHACH_HANG');
  const [shopName, setShopName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const [supplierName, setSupplierName] = useState('');

  const [bankName, setBankName] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountNo, setBankAccountNo] = useState('');

  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    setPartnerType((initial?.partner_type as PartnerType) || 'CUSTOMER');
    setShopName(initial?.shop_name || '');
    setPhone(initial?.phone || '');
    setAddress(initial?.address || '');
    setSupplierName(initial?.supplier_name || '');
    setBankName(initial?.bank_name || '');
    setBankAccountName(initial?.bank_account_name || '');
    setBankAccountNo(initial?.bank_account_no || '');
    setNote(initial?.note || '');
  }, [open, initial]);

  const showSupplierFields = useMemo(() => partnerType === 'NHA_CUNG_CAP', [partnerType]);

  async function handleSubmit() {
    if (!shopName.trim()) return;

    const payload: PartnerCreatePayload = {
      partner_type: partnerType,
      shop_name: shopName.trim(),
      phone: phone || null,
      address: address || null,
      supplier_name: showSupplierFields ? (supplierName || null) : null,
      bank_name: bankName || null,
      bank_account_name: bankAccountName || null,
      bank_account_no: bankAccountNo || null,
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
      <DialogTitle>{isEdit ? 'Cập nhật Đối tác' : 'Tạo Đối tác'}</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            select
            label="Loại đối tác"
            value={partnerType}
            onChange={(e) => setPartnerType(e.target.value as PartnerType)}
            fullWidth
          >
            {PARTNER_TYPES.map((o) => (
              <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
            ))}
          </TextField>

          <TextField label="Tên đối tác" value={shopName} onChange={(e) => setShopName(e.target.value)} fullWidth required />
          <TextField label="SĐT" value={phone} onChange={(e) => setPhone(e.target.value)} fullWidth />
          <TextField label="Địa chỉ" value={address} onChange={(e) => setAddress(e.target.value)} fullWidth />

          {showSupplierFields && (
            <>
              <Divider />
              <Typography variant="subtitle2">Thông tin nhà cung cấp</Typography>
              <TextField
                label="Tên nhà cung cấp"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                fullWidth
              />
            </>
          )}

          <Divider />
          <Typography variant="subtitle2">Thông tin ngân hàng (nếu có)</Typography>
          <TextField label="Tên ngân hàng" value={bankName} onChange={(e) => setBankName(e.target.value)} fullWidth />
          <TextField label="Chủ tài khoản" value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value)} fullWidth />
          <TextField label="Số tài khoản" value={bankAccountNo} onChange={(e) => setBankAccountNo(e.target.value)} fullWidth />

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
        <Button onClick={handleSubmit} disabled={saving || !shopName.trim()} variant="contained">
          {isEdit ? 'Lưu' : 'Tạo'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
