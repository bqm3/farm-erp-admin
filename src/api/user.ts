import axiosInstance from 'src/utils/axios';

type RoleRow = { id?: number | string; code: string; name?: string };
type ApiUser = {
  id: number | string;
  username: string;
  full_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: string;
  roles?: RoleRow[]; // có thể undefined
};

type UiUser = {
  id: string;
  full_name: string;
  username: string;
  email?: string;
  phone?: string;
  address?: string;
  status: string;
  role: string;
  roles: RoleRow[];
  company: string;
  isVerified: boolean;
};

export async function fetchUsersForChat(): Promise<UiUser[]> {
  const res = await axiosInstance.get("/api/users");
  const apiUsers: ApiUser[] = res.data?.data ?? [];

  return apiUsers
    // nếu bạn muốn ẩn luôn admin khỏi danh sách chat
    .filter((u) => {
      const roles = Array.isArray(u.roles) ? u.roles : [];
      return !roles.some((r) => r?.code === "ADMIN");
    })
    .map((u) => {
      const roles = Array.isArray(u.roles) ? u.roles : [];
      const safeRoles = roles.filter((r) => r?.code && r.code !== "ADMIN");

      // role hiển thị: ưu tiên role đầu tiên (không phải ADMIN), fallback STAFF
      const primaryRole = safeRoles[0]?.code || "STAFF";

      return {
        id: String(u.id),
        full_name: (u.full_name && u.full_name.trim()) || u.username,
        username: u.username,
        email: u.email,
        phone: u.phone,
        address: u.address,
        status: u.status || "ACTIVE",
        role: primaryRole,
        roles: safeRoles,
        company: "Farm",
        isVerified: true,
      };
    });
}


export async function getUsersAndManagersByFarm(farmId: number) {
  const res = await axiosInstance.get(`/api/users/by-farm/${farmId}`);
  return res.data as {
    ok: boolean;
    data: {
      farm: { id: number; name: string; code?: string };
      users: any[];
      managers: any[];
    };
  };
}


export type UpdateMePayload = Partial<Pick<any, "full_name" | "phone" | "email" | "address" | "dob" | "cccd">>;

export async function apiGetMe() {
  const res = await axiosInstance.get("/api/auth/me");
  return res.data?.data as any;
}

export async function apiUpdateMe(payload: UpdateMePayload) {
  const res = await axiosInstance.put("/api/auth/me", payload);
  return res.data?.data as any;
}

export async function apiChangeMyPassword(old_password: string, new_password: string) {
  const res = await axiosInstance.put("/api/auth/me/password", { old_password, new_password });
  return res.data;
}