/* eslint-disable react/jsx-no-bind */
/* eslint-disable consistent-return */
/* eslint-disable no-nested-ternary */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useMemo, useRef, useState } from "react";

import {
  Box,
  Card,
  Divider,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  TextField,
  Typography,
  CircularProgress,
  Avatar,
  Chip,
} from "@mui/material";

import Iconify from "src/components/iconify"; // nếu bạn có component này
import { signInWithCustomToken } from "firebase/auth";
import { fbAuth } from "src/firebase/firebaseClient";

import { listenMessages } from "src/firebase/listeners";
import { fetchFirebaseToken, apiSendDm, apiStartDm } from "src/api/firebase";
import axiosInstance from "src/utils/axios";

// -------------------- types --------------------
type FbInfo = { uid: string; farm_id: number; role: string };

type RoleRow = { code: string; name?: string };
type ApiUser = {
  id: number | string;
  username: string;
  full_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: string;
  roles?: RoleRow[];
};

type UiUser = {
  id: string;
  name: string;
  username: string;
  status: string;
  role: string;
  roles: RoleRow[];
};

type MsgRow = {
  id: string;
  from: string;
  to: string;
  text: string;
  createdAt?: any;
};

// -------------------- helpers --------------------
function safeStr(v: any) {
  return typeof v === "string" ? v : "";
}

function isAdminRole(role?: string) {
  return role === "ADMIN";
}

function makeThreadId(farmId: number, a: string, b: string) {
  const [x, y] = a < b ? [a, b] : [b, a];
  return `${farmId}_${x}_${y}`;
}

async function fetchUsersForChat(): Promise<UiUser[]> {
  const res = await axiosInstance.get("/api/users");
  const apiUsers: ApiUser[] = res.data?.data ?? [];

  return apiUsers
    // Ẩn admin khỏi list để staff không nhắn admin (tuỳ bạn). Nếu muốn thấy admin thì bỏ filter này.
    .filter((u) => {
      const roles = Array.isArray(u.roles) ? u.roles : [];
      return !roles.some((r) => r?.code === "ADMIN");
    })
    .map((u) => {
      const roles = Array.isArray(u.roles) ? u.roles : [];
      const safeRoles = roles.filter((r) => r?.code && r.code !== "ADMIN");
      const primaryRole = safeRoles[0]?.code || "STAFF";

      return {
        id: String(u.id),
        name: (u.full_name && u.full_name.trim()) || u.username,
        username: u.username,
        status: u.status || "ACTIVE",
        role: primaryRole,
        roles: safeRoles,
      };
    });
}

export default function ChatPage() {
  const [loadingFb, setLoadingFb] = useState(true);
  const [fbInfo, setFbInfo] = useState<FbInfo | null>(null);

  const [loadingUsers, setLoadingUsers] = useState(true);
  const [users, setUsers] = useState<UiUser[]>([]);
  const [q, setQ] = useState("");

  const [activeUser, setActiveUser] = useState<UiUser | null>(null);
  const [activeThreadId, setActiveThreadId] = useState<string>("");
  const [messages, setMessages] = useState<MsgRow[]>([]);
  const [text, setText] = useState("");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const filteredUsers = useMemo(() => {
    const k = q.trim().toLowerCase();
    if (!k) return users;
    return users.filter((u) => u.name.toLowerCase().includes(k) || u.username.toLowerCase().includes(k));
  }, [q, users]);

  // 1) Connect Firebase (bằng firebaseToken từ API)
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoadingFb(true);
        const info = await fetchFirebaseToken(); // { uid, farm_id, role, firebaseToken }
        await signInWithCustomToken(fbAuth, info.firebaseToken);

        if (!mounted) return;
        setFbInfo({ uid: info.uid, farm_id: info.farm_id, role: info.role });
      } catch (e: any) {
        // bạn có thể dùng snackbar thay vì alert
        // eslint-disable-next-line no-alert
        alert(e?.message || String(e));
      } finally {
        if (mounted) setLoadingFb(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // 2) Load users list
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoadingUsers(true);
        const rows = await fetchUsersForChat();
        if (!mounted) return;
        setUsers(rows);
      } catch (e: any) {
        // eslint-disable-next-line no-alert
        alert(e?.message || String(e));
      } finally {
        if (mounted) setLoadingUsers(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // 3) Khi chọn user => start DM => set activeThreadId
  async function handleSelectUser(u: UiUser) {
    if (!fbInfo) return;

    setActiveUser(u);

    try {
      // server sẽ validate cùng farm, tạo thread
      const r = await apiStartDm(Number(u.id));
      setActiveThreadId(r.threadId);
    } catch (e: any) {
      // eslint-disable-next-line no-alert
      alert(e?.message || String(e));
      setActiveThreadId("");
    }
  }

  // 4) Listen messages realtime khi activeThreadId đổi
  useEffect(() => {
    if (!activeThreadId) {
      setMessages([]);
      return;
    }

    const unsub = listenMessages(activeThreadId, (rows: any[]) => {
      // rows từ listeners của bạn: [{id,...data}]
      setMessages(rows as MsgRow[]);
    });

    return () => unsub?.();
  }, [activeThreadId]);

  // auto scroll cuối
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // 5) Send message (qua API)
  async function handleSend() {
    if (!activeUser) return;
    const t = text.trim();
    if (!t) return;

    try {
      await apiSendDm(Number(activeUser.id), t);
      setText("");
    } catch (e: any) {
      // eslint-disable-next-line no-alert
      alert(e?.message || String(e));
    }
  }

  // nếu bạn muốn admin xem tất cả threads thì cần UI list threads riêng.
  // Ở đây UI tập trung “click user -> chat”.

  const headerRight = (
    <Stack spacing={0.25}>
      <Typography variant="subtitle1" fontWeight={700}>
        {activeUser ? activeUser.name : "Chọn người để nhắn tin"}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {activeUser ? `@${activeUser.username}` : ""}
      </Typography>
    </Stack>
  );

  return (
    <Box sx={{ height: "calc(100vh - 24px)", p: 2 }}>
      <Card sx={{ height: "100%", overflow: "hidden" }}>
        <Stack direction="row" sx={{ height: "100%" }}>
          {/* LEFT: users */}
          <Box sx={{ width: 360, borderRight: "1px solid", borderColor: "divider", display: "flex", flexDirection: "column" }}>
            <Box sx={{ p: 2 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="subtitle1" fontWeight={800}>
                  Chat 1-1
                </Typography>
                <Chip
                  size="small"
                  label={
                    loadingFb
                      ? "Firebase: ..."
                      : fbInfo
                        ? `Farm ${fbInfo.farm_id} • ${fbInfo.role}`
                        : "Firebase: lỗi"
                  }
                  color={fbInfo && isAdminRole(fbInfo.role) ? "primary" : "default"}
                  variant="outlined"
                />
              </Stack>

              <TextField
                fullWidth
                size="small"
                placeholder="Tìm theo tên/username..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                sx={{ mt: 1.5 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="eva:search-fill" />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Divider />

            <Box sx={{ flex: 1, overflow: "auto" }}>
              {loadingUsers ? (
                <Stack alignItems="center" justifyContent="center" sx={{ py: 4 }}>
                  <CircularProgress size={22} />
                  <Typography variant="body2" sx={{ mt: 1 }} color="text.secondary">
                    Đang tải users...
                  </Typography>
                </Stack>
              ) : filteredUsers.length === 0 ? (
                <Stack alignItems="center" justifyContent="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    Không có user.
                  </Typography>
                </Stack>
              ) : (
                <List disablePadding>
                  {filteredUsers.map((u) => {
                    const selected = activeUser?.id === u.id;

                    return (
                      <ListItemButton
                        key={u.id}
                        selected={selected}
                        onClick={() => handleSelectUser(u)}
                        sx={{
                          py: 1.25,
                          alignItems: "flex-start",
                        }}
                      >
                        <Avatar sx={{ width: 34, height: 34, mr: 1.5 }}>
                          {u.name?.[0]?.toUpperCase() || "U"}
                        </Avatar>

                        <ListItemText
                          primary={
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Typography variant="subtitle2" noWrap>
                                {u.name}
                              </Typography>
                              <Chip size="small" label={u.role} variant="outlined" />
                            </Stack>
                          }
                          secondary={
                            <Typography variant="caption" color="text.secondary" noWrap>
                              @{u.username} • {u.status}
                            </Typography>
                          }
                        />
                      </ListItemButton>
                    );
                  })}
                </List>
              )}
            </Box>
          </Box>

          {/* RIGHT: messages */}
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
            {/* Header */}
            <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                {headerRight}

                <Stack direction="row" spacing={1} alignItems="center">
                  {activeThreadId ? (
                    <Typography variant="caption" color="text.secondary">
                      Thread: {activeThreadId}
                    </Typography>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      —
                    </Typography>
                  )}
                </Stack>
              </Stack>
            </Box>

            {/* Body */}
            <Box sx={{ flex: 1, overflow: "auto", p: 2, bgcolor: "background.neutral" }}>
              {!fbInfo ? (
                <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
                  <CircularProgress size={22} />
                  <Typography variant="body2" sx={{ mt: 1 }} color="text.secondary">
                    Đang kết nối Firebase...
                  </Typography>
                </Stack>
              ) : !activeUser ? (
                <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    Chọn 1 người ở bên trái để bắt đầu chat.
                  </Typography>
                </Stack>
              ) : !activeThreadId ? (
                <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    Chưa có thread. Nhấn vào user để tạo cuộc trò chuyện.
                  </Typography>
                </Stack>
              ) : messages.length === 0 ? (
                <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    Chưa có tin nhắn.
                  </Typography>
                </Stack>
              ) : (
                <Stack spacing={1.25}>
                  {messages.map((m) => {
                    const mine = fbInfo.uid === m.from;
                    return (
                      <Stack
                        key={m.id}
                        direction="row"
                        justifyContent={mine ? "flex-end" : "flex-start"}
                      >
                        <Box
                          sx={{
                            maxWidth: "72%",
                            px: 1.5,
                            py: 1.2,
                            borderRadius: 2,
                            border: "1px solid",
                            borderColor: "divider",
                            bgcolor: mine ? "primary.lighter" : "background.paper",
                          }}
                        >
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                            {m.from} → {m.to}
                          </Typography>

                          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                            {safeStr(m.text)}
                          </Typography>
                        </Box>
                      </Stack>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </Stack>
              )}
            </Box>

            {/* Footer */}
            <Box sx={{ p: 2, borderTop: "1px solid", borderColor: "divider" }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  fullWidth
                  size="small"
                  placeholder={activeUser ? "Nhập tin nhắn..." : "Chọn người để chat"}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  disabled={!activeUser || !activeThreadId}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSend();
                  }}
                />
                <IconButton
                  color="primary"
                  onClick={handleSend}
                  disabled={!activeUser || !activeThreadId || !text.trim()}
                >
                  <Iconify icon="mingcute:send-fill" />
                </IconButton>
              </Stack>
            </Box>
          </Box>
        </Stack>
      </Card>
    </Box>
  );
}
