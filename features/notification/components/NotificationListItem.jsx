import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import ProfileImg from '../../../shared/components/atomic/ProfileImg';
import SuitSafeText from '../../../shared/components/atomic/SuitSafeText';

import { colors } from '../../../shared/styles/color';
import { gap, padding, radius } from '../../../shared/styles/token';
import { typo } from '../../../shared/styles/typo';
import { formatDate, formatRelativeDate } from '../../../shared/utils/dateUtils';
import { getFromSuffix } from '../../../shared/utils/koreanUtils';

export const NOTIFICATION_TYPE = {
  LETTER: 'letter',
  FEED: 'feed',
  NEWS: 'news',
};

export const NOTIFICATION_STATUS = {
  SEND: 'send',
  RECEIVE: 'receive',
  COMMENT: 'comment',
  REPLY: 'reply',
  SYSTEM: 'system',
  EVENT: 'event',
};

// 댓글/답글 내용은 최대 20자까지만 보여준다
const MAX_FEED_CONTENT_LENGTH = 20;

// 이모지가 중간에 잘리지 않게 글자 단위로 자른다
const truncate = (text, maxLength) => {
  const chars = Array.from(String(text ?? ''));
  if (chars.length <= maxLength) return chars.join('');

  return `${chars.slice(0, maxLength).join('')}...`;
};

const toUserCode = userCode =>
  `@${String(userCode ?? '').replace(/^@+/, '')}`;

// 알림 종류별 문구. showLogo면 프로필 대신 앱 로고를 단다.
const NOTIFICATION_CONTENT = {
  [NOTIFICATION_TYPE.LETTER]: {
    // name: 받는 사람 닉네임
    [NOTIFICATION_STATUS.SEND]: ({ name }) => ({
      title: `${name}에게 편지 도착 예정`,
      body: '편지가 내일 도착할 예정입니다.\n편지가 도착하기 전에 전송 여부를 확인해주세요.',
    }),
    // name: 보낸 사람 닉네임. 나에게 보낸 편지면 '닉네임(나)'로 표시하고
    // 조사는 닉네임 받침 기준으로 붙인다. (예: 지훈(나)으로부터)
    [NOTIFICATION_STATUS.RECEIVE]: ({ name, isToSelf }) => ({
      title: `${name}${isToSelf ? '(나)' : ''}${getFromSuffix(name)} 편지 도착`,
      body: '편지함을 확인해 주세요.',
    }),
  },
  [NOTIFICATION_TYPE.FEED]: {
    // name: 댓글/답글 작성자 아이디, content: 댓글/답글 내용
    [NOTIFICATION_STATUS.COMMENT]: ({ name, content }) => ({
      title: `${toUserCode(name)}의 댓글`,
      body: truncate(content, MAX_FEED_CONTENT_LENGTH),
    }),
    [NOTIFICATION_STATUS.REPLY]: ({ name, content }) => ({
      title: `${toUserCode(name)}의 답글`,
      body: truncate(content, MAX_FEED_CONTENT_LENGTH),
    }),
  },
  [NOTIFICATION_TYPE.NEWS]: {
    [NOTIFICATION_STATUS.SYSTEM]: () => ({
      title: '시스템 개선',
      body: '더 편리하게 이용할 수 있도록 개선했습니다.\n새롭게 달라진 기능을 확인해 보세요.',
      showLogo: true,
    }),
    [NOTIFICATION_STATUS.EVENT]: ({ eventTitle }) => ({
      title: '이벤트 알림',
      body: `${eventTitle} 이벤트가 시작됐습니다.\n지금 바로 참여해 보세요.`,
      showLogo: true,
    }),
  },
};

// n분 전 / n시간 전 / 24시간 이상은 yy.mm.dd
const formatNotificationDate = value => formatRelativeDate(value, formatDate);

const NotificationListItem = ({
  type,
  status,
  // letter: 받는/보낸 사람 닉네임, feed: 작성자 아이디
  name,
  profileImageUrl,
  // feed: 댓글/답글 내용
  content,
  // news/event: 이벤트 제목
  eventTitle,
  // letter/receive: 나에게 보낸 편지인지
  isToSelf = false,
  // 알림이 뜬 시각
  createdAt,
  style,
}) => {
  const getContent = NOTIFICATION_CONTENT[type]?.[status];
  if (!getContent) return null;

  const { title, body, showLogo = false } = getContent({
    name,
    content,
    eventTitle,
    isToSelf,
  });

  return (
    <View style={[styles.container, style]}>
      {showLogo ? (
        // TODO: 앱 로고 나오면 교체
        <View style={styles.logo} />
      ) : (
        <ProfileImg imageUri={profileImageUrl} size="S" />
      )}

      <View style={styles.textContainer}>
        <SuitSafeText style={styles.title}>{title}</SuitSafeText>
        <SuitSafeText style={styles.body}>{body}</SuitSafeText>
        <Text style={styles.date}>{formatNotificationDate(createdAt)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: padding.M,
    gap: gap.M,
    backgroundColor: colors.bgLayerDefault,
  },
  logo: {
    width: 24,
    height: 24,
    flexShrink: 0,
    borderRadius: radius.XS,
    backgroundColor: colors.fgNeutralWeak,
  },
  textContainer: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: gap.S,
  },
  title: {
    ...typo.suitTitleSmallStrong,
    alignSelf: 'stretch',
    color: colors.fgNeutralMuted,
  },
  body: {
    ...typo.suitBodyMedium,
    alignSelf: 'stretch',
    color: colors.fgNeutralSubtle,
  },
  date: {
    ...typo.suitLabelMedium,
    color: colors.fgDisabled,
  },
});

export default memo(NotificationListItem);
