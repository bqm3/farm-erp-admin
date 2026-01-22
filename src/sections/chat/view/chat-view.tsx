/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-nested-ternary */
/* eslint-disable no-return-assign */
/* eslint-disable consistent-return */
import { useEffect, useMemo, useState, useCallback } from 'react';
// @mui
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
// routes
import { paths } from 'src/routes/paths';
import { useRouter, useSearchParams } from 'src/routes/hooks';
// hooks
import { useAuthContext } from 'src/auth/hooks'; // <-- bạn dùng auth thật
// components
import { useSettingsContext } from 'src/components/settings';

// types
import type { IChatParticipant } from 'src/types/chat';

// firebase
import { signInWithCustomToken, getIdTokenResult } from 'firebase/auth';
import { fbAuth } from 'src/firebase/firebaseClient';
import { listenThreads, listenMessages } from 'src/firebase/listeners';
import axiosInstance from 'src/utils/axios';
import { fetchFirebaseToken, apiStartDm, apiSendDm } from 'src/api/firebase';

// ui components (giữ nguyên)
import ChatNav from '../chat-nav';
import ChatRoom from '../chat-room';
import ChatMessageList from '../chat-message-list';
import ChatMessageInput from '../chat-message-input';
import ChatHeaderDetail from '../chat-header-detail';
import ChatHeaderCompose from '../chat-header-compose';
import UserListNav from '../user-list-nav';

// ----------------------------------------------------------------------

type FbInfo = { uid: string; farm_id: number; role: string };

type UiConversation = {
  id: string; // threadId
  participants: IChatParticipant[];
  messages: any[]; // ChatMessageList của bạn dùng shape gì thì map thêm
  lastMessageText?: string;
  updatedAt?: any;
  // bạn có thể thêm unreadCount...
};

type UiContact = IChatParticipant;

// ----------------------------------------------------------------------
async function fetchContacts(): Promise<UiContact[]> {
  const res = await axiosInstance.get('/api/users/all');
  const apiUsers = res.data?.data ?? [];

  const rows = apiUsers.map((u: any) => ({
    id: String(u.id),
    name: u.full_name || u.username,
    username: u.username,
    role: (u.roles || []).find((r: any) => r.code || 'STAFF')?.code || 'STAFF',
    status: u.status || 'ACTIVE',
    avatarUrl: u.avatarUrl || null,
    phone: u.phone || '',
    email: u.email || '',
    address: u.address || '',
  }));

  return rows;
}

// Map Firestore thread -> conversation minimal for ChatNav
function mapThreadToConversation(params: {
  thread: any;
  contactsById: Record<string, UiContact>;
  myUid: string;
}): UiConversation {
  const { thread, contactsById, myUid } = params;

  const members: string[] = thread.members || [];
  const otherId = members.find((m) => m !== myUid) || members[0];

  const other =
    contactsById[otherId] ||
    ({
      id: otherId,
      name: otherId,
      username: otherId,
    } as any);

  return {
    id: thread.id,
    participants: [other],
    messages: [], // messages load riêng bằng listenMessages
    lastMessageText: thread.lastMessage?.text || '',
    updatedAt: thread.updatedAt,
  };
}

function getOtherUserIdFromThreadId(threadId: string, myid: string) {
  // format: 1_1_3 hoặc farmId_uid1_uid2
  const parts = threadId.split('_');
  const ids = parts.filter((p) => p !== String(myid));
  return ids[ids.length - 1]; // user còn lại
}

// ----------------------------------------------------------------------

