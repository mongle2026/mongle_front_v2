import { useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import InboxIcon from '../../../assets/icons/ic_inbox.svg';
import DotIcon from '../../../assets/letter/dot.svg';
import ProfileImg from '../../../shared/components/atomic/ProfileImg';
import { colors } from '../../../shared/styles/color';
import { gap, padding, radius } from '../../../shared/styles/token';
import { typo } from '../../../shared/styles/typo';
import Letter from './Letter';

// 두 번째 컨테이너의 편지 봉투. 공유 Letter(320x232)를 카드 폭에 맞춰 축소해서 사용.
const LETTER_WIDTH = 120;
const LETTER_HEIGHT = Math.round((LETTER_WIDTH * 232) / 320); // 원본 비율 유지

// unread dot: 글자 수만큼 생성. 첫 dot → 마지막 dot(1px)까지 선형으로 축소.
const DOT_FIRST_SIZE = 4; // title 첫 dot
const DOT_LAST_SIZE = 1;
const SINGER_FIRST_DOT_SIZE = 3; // singer는 첫 dot만 3px, 나머지는 title과 동일

/**
 * 글자 수만큼 dot 크기 배열을 만든다.
 * - index 0 : firstSize (title=4, singer=3)
 * - 그 외   : 4px → 1px 선형 보간 (11개면 4, 3.7, 3.4 … 1)
 */
function getDotSizes(text, firstSize) {
  const count = Array.from(text ?? '').length;
  if (count <= 0) return [];
  if (count === 1) return [firstSize];

  return Array.from({ length: count }, (_, index) => {
    if (index === 0) return firstSize;
    return (
      DOT_FIRST_SIZE + (DOT_LAST_SIZE - DOT_FIRST_SIZE) * (index / (count - 1))
    );
  });
}

// 백엔드 값(Date | ISO 문자열 | timestamp) → "yy.mm.dd"
function formatDate(value) {
  if (value == null || value === '') return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return typeof value === 'string' ? value : '';
  }
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yy}.${mm}.${dd}`;
}

// dot 한 행. 글자마다 위/아래 2행을 이루며, 행 내부는 caption 컨테이너와 동일한 규칙.
function DotLine({ sizes, color }) {
  return (
    <View style={styles.dotRow}>
      {sizes.map((size, index) => (
        <View
          key={index}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
          }}
        />
      ))}
    </View>
  );
}

function DottedText({ text, firstDotSize, color }) {
  const sizes = useMemo(
    () => getDotSizes(text, firstDotSize),
    [text, firstDotSize],
  );

  return (
    <>
      <DotLine sizes={sizes} color={color} />
      <DotLine sizes={sizes} color={color} />
    </>
  );
}

/**
 * 받은 편지 카드.
 * 백엔드에서 편지 1건에 대한 정보를 letter 객체로 넘겨준다고 가정한다.
 *
 * @param {object}   [letter]
 * @param {string}   [letter.profileImageUri] 보낸 사람 프로필 이미지
 * @param {string}   [letter.nickname]        보낸 사람 이름
 * @param {string|number|Date} [letter.receivedAt] 받은 날짜
 * @param {boolean}  [letter.isRead]          읽음 여부 (type 미지정 시 이 값으로 결정)
 * @param {{ title?: string, singer?: string }} [letter.music] 음악 정보
 * @param {import('react-native').ImageSourcePropType} [letter.stampSource] 우표 이미지
 * @param {'read' | 'unread'} [type] letter.isRead 대신 강제 지정할 때
 * @param {() => void} [onPress]
 * @param {import('react-native').StyleProp<import('react-native').ViewStyle>} [style]
 */
function Card({ letter = {}, type, onPress, style }) {
  const { profileImageUri, nickname = '', receivedAt, stampSource, isRead } =
    letter;
  const music = letter.music ?? {};

  const resolvedType = type ?? (isRead ? 'read' : 'unread');
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
          {/* caption container */}
          <View style={styles.captionContainer}>
            <InboxIcon width={14} height={14} color={colors.fgNeutralWeak} />
            <Text style={styles.caption}>받은 편지</Text>
            {/* dot.svg (2x2, fill fgNeutralSubtle #72757B) — 원본 그대로 사용 */}
            <DotIcon width={2} height={2} />
            <Text style={styles.caption}>{formatDate(receivedAt)}</Text>
          </View>

          {/* title */}
          <View style={styles.title}>
            {isReadType ? (
              <Text style={styles.titleText} numberOfLines={1}>
                {title}
              </Text>
            ) : (
              <DottedText
                text={title}
                firstDotSize={DOT_FIRST_SIZE}
                color={colors.fgNeutralSubtle}
              />
            )}
          </View>

          {/* singer */}
          <View style={styles.singer}>
            {isReadType ? (
              <Text style={styles.singerText} numberOfLines={1}>
                {singer}
              </Text>
            ) : (
              <DottedText
                text={singer}
                firstDotSize={SINGER_FIRST_DOT_SIZE}
                color={colors.fgNeutralWeak}
              />
            )}
          </View>
        </View>
      </View>

      {/* 두 번째 컨테이너 */}
      <View style={styles.secondContainer}>
        <Letter type="front" style={styles.letter} />
        {stampSource ? (
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
    padding: padding.L,
    alignItems: 'center',
    gap: padding.XS,
    borderRadius: radius.M,
    backgroundColor: colors.bgLayerDefault,
  },

  // 첫 번째 container: column, align flex-start, gap XL, flex 1
  firstContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
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

  // title: 세로 padding XS, column, justify center, align flex-start, gap S, stretch
  title: {
    paddingVertical: padding.XS,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: gap.S,
    alignSelf: 'stretch',
  },
  titleText: {
    color: colors.fgNeutralMuted,
    ...typo.suitLabelLarge,
  },

  // singer: 세로 padding XXS, 그 외 title과 동일
  singer: {
    paddingVertical: padding.XXS,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: gap.S,
    alignSelf: 'stretch',
  },
  singerText: {
    color: colors.fgNeutralSubtle,
    ...typo.suitLabelMedium,
  },

  // unread dot 한 행: caption 컨테이너와 동일 (row + align center + gap S + stretch)
  dotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap.S,
    alignSelf: 'stretch',
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
