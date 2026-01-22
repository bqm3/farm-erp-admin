import React, { useMemo } from 'react';
import {
  Box,
  List,
  ListItemButton,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Typography,
  TextField,
  Stack,
} from '@mui/material';
import type { IChatParticipant } from 'src/types/chat';

type Props = {
  contacts: IChatParticipant[];
  myUid: string;
  selectedConversationId: string;
  getThreadIdByUserId?: (otherUserId: string) => string | null;
  onClickUser: (user: IChatParticipant) => void;
};

export default function UserListNav({
  contacts,
  myUid,
  selectedConversationId,
  getThreadIdByUserId,
  onClickUser,
}: Props) {
  const [q, setQ] = React.useState('');

  const rows = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return (contacts || [])
      .filter((u: any) => String(u.id) !== String(myUid)) // ✅ loại bản thân
      .filter((u: any) => {
        if (!kw) return true;
        const name = (u.name || u.full_name || '').toLowerCase();
        const username = (u.username || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        return name.includes(kw) || username.includes(kw) || email.includes(kw);
      });
  }, [contacts, myUid, q]);

  return (
    <Box
      sx={{
        width: 320,
        height: 1,
        borderRight: (theme) => `solid 1px ${theme.palette.divider}`,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Stack sx={{ p: 2, pb: 1 }}>
        <Typography variant="subtitle1">Danh sách người dùng</Typography>
        <TextField
          size="small"
          placeholder="Tìm kiếm..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </Stack>

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <List disablePadding>
          {rows.map((u: any) => {
            const threadId = getThreadIdByUserId?.(String(u.id)) || '';
            const isActive = !!threadId && threadId === selectedConversationId;

            return (
              <ListItemButton
                key={String(u.id)}
                selected={isActive}
                onClick={() => onClickUser(u)}
                sx={{ px: 2, py: 1.25 }}
              >
                <ListItemAvatar>
                  <Avatar src={u.avatarUrl || undefined}>{(u.name || '?')[0]}</Avatar>
                </ListItemAvatar>

                <ListItemText
                  primary={u.name || u.full_name || u.username || u.id}
                  secondary={u.role || u.username || u.email || ''}
                  primaryTypographyProps={{ noWrap: true }}
                  secondaryTypographyProps={{ noWrap: true }}
                />
              </ListItemButton>
            );
          })}
        </List>
      </Box>
    </Box>
  );
}
