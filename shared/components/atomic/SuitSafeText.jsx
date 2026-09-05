import React, { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';

import { isSuitGlyphSafe } from '../../utils/suitGlyphCoverage';
import { FALLBACK_FONT_FAMILY } from '../../styles/typo';

const isSuitFontFamily = fontFamily =>
  typeof fontFamily === 'string' && fontFamily.startsWith('SUIT-');

const splitSuitSafeSegments = text => {
  const segments = [];
  let current = '';
  let currentSafe = null;

  for (const char of text) {
    const safe = isSuitGlyphSafe(char);

    if (currentSafe === null || safe === currentSafe) {
      current += char;
      currentSafe = safe;
    } else {
      segments.push({ text: current, safe: currentSafe });
      current = char;
      currentSafe = safe;
    }
  }

  if (current) segments.push({ text: current, safe: currentSafe });

  return segments;
};

/**
 * SUIT 폰트가 지원하지 않는(윤곽선이 비어있는) 완성형 한글을 만나면
 * 그 부분만 FALLBACK_FONT_FAMILY로 대체해서 빈칸 대신 보이게 하는 Text.
 * SUIT가 아닌 폰트(kyobo 등)가 적용된 경우에는 그대로 통과시킨다.
 */
const SuitSafeText = ({ style, children, ...rest }) => {
  const flatStyle = StyleSheet.flatten(style) || {};

  const segments = useMemo(() => {
    if (typeof children !== 'string' || !isSuitFontFamily(flatStyle.fontFamily)) {
      return null;
    }

    return splitSuitSafeSegments(children);
  }, [children, flatStyle.fontFamily]);

  if (!segments) {
    return (
      <Text style={style} {...rest}>
        {children}
      </Text>
    );
  }

  return (
    <Text style={style} {...rest}>
      {segments.map((segment, index) =>
        segment.safe ? (
          segment.text
        ) : (
          <Text key={index} style={styles.fallback}>
            {segment.text}
          </Text>
        ),
      )}
    </Text>
  );
};

const styles = StyleSheet.create({
  // 중첩된 <Text>에서 fontFamily: undefined는 부모의 값을 그대로 물려받아
  // 무시된다(값이 없으면 override가 아니라 상속). 그래서 반드시 실존하는
  // 폰트 이름을 명시해야 부모의 SUIT가 실제로 대체된다.
  fallback: {
    fontFamily: FALLBACK_FONT_FAMILY,
  },
});

export default SuitSafeText;
