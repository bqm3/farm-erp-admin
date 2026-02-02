import axiosInstance from 'src/utils/axios';

export type FundType = 'TIEN_MAT' | 'CHUYEN_KHOAN'; // bạn chỉnh theo enum DB của bạn
export type FundRow = {
  id: number;
  farm_id?: number;

  fund_type: FundType;        // CASH/BANK...
  name: string;

  bank_name?: string | null;
  bank_account_name?: string | null;
  bank_account_no?: string | null;

  balance?: string | number;  // nếu trả về decimal string
  note?: string | null;

  createdAt?: string;
  updatedAt?: string;
};

export type FundCreatePayload = {
  fund_type: FundType;
  name: string;
  bank_name?: string | null;
  bank_account_name?: string | null;
  bank_account_no?: string | null;
  note?: string | null;
};

export type FundUpdatePayload = Partial<FundCreatePayload> & { is_active?: boolean };

export async function listFunds(params: {
  fund_type?: FundType | '';
  q?: string;
  page?: number;
  limit?: number;
}) {
  const res = await axiosInstance.get('/api/funds', { params });
  return res.data as {
    ok: boolean;
    data: FundRow[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export type FundAdjustPayload = {
  direction: 'IN' | 'OUT';
  amount: number | string;
  note: string;
};

export async function getFund(id: number) {
  const res = await axiosInstance.get(`/api/funds/${id}`);
  return res.data as { ok: boolean; data: FundRow };
}

export async function createFund(payload: FundCreatePayload) {
  const res = await axiosInstance.post('/api/funds', payload);
  return res.data as { ok: boolean; data: FundRow; message: string };
}

export async function updateFund(id: number, payload: FundUpdatePayload) {
  const res = await axiosInstance.put(`/api/funds/${id}`, payload);
  return res.data as { ok: boolean; data: FundRow };
}

export async function deleteFund(id: number) {
  const res = await axiosInstance.delete(`/api/funds/${id}`);
  return res.data as { ok: boolean };
}

export async function adjustFund(id: number | string, payload: FundAdjustPayload) {
  const res = await axiosInstance.post(`/api/funds/${id}/adjust`, payload);
  if (!res.data?.ok) throw new Error(res.data?.message || 'Adjust fund failed');
  return res.data.data; // { fund, ledger }
}

export async function listFundLedgers(params: { id: number | string; page?: number; limit?: number }) {
  const { id, page = 1, limit = 20 } = params;
  const res = await axiosInstance.get(`/api/funds/${id}/ledgers`, { params: { page, limit } });
  return res.data as {
    ok: boolean;
    data: any[];
    total: number;
    page: number;
    limit: number;
  };
}

