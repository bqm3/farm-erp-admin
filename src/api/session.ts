// src/api/session.ts
import axiosInstance from 'src/utils/axios';

export async function selectFarm(farm_id: number) {
  const res = await axiosInstance.post('/api/users/me/select-farm', { farm_id });
  return res.data; // { ok: true, data: user }
}
