/* eslint-disable react/jsx-no-bind */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Container, Card, Stack, TextField, MenuItem, Button, Typography,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
  Pagination, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { useSnackbar } from 'src/components/snackbar';
import {
  createPartner, deletePartner, listPartners, updatePartner,
  type PartnerCreatePayload, type PartnerRow, type PartnerType
} from 'src/api/partners';
import PartnerUpsertDialog from './partner-upsert-dialog';

const PARTNER_TYPE_FILTER: { value: '' | PartnerType; label: string }[] = [
  { value: '', label: 'Tất cả' },
  { value: 'KHACH_HANG', label: 'Khách hàng' },
  { value: 'NHA_CUNG_CAP', label: 'Nhà cung cấp' },
  { value: 'NHA_PHAN_PHOI', label: 'Nhà phân phối' },
];

export default function PartnerListView() {
  const { enqueueSnackbar } = useSnackbar();

  const [rows, setRows] = useState<PartnerRow[]>([]);
  const [total, setTotal] = useState(0);

  const [q, setQ] = useState('');
  const [partnerType, setPartnerType] = useState<'' | PartnerType>('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const [loading, setLoading] = useState(false);

  const [openUpsert, setOpenUpsert] = useState(false);
  const [editing, setEditing] = useState<PartnerRow | null>(null);

  const [openDelete, setOpenDelete] = useState(false);
  const [deleting, setDeleting] = useState<PartnerRow | null>(null);

  const pageCount = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listPartners({ q, partner_type: partnerType, page, limit });
      setRows(res.data || []);
      setTotal(res.total || 0);
    } catch (e: any) {
      enqueueSnackbar(e?.message || 'Load partners failed', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar, limit, page, partnerType, q]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function openCreate() {
    setEditing(null);
    setOpenUpsert(true);
  }

  function openEdit(r: PartnerRow) {
    setEditing(r);
    setOpenUpsert(true);
  }

  function askDelete(r: PartnerRow) {
    setDeleting(r);
    setOpenDelete(true);
  }

  async function handleSubmit(payload: PartnerCreatePayload) {
    try {
      if (editing?.id) {
        await updatePartner(editing.id, payload);
        enqueueSnackbar('Cập nhật đối tác thành công', { variant: 'success' });
      } else {
        await createPartner(payload);
        enqueueSnackbar('Tạo đối tác thành công', { variant: 'success' });
      }
      await fetchData();
    } catch (e: any) {
      enqueueSnackbar(e?.message || 'Save partner failed', { variant: 'error' });
      throw e;
    }
  }

  async function confirmDelete() {
    if (!deleting?.id) return;
    try {
      await deletePartner(deleting.id);
      enqueueSnackbar('Đã xóa đối tác', { variant: 'success' });
      setOpenDelete(false);
      setDeleting(null);

      if (rows.length === 1 && page > 1) setPage(page - 1);
      else await fetchData();
    } catch (e: any) {
      enqueueSnackbar(e?.message || 'Delete partner failed', { variant: 'error' });
    }
  }

  return (
    <>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5">Đối tác</Typography>
        <Button variant="contained" onClick={openCreate}>Tạo đối tác</Button>
      </Stack>

      <Card sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
          <TextField
            select
            label="Loại đối tác"
            value={partnerType}
            onChange={(e) => { setPage(1); setPartnerType(e.target.value as any); }}
            sx={{ minWidth: 220 }}
          >
            {PARTNER_TYPE_FILTER.map((o) => (
              <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
            ))}
          </TextField>

          <TextField
            label="Tìm kiếm"
            value={q}
            onChange={(e) => { setPage(1); setQ(e.target.value); }}
            fullWidth
            placeholder="Tên / SĐT / địa chỉ / ngân hàng..."
          />
        </Stack>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell width={90}>ID</TableCell>
                <TableCell>Tên</TableCell>
                <TableCell width={150}>Loại</TableCell>
                <TableCell width={140}>SĐT</TableCell>
                <TableCell>Địa chỉ</TableCell>
                <TableCell width={160}>Ngân hàng</TableCell>
                <TableCell width={180} align="right">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell>{r.id}</TableCell>
                  <TableCell>{r.shop_name}</TableCell>
                  <TableCell>{r.partner_type}</TableCell>
                  <TableCell>{r.phone || '-'}</TableCell>
                  <TableCell>{r.address || '-'}</TableCell>
                  <TableCell>{r.bank_name || '-'}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" justifyContent="flex-end" spacing={1}>
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

      <PartnerUpsertDialog
        open={openUpsert}
        onClose={() => setOpenUpsert(false)}
        onSubmit={handleSubmit}
        initial={editing}
      />

      <Dialog open={openDelete} onClose={() => setOpenDelete(false)} fullWidth maxWidth="xs">
        <DialogTitle>Xóa đối tác?</DialogTitle>
        <DialogContent>
          Bạn chắc chắn muốn xóa đối tác: <b>{deleting?.shop_name}</b> ?
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setOpenDelete(false)}>Hủy</Button>
          <Button color="error" variant="contained" onClick={confirmDelete}>Xóa</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
