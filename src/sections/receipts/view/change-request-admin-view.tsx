/* eslint-disable no-unneeded-ternary */
// src/sections/receipts/view/change-request-admin-view.tsx

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Container,
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
  Pagination,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import Iconify from 'src/components/iconify';

import {
  listChangeRequests,
  approveChangeRequest,
  rejectChangeRequest,
  type ReceiptChangeRequest,
} from 'src/api/receipts';

function toInt(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

type Props = {
  roles?: string[];
};

export default function ChangeRequestAdminView({ roles = [] }: Props) {
  const isAdmin = roles.includes('ADMIN');

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<ReceiptChangeRequest[]>([]);
  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(1);
  const limit = 20;

  const [status, setStatus] = useState<string>('');
  const [requestType, setRequestType] = useState<string>('');
  const [receiptId, setReceiptId] = useState<string>('');

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  const fetchData = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const res = await listChangeRequests({
        page,
        limit,
        status: status ? (status as any) : undefined,
        request_type: requestType ? (requestType as any) : undefined,
        receipt_id: receiptId ? receiptId : undefined,
      });
      setRows(res.data || []);
      setTotal(toInt(res.total, 0));
    } finally {
      setLoading(false);
    }
  }, [isAdmin, page, limit, status, requestType, receiptId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const badge = (s: string) => {
    if (s === 'APPROVED') return <Chip size="small" label="APPROVED" color="success" />;
    if (s === 'REJECTED') return <Chip size="small" label="REJECTED" color="error" />;
    return <Chip size="small" label="PENDING" color="warning" />;
  };

  const handleApprove = async (id: number) => {
    if (!window.confirm('Duyệt change request này?')) return;
    await approveChangeRequest(id);
    await fetchData();
  };

  const handleReject = async (id: number) => {
    if (!window.confirm('Từ chối change request này?')) return;
    await rejectChangeRequest(id);
    await fetchData();
  };

  if (!isAdmin) {
    return (
      <Container maxWidth="xl">
        <Typography color="error">Bạn không có quyền ADMIN để xem trang này.</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Stack spacing={2}>
        <Typography variant="h4">Receipt Change Requests (ADMIN)</Typography>

        <Card sx={{ p: 2 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
            <TextField
              label="Receipt ID"
              value={receiptId}
              onChange={(e) => setReceiptId(e.target.value)}
              sx={{ width: 220 }}
            />

            <TextField select label="Request type" value={requestType} onChange={(e) => setRequestType(e.target.value)} sx={{ width: 220 }}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="UPDATE">UPDATE</MenuItem>
              <MenuItem value="CANCEL">CANCEL</MenuItem>
            </TextField>

            <TextField select label="Status" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ width: 220 }}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="PENDING">PENDING</MenuItem>
              <MenuItem value="APPROVED">APPROVED</MenuItem>
              <MenuItem value="REJECTED">REJECTED</MenuItem>
            </TextField>

            <Button
              variant="outlined"
              startIcon={<Iconify icon="eva:search-fill" />}
              onClick={() => {
                setPage(1);
                fetchData();
              }}
              disabled={loading}
            >
              Lọc
            </Button>
          </Stack>
        </Card>

        <Card>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell width={80}>ID</TableCell>
                  <TableCell width={120}>Type</TableCell>
                  <TableCell width={120}>Status</TableCell>
                  <TableCell width={120}>Receipt</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell width={220}>Requester</TableCell>
                  <TableCell width={220}>Reviewer</TableCell>
                  <TableCell width={170}>Reviewed at</TableCell>
                  <TableCell width={140} align="right">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell>{r.id}</TableCell>
                    <TableCell>{r.request_type}</TableCell>
                    <TableCell>{badge(r.status)}</TableCell>
                    <TableCell>{r.receipt_id}</TableCell>
                    <TableCell>{r.reason}</TableCell>
                    <TableCell>{r.requester?.full_name || r.requested_by}</TableCell>
                    <TableCell>{r.reviewer?.full_name || '-'}</TableCell>
                    <TableCell>{r.reviewed_at ? new Date(r.reviewed_at).toLocaleString() : '-'}</TableCell>

                    <TableCell align="right">
                      <Stack direction="row" justifyContent="flex-end">
                        <Tooltip title="Approve">
                          <span>
                            <IconButton
                              color="success"
                              disabled={r.status !== 'PENDING'}
                              onClick={() => handleApprove(r.id)}
                            >
                              <Iconify icon="eva:checkmark-circle-2-outline" />
                            </IconButton>
                          </span>
                        </Tooltip>

                        <Tooltip title="Reject">
                          <span>
                            <IconButton
                              color="error"
                              disabled={r.status !== 'PENDING'}
                              onClick={() => handleReject(r.id)}
                            >
                              <Iconify icon="eva:close-circle-outline" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}

                {!rows.length && (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 5 }}>
                      <Typography sx={{ color: 'text.secondary' }}>
                        {loading ? 'Đang tải...' : 'Không có dữ liệu'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Stack direction="row" justifyContent="flex-end" sx={{ p: 2 }}>
            <Pagination page={page} count={totalPages} onChange={(_, p) => setPage(p)} />
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}
