import React, { memo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import ProfileImg from '../../../shared/components/atomic/ProfileImg';
import FontFallbackText from '../../../shared/components/atomic/FontFallbackText';

import { colors } from '../../../shared/styles/color';
import { gap, padding, radius } from '../../../shared/styles/token';
import { typo } from '../../../shared/styles/typo';
import { formatDate, formatRelativeDate } from '../../../shared/utils/dateUtils';
import { getFromSuffix } from '../../../shared/utils/koreanUtils';
import { NOTIFICATION_STATUS, NOTIFICATION_TYPE } from '../constants';


const APP_LOGO_IMAGE = require('../../../assets/logo/icon.png');

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
    // name: 나를 팔로우한 사람 아이디, myNickname: 내 닉네임
    [NOTIFICATION_STATUS.FOLLOW]: ({ name, myNickname }) => ({
      title: `${toUserCode(name)}님의 새로운 팔로우`,
      body: `${toUserCode(name)}님이 ${myNickname ?? ''}님을 팔로우하기 시작했습니다.`,
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
  [NOTIFICATION_TYPE.SUMMARY]: {
    // summaryCount: 야간 알림을 끈 사람에게 밤사이 쌓인 알림 개수
    [NOTIFICATION_STATUS.NIGHT_SUMMARY]: ({ summaryCount }) => ({
      title: `${summaryCount}개 알림`,
      body: `지난 밤 동안 알림이 ${summaryCount}개 왔습니다.`,
      showLogo: true,
    }),
  },
};

// n분 전 / n시간 전 / 24시간 이상은 yy.mm.dd
const formatNotificationDate = value => formatRelativeDate(value, formatDate);

const NotificationListItem = ({
  type,
  status,
  // letter: 받는/보낸 사람 닉네임, feed: 작성자/팔로우한 사람 아이디
  name,
  // feed/follow: 본문에 들어가는 내 닉네임
  myNickname,
  profileImageUrl,
  // feed: 댓글/답글 내용
  content,
  // news/event: 이벤트 제목
  eventTitle,
  // letter/receive: 나에게 보낸 편지인지
  isToSelf = false,
  // summary/night_summary: 묶인 알림 개수
  summaryCount,
  // 알림이 뜬 시각
  createdAt,
  onPress,
  style,
}) => {
  const getContent = NOTIFICATION_CONTENT[type]?.[status];
  if (!getContent) return null;

  const { title, body, showLogo = false } = getContent({
    name,
    content,
    eventTitle,
    isToSelf,
    myNickname,
    summaryCount,
  });

  return (
    <Pressable style={[styles.container, style]} onPress={onPress} disabled={!onPress}>
      {showLogo ? (
        <Image source={APP_LOGO_IMAGE} style={styles.logo} />
      ) : (
        <ProfileImg imageUri={profileImageUrl} size="S" />
      )}

      <View style={styles.textContainer}>
        <FontFallbackText style={styles.title}>{title}</FontFallbackText>
        {body ? <FontFallbackText style={styles.body}>{body}</FontFallbackText> : null}
        <Text style={styles.date}>{formatNotificationDate(createdAt)}</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: padding.M,
    gap: gap.M,
    backgroundColor: colors.bgSurface,
  },
  logo: {
    width: 24,
    height: 24,
    flexShrink: 0,
    borderRadius: radius.XS,
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
    color: colors.fgNeutralSecondary,
  },
  body: {
    ...typo.suitBodyMedium,
    alignSelf: 'stretch',
    color: colors.fgNeutralTertiary,
  },
  date: {
    ...typo.suitLabelMedium,
    color: colors.fgDisabled,
  },
});

export default memo(NotificationListItem);
