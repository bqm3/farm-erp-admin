'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Card,
  Stack,
  Button,
  TextField,
  MenuItem,
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
  Divider,
  Tooltip,
} from '@mui/material';
import Iconify from 'src/components/iconify';

import {
  listItems,
  createItem,
  updateItem,
  deleteItem,
  listItemCategories,
  type Item,
  type ItemPayload,
  type ItemCategory,
} from 'src/api/items';

function ItemDialog({
  open,
  onClose,
  onSubmit,
  categories,
  initial,
  submitting,
}: {
  open: boolean;
  onClose: VoidFunction;
  onSubmit: (payload: ItemPayload) => Promise<void>;
  categories: ItemCategory[];
  initial?: Item | null;
  submitting?: boolean;
}) {
  const [form, setForm] = useState<ItemPayload>({ name: '', category_id: null});

  useEffect(() => {
    if (initial) {
      setForm({
        code: initial.code || '',
        name: initial.name || '',
        category_id: initial.category_id ?? null,
      });
    } else {
      setForm({ name: '', category_id: null, unit: null, price: null, code: '' });
    }
  }, [initial, open]);

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{initial ? 'Sửa Item' : 'Tạo Item'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 2 }}>
          <TextField
            label="Code"
            value={form.code || ''}
            onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
            fullWidth
          />
          <TextField
            label="Tên item"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            fullWidth
          />

          <TextField
            select
            label="Danh mục"
            value={form.category_id ?? ''}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                category_id: e.target.value === '' ? null : Number(e.target.value),
              }))
            }
            fullWidth
          >
            <MenuItem value="">(Không chọn)</MenuItem>
            {categories.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.code} - {c.name}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting} color="inherit">
          Huỷ
        </Button>
        <Button
          variant="contained"
          onClick={() => onSubmit(form)}
          disabled={submitting || !String(form.name || '').trim()}
        >
          Lưu
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function ItemView() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Item[]>([]);
  const [categories, setCategories] = useState<ItemCategory[]>([]);

  const [filterCat, setFilterCat] = useState<number | ''>('');
  const [filterActive, setFilterActive] = useState<'all' | 'true' | 'false'>('all');

  const [openDlg, setOpenDlg] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchBase = async () => {
    const cats = await listItemCategories({ limit: 500 });
    setCategories(cats);
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params: any = { limit: 200 };
      if (filterCat !== '') params.category_id = filterCat;
      const data = await listItems(params);
      setRows(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBase().then(fetchItems);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = () => {
    setEditing(null);
    setOpenDlg(true);
  };

  const handleEdit = (row: Item) => {
    setEditing(row);
    setOpenDlg(true);
  };

  const handleSubmit = async (payload: ItemPayload) => {
    setSubmitting(true);
    try {
      if (editing) await updateItem(editing.id, payload);
      else await createItem(payload);

      setOpenDlg(false);
      await fetchItems();
    } catch (e: any) {
      alert(e?.message || 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    const ok = window.confirm('Xoá item?');
    if (!ok) return;
    try {
      await deleteItem(id);
      await fetchItems();
    } catch (e: any) {
      alert(e?.message || 'Error');
    }
  };

  const displayRows = useMemo(() => rows, [rows]);

  return (
    <Card sx={{ p: 2 }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Typography variant="h6" sx={{ flex: 1 }}>
          Danh sách mục chi tiết
        </Typography>

        <TextField
          select
          size="small"
          label="Danh mục"
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value === '' ? '' : Number(e.target.value))}
          sx={{ minWidth: 220 }}
        >
          <MenuItem value="">Tất cả</MenuItem>
          {categories.map((c) => (
            <MenuItem key={c.id} value={c.id}>
              {c.code} - {c.name}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          size="small"
          label="Active"
          value={filterActive}
          onChange={(e) => setFilterActive(e.target.value as any)}
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="all">Tất cả</MenuItem>
          <MenuItem value="true">Active</MenuItem>
          <MenuItem value="false">Inactive</MenuItem>
        </TextField>

        <Button variant="outlined" onClick={fetchItems} disabled={loading}>
          Lọc
        </Button>

        <Button variant="contained" onClick={handleCreate}>
          Tạo item
        </Button>
      </Stack>

      <Divider sx={{ my: 2 }} />

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell width={160}>CODE</TableCell>
              <TableCell>Tên</TableCell>
              <TableCell width={240}>Loại</TableCell>
              <TableCell width={140} align="right">
                Hành động
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {displayRows.map((r) => (
              <TableRow key={r.id} hover>
                <TableCell>{r.code || ''}</TableCell>
                <TableCell>{r.name}</TableCell>
                <TableCell>{r.category ? `${r.category.code} - ${r.category.name}` : ''}</TableCell>
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
            {!displayRows.length && (
              <TableRow>
                <TableCell colSpan={8}>
                  <Typography variant="body2" sx={{ py: 2 }} color="text.secondary">
                    Không có dữ liệu
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <ItemDialog
        open={openDlg}
        onClose={() => setOpenDlg(false)}
        onSubmit={handleSubmit}
        categories={categories}
        initial={editing}
        submitting={submitting}
      />
    </Card>
  );
}
