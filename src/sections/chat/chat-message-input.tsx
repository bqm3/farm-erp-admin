import { sub } from 'date-fns';
import { useRef, useState, useCallback, useMemo } from 'react';
// @mui
import Stack from '@mui/material/Stack';
import InputBase from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';
// routes
import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
// hooks
import { useMockedUser } from 'src/hooks/use-mocked-user';
// utils
import uuidv4 from 'src/utils/uuidv4';
// api
import { sendMessage, createConversation } from 'src/api/chat';
import { useAuthContext } from 'src/auth/hooks'; // dùng user thật
import { apiSendDm } from 'src/api/firebase';
// components
import Iconify from 'src/components/iconify';
// types
import { IChatParticipant } from 'src/types/chat';

// ----------------------------------------------------------------------

type Props = {
  recipients: IChatParticipant[];
  onAddRecipients: (recipients: IChatParticipant[]) => void;
  //
  disabled: boolean;
  selectedConversationId: string;
};

export default function ChatMessageInput({
  recipients,
  onAddRecipients,
  //
  disabled,
  selectedConversationId,
}: Props) {
  const router = useRouter();

  const { user } = useAuthContext();
   const myUid = useMemo(() => String(user?.id ?? ''), [user?.id]);

  const fileRef = useRef<HTMLInputElement>(null);

  const [message, setMessage] = useState('');

  const myContact = useMemo(
    () => ({
      id: `${user?.id}`,
      role: `${user?.role}`,
      email: `${user?.email}`,
      address: `${user?.address}`,
      name: `${user?.displayName}`,
      lastActivity: new Date(),
      avatarUrl: `${user?.photoURL}`,
      phoneNumber: `${user?.phoneNumber}`,
      status: 'online' as 'online' | 'offline' | 'alway' | 'busy',
    }),
    [user]
  );

   const getToUserIdFromThreadId = useCallback(
    (threadId: string) => {
      // threadId format: farmId_uidA_uidB
      const parts = String(threadId).split('_');
      const a = parts[1];
      const b = parts[2];
      if (!a || !b) return null;
      const other = a === myUid ? b : a;
      const n = Number(other);
      return Number.isFinite(n) ? n : null;
    },
    [myUid]
  );


  const messageData = useMemo(
    () => ({
      id: uuidv4(),
      attachments: [],
      body: message,
      contentType: 'text',
      createdAt: sub(new Date(), { minutes: 1 }),
      senderId: myContact.id,
    }),
    [message, myContact.id]
  );

  const conversationData = useMemo(
    () => ({
      id: uuidv4(),
      messages: [messageData],
      participants: [...recipients, myContact],
      type: recipients.length > 1 ? 'GROUP' : 'ONE_TO_ONE',
      unreadCount: 0,
    }),
    [messageData, myContact, recipients]
  );

  const handleAttach = useCallback(() => {
    if (fileRef.current) {
      fileRef.current.click();
    }
  }, []);

  const handleChangeMessage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(event.target.value);
  }, []);

   const handleSendMessage = useCallback(
    async (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== 'Enter') return;

      const text = message.trim();
      if (!text) return;

      try {
        // đã có thread => send DM
        if (selectedConversationId) {
          const toUserId = getToUserIdFromThreadId(selectedConversationId);
          if (!toUserId) throw new Error('threadId không hợp lệ, không tách được to_user_id');

          await apiSendDm(toUserId, text);
          // Firestore listener sẽ tự update UI
          setMessage('');
          return;
        }

        // chưa có thread => UI của bạn đang start DM ở ChatHeaderCompose rồi
        // ở đây cứ clear message, hoặc bạn có thể disable input khi chưa có selectedConversationId
        setMessage('');
      } catch (error) {
        console.error(error);
      }
    },
    [getToUserIdFromThreadId, message, selectedConversationId]
  );

  return (
    <>
      <InputBase
        value={message}
        onKeyUp={handleSendMessage}
        onChange={handleChangeMessage}
        placeholder="Nhập tin nhắn"
        disabled={disabled}
        startAdornment={
          <IconButton>
            <Iconify icon="eva:smiling-face-fill" />
          </IconButton>
        }
        endAdornment={
          <Stack direction="row" sx={{ flexShrink: 0 }}>
            <IconButton onClick={handleAttach}>
              <Iconify icon="solar:gallery-add-bold" />
            </IconButton>
            <IconButton onClick={handleAttach}>
              <Iconify icon="eva:attach-2-fill" />
            </IconButton>
            <IconButton>
              <Iconify icon="solar:microphone-bold" />
            </IconButton>
          </Stack>
        }
        sx={{
          px: 1,
          height: 56,
          flexShrink: 0,
          borderTop: (theme) => `solid 1px ${theme.palette.divider}`,
        }}
      />

      <input type="file" ref={fileRef} style={{ display: 'none' }} />
    </>
  );
}
