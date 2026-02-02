import axiosInstance from 'src/utils/axios';

export type PartnerType = 'KHACH_HANG' | 'NHA_CUNG_CAP' | 'NHA_PHAN_PHOI';

export type PartnerRow = {
  id: number;
  farm_id?: number;

  partner_type: PartnerType;
  name: string;
  phone?: string | null;
  address?: string | null;

  supplier_name?: string | null;

  bank_name?: string | null;
  bank_account_name?: string | null;
  bank_account_no?: string | null;

  note?: string | null;

  createdAt?: string;
  updatedAt?: string;
};

export type PartnerCreatePayload = {
  partner_type: PartnerType;
  name: string;
  phone?: string | null;
  address?: string | null;
  supplier_name?: string | null;
  bank_name?: string | null;
  bank_account_name?: string | null;
  bank_account_no?: string | null;
  note?: string | null;
};

export type PartnerUpdatePayload = Partial<PartnerCreatePayload>;

export async function listPartners(params: {
  partner_type?: PartnerType | '';
  q?: string;
  page?: number;
  limit?: number;
}) {
  const res = await axiosInstance.get('/api/partners', { params });
  return res.data as {
    ok: boolean;
    data: PartnerRow[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export async function getPartner(id: number) {
  const res = await axiosInstance.get(`/api/partners/${id}`);
  return res.data as { ok: boolean; data: PartnerRow };
}

export async function createPartner(payload: PartnerCreatePayload) {
  const res = await axiosInstance.post('/api/partners', payload);
  return res.data as { ok: boolean; data: PartnerRow };
}

export async function updatePartner(id: number, payload: PartnerUpdatePayload) {
  const res = await axiosInstance.put(`/api/partners/${id}`, payload);
  return res.data as { ok: boolean; data: PartnerRow };
}

export async function deletePartner(id: number) {
  const res = await axiosInstance.delete(`/api/partners/${id}`);
  return res.data as { ok: boolean };
}

export async function getPartnerTransactions(partnerId: number, params: any) {
  const res = await axiosInstance.get(`/api/partners/${partnerId}/transactions`, { params });
  return res.data;
}

export function exportPartnerTransactions(partnerId: number, params: any) {
  return axiosInstance.get(`/api/partners/${partnerId}/transactions/export`, {
    params,
    responseType: "blob",
  });
}