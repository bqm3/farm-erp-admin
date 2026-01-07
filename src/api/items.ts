// src/api/items.ts
import axiosInstance from 'src/utils/axios';

export type ItemCategory = {
  id: number;
  code: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Item = {
  id: number;
  code?: string | null;
  name: string;
  category_id?: number | null;
  is_active?: boolean;
  isDelete?: boolean;
  unit?: string | null;
  price?: number | null;
  category?: ItemCategory | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ItemCategoryPayload = {
  code: string;
  name: string;
};

export type ItemPayload = Partial<{
  code: string;
  name: string;
  category_id: number | null;
  is_active: boolean;
  unit: string | null;
  price: number | null;
}> & { name: string };

const unwrap = (res: any) => {
  if (res?.data?.ok) return res.data.data;
  throw new Error(res?.data?.error || 'API_ERROR');
};

// --------- Category ----------
export async function listItemCategories(params?: { search?: string; limit?: number }) {
  const res = await axiosInstance.get('/api/items/categories', { params });
  return unwrap(res) as ItemCategory[];
}

export async function createItemCategory(payload: ItemCategoryPayload) {
  const res = await axiosInstance.post('/api/items/categories', payload);
  return unwrap(res) as ItemCategory;
}

export async function updateItemCategory(id: number, payload: Partial<ItemCategoryPayload>) {
  const res = await axiosInstance.put(`/api/items/categories/${id}`, payload);
  return unwrap(res) as ItemCategory;
}

export async function deleteItemCategory(id: number) {
  const res = await axiosInstance.delete(`/api/items/categories/${id}`);
  return unwrap(res) as boolean;
}

// --------- Item ----------
export async function listItems(params?: { category_id?: number; isDelete?: boolean; limit?: number }) {
  const res = await axiosInstance.get('/api/items', { params });
  return unwrap(res) as Item[];
}

export async function createItem(payload: ItemPayload) {
  const res = await axiosInstance.post('/api/items', payload);
  return unwrap(res) as Item;
}

export async function updateItem(id: number, payload: Partial<ItemPayload>) {
  const res = await axiosInstance.put(`/api/items/${id}`, payload);
  return unwrap(res) as Item;
}

export async function deleteItem(id: number) {
  const res = await axiosInstance.delete(`/api/items/${id}`);
  return unwrap(res) as boolean;
}
