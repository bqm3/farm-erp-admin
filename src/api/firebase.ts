import axiosInstance from "src/utils/axios";

export async function fetchFirebaseToken() {
  const res = await axiosInstance.get(`/api/firebase/token`);
  if (res.status < 200 || res.status >= 300) throw new Error("Cannot fetch firebase token");
  return res.data; 
}

export type StartDmRes = { threadId: string; farm_id: number; members: string[] };
export type SendDmRes = { ok: boolean; threadId: string; messageId: string };

export async function apiStartDm(to_user_id: number): Promise<StartDmRes> {
  const { data } = await axiosInstance.post(`/api/firebase/start`, { to_user_id });
  return data;
}

export async function apiSendDm(to_user_id: number, text: string): Promise<SendDmRes> {
  const { data } = await axiosInstance.post(`/api/firebase/send`, { to_user_id, text });
  return data;
}
