import { useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import InboxIcon from '../../../assets/icons/ic_inbox.svg';
import SendIcon from '../../../assets/icons/ic_send.svg';
import ProfileImg from '../../../shared/components/atomic/ProfileImg';
import { colors } from '../../../shared/styles/color';
import { gap, padding, radius } from '../../../shared/styles/token';
import { typo } from '../../../shared/styles/typo';
import { formatDate } from '../../../shared/utils/dateUtils';
import { resolveEnvelope } from '../../../shared/utils/envelopeUtils';
import CdCover from './CdCover';
import DotMatrixText from './DotMatrixText';
import Letter from './Letter';

// 두 번째 컨테이너의 편지 봉투. 공유 Letter(320x232)를 카드 폭에 맞춰 축소해서 사용.
const LETTER_WIDTH = 120;
const LETTER_HEIGHT = Math.round((LETTER_WIDTH * 232) / 320); // 원본 비율 유지

// 카드 높이: 디자인 기준 padding 포함 143px. read/unread 모두 동일하게 고정.
const CARD_HEIGHT = 143;
// read 카드의 CD 지름. 디자인은 104px이지만 카드 높이 143에 맞추기 위해 봉투 높이와 동일하게 축소.
const CD_SIZE = LETTER_HEIGHT;

// unread dot 격자. 크기는 모두 같고, 제목/가수 글자 모양에 해당하는 dot만 색을 바꾼다.
// rowPitch = dot 높이 + 줄 사이 여백 → 3줄 높이는 DOT_ROWS * rowPitch 가 된다.
const TITLE_DOT = { dotSize: 3, colGap: 1, rowPitch: 5 }; // 3줄 15px + padding 4px = 19px
const SINGER_DOT = { dotSize: 2, colGap: 2, rowPitch: 4 }; // 3줄 12px + padding 4px = 16px

/**
 * 받은 편지 / 보낸 편지 카드.
 * 백엔드에서 편지 1건에 대한 정보를 letter 객체로 넘겨준다고 가정한다.
 *
 * @param {object}   [letter]
 * @param {string}   [letter.profileImageUri] 상대 프로필 이미지 (받은 편지: 보낸 사람, 보낸 편지: 받는 사람)
 * @param {string}   [letter.nickname]        상대 이름 (받은 편지: 보낸 사람, 보낸 편지: 받는 사람)
 * @param {string|number|Date} [letter.receivedAt] 받은 날짜
 * @param {boolean}  [letter.isSent]          보낸 편지 여부 (보낸 편지는 읽음 여부와 관계없이 점으로 가리지 않음)
 * @param {boolean}  [letter.isRead]          읽음 여부 (type 미지정 시 이 값으로 결정)
 * @param {{ title?: string, singer?: string, artworkUri?: string }} [letter.music] 음악 정보 (artworkUri: 앨범 커버, CD에 사용)
 * @param {{ pattern?: string, color?: string, stamp?: string }} [letter.envelope] 봉투 패턴/색상/우표 id (envelopeData 기준)
 * @param {import('react-native').ImageSourcePropType} [letter.stampSource] 우표 이미지 (envelope.stamp 가 없을 때)
 * @param {'read' | 'unread'} [type] letter.isRead 대신 강제 지정할 때
 * @param {() => void} [onPress]
 * @param {import('react-native').StyleProp<import('react-native').ViewStyle>} [style]
 */
function Card({ letter = {}, type, onPress, style }) {
  const {
    profileImageUri,
    nickname = '',
    receivedAt,
    stampSource,
    isSent,
    isRead,
  } = letter;
  const music = letter.music ?? {};
  const envelope = letter.envelope ?? {};

  const { FrontSvg, FlapSvg, StampSvg } = useMemo(
    () =>
      resolveEnvelope({
        patternId: envelope.pattern,
        colorId: envelope.color,
        stampId: envelope.stamp,
      }),
    [envelope.pattern, envelope.color, envelope.stamp],
  );

  const resolvedType = type ?? (isSent || isRead ? 'read' : 'unread');
  const CaptionIcon = isSent ? SendIcon : InboxIcon;
  const isReadType = resolvedType === 'read';
  const title = music.title ?? '';
  const singer = music.singer ?? '';

  const Container = onPress ? Pressable : View;

  return (
    <Container style={[styles.card, style]} {...(onPress ? { onPress } : null)}>
      {/* 첫 번째 컨테이너 */}
      <View style={styles.firstContainer}>
        {/* profile container */}
        <View style={styles.profileContainer}>
          <ProfileImg imageUri={profileImageUri} size="S" />
          <Text style={styles.nickname} numberOfLines={1}>
            {nickname}
          </Text>
        </View>

        {/* music container */}
        <View style={styles.musicContainer}>
          {/* title */}
          <View style={[styles.title, isReadType && styles.textBoxRead]}>
            {isReadType ? (
              <Text style={styles.titleText} numberOfLines={1}>
                {title}
              </Text>
            ) : (
              <DotMatrixText
                text={title}
                {...TITLE_DOT}
                baseColor={colors.fgNeutralFaint}
                fillColor={colors.fgNeutralWeak}
              />
            )}
          </View>

          {/* singer */}
          <View style={[styles.singer, isReadType && styles.textBoxRead]}>
            {isReadType ? (
              <Text style={styles.singerText} numberOfLines={1}>
                {singer}
              </Text>
            ) : (
              <DotMatrixText
                text={singer}
                {...SINGER_DOT}
                baseColor={colors.fgNeutralFaint}
                fillColor={colors.fgNeutralWeak}
              />
            )}
          </View>
        </View>

        {/* caption container */}
        <View style={styles.captionContainer}>
          <CaptionIcon width={14} height={14} color={colors.fgNeutralWeak} />
          <Text style={styles.caption}>{isSent ? '보낸 편지' : '받은 편지'}</Text>
          <View style={styles.captionDot} />
          <Text style={styles.caption}>{formatDate(receivedAt)}</Text>
        </View>
      </View>

      {/* 두 번째 컨테이너 */}
      <View style={styles.secondContainer}>
        {/* 보낸 편지 / 읽은 편지는 봉투 대신 앨범 커버를 씌운 CD */}
        {isReadType ? (
          <CdCover imageUri={music.artworkUri} size={CD_SIZE} />
        ) : (
          <Letter
            type="front"
            BackgroundSvg={FrontSvg}
            FlapSvg={FlapSvg}
            style={styles.letter}
          />
        )}
        {StampSvg ? (
          <View style={styles.stamp}>
            <StampSvg
              width="100%"
              height="100%"
              preserveAspectRatio="xMidYMid slice"
            />
          </View>
        ) : stampSource ? (
          <Image source={stampSource} style={styles.stamp} resizeMode="cover" />
        ) : (
          <View style={styles.stamp} />
        )}
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  // root: width 375 → 100%, padding L, align center, gap XS, radius M, bg #fff
  card: {
    flexDirection: 'row',
    width: '100%',
    height: CARD_HEIGHT,
    padding: padding.L,
    alignItems: 'center',
    gap: padding.XS,
    borderRadius: radius.M,
    backgroundColor: colors.bgLayerDefault,
  },

  // 첫 번째 container: column, align flex-start, gap XL, flex 1
  // 카드의 alignItems center 영향을 받지 않도록 상단 고정 → profile이 카드 padding 바로 아래에 위치
  firstContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    alignSelf: 'flex-start',
    gap: gap.XL,
    flex: 1,
  },

  // profile container: row, align center, gap M, stretch
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: padding.M,
    alignSelf: 'stretch',
  },
  nickname: {
    flex: 1,
    color: colors.fgNeutralSolid,
    ...typo.suitLabelXLargeStrong,
  },

  // music container: column, align flex-start, gap XS(4), stretch
  musicContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: padding.XS,
    alignSelf: 'stretch',
  },

  // caption container: row, align center, gap M, stretch
  captionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap.M,
    alignSelf: 'stretch',
  },
  caption: {
    color: colors.fgNeutralSubtle,
    ...typo.suitLabelMedium,
  },
  // caption 사이 구분 점: 2x2 원
  captionDot: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.fgNeutralSubtle,
  },

  // title: height 19, 세로 padding XXS, column, justify center, align flex-start, gap XXS, stretch
  title: {
    height: 19,
    paddingVertical: padding.XXS,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: gap.XS,
    alignSelf: 'stretch',
  },
  titleText: {
    color: colors.fgNeutralMuted,
    ...typo.suitLabelLarge,
  },

  // singer: 세로 padding XXS, 높이 고정 없음. 그 외 title과 동일
  singer: {
    paddingVertical: padding.XXS,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    alignSelf: 'stretch',
  },
  singerText: {
    color: colors.fgNeutralSubtle,
    ...typo.suitLabelMedium,
  },
  // read 카드: 텍스트 줄높이가 dot 2행보다 커서, 카드 높이 143을 맞추기 위해 상하 padding 제거
  textBoxRead: {
    paddingVertical: 0,
  },

  // 두 번째 container: 세로 padding 8, column, justify flex-end, align flex-end, stretch
  secondContainer: {
    paddingVertical: padding.M,
    flexDirection: 'column',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    alignSelf: 'stretch',
  },
  letter: {
    width: LETTER_WIDTH,
    height: LETTER_HEIGHT,
  },
  // gap: -48px → RN은 음수 gap 미지원. 우표를 위로 끌어올려 봉투와 겹침.
  stamp: {
    width: 44,
    height: 64,
    marginTop: -48,
    backgroundColor: colors.bgDisabled,
  },
});

export default Card;
