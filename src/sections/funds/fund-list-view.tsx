/* eslint-disable react/jsx-no-bind */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Container, Card, Stack, TextField, MenuItem, Button, Typography,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
  Pagination, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { useSnackbar } from 'src/components/snackbar';
import {
  createFund, deleteFund, listFunds, updateFund,
  type FundCreatePayload, type FundRow, type FundType,
} from 'src/api/funds';
import { formatMoney } from 'src/utils/format-number';

import FundUpsertDialog from './fund-upsert-dialog';
import FundAdjustDialog from './fund-adjust-dialog';
import FundLedgerDialog from './fund-ledger-dialog';

const FUND_TYPE_FILTER: { value: '' | FundType; label: string }[] = [
  { value: '', label: 'Tất cả' },
  { value: 'TIEN_MAT', label: 'Tiền mặt' },
  { value: 'CHUYEN_KHOAN', label: 'Ngân hàng' },
];

export default function FundListView() {
  const { enqueueSnackbar } = useSnackbar();

  const [rows, setRows] = useState<FundRow[]>([]);
  const [total, setTotal] = useState(0);

  const [q, setQ] = useState('');
  const [fundType, setFundType] = useState<'' | FundType>('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const [loading, setLoading] = useState(false);

  // upsert
  const [openUpsert, setOpenUpsert] = useState(false);
  const [editing, setEditing] = useState<FundRow | null>(null);

  // delete
  const [openDelete, setOpenDelete] = useState(false);
  const [deleting, setDeleting] = useState<FundRow | null>(null);

  // adjust
  const [openAdjustDlg, setOpenAdjustDlg] = useState(false);
  const [adjustingFund, setAdjustingFund] = useState<FundRow | null>(null);
  const [adjustDirection, setAdjustDirection] = useState<'IN' | 'OUT'>('IN');

  // ledger
  const [openLedgerDlg, setOpenLedgerDlg] = useState(false);
  const [ledgerFund, setLedgerFund] = useState<FundRow | null>(null);

  const pageCount = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listFunds({ q, fund_type: fundType, page, limit });
      setRows(res.data || []);
      setTotal(res.total || 0);
    } catch (e: any) {
      enqueueSnackbar(e?.message || 'Load funds failed', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar, fundType, limit, page, q]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function openCreate() {
    setEditing(null);
    setOpenUpsert(true);
  }

  function openEdit(r: FundRow) {
    setEditing(r);
    setOpenUpsert(true);
  }

  function askDelete(r: FundRow) {
    setDeleting(r);
    setOpenDelete(true);
  }

  function openAdjust(r: FundRow, dir: 'IN' | 'OUT') {
    setAdjustingFund(r);
    setAdjustDirection(dir);
    setOpenAdjustDlg(true);
  }

  function openLedger(r: FundRow) {
    setLedgerFund(r);
    setOpenLedgerDlg(true);
  }

  async function handleSubmit(payload: FundCreatePayload) {
    try {
      if (editing?.id) {
        await updateFund(editing.id, payload);
        enqueueSnackbar('Cập nhật quỹ thành công', { variant: 'success' });
      } else {
        await createFund(payload);
        enqueueSnackbar('Tạo quỹ thành công', { variant: 'success' });
      }
      await fetchData();
    } catch (e: any) {
      console.log('e', e)
      enqueueSnackbar(e?.message || 'Save fund failed', { variant: 'error' });
      // throw e;
    }
  }

  async function confirmDelete() {
    if (!deleting?.id) return;
    try {
      await deleteFund(deleting.id);
      enqueueSnackbar('Đã xóa quỹ', { variant: 'success' });
      setOpenDelete(false);
      setDeleting(null);

      // nếu xóa làm trang rỗng, lùi trang
      if (rows.length === 1 && page > 1) setPage(page - 1);
      else await fetchData();
    } catch (e: any) {
      enqueueSnackbar(e?.message || 'Delete fund failed', { variant: 'error' });
    }
  }

  return (
    <>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5">Quỹ tiền</Typography>
        <Button variant="contained" onClick={openCreate}>Tạo quỹ</Button>
      </Stack>

      <Card sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
          <TextField
            select
            label="Loại quỹ"
            value={fundType}
            onChange={(e) => { setPage(1); setFundType(e.target.value as any); }}
            sx={{ minWidth: 220 }}
          >
            {FUND_TYPE_FILTER.map((o) => (
              <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
            ))}
          </TextField>

          <TextField
            label="Tìm kiếm"
            value={q}
            onChange={(e) => { setPage(1); setQ(e.target.value); }}
            fullWidth
            placeholder="Tên quỹ / ngân hàng / số TK..."
          />
        </Stack>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell width={90}>ID</TableCell>
                <TableCell>Tên quỹ</TableCell>
                <TableCell width={140}>Loại</TableCell>
                <TableCell>Ngân hàng</TableCell>
                <TableCell width={160}>Số TK</TableCell>
                <TableCell width={160} align="right">Số dư</TableCell>
                <TableCell width={260} align="right">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell>{r.id}</TableCell>
                  <TableCell>{r.name}</TableCell>
                  <TableCell>{r.fund_type}</TableCell>
                  <TableCell>{r.bank_name || '-'}</TableCell>
                  <TableCell>{r.bank_account_no || '-'}</TableCell>
                  <TableCell align="right">{formatMoney(Number(r.balance)) ?? '-'}</TableCell>

                  <TableCell align="right">
                    <Stack direction="row" justifyContent="flex-end" spacing={1}>
                      <Button size="small" onClick={() => openAdjust(r, 'IN')}>Nạp</Button>
                      <Button size="small" onClick={() => openAdjust(r, 'OUT')}>Chi</Button>
                      <Button size="small" onClick={() => openLedger(r)}>Lịch sử</Button>

                      <Button size="small" onClick={() => openEdit(r)}>Sửa</Button>
                      <Button size="small" color="error" onClick={() => askDelete(r)}>Xóa</Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}

              {!rows.length && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, opacity: 0.7 }}>
                    {loading ? 'Đang tải...' : 'Không có dữ liệu'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
          <Pagination
            count={pageCount}
            page={page}
            onChange={(_, v) => setPage(v)}
            color="primary"
          />
        </Stack>
      </Card>

      <FundUpsertDialog
        open={openUpsert}
        onClose={() => setOpenUpsert(false)}
        onSubmit={handleSubmit}
        initial={editing}
      />

      <FundAdjustDialog
        open={openAdjustDlg}
        onClose={() => setOpenAdjustDlg(false)}
        fund={adjustingFund}
        direction={adjustDirection}
        onDone={fetchData}
      />

      <FundLedgerDialog
        open={openLedgerDlg}
        onClose={() => setOpenLedgerDlg(false)}
        fund={ledgerFund}
      />

      <Dialog open={openDelete} onClose={() => setOpenDelete(false)} fullWidth maxWidth="xs">
        <DialogTitle>Xóa quỹ?</DialogTitle>
        <DialogContent>
          Bạn chắc chắn muốn xóa quỹ: <b>{deleting?.name}</b> ?
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setOpenDelete(false)}>Hủy</Button>
          <Button color="error" variant="contained" onClick={confirmDelete}>Xóa</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
