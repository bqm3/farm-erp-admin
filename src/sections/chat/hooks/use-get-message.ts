import { IChatParticipant, IChatMessage } from 'src/types/chat';

type Props = {
  message: IChatMessage & { from?: string; senderId?: string };
  currentUserId: string;
  participants: IChatParticipant[];
  contactsById?: Record<string, IChatParticipant>;
};

function firstNameOf(s?: string) {
  const t = (s ?? '').trim();
  return t ? t.split(/\s+/)[0] : 'Unknown';
}

export default function useGetMessage({ message, participants, currentUserId, contactsById }: Props) {
  const senderId = String((message as any).senderId ?? (message as any).from ?? '');
  const me = senderId === String(currentUserId);

  const sender =
    participants.find((p) => String(p.id) === senderId) ||
    (contactsById ? contactsById[senderId] : undefined);

  const senderDetails = me
    ? { type: 'me' as const, firstName: 'You', avatarUrl: '' }
    : {
        type: 'other' as const,
        firstName: firstNameOf(sender?.name ?? sender?.full_name ?? senderId),
        avatarUrl: sender?.avatarUrl ?? '',
      };

  const hasImage = (message as any).contentType === 'image';

  return { hasImage, me, senderDetails };
}
