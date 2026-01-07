// src/sections/warehouse/view/warehouse-manage-view.tsx

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Card,
  Tabs,
  Tab,
  Stack,
  Button,
  TextField,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  IconButton,
  CircularProgress,
  Divider,
  Autocomplete,
} from '@mui/material';

import Iconify from 'src/components/iconify';
import { listItems, type Item } from 'src/api/items';
import {
  listWarehouses,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  getStocks,
  listMovements,
  createMovement,
  setStockQty,
  type Warehouse,
  type WarehouseStock,
  type WarehouseMovement,
} from 'src/api/warehouse';

import { formatNumber, formatVND, fPercent } from 'src/utils/format-number';
import ReceiptCreateDialog from 'src/sections/receipts/receipt-create-dialog';
import type { ReceiptCreatePayload } from 'src/api/receipts';
import { createReceipt } from 'src/api/receipts';

import WarehouseEditDialog from '../warehouse-edit-dialog';
import StockSetQtyDialog from '../stock-setqty-dialog';
import MovementCreateDialog from '../movement-create-dialog';

type TabValue = 'WAREHOUSE' | 'STOCK' | 'MOVEMENT';

export default function WarehouseManageView() {
  const [tab, setTab] = useState<TabValue>('WAREHOUSE');

  // common
  const [loading, setLoading] = useState(false);
  const [itemsLoading, setItemsLoading] = useState(false);

  // data sources
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [items, setItems] = useState<Item[]>([]);

  // selected warehouse (for stock/movement)
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);

  // warehouse list filters
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<string>('');

  // warehouse CRUD dialogs
  const [openWarehouseDlg, setOpenWarehouseDlg] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);

  // stock
  const [stocks, setStocks] = useState<WarehouseStock[]>([]);
  const [openSetQty, setOpenSetQty] = useState(false);
  const [editingStock, setEditingStock] = useState<WarehouseStock | null>(null);

  // movements
  const [movements, setMovements] = useState<WarehouseMovement[]>([]);
  const [openReceiptDlg, setOpenReceiptDlg] = useState(false);
  const [defaultReceiptType, setDefaultReceiptType] = useState<'INCOME' | 'EXPENSE'>('INCOME');

  const selectedWarehouseId = selectedWarehouse?.id ?? 0;

  const itemOptions = useMemo(
    () => items.filter((x: any) => x.isDelete === false || x.isDelete === 0),
    [items]
  );

  const fetchWarehouses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listWarehouses({
        q: q || undefined,
        status: status || undefined,
        page: 1,
        pageSize: 200,
      });
      setWarehouses(res.rows);
      if (!selectedWarehouse && res.rows.length) setSelectedWarehouse(res.rows[0]);
    } finally {
      setLoading(false);
    }
  }, [q, status, selectedWarehouse]);

  const fetchItems = useCallback(async () => {
    setItemsLoading(true);
    try {
      const res = await listItems({ limit: 500 });
      setItems(res);
    } finally {
      setItemsLoading(false);
    }
  }, []);

  const fetchStocks = useCallback(async () => {
    if (!selectedWarehouseId) return;
    setLoading(true);
    try {
      const res = await getStocks({ warehouse_id: selectedWarehouseId });
      setStocks(res);
    } finally {
      setLoading(false);
    }
  }, [selectedWarehouseId]);

  const fetchMovements = useCallback(async () => {
    if (!selectedWarehouseId) return;
    setLoading(true);
    try {
      const res = await listMovements({ warehouse_id: selectedWarehouseId, limit: 2000 });
      setMovements(res);
    } finally {
      setLoading(false);
    }
  }, [selectedWarehouseId]);

  useEffect(() => {
    fetchWarehouses();
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (tab === 'STOCK') fetchStocks();
    if (tab === 'MOVEMENT') fetchMovements();
  }, [tab, fetchStocks, fetchMovements]);

  const onCreateWarehouse = () => {
    setEditingWarehouse(null);
    setOpenWarehouseDlg(true);
  };

  const onEditWarehouse = (row: Warehouse) => {
    setEditingWarehouse(row);
    setOpenWarehouseDlg(true);
  };

  const onDeleteWarehouse = async (id: number) => {
    await deleteWarehouse(id);
    await fetchWarehouses();
  };

  const onSubmitWarehouse = async (payload: any) => {
    if (editingWarehouse?.id) await updateWarehouse(editingWarehouse.id, payload);
    else await createWarehouse(payload);
    setOpenWarehouseDlg(false);
    setEditingWarehouse(null);
    await fetchWarehouses();
  };

  const onOpenSetQty = (row: WarehouseStock) => {
    setEditingStock(row);
    setOpenSetQty(true);
  };

  const onSubmitSetQty = async (payload: { item_id: number; qty: number }) => {
    if (!selectedWarehouseId) return;
    await setStockQty({
      warehouse_id: selectedWarehouseId,
      item_id: payload.item_id,
      qty: payload.qty,
    });
    setOpenSetQty(false);
    setEditingStock(null);
    await fetchStocks();
  };

  const onSubmitReceipt = async (payload: ReceiptCreatePayload) => {
    // ép source/warehouse đúng theo tab kho
    if (!selectedWarehouseId) throw new Error('Chưa chọn kho');

    await createReceipt({
      ...payload,
      source: 'WAREHOUSE',
      warehouse_id: selectedWarehouseId,
    });

    setOpenReceiptDlg(false);

    // reload tồn + movement
    await fetchStocks();
    await fetchMovements();
  };

  return (
    <Card sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Typography variant="h5">Quản lý kho</Typography>

        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab value="WAREHOUSE" label="Danh sách kho" />
          <Tab value="STOCK" label="Tồn kho" />
          <Tab value="MOVEMENT" label="Lịch sử nhập / xuất" />
        </Tabs>

        {(tab === 'STOCK' || tab === 'MOVEMENT') && (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <Autocomplete
              sx={{ minWidth: 360 }}
              options={warehouses}
              value={selectedWarehouse}
              onChange={(_, v) => setSelectedWarehouse(v)}
              getOptionLabel={(o) => `${o.code} - ${o.name}`}
              renderInput={(params) => <TextField {...params} label="Chọn kho" />}
            />
            <Button
              variant="outlined"
              startIcon={<Iconify icon="solar:refresh-bold" />}
              onClick={() => (tab === 'STOCK' ? fetchStocks() : fetchMovements())}
            >
              Tải lại
            </Button>
            {loading && <CircularProgress size={20} />}
          </Stack>
        )}

        <Divider />

        {tab === 'WAREHOUSE' && (
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
              <TextField
                value={q}
                onChange={(e) => setQ(e.target.value)}
                label="Tìm theo mã / tên kho"
                sx={{ minWidth: 320 }}
              />
              <TextField
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                label="Trạng thái (ACTIVE/INACTIVE)"
                sx={{ minWidth: 240 }}
              />

              <Button
                variant="contained"
                startIcon={<Iconify icon="solar:filter-bold" />}
                onClick={fetchWarehouses}
              >
                Lọc
              </Button>
              <Button
                variant="contained"
                startIcon={<Iconify icon="solar:add-circle-bold" />}
                onClick={onCreateWarehouse}
              >
                Tạo kho
              </Button>
              {loading && <CircularProgress size={20} />}
            </Stack>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell width={220}>Mã kho</TableCell>
                    <TableCell>Tên kho</TableCell>
                    <TableCell width={180}>Trạng thái</TableCell>
                    <TableCell width={140} align="right">
                      Hành động
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {warehouses.map((r) => (
                    <TableRow key={r.id} hover>
                      <TableCell>{r.code}</TableCell>
                      <TableCell>{r.name}</TableCell>
                      <TableCell>
                        {r.status === 'ACTIVE' ? 'Hoạt động' : 'Không hoạt động'}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton onClick={() => onEditWarehouse(r)} title="Sửa">
                          <Iconify icon="solar:pen-bold" />
                        </IconButton>
                        <IconButton onClick={() => onDeleteWarehouse(r.id)} title="Xoá">
                          <Iconify icon="solar:trash-bin-trash-bold" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!warehouses.length && (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <Typography variant="body2" color="text.secondary">
                          Không có dữ liệu
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        )}

        {tab === 'STOCK' && (
          <Stack spacing={2}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Button
                variant="contained"
                startIcon={<Iconify icon="solar:pen-bold" />}
                disabled={!selectedWarehouseId}
                onClick={() => {
                  setEditingStock(null);
                  setOpenSetQty(true);
                }}
              >
                Thiết lập số lượng tồn
              </Button>

              {itemsLoading && (
                <Typography variant="body2" color="text.secondary">
                  Đang tải danh mục hàng hoá...
                </Typography>
              )}
            </Stack>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell width={260}>Hàng hoá</TableCell>
                    <TableCell width={140} align="right">
                      Số lượng
                    </TableCell>
                    <TableCell width={160} align="right">
                      Giá vốn trung bình
                    </TableCell>
                    <TableCell width={160} align="right">
                      Giá vốn tổng
                    </TableCell>
                    <TableCell width={90} align="right">
                      Sửa
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stocks.map((s) => (
                    <TableRow key={s.id} hover>
                      <TableCell>
                        {(s.item?.code ? `${s.item.code} - ` : '') + (s.item?.name || '')}
                      </TableCell>
                      <TableCell align="right">{formatNumber(s.qty || 0)}</TableCell>
                      <TableCell align="right">{formatVND(s.unit_cost || 0)}</TableCell>
                      <TableCell align="right">{formatVND(s.total_cost || 0)}</TableCell>
                      <TableCell align="right">
                        <IconButton onClick={() => onOpenSetQty(s)} title="Thiết lập">
                          <Iconify icon="solar:pen-bold" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!stocks.length && (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <Typography variant="body2" color="text.secondary">
                          Chưa có dữ liệu tồn kho
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        )}

        {tab === 'MOVEMENT' && (
          <Stack spacing={2}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Button
                variant="contained"
                startIcon={<Iconify icon="solar:add-circle-bold" />}
                disabled={!selectedWarehouseId}
                onClick={() => {
                  // tuỳ bạn: hỏi user chọn nhập/xuất hoặc làm 2 nút
                  setDefaultReceiptType('INCOME'); // hoặc 'EXPENSE'
                  setOpenReceiptDlg(true);
                }}
              >
                Tạo phiếu nhập / xuất
              </Button>

              {itemsLoading && (
                <Typography variant="body2" color="text.secondary">
                  Đang tải danh mục hàng hoá...
                </Typography>
              )}
            </Stack>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell width={90}>Loại</TableCell>
                    <TableCell width={260}>Hàng hoá</TableCell>
                    <TableCell width={100} align="right">
                      Số lượng
                    </TableCell>
                    <TableCell width={160} align="right">
                      Đơn giá
                    </TableCell>
                    <TableCell width={100} align="right">
                      VAT
                    </TableCell>
                    <TableCell width={160} align="right">
                      Tổng tiền
                    </TableCell>
                    <TableCell width={200}>Mã biên lai</TableCell>
                    <TableCell width={160}>Thời gian</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {movements.map((m) => (
                    <TableRow key={m.id} hover>
                      <TableCell>{m.direction === 'IN' ? 'Nhập' : 'Xuất'}</TableCell>
                      <TableCell>
                        {(m.item?.code ? `${m.item.code} - ` : '') + (m.item?.name || '')}
                      </TableCell>
                      <TableCell align="right">{formatNumber(m.qty || 0)}</TableCell>
                      <TableCell align="right">{formatVND(m.price || 0)}</TableCell>
                      <TableCell align="right">{fPercent(m.vat_percent || 0)}</TableCell>
                      <TableCell align="right">{formatVND(m.amount_total || 0)}</TableCell>
                      <TableCell>{m?.receipt?.code || '-'}</TableCell>
                      <TableCell>
                        {m.created_at ? new Date(m.created_at).toLocaleString('vi-VN') : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!movements.length && (
                    <TableRow>
                      <TableCell colSpan={7}>
                        <Typography variant="body2" color="text.secondary">
                          Chưa có lịch sử nhập / xuất
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        )}
      </Stack>

      {/* dialogs */}
      <WarehouseEditDialog
        open={openWarehouseDlg}
        initial={editingWarehouse}
        onClose={() => {
          setOpenWarehouseDlg(false);
          setEditingWarehouse(null);
        }}
        onSubmit={onSubmitWarehouse}
      />

      <StockSetQtyDialog
        open={openSetQty}
        initialStock={editingStock}
        items={itemOptions}
        onClose={() => {
          setOpenSetQty(false);
          setEditingStock(null);
        }}
        onSubmit={onSubmitSetQty}
      />

      <ReceiptCreateDialog
        open={openReceiptDlg}
        onClose={() => setOpenReceiptDlg(false)}
        onSubmit={(payload) =>
          onSubmitReceipt({
            ...payload,
            type: defaultReceiptType, // ép default type theo nút
            source: 'WAREHOUSE', // ép source
            warehouse_id: selectedWarehouseId, // ép kho đang chọn
          })
        }
      />
    </Card>
  );
}
