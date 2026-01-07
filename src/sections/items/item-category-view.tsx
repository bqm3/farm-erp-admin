

import { useEffect, useMemo, useState } from 'react';
import {
  Card,
  Stack,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Tooltip,
  Divider,
} from '@mui/material';
import Iconify from 'src/components/iconify';

import {
  listItemCategories,
  createItemCategory,
  updateItemCategory,
  deleteItemCategory,
  type ItemCategory,
  type ItemCategoryPayload,
} from 'src/api/items';

type FormState = ItemCategoryPayload;

function CategoryDialog({
  open,
  onClose,
  onSubmit,
  initial,
  submitting,
}: {
  open: boolean;
  onClose: VoidFunction;
  onSubmit: (payload: FormState) => Promise<void>;
  initial?: ItemCategory | null;
  submitting?: boolean;
}) {
  const [form, setForm] = useState<FormState>({ code: '', name: '' });

  useEffect(() => {
    if (initial) setForm({ code: initial.code || '', name: initial.name || '' });
    else setForm({ code: '', name: '' });
  }, [initial, open]);

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{initial ? 'Sửa danh mục' : 'Tạo danh mục'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 2 }}>
          <TextField
            label="Mã danh mục"
            value={form.code}
            onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
            placeholder="VD: FEED, MED..."
            fullWidth
          />
          <TextField
            label="Tên danh mục"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting} color="inherit">
          Huỷ
        </Button>
        <Button
          variant="contained"
          onClick={() => onSubmit(form)}
          disabled={submitting || !form.code.trim() || !form.name.trim()}
        >
          Lưu
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function ItemCategoryView() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<ItemCategory[]>([]);
  const [search, setSearch] = useState('');

  const [openDlg, setOpenDlg] = useState(false);
  const [editing, setEditing] = useState<ItemCategory | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await listItemCategories({ search, limit: 200 });
      setRows(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => rows, [rows]);

  const handleCreate = () => {
    setEditing(null);
    setOpenDlg(true);
  };

  const handleEdit = (row: ItemCategory) => {
    setEditing(row);
    setOpenDlg(true);
  };

  const handleSubmit = async (payload: ItemCategoryPayload) => {
    setSubmitting(true);
    try {
      if (editing) await updateItemCategory(editing.id, payload);
      else await createItemCategory(payload);

      setOpenDlg(false);
      await fetchData();
    } catch (e: any) {
      // bạn có thể thay bằng snackbar
      alert(e?.message || 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    const ok = window.confirm('Xoá danh mục? Nếu danh mục đang được dùng sẽ bị chặn.');
    if (!ok) return;

    try {
      await deleteItemCategory(id);
      await fetchData();
    } catch (e: any) {
      alert(e?.message || 'Error');
    }
  };

  return (
    <Card sx={{ p: 2 }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Typography variant="h6" sx={{ flex: 1 }}>
          Danh mục vật tư
        </Typography>

        <TextField
          size="small"
          placeholder="Tìm theo mã/tên..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') fetchData();
          }}
        />

        <Button variant="outlined" onClick={fetchData} disabled={loading}>
          Lọc
        </Button>

        <Button variant="contained" onClick={handleCreate}>
          Tạo danh mục
        </Button>
      </Stack>

      <Divider sx={{ my: 2 }} />

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell width={160}>CODE</TableCell>
              <TableCell>NAME</TableCell>
              <TableCell width={140} align="right">
                Hành động
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r.id} hover>
                <TableCell>{r.code}</TableCell>
                <TableCell>{r.name}</TableCell>
                <TableCell align="right">
                  <Tooltip title="Sửa">
                    <IconButton onClick={() => handleEdit(r)}>
                      <Iconify icon="solar:pen-bold" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Xoá">
                    <IconButton color="error" onClick={() => handleDelete(r.id)}>
                      <Iconify icon="solar:trash-bin-trash-bold" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {!filtered.length && (
              <TableRow>
                <TableCell colSpan={4}>
                  <Typography variant="body2" sx={{ py: 2 }} color="text.secondary">
                    Không có dữ liệu
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <CategoryDialog
        open={openDlg}
        onClose={() => setOpenDlg(false)}
        onSubmit={handleSubmit}
        initial={editing}
        submitting={submitting}
      />
    </Card>
  );
}
