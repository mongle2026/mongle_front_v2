import { resolveMediaUri } from '../../../shared/utils/media';

// 백엔드 편지함 아이템 → Card 의 letter prop 형태
export function normalizeLetterboxItem(item) {
  if (!item?.letterId) return null;

  const isSender = Boolean(item.isSender);
  const isReceiver = Boolean(item.isReceiver);

  // 나에게 쓴 편지는 받은 편지로 취급한다
  const isSent = isSender && !isReceiver;

  // 보낸 편지는 받는 사람, 받은 편지는 보낸 사람을 보여준다
  const counterpart = isSent ? item.receiver : item.sender;

  return {
    letterId: Number(item.letterId),
    profileImageUri: resolveMediaUri(counterpart?.profileImageUrl),
    nickname: counterpart?.nickname ?? '',
    // 편지 뒷면(Letter type="back")에 쓰는 받는 사람/보낸 사람 이름
    recipientName: item.receiver?.nickname ?? '',
    senderName: item.sender?.nickname ?? '',
    receivedAt: item.deliveryAt,
    createdAt: item.createdAt,
    isRead: Boolean(item.isRead),
    isSent,
    isSender,
    isReceiver,
    envelope: item.envelope ?? null,
    music: {
      title: item.music?.musicTitle ?? '',
      singer: item.music?.musicArtist ?? '',
      artworkUri: resolveMediaUri(item.music?.musicArtwork),
    },
  };
}
