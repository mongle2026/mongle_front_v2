import { StyleSheet, View, Text, Image } from 'react-native';

import LetterBackground from '../../../assets/letter/letter.svg';
import LetterFlap from '../../../assets/letter/letter_flap.svg';
import { colors } from '../../../shared/styles/color';
import { typo } from '../../../shared/styles/typo';
import { gap } from '../../../shared/styles/token';

const CARD_WIDTH = 320;
const CARD_HEIGHT = 232;

// letter_flap.svg 원본 비율(359 x 205) 유지
const FLAP_ASPECT_RATIO = 359 / 205;

/**
 * 편지 봉투 카드.
 * - type="front": letter.svg 배경 위에 letter_flap.svg(봉투 덮개)를 올린 앞면
 * - type="back" : letter.svg 배경 위에 받는이/보내는이 + 우표를 배치한 뒷면
 *
 * @param {'front' | 'back'} [type='front']
 * @param {string} [recipient] 받는 사람 (type="back")
 * @param {string} [sender]    보내는 사람 (type="back")
 * @param {import('react-native').ImageSourcePropType} [stampSource] 우표 이미지 (type="back")
 * @param {import('react-native').StyleProp<import('react-native').ViewStyle>} [style]
 */
function Letter({ type = 'front', recipient = '', sender = '', stampSource, style }) {
  const isBack = type === 'back';

  return (
    <View style={[styles.card, isBack && styles.cardBack, style]}>
      {/* 배경: letter.svg (front / back 공통) */}
      <LetterBackground
        style={StyleSheet.absoluteFill}
        width="100%"
        height="100%"
        preserveAspectRatio="none"
      />

      {isBack ? (
        <View style={styles.section}>
          <View style={styles.container}>
            <Text style={styles.recipient} numberOfLines={1}>
              {recipient}
            </Text>
            <Text style={styles.sender} numberOfLines={1}>
              {sender}
            </Text>
          </View>

          {stampSource ? (
            <Image source={stampSource} style={styles.stamp} resizeMode="cover" />
          ) : (
            <View style={styles.stamp} />
          )}
        </View>
      ) : (
        <LetterFlap
          style={styles.flap}
          width="100%"
          height="100%"
          preserveAspectRatio="none"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    // Figma: padding XXL(20) 세로 / XXXL(24) 가로 — token.js에 해당 토큰이 없어 값 직접 사용
    paddingVertical: 20,
    paddingHorizontal: 24,
    flexDirection: 'column',
    alignItems: 'center',
    aspectRatio: 40 / 29,
  },
  cardBack: {
    justifyContent: 'center',
  },

  // type="front" : 봉투 덮개, 카드 상단에 원본 비율로 고정
  flap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    aspectRatio: FLAP_ASPECT_RATIO,
  },

  // type="back" : container + stamp
  section: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    flex: 1,
    alignSelf: 'stretch',
  },
  container: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: gap.S,
    flex: 1,
  },
  recipient: {
    alignSelf: 'stretch',
    color: colors.fgNeutralSolid,
    ...typo.kyoboTitleSmall,
  },
  sender: {
    alignSelf: 'stretch',
    color: colors.fgNeutralSolid,
    ...typo.kyoboTitleSmall,
  },
  stamp: {
    width: 72,
    height: 104.663,
    backgroundColor: colors.bgDisabled, // url(<path-to-image>) 뒤 lightgray 플레이스홀더
  },
});

export default Letter;