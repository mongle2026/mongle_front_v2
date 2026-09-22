// TODO: 알림 API 연결되면 삭제
const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

const ago = ms => new Date(Date.now() - ms).toISOString();

export const MOCK_NOTIFICATIONS = [
  {
    notificationId: 1,
    type: 'feed',
    status: 'comment',
    name: 'mongle_user',
    content: '사진 너무 예뻐요!',
    createdAt: ago(10 * MINUTE_MS),
  },
  {
    notificationId: 2,
    type: 'letter',
    status: 'receive',
    name: '지훈',
    createdAt: ago(3 * HOUR_MS),
  },
  {
    notificationId: 3,
    type: 'letter',
    status: 'receive',
    name: '민수',
    isToSelf: true,
    createdAt: ago(5 * HOUR_MS),
  },
  {
    notificationId: 4,
    type: 'feed',
    status: 'reply',
    name: 'letter_lover',
    content: '저도 그렇게 생각해요.',
    createdAt: ago(DAY_MS),
  },
  {
    notificationId: 5,
    type: 'letter',
    status: 'send',
    name: '하늘',
    createdAt: ago(2 * DAY_MS),
  },
  {
    notificationId: 6,
    type: 'news',
    status: 'event',
    eventTitle: '가을 편지 쓰기',
    createdAt: ago(3 * DAY_MS),
  },
  {
    notificationId: 7,
    type: 'news',
    status: 'system',
    createdAt: ago(5 * DAY_MS),
  },
];
