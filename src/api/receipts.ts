// src/api/receipts.ts
import axiosInstance from 'src/utils/axios';


export type ReceiptType = 'THU' | 'CHI';
export type ReceiptSubType = 'HARVEST' | 'SOLD';
export type ReceiptStatus = 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type ReceiptSource = 'WAREHOUSE' | 'CASH' | 'BANK' | string;
export type PaymentMethod = 'CASH' | 'BANK' | 'OTHER';

export type ChangeRequestType = 'UPDATE' | 'CANCEL';
export type ChangeRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';


export type ReceiptLine = {
  id: number;
  receipt_id: number;
  item_id: number | null;
  item?: { id: number; code: string; name: string };
  description?: string | null;

  qty: string | number;
  unit?: string | null;

  unit_price: string | number;
  price: string | number;
  vat_percent: number;

  amount_before_tax: string | number;
  vat_amount: string | number;
  amount_total: string | number;

  isDelete?: boolean;
};

export type ReceiptRow = {
  id: number;
  code: string;
  type: ReceiptType;
  subtype?: string | null;
  payment_method: string;
  source: string;
  receipt_date: string;
  month: number;
  year: number;
  status: ReceiptStatus;
  work_cycle_id?: number | null;
  warehouse_id?: number | null;
  fund_id?: number | null;
  total_amount?: number | null;
  note?: string | null;
  locked?: boolean;
  lines?: ReceiptLine[];
  computed?: {
    total_qty: number;
    amount_before_tax: number;
    vat_amount: number;
    amount_total: number;
  };
};

export type Receipt = {
  id: number;
  code: string;
  type: ReceiptType;
  subtype?: ReceiptSubType |string | null;
  payment_method: string;
  source: ReceiptSource;

  warehouse_id?: number | null;
  warehouse?: { id: number; code?: string; name?: string } | null;

  receipt_date: string; // yyyy-mm-dd
  month: number;
  year: number;

  employee_id: number;
  employee?: { id: number; username: string; full_name: string };

  created_by: number;
  creator?: { id: number; username: string; full_name: string };

  work_cycle_id?: number | null;
  cycle?: any;

  note?: string | null;

  status: ReceiptStatus;
  locked: boolean;

  lines?: ReceiptLine[];
};

export type ReceiptLinePayload = {
  item_id: number;
  description?: string;
  qty: number;
  vat_percent?: number;
  // price: backend sẽ set 0 cho EXPENSE/WAREHOUSE lúc tạo => có thể omit
};

export type ListReceiptsParams = {
  page?: number;
  limit?: number;
  code?: string;
  type?: ReceiptType;
  status?: ReceiptStatus;
  work_cycle_id?: number | string;
  from?: string; // yyyy-mm-dd
  to?: string;   // yyyy-mm-dd
};

export type ListReceiptsResponse = {
  ok: boolean;
  data: Receipt[];
  page: number;
  limit: number;
  total: number;
};

export type ReceiptCreatePayload = {
  type: ReceiptType;
  subtype?: ReceiptSubType |string | null;
  payment_method: string;
  source: ReceiptSource;

  warehouse_id?: number | null;
  receipt_date: string;

  work_cycle_id?: number | null;
  note?: string | null;

  lines: Array<{
    item_id?: number | null;
    description?: string | null;
    qty: number;
    unit?: string | null;
    price?: number; // INCOME cần; EXPENSE WAREHOUSE có thể auto avg_cost
    vat_percent?: number;
  }>;
};

export type ReceiptChangeRequest = {
  id: number;
  receipt_id: number;
  request_type: ChangeRequestType;
  reason: string;
  proposed_payload?: any | null;
  status: ChangeRequestStatus;

  requested_by: number;
  requester?: { id: number; username: string; full_name: string };

  reviewed_by?: number | null;
  reviewer?: { id: number; username: string; full_name: string } | null;

  reviewed_at?: string | null;
  createdAt?: string;
};

export type ListChangeRequestsParams = {
  page?: number;
  limit?: number;
  receipt_id?: number | string;
  status?: ChangeRequestStatus;
  request_type?: ChangeRequestType;
};

export type ListChangeRequestsResponse = {
  ok: boolean;
  data: ReceiptChangeRequest[];
  page: number;
  limit: number;
  total: number;
};

export async function listReceipts(params: ListReceiptsParams) {
  const res = await axiosInstance.get<ListReceiptsResponse>('/api/receipts', { params });
  return res.data;
}

export async function getReceiptDetail(id: number) {
  const res = await axiosInstance.get<{ ok: boolean; data: Receipt }>(`/api/receipts/${id}`);
  return res.data.data;
}

export async function createReceipt(payload: ReceiptCreatePayload) {
  const res = await axiosInstance.post<{ ok: boolean; data?: Receipt; message?: string }>(
    '/api/receipts',
    payload
  );

  if (!res.data.ok) {
    throw new Error(res.data.message || 'Tạo phiếu thất bại');
  }

  // ok:true thì mới có data
  return res.data.data as Receipt;
}

export async function approveReceipt(id: number) {
  const res = await axiosInstance.post<{ ok: boolean; message: string }>(`/api/receipts/${id}/approve`);

  if (!res.data.ok) {
    throw new Error(res.data.message || 'Duyệt phiếu thất bại');
  }

  return res.data;
}

export async function rejectReceipt(id: number, payload : {
  reason: string
}) {
  const res = await axiosInstance.post<{ ok: boolean; message: string }>(`/api/receipts/${id}/reject`, payload);

  if (!res.data.ok) {
    throw new Error(res.data.message || 'Duyệt phiếu thất bại');
  }

  return res.data;
}

export async function createReceiptChangeRequest(
  receiptId: number,
  payload: { request_type: ChangeRequestType; reason: string; proposed_payload?: any }
) {
  const res = await axiosInstance.post<{ ok: boolean; data: ReceiptChangeRequest; message?: string }>(
    `/api/receipts/${receiptId}/change-requests`,
    payload
  );
  return res.data.data;
}

export async function listChangeRequests(params: ListChangeRequestsParams) {
  // NOTE: route của bạn: GET /api/receipts/change-requests (requireAdmin)
  const res = await axiosInstance.get<ListChangeRequestsResponse>('/api/receipts/change-requests', { params });
  return res.data;
}

export async function approveChangeRequest(reqId: number) {
  const res = await axiosInstance.post<{ ok: boolean; message: string }>(
    `/api/receipts/change-requests/${reqId}/approve`
  );
  return res.data;
}

export async function rejectChangeRequest(reqId: number) {
  const res = await axiosInstance.post<{ ok: boolean; message: string }>(
    `/api/receipts/change-requests/${reqId}/reject`
  );
  return res.data;
}


export async function getReceiptsByWorkCycle(params: {
  work_cycle_id: number;
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  from?: string;
  to?: string;
  message?: string;
}) {
  const res = await axiosInstance.get('/api/receipts/by-workcycle', { params });
  return res.data as {
    ok: boolean;
    data: ReceiptRow[];
    paging: { page: number; limit: number; total: number; totalPages: number };
  };
}