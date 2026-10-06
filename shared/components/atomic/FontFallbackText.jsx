import React, { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';

import { needsKyoboHanFallback } from '../../utils/kyoboGlyphCoverage';
import { HAN_FALLBACK_FONT_FAMILY, KYOBO_FONT_FAMILY } from '../../styles/typo';

const styles = StyleSheet.create({
  // 중첩된 <Text>에서 fontFamily: undefined는 부모의 값을 그대로 물려받아
  // 무시된다(값이 없으면 override가 아니라 상속). 그래서 반드시 실존하는
  // 폰트 이름을 명시해야 부모의 폰트가 실제로 대체된다.
  kyoboHanFallback: {
    fontFamily: HAN_FALLBACK_FONT_FAMILY,
  },
});

// 부모 폰트별로 "어떤 글자를 어떤 폰트로 대체할지" 규칙.
// SUITX는 현대 한글 11,172자를 모두 그리므로 규칙이 없다(fontTools로 검증).
const FALLBACK_RULES = [
  {
    // Kyobo: 폰트에 없는 한자 → Kiwi Maru Light
    // 한자가 Kyobo 글자보다 커 보여서 부모 fontSize보다 2 작게 그린다.
    matches: fontFamily => fontFamily === KYOBO_FONT_FAMILY,
    needsFallback: needsKyoboHanFallback,
    style: styles.kyoboHanFallback,
    fontSizeOffset: -2,
  },
];

// 규칙의 기본 스타일에 fontSizeOffset을 반영한다. 부모 fontSize가 없으면 크기는 그대로 상속.
const getFallbackStyle = (rule, parentFontSize) => {
  if (!rule.fontSizeOffset || typeof parentFontSize !== 'number') {
    return rule.style;
  }

  return [rule.style, { fontSize: parentFontSize + rule.fontSizeOffset }];
};

const findFallbackRule = fontFamily =>
  typeof fontFamily === 'string'
    ? FALLBACK_RULES.find(rule => rule.matches(fontFamily))
    : undefined;

// `{a}{b}`처럼 문자열/숫자로만 이루어진 children은 하나의 문자열로 합친다.
// 엘리먼트가 섞여 있으면 글자 단위로 나눌 수 없으니 null.
const toPlainText = children => {
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);

  if (Array.isArray(children)) {
    const parts = children.filter(child => child !== null && child !== undefined && child !== false);
    const isPlain = parts.every(child => typeof child === 'string' || typeof child === 'number');

    return isPlain ? parts.join('') : null;
  }

  return null;
};

const splitFallbackSegments = (text, needsFallback) => {
  const segments = [];
  let current = '';
  let currentFallback = null;

  for (const char of text) {
    const fallback = needsFallback(char);

    if (currentFallback === null || fallback === currentFallback) {
      current += char;
      currentFallback = fallback;
    } else {
      segments.push({ text: current, fallback: currentFallback });
      current = char;
      currentFallback = fallback;
    }
  }

  if (current) segments.push({ text: current, fallback: currentFallback });

  return segments;
};

/**
 * 적용된 폰트에 없는 글자를 만나면 그 부분만 대체 폰트로 감싸서
 * 빈칸(또는 어울리지 않는 시스템 폰트) 대신 보이게 하는 Text.
 * - Kyobo: 한자 → HAN_FALLBACK_FONT_FAMILY (fontSize -2)
 * 규칙이 없는 폰트가 적용됐거나 대체할 글자가 없으면 그대로 통과시킨다.
 */
const FontFallbackText = ({ style, children, ...rest }) => {
  const flatStyle = StyleSheet.flatten(style) || {};
  const rule = findFallbackRule(flatStyle.fontFamily);
  const text = toPlainText(children);

  const segments = useMemo(() => {
    if (text === null || !rule) {
      return null;
    }

    const result = splitFallbackSegments(text, rule.needsFallback);

    return result.some(segment => segment.fallback) ? result : null;
  }, [text, rule]);

  const fallbackStyle = useMemo(
    () => (rule ? getFallbackStyle(rule, flatStyle.fontSize) : null),
    [rule, flatStyle.fontSize],
  );

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
        segment.fallback ? (
          <Text key={index} style={fallbackStyle}>
            {segment.text}
          </Text>
        ) : (
          segment.text
        ),
      )}
    </Text>
  );
};

export default FontFallbackText;
