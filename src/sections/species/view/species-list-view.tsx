/* eslint-disable import/order */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Container,
  Card,
  Stack,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Pagination,
} from '@mui/material';
import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
// routes (nếu bạn có paths thì thay)
import { paths } from 'src/routes/paths';

import SpeciesTable from '../species-table';
import SpeciesEditDialog from '../species-edit-dialog';
import type { ISpecies } from 'src/api/species';
import { apiDeleteSpecies, apiListSpecies } from 'src/api/species';



export default function SpeciesListView() {
  const settings = useSettingsContext();

  const [rows, setRows] = useState<ISpecies[]>([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [openDialog, setOpenDialog] = useState(false);
  const [current, setCurrent] = useState<ISpecies | null>(null);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiListSpecies({ page, pageSize, search });
      setRows(res.data || []);
      setTotal(res.total || 0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenCreate = () => {
    setCurrent(null);
    setOpenDialog(true);
  };

  const handleOpenEdit = (row: ISpecies) => {
    setCurrent(row);
    setOpenDialog(true);
  };

  const handleDelete = async (row: ISpecies) => {
    // confirm đơn giản (bạn có thể thay bằng ConfirmDialog component của template)
    const ok = window.confirm(`Xóa Vật nuôi, cây trồng "${row.name}"?`);
    if (!ok) return;
    await apiDeleteSpecies(row.id);
    fetchData();
  };

  const handleSearch = () => {
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setPage(1);
    setSearch('');
  };

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="Vật nuôi, cây trồng"
        links={[
          { name: 'Dashboard', href: paths.dashboard?.root || '/dashboard' },
          { name: 'Danh mục', href: paths.dashboard?.root || '/dashboard' },
          { name: 'Vật nuôi, cây trồng' },
        ]}
        action={
          <Button
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={handleOpenCreate}
          >
            Thêm Vật nuôi, cây trồng
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <TextField
            fullWidth
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm theo mã hoặc tên..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" />
                </InputAdornment>
              ),
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearch();
            }}
          />

          <Stack direction="row" spacing={1} flexShrink={0}>
            <Button variant="contained" onClick={handleSearch}>
              Tìm
            </Button>
            <Button color="inherit" onClick={handleClearSearch}>
              Xóa lọc
            </Button>
          </Stack>
        </Stack>

        {loading ? (
          <Typography variant="body2" sx={{ p: 2 }}>
            Đang tải...
          </Typography>
        ) : (
          <SpeciesTable rows={rows} onEdit={handleOpenEdit} onDelete={handleDelete} />
        )}

        <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
          <Pagination
            page={page}
            count={totalPages}
            onChange={(_, v) => setPage(v)}
            shape="rounded"
          />
        </Stack>
      </Card>

      <SpeciesEditDialog
        open={openDialog}
        current={current}
        onClose={() => setOpenDialog(false)}
        onSuccess={fetchData}
      />
    </Container>
  );
}