export default function ChatView() {
  const router = useRouter();
  const settings = useSettingsContext();
  const searchParams = useSearchParams();
  const selectedConversationId = searchParams.get('id') || '';

  const { user } = useAuthContext(); // user thật của bạn
  const myUid = useMemo(() => String(user?.id || ''), [user?.id]);

  const [fbInfo, setFbInfo] = useState<FbInfo | null>(null);
  const [fbReady, setFbReady] = useState(false);

  // contacts
  const [contacts, setContacts] = useState<UiContact[]>([]);
  const contactsById = useMemo(() => {
    const m: Record<string, UiContact> = {};
    contacts.forEach((c) => (m[String(c.id)] = c));
    return m;
  }, [contacts]);

  // compose recipients
  const [recipients, setRecipients] = useState<IChatParticipant[]>([]);

  // conversations (threads)
  const [conversations, setConversations] = useState<UiConversation[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);

  // current conversation messages
  const [conversation, setConversation] = useState<UiConversation | null>(null);
  const [conversationError, setConversationError] = useState<any>(null);

  // ---------------------------
  // 1) Connect Firebase bằng custom token (dựa trên JWT hiện tại của axiosInstance)
  // ---------------------------
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setFbReady(false);
        const info = await fetchFirebaseToken(); // { uid,farm_id,role,firebaseToken }
        const cred = await signInWithCustomToken(fbAuth, info.firebaseToken);
        await getIdTokenResult(cred.user, true);

        if (!mounted) return;
        setFbInfo({ uid: info.uid, farm_id: info.farm_id, role: info.role });
        setFbReady(true);
      } catch (e) {
        if (!mounted) return;
        setConversationError(e);
        setFbReady(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // ---------------------------
  // 2) Load contacts từ API
  // ---------------------------
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const rows = await fetchContacts();
        if (!mounted) return;
        setContacts(rows);
      } catch (e) {
        // ignore / show snackbar if you want
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // ---------------------------
  // 3) Listen threads realtime -> conversations for left nav
  // ---------------------------
  useEffect(() => {
    if (!fbInfo || !fbReady || !myUid) return;

    setConversationsLoading(true);

    const unsub = listenThreads({
      farmId: fbInfo.farm_id,
      uid: fbInfo.uid,
      isAdmin: fbInfo.role === 'ADMIN',
      onData: (rows: any[]) => {
        // rows: [{ id, ...data }]
        const convs = rows.map((t) =>
          mapThreadToConversation({ thread: t, contactsById, myUid: fbInfo.uid })
        );
        setConversations(convs);
        setConversationsLoading(false);
      },
    });

    return () => unsub?.();
  }, [fbInfo, fbReady, myUid, contactsById]);

  // ---------------------------
  // 4) When selectedConversationId changes -> listen messages
  // ---------------------------

  async function fetchUserById(id: string): Promise<UiContact | null> {
    try {
      const res = await axiosInstance.get(`/api/users/${id}`);
      const u = res.data?.data;
      if (!u) return null;

      return {
        id: String(u.id),
        name: u.full_name || u.username,
        full_name: u.full_name,
        role: (u.roles || []).find((r: any) => r.code !== 'ADMIN')?.code || 'STAFF',
        status: u.status || 'ACTIVE',
        avatarUrl: u.avatarUrl || null,
        email: u.email || '',
        address: u.address || '',
        phone: u.phone || '',
        lastActivity: u.lastActivity || null,
      };
    } catch {
      return null;
    }
  }

  useEffect(() => {
    if (!fbInfo || !fbReady || !selectedConversationId) return;

    setConversationError(null);

    let unsub: any;

    (async () => {
      let baseConv = conversations.find((c) => c.id === selectedConversationId);

      // Nếu chưa có trong conversations → resolve user từ threadId
      if (!baseConv) {
        const otherUserId = getOtherUserIdFromThreadId(selectedConversationId, fbInfo.uid);

        let other = contactsById[otherUserId];

        // fallback gọi API nếu chưa có trong contacts
        if (!other) {
          const fetched = await fetchUserById(otherUserId);
          if (fetched) {
            other = fetched;
          }
        }

        baseConv = {
          id: selectedConversationId,
          participants: other ? [other] : [],
          messages: [],
        };
      }

      setConversation(baseConv);

      unsub = listenMessages(selectedConversationId, (rows: any[]) => {
        setConversation((prev) => ({
          ...(prev || baseConv!),
          messages: rows,
        }));
      });
    })();

    return () => unsub?.();
  }, [selectedConversationId, fbInfo, fbReady, conversations, contactsById]);

  useEffect(() => {
    if (!conversation) return;

    const full = conversations.find((c) => c.id === conversation.id);
    if (full && full.participants.length) {
      setConversation((prev) => ({ ...prev!, participants: full.participants }));
    }
  }, [conversations]);

  // ---------------------------
  // 5) Redirect if bad id
  // ---------------------------
  useEffect(() => {
    if (conversationError) {
      router.push(paths.dashboard.chat);
    }
  }, [conversationError, router]);

  // ---------------------------
  // handlers
  // ---------------------------
  const handleAddRecipients = useCallback((selected: IChatParticipant[]) => {
    // chỉ 1-1 => lấy 1 người
    setRecipients(selected.slice(0, 1));
  }, []);

  const getThreadIdByUserId = useCallback(
  (otherUserId: string) => {
    if (!fbInfo?.uid) return null;
    return (
      findExistingDmThreadId(conversations, fbInfo.uid, otherUserId) ||
      null
    );
  },
  [conversations, fbInfo?.uid]
);



  function findExistingDmThreadId(convs: UiConversation[], id: string, otherUid: string) {
    const other = String(otherUid);
    const mine = String(id);

    return convs.find((c) => {
      const parts = c.id.split('_'); // farmId_uid1_uid2
      return parts.includes(mine) && parts.includes(other);
    })?.id;
  }

  const handleClickUser = useCallback(
  async (u: IChatParticipant) => {
    try {
      const otherId = String((u as any).id);

      const existing = getThreadIdByUserId(otherId);
      if (existing) {
        router.push(`${paths.dashboard.chat}?id=${encodeURIComponent(existing)}`);
        return;
      }

      const r = await apiStartDm(Number(otherId));
      router.push(`${paths.dashboard.chat}?id=${encodeURIComponent(r.threadId)}`);
    } catch (e) {
      setConversationError(e);
    }
  },
  [router, getThreadIdByUserId]
);


  const participants: IChatParticipant[] = conversation ? conversation.participants : [];

  const details = !!conversation;

  // ---------------------------
  // render (giữ layout giống bạn)
  // ---------------------------

  const renderHead = (
  <Stack direction="row" alignItems="center" flexShrink={0} sx={{ pr: 1, pl: 2.5, py: 1, minHeight: 72 }}>
    {selectedConversationId ? (
      participants?.length ? (
        <ChatHeaderDetail participants={participants} />
      ) : (
        <Typography variant="body2" color="text.secondary">
          Đang tải hội thoại...
        </Typography>
      )
    ) : (
      <Typography variant="body2" color="text.secondary">
        Chọn một người bên trái để bắt đầu chat
      </Typography>
    )}
  </Stack>
);


 const renderNav = (
  <UserListNav
    contacts={contacts as any}
    myUid={myUid}
    selectedConversationId={selectedConversationId}
    getThreadIdByUserId={getThreadIdByUserId}
    onClickUser={handleClickUser}
  />
);


  const renderMessages = (
    <Stack
      sx={{
        width: 1,
        height: 1,
        overflow: 'hidden',
      }}
    >
      <ChatMessageList
        messages={conversation?.messages ?? []}
        participants={participants}
        contactsById={contactsById}
      />

      <ChatMessageInput
        recipients={recipients}
        onAddRecipients={handleAddRecipients}
        //
        selectedConversationId={selectedConversationId}
        disabled={!selectedConversationId || !fbReady}
        // NOTE: nếu ChatMessageInput của bạn có prop onSendMessage thì dùng, còn không thì bạn sửa component đó gọi handleSendMessage.
        // onSendMessage={handleSendMessage}
      />
    </Stack>
  );

  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'}>
      <Typography variant="h4" sx={{ mb: { xs: 1, md: 3 } }}>
        Nhắn tin
      </Typography>

      <Stack component={Card} direction="row" sx={{ height: '72vh' }}>
        {renderNav}

        <Stack sx={{ width: 1, height: 1, overflow: 'hidden' }}>
          {renderHead}

          <Stack
            direction="row"
            sx={{
              width: 1,
              height: 1,
              overflow: 'hidden',
              borderTop: (theme) => `solid 1px ${theme.palette.divider}`,
            }}
          >
            {renderMessages}

            {details && <ChatRoom conversation={conversation as any} participants={participants} />}
          </Stack>
        </Stack>
      </Stack>

      {!fbReady && (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Đang tải tin nhắn...
          </Typography>
        </Stack>
      )}
    </Container>
  );
}
