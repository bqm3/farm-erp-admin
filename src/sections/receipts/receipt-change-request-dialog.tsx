/* eslint-disable no-undef-init */
// src/sections/receipts/receipt-change-request-dialog.tsx

import { useMemo, useState } from 'react';
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
} from '@mui/material';
import type { ChangeRequestType } from 'src/api/receipts';

type Props = {
  open: boolean;
  onClose: VoidFunction;
  onSubmit: (payload: { request_type: ChangeRequestType; reason: string; proposed_payload?: any }) => Promise<void>;
};

export default function ReceiptChangeRequestDialog({ open, onClose, onSubmit }: Props) {
  const [submitting, setSubmitting] = useState(false);

  const [request_type, setRequestType] = useState<ChangeRequestType>('UPDATE');
  const [reason, setReason] = useState('');
  const [proposed_payload_text, setProposedPayloadText] = useState(
    JSON.stringify(
      {
        header: {
          payment_method: 'CASH',
          source: 'WAREHOUSE',
          warehouse_id: 1,
          receipt_date: '2026-01-02',
          note: 'Sửa note...',
          subtype: '...optional',
        },
        lines: [
          { item_id: 1, qty: 2, price: 10000, vat_percent: 0, description: '...' },
        ],
      },
      null,
      2
    )
  );

  const needPayload = useMemo(() => request_type === 'UPDATE', [request_type]);

  const handleSubmit = async () => {
    try {
      if (!request_type || !reason.trim()) {
        alert('request_type và reason là bắt buộc');
        return;
      }

      let proposed_payload: any = undefined;
      if (needPayload) {
        try {
          proposed_payload = JSON.parse(proposed_payload_text || '{}');
        } catch {
          alert('proposed_payload phải là JSON hợp lệ');
          return;
        }
      }

      setSubmitting(true);
      await onSubmit({ request_type, reason: reason.trim(), proposed_payload });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle>Tạo yêu cầu sửa / hủy (Change Request)</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            select
            label="Request type"
            value={request_type}
            onChange={(e) => setRequestType(e.target.value as ChangeRequestType)}
            fullWidth
          >
            <MenuItem value="UPDATE">UPDATE</MenuItem>
            <MenuItem value="CANCEL">CANCEL</MenuItem>
          </TextField>

          <TextField
            label="Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            fullWidth
            multiline
            minRows={2}
          />

          {needPayload && (
            <>
              <Divider />
              <Typography variant="subtitle2">Proposed payload (JSON)</Typography>
              <TextField
                value={proposed_payload_text}
                onChange={(e) => setProposedPayloadText(e.target.value)}
                fullWidth
                multiline
                minRows={10}
                placeholder="JSON proposed payload"
              />
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Backend của bạn hỗ trợ: <b>header</b> (payment_method, source, warehouse_id, receipt_date, note, subtype) và <b>lines</b>.
              </Typography>
            </>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Hủy
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
          Gửi yêu cầu
        </Button>
      </DialogActions>
    </Dialog>
  );
}
