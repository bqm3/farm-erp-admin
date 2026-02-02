// src/api/funds-ledgers.ts
import axiosInstance from 'src/utils/axios';

export type FundLedgerRow = {
  id: number;

  fund_id: number;
  receipt_id?: number | null;
  farm_id: number;

  action?: 'THU' | 'CHI' | 'DIEU_CHINH' | 'HOAN_TAC';
  ref_type?: string | null;

  amount?: any;
  balance_before?: any;
  balance_after?: any;
  note?: string | null;

  created_by?: number;
  created_at?: string; // Sequelize timestamps
  updated_at?: string;

  creator?: { id?: number; full_name?: string; email?: string } | null;

  // join from receipts
  receipt?: {
    id?: number;
    code?: string;
    type?: string; // THU/CHI...
    subtype?: string | null;
    total_amount?: any;
    note?: string | null;
    status?: string | null;
    createdAt?: string;
  } | null;
};

export type ListFundLedgerParams = {
  fundId: number;

  page?: number;
  limit?: number;

  q?: string;
  action?: string; // '' | 'THU' | 'CHI' | 'DIEU_CHINH' | 'HOAN_TAC' | 'THU,CHI'
  refType?: string; // filter theo ref_type

  from?: string; // yyyy-mm-dd or ISO
  to?: string; // yyyy-mm-dd or ISO

  minAmount?: string | number;
  maxAmount?: string | number;

  createdBy?: string | number;

  hasReceipt?: '0' | '1' | ''; // 1: chỉ có receipt_id; 0: chỉ không có receipt_id
  sort?: string; // 'id:DESC' | 'createdAt:DESC' | 'amount:ASC' ...
};

export type FundLedgerSummary = {
  totalsByAction: Record<string, { total: number; count: number }>;
  grandTotal: number;
};

export type ListFundLedgerResponse = {
  fund: any;
  summary?: FundLedgerSummary;
  data: FundLedgerRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const ENDPOINTS = {
  list: '/api/funds/fund-ledgers',
  export: '/api/funds/fund-ledgers/export',
};

export async function listFundLedgers(params: ListFundLedgerParams) {
  const res = await axiosInstance.get<ListFundLedgerResponse>(ENDPOINTS.list, { params });
  return res.data;
}

export async function exportFundLedgersExcel(params: ListFundLedgerParams) {
  const res = await axiosInstance.get(ENDPOINTS.export, {
    params,
    responseType: 'blob',
  });
  return res.data as Blob;
}
