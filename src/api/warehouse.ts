// src/api/warehouse.ts
import axiosInstance from 'src/utils/axios';
import { Receipt } from './receipts';

export type WarehouseStatus = 'ACTIVE' | 'INACTIVE';

export type Warehouse = {
  id: number;
  code: string;
  name: string;
  status: WarehouseStatus;
  isDelete?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type WarehousePayload = Partial<{
  code: string;
  name: string;
  status: WarehouseStatus;
}> & { code: string; name: string };

export type WarehouseStock = {
  id: number;
  warehouse_id: number;
  item_id: number;
  qty: number;
  avg_cost: number;
  unit_price: number;
  total_cost: number;
  item?: { id: number; code?: string | null; name: string; unit?: string | null; price?: number | null };
  createdAt?: string;
  updatedAt?: string;
  isDelete: boolean;
};

export type WarehouseMovement = {
  id: number;
  warehouse_id: number;
  item_id: number;
  direction: 'IN' | 'OUT';
  qty: number;
  price: number;
  unit_price: number;
  vat_percent: number;
  vat_amount: number;
  amount_before_tax: number;
  amount_total: number;
  unit_cost_applied: number;
  ref_type: string;
  receipt_id: string | number;
  created_by?: number;
  item?: { id: number; code?: string | null; name: string; unit?: string | null };
  warehouse?: Warehouse;
  created_at?: string;
  receipt: Receipt;
  createdAt?: string;
  updatedAt?: string;
};

export type MovementCreatePayload = {
  warehouse_id: number;
  item_id: number;
  direction: 'IN' | 'OUT';
  qty: number;
  unit_price?: number; // IN dùng tính avg
  ref_type: string;
  receipt_id: string | number;
};

const unwrap = (res: any) => {
  if (res?.data?.ok) return res.data;
  throw new Error(res?.data?.error || 'API_ERROR');
};

const BASE = '/api/warehouses';

export type ItemLedgerParams = {
  warehouse_id: number;
  item_id: number;
  from?: string; // yyyy-mm-dd
  to?: string;
  page?: number;
  pageSize?: number;
};

export async function listItemLedger(params: ItemLedgerParams) {
  const res = await axiosInstance.get(`${BASE}/item-ledger`, { params });
  return res.data as {
    rows: WarehouseMovement[];
    count: number;
    page: number;
    pageSize: number;
  };
}

export async function exportItemLedgerExcel(params: ItemLedgerParams) {
  const res = await axiosInstance.get(`${BASE}/item-ledger/export`, {
    params,
    responseType: 'blob',
  });

  // lấy filename nếu server set Content-Disposition
  const cd = res.headers?.['content-disposition'] || '';
  const match = /filename="?([^"]+)"?/i.exec(cd);
  const filename = match?.[1] || 'item-ledger.xlsx';

  const blobUrl = window.URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(blobUrl);
}

export async function listWarehouses(params?: { q?: string; status?: string; page?: number; pageSize?: number }) {
  const res = await axiosInstance.get(BASE, { params });
  const data = unwrap(res);
  // controller trả { ok:true, rows,count,page,pageSize }
  return data as { rows: Warehouse[]; count: number; page: number; pageSize: number };
}

export async function getWarehouse(id: number) {
  const res = await axiosInstance.get(`${BASE}/${id}`);
  return unwrap(res).data as Warehouse;
}

export async function createWarehouse(payload: WarehousePayload) {
  const res = await axiosInstance.post(BASE, payload);
  return unwrap(res).data as Warehouse;
}

export async function updateWarehouse(id: number, payload: Partial<WarehousePayload>) {
  const res = await axiosInstance.put(`${BASE}/${id}`, payload);
  return unwrap(res).data as Warehouse;
}

export async function deleteWarehouse(id: number) {
  const res = await axiosInstance.delete(`${BASE}/api/${id}`);
  return unwrap(res) as { ok: true };
}

// ----- Stock -----
export async function getStocks(params: { warehouse_id: number }) {
  const res = await axiosInstance.get(`${BASE}/stock/list`, { params });
  return unwrap(res).data as WarehouseStock[];
}

export async function upsertStock(payload: { warehouse_id: number; item_id: number; qty: number; avg_cost?: number }) {
  const res = await axiosInstance.post(`${BASE}/stock/upsert`, payload);
  return unwrap(res).data as WarehouseStock;
}

export async function setStockQty(payload: { warehouse_id: number; item_id: number; qty: number }) {
  const res = await axiosInstance.post(`${BASE}/stock/set-qty`, payload);
  return unwrap(res).data as WarehouseStock;
}

// ----- Movement -----
export async function listMovements(params: { warehouse_id: number; from?: string; to?: string; limit?: number }) {
  const res = await axiosInstance.get(`${BASE}/movement/list`, { params });
  return unwrap(res).data as WarehouseMovement[];
}

export async function createMovement(payload: MovementCreatePayload) {
  const res = await axiosInstance.post(`${BASE}/movement`, payload);
  // controller trả { ok:true, movement, stock }
  return unwrap(res) as { movement: WarehouseMovement; stock: WarehouseStock };
}
