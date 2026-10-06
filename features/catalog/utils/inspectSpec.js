import { StyleSheet } from 'react-native';

import { colors, palette } from '../../../shared/styles/color';
import { gap, padding, radius } from '../../../shared/styles/token';
import { typo } from '../../../shared/styles/typo';

// 카탈로그 "스펙 보기"용. 카드 안에 실제로 렌더된 React 트리(fiber)를 훑어서
// 1) 컴포넌트에 넘어간 props 2) 실제 적용된 스타일 값을 토큰 이름과 함께 뽑는다.
// React 내부 구조(fiber)를 읽으므로 개발 빌드 전용이고, 실패하면 빈 결과를 돌려준다.

// ── 역방향 토큰 맵 ────────────────────────────────────────────
const normalizeColor = value => (typeof value === 'string' ? value.toLowerCase() : null);

const COLOR_TOKENS = (() => {
  const map = new Map();
  const add = (value, name) => {
    const key = normalizeColor(value);
    if (!key) return;
    map.set(key, [...(map.get(key) ?? []), name]);
  };

  Object.entries(colors).forEach(([name, value]) => add(value, name));
  // 시맨틱 토큰이 없는 값은 palette 이름이라도 보여준다
  Object.entries(palette).forEach(([family, steps]) => {
    Object.entries(steps).forEach(([step, value]) => {
      if (!map.has(normalizeColor(value))) add(value, `${family}/${step}`);
    });
  });

  return map;
})();

const scaleTokens = (scale, prefix) => value =>
  Object.entries(scale)
    .filter(([, v]) => v === value)
    .map(([key]) => `${prefix}.${key}`);

const paddingTokens = scaleTokens(padding, 'padding');
const gapTokens = scaleTokens(gap, 'gap');
const radiusTokens = scaleTokens(radius, 'radius');

const findTypoToken = style =>
  Object.entries(typo).find(
    ([, t]) =>
      t.fontFamily === style.fontFamily &&
      t.fontSize === style.fontSize &&
      (style.lineHeight == null || t.lineHeight === style.lineHeight),
  )?.[0];

// 스타일 키 → 어떤 토큰 스케일로 해석할지
const STYLE_KEYS = [
  ['padding', paddingTokens],
  ['paddingHorizontal', paddingTokens],
  ['paddingVertical', paddingTokens],
  ['paddingTop', paddingTokens],
  ['paddingBottom', paddingTokens],
  ['paddingLeft', paddingTokens],
  ['paddingRight', paddingTokens],
  ['margin', paddingTokens],
  ['marginHorizontal', paddingTokens],
  ['marginVertical', paddingTokens],
  ['gap', gapTokens],
  ['rowGap', gapTokens],
  ['columnGap', gapTokens],
  ['borderRadius', radiusTokens],
  ['borderTopLeftRadius', radiusTokens],
  ['borderTopRightRadius', radiusTokens],
  ['borderBottomLeftRadius', radiusTokens],
  ['borderBottomRightRadius', radiusTokens],
  ['borderWidth', null],
  ['borderBottomWidth', null],
  ['borderTopWidth', null],
  ['width', null],
  ['height', null],
  ['opacity', null],
  ['backgroundColor', 'color'],
  ['borderColor', 'color'],
  ['borderBottomColor', 'color'],
  ['borderTopColor', 'color'],
  ['color', 'color'],
];

// 같은 hex 를 여러 토큰이 쓰므로(fillNeutral = fgNeutralPrimary 등), 속성 종류에 맞는 접두어를 먼저 고른다
const COLOR_PREFIXES_BY_KEY = {
  color: ['fg'],
  backgroundColor: ['bg', 'fill'],
  borderColor: ['stroke'],
  borderBottomColor: ['stroke'],
  borderTopColor: ['stroke'],
};

const describeColorValue = (value, styleKey) => {
  const tokens = COLOR_TOKENS.get(normalizeColor(value));
  if (!tokens) return null;

  const prefixes = COLOR_PREFIXES_BY_KEY[styleKey];
  const preferred = prefixes
    ? tokens.filter(token => prefixes.some(prefix => token.startsWith(prefix)))
    : [];

  return (preferred.length > 0 ? preferred : tokens).join(' / ');
};

// ── fiber 유틸 ───────────────────────────────────────────────
const getTypeName = type => {
  if (!type) return null;
  if (typeof type === 'string') return type;
  if (typeof type === 'function') return type.displayName || type.name || null;
  if (type.displayName) return type.displayName;
  if (type.render) return type.render.displayName || type.render.name || null; // forwardRef
  if (type.type) return getTypeName(type.type); // memo
  return null;
};

// 라이브러리 내부 래퍼 이름은 건너뛴다
const IGNORED_NAME =
  /^(View|Text|Image|ScrollView|Pressable|TouchableOpacity|Fragment|Unknown|Wrap|Wrapper|Context|Provider|Consumer|Svg|G|Path|Defs|ClipPath|Rect|Circle|Shape|LayoutAnimationConfig|.*Animated.*|.*Gesture.*|.*Handler.*|RN.*|RCT.*|Native.*|Virtualized.*|ScrollViewBase|_.*)$/;

const isUserComponent = name =>
  !!name && /^[A-Z]/.test(name) && !IGNORED_NAME.test(name);

const HOST_LABEL = {
  RCTView: 'View',
  RNGestureHandlerButton: 'View', // gesture-handler Pressable 의 바탕 뷰
  RCTText: 'Text',
  RCTVirtualText: 'Text',
  RCTImageView: 'Image',
  RCTScrollView: 'ScrollView',
  RCTScrollContentView: 'ScrollContent',
  RCTSinglelineTextInputView: 'TextInput',
  RCTMultilineTextInputView: 'TextInput',
};

// ref 로 받은 host 인스턴스가 들고 있는 fiber 가 지난 렌더 것일 수 있어서, 현재 트리 쪽을 고른다
const getCurrentFiber = fiber => {
  let root = fiber;
  while (root.return) root = root.return;
  return root.stateNode?.current === root ? fiber : fiber.alternate ?? fiber;
};

export const getFiberFromRef = instance => {
  const fiber = instance?.__internalInstanceHandle;
  return fiber ? getCurrentFiber(fiber) : null;
};

// host fiber → 네이티브 뷰 tag (터치 이벤트의 target 과 맞춰보기 위해)
const getNativeTag = fiber =>
  fiber.stateNode?.canonical?.nativeTag ??
  fiber.stateNode?.canonical?.publicInstance?.__nativeTag ??
  fiber.stateNode?._nativeTag ??
  null;

const forEachChild = (fiber, callback) => {
  let child = fiber.child;
  while (child) {
    callback(child);
    child = child.sibling;
  }
};

// ── props 포맷 ───────────────────────────────────────────────
const truncate = (text, max = 48) => (text.length > max ? `${text.slice(0, max)}…` : text);

// prop 이름으로 색 토큰 종류를 짐작한다 (backgroundColor → bg/fill, 그 밖의 *color → fg)
const colorKeyForProp = propName => {
  if (/background/i.test(propName)) return 'backgroundColor';
  if (/border/i.test(propName)) return 'borderColor';
  if (/color/i.test(propName)) return 'color';
  return null;
};

const formatValue = (value, propName = '') => {
  if (value === null) return 'null';
  if (typeof value === 'string') {
    const token = describeColorValue(value, colorKeyForProp(propName));
    return token ? `"${value}" (${token})` : `"${truncate(value)}"`;
  }
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'function') {
    const name = getTypeName(value);
    return name && /^[A-Z]/.test(name) ? `<${name}>` : 'ƒ()';
  }
  if (Array.isArray(value)) {
    try {
      return truncate(JSON.stringify(value));
    } catch {
      return `[${value.length}]`;
    }
  }
  if (typeof value === 'object') {
    if (value.$$typeof) return `<${getTypeName(value.type) ?? 'element'} />`;
    if (value.uri) return `{ uri: "${truncate(value.uri, 32)}" }`;
    try {
      return truncate(JSON.stringify(value));
    } catch {
      return '{…}';
    }
  }
  return String(value);
};

const SKIPPED_PROPS = new Set(['key', 'ref']);

const collectProps = memoizedProps =>
  Object.entries(memoizedProps ?? {})
    .filter(([key, value]) => {
      if (SKIPPED_PROPS.has(key) || value === undefined) return false;
      if (key === 'children') return typeof value === 'string' || typeof value === 'number';
      return true;
    })
    .map(([key, value]) => ({
      key,
      value: formatValue(value, key),
      // 색 미리보기 칩에 쓸 원래 값
      swatch: typeof value === 'string' && /^#|^rgba?\(/i.test(value) ? value : null,
    }));

// ── 스타일 포맷 ───────────────────────────────────────────────
const collectStyleRows = style => {
  const rows = [];

  const typoToken = style.fontFamily ? findTypoToken(style) : null;
  if (style.fontFamily) {
    rows.push({
      key: 'font',
      value: `${style.fontFamily} ${style.fontSize ?? ''}/${style.lineHeight ?? ''}`,
      token: typoToken ? `typo.${typoToken}` : null,
    });
  }

  STYLE_KEYS.forEach(([key, resolver]) => {
    const value = style[key];
    if (value === undefined || value === null) return;
    if (typeof value === 'object') return; // Animated 값 등은 건너뛴다

    let token = null;
    if (resolver === 'color') token = describeColorValue(value, key);
    else if (typeof resolver === 'function' && typeof value === 'number') {
      token = resolver(value).join(' / ') || null;
    }

    rows.push({ key, value: String(value), token, swatch: resolver === 'color' ? String(value) : null });
  });

  return rows;
};

const getTextContent = props => {
  const { children } = props ?? {};
  if (typeof children === 'string' || typeof children === 'number') return String(children);
  if (Array.isArray(children)) {
    const text = children.filter(c => typeof c === 'string' || typeof c === 'number').join('');
    return text || null;
  }
  return null;
};

const MAX_INSTANCES = 40;

// 인스턴스 제목 옆에 태그로 보여줄 "모양을 정하는" props
const SUMMARY_PROP_KEYS = ['variant', 'type', 'size', 'font', 'ratio', 'dateFormat'];

const summarizeProps = memoizedProps =>
  SUMMARY_PROP_KEYS.filter(key => {
    const value = memoizedProps?.[key];
    return typeof value === 'string' || typeof value === 'number';
  }).map(key => ({ key, value: String(memoizedProps[key]) }));

// ── 메인 ─────────────────────────────────────────────────────
// rootFiber: 카드 콘텐츠 View 의 fiber. 그 아래 자식들만 본다.
// 카드에 놓인 컴포넌트(버튼 하나 등)마다 { props, 그 안의 스타일 노드들 } 을 한 묶음으로 만든다.
// 카드 레이아웃용 View 처럼 어떤 컴포넌트에도 속하지 않은 노드는 빼고 보여준다.
export const inspectSpec = rootFiber => {
  const instances = [];

  // instance: 지금 지나고 있는 최상위 컴포넌트 묶음. owners: 그 안에서 지나온 하위 컴포넌트 이름들
  const visit = (fiber, instance, owners) => {
    const name = getTypeName(fiber.type);
    const isHost = typeof fiber.type === 'string';
    let nextInstance = instance;
    let nextOwners = owners;

    if (!isHost && isUserComponent(name)) {
      if (!instance) {
        if (instances.length >= MAX_INSTANCES) return;

        nextInstance = {
          name,
          summary: summarizeProps(fiber.memoizedProps),
          title: getTextContent(fiber.memoizedProps),
          props: collectProps(fiber.memoizedProps),
          nodes: [],
          tags: [],
          seen: new Set(),
        };
        instances.push(nextInstance);
      } else if (name !== instance.name && name !== owners[owners.length - 1]) {
        nextOwners = [...owners, name];
      }
    }

    if (isHost && instance) {
      const tag = getNativeTag(fiber);
      if (tag != null) instance.tags.push(tag);

      const style = StyleSheet.flatten(fiber.memoizedProps?.style) ?? {};
      const rows = collectStyleRows(style);

      if (rows.length > 0) {
        const text = getTextContent(fiber.memoizedProps);
        const hostLabel = HOST_LABEL[fiber.type] ?? fiber.type;
        const label = [...owners.slice(-2), hostLabel].join(' › ');

        // 버튼 제목이 children 으로 안 들어온 경우 안쪽 Text 내용으로 채운다
        if (!instance.title && text) instance.title = text;

        // 같은 모양의 노드(우표 여러 장 등)는 한 번만 보여준다
        const signature = `${label}|${rows.map(r => `${r.key}=${r.value}`).join(',')}`;
        if (!instance.seen.has(signature)) {
          instance.seen.add(signature);
          instance.nodes.push({ label, text, rows });
        }
      }
    }

    forEachChild(fiber, child => visit(child, nextInstance, nextOwners));
  };

  try {
    forEachChild(rootFiber, child => visit(child, null, []));
  } catch (error) {
    return { instances: [], error: String(error?.message ?? error) };
  }

  return {
    instances: instances.map(({ seen, ...instance }) => instance),
    truncated: instances.length >= MAX_INSTANCES,
  };
};

// 터치 이벤트 → 눌린 네이티브 뷰의 tag
export const getTouchTargetTag = event => {
  const target = event?.nativeEvent?.target ?? event?.target;
  if (typeof target === 'number') return target;
  return target?.__nativeTag ?? null;
};
