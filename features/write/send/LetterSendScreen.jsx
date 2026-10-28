import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { GestureDetector } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurMask, Canvas, Oval } from '@shopify/react-native-skia';

import IcArrowUp from '../../../assets/icons/ic_arrowup.svg';
import IlLetterSuccess from '../../../assets/illustrations/il_letter_success.svg';
import IcFilledAlert from '../../../assets/icons/ic_filledalert.svg';

import { Button, BUTTON_SIZE, BUTTON_VARIANT } from '../../../shared/components/action/Button';

import { colors, palette } from '../../../shared/styles/color';
import { gap, padding } from '../../../shared/styles/token';
import { typo } from '../../../shared/styles/typo';
import { formatDate } from '../../../shared/utils/dateUtils';

import useCurrentUser from '../../../shared/hooks/useCurrentUser';
import { getApiErrorDetail } from '../../../shared/api/client';
import { fetchCursorPage } from '../../../shared/api/cursorPage';
import { resolveEnvelope } from '../../../shared/utils/envelopeUtils';
import { resolveMediaUri } from '../../../shared/utils/media';

import { useLetterFormStore } from '../store/useLetterFormStore';
import { useRecordFormStore } from '../store/useRecordFormStore';
import useCreateLetter from '../envelope/hooks/useCreateLetter';
import { deliveryAtToDate } from '../date/utils/deliveryDate';

import { BODY_ASPECT_RATIO } from './data/sendEnvelopeData';
import SendEnvelope from './components/SendEnvelope';
import SendContentCard from './components/SendContentCard';
import useLetterSendAnimation from './hooks/useLetterSendAnimation';

const ENVELOPE_WIDTH_RATIO = 0.72;
const ENVELOPE_MAX_WIDTH = 320;

// 화면 높이 대비 봉투 중심 위치: 담을 때 / 떠 있을 때
const PACK_CENTER_RATIO = 0.68;
const FLOAT_CENTER_RATIO = 0.48;

// 내용물은 봉투 폭에 가까운 정사각형으로 세로 한 줄로 쌓는다
const CARD_SIZE_RATIO = 0.92;
const CARD_GAP = 6;

// 봉투에 담긴 장은 입구 위로 카드 크기의 이 비율만큼 나와 있다
const CARD_PEEK_RATIO = 0.45;
// 먼저 담긴 장일수록 이만큼씩 더 깊이 들어가 포개진 모서리가 보인다
const CARD_STACK_STEP = 10;
// 다 담긴 뒤 맨 위 장의 윗변이 봉투 높이의 이 비율까지 가라앉는다
const CARD_SINK_TOP_RATIO = 0.12;

const SHADOW_HEIGHT = 44;
const SHADOW_BLUR = 10;

const WRITE_FLOW_FIRST_ROUTE = 'Record';

// 전송 실패 아이콘: 연한 빨간 원 안에 빨간 느낌표
const FAILED_ICON_CIRCLE_SIZE = 72;
const FAILED_ICON_SIZE = 40;

const resetWriteForms = () => {
  useRecordFormStore.getState().resetRecordForm();
  useLetterFormStore.getState().resetLetterForm();
};

/*
 * 편지 저장 응답에서 새 편지 id.
 * 응답의 맨 위 id 는 기록(record) id 일 수 있어 쓰지 않고, 편지 id 로 확실한 값만 읽는다
 */
const resolveSentLetterId = data => {
  const letterId = data?.letterId ?? data?.letter?.id ?? data?.letter?.letterId;
  if (letterId == null && __DEV__) {
    console.warn('편지 저장 응답에서 letterId 를 찾지 못해 보낸 편지함에서 찾습니다.', data);
  }
  return letterId ?? null;
};

/* 저장 응답에 편지 id 가 없을 때, 편지함(나에게 쓴 편지 / 보낸 편지)의 가장 최근 편지를 방금 보낸 편지로 본다 */
const fetchLatestSentLetterId = async isToMe => {
  try {
    const page = await fetchCursorPage('/letter', {
      params: { tab: isToMe ? 'SELF' : 'SENT', limit: 1 },
    });
    return page.items[0]?.letterId ?? null;
  } catch (error) {
    console.warn('보낸 편지를 찾지 못했습니다.', getApiErrorDetail(error));
    return null;
  }
};

/* 전송 버튼을 누른 순간의 작성값. 전송이 성공하면 store 가 초기화되므로 처음 한 번만 읽어 둔다 */
const readSendSnapshot = currentUser => {
  const letterForm = useLetterFormStore.getState();
  const recordForm = useRecordFormStore.getState();

  const envelope = resolveEnvelope({
    patternId: letterForm.patternId,
    colorId: letterForm.colorId,
    stampId: letterForm.stampId,
  });

  const photos = recordForm.files
    .filter(file => file?.uri && (!file.type || file.type.startsWith('image')))
    .map((file, index) => ({ key: `photo-${index}`, kind: 'photo', uri: file.uri }));

  const musicArtworkUri = resolveMediaUri(recordForm.music?.musicArtwork);

  return {
    colorId: envelope.color?.id ?? null,
    color: envelope.color?.color ?? palette.neutral[300],
    FlapSvg: envelope.FlapSvg,
    deliveryAt: letterForm.deliveryAt,
    receiverNickname: letterForm.receiver?.nickname ?? '',
    isToMe: Boolean(letterForm.receiver?.isMe),
    items: [
      { key: 'profile', kind: 'profile', uri: currentUser?.profileImageUri ?? null },
      ...(recordForm.music ? [{ key: 'music', kind: 'music', uri: musicArtworkUri }] : []),
      ...photos,
    ],
  };
};

const LetterSendScreen = ({ navigation }) => {
  const { width: windowWidth } = useWindowDimensions();

  const { currentUser, userId } = useCurrentUser();

  const [snapshot] = useState(() => readSendSnapshot(currentUser));
  const [isSent, setIsSent] = useState(false);
  const [isFailed, setIsFailed] = useState(false);
  const [sentLetterId, setSentLetterId] = useState(null);
  const [stageHeight, setStageHeight] = useState(0);

  const { createLetter } = useCreateLetter({
    userId,
    onSuccess: data => {
      setSentLetterId(resolveSentLetterId(data));
      setIsSent(true);
    },
    // 실패하면 담기 애니메이션을 멈추고 실패 화면을 보여준다
    onError: () => setIsFailed(true),
  });

  // 화면에 들어오자마자 전송을 시작하고, 그동안 담기 애니메이션을 보여준다
  const hasRequested = useRef(false);
  useEffect(() => {
    if (hasRequested.current) return;
    hasRequested.current = true;

    createLetter();
  }, [createLetter]);

  const envelopeWidth = Math.min(windowWidth * ENVELOPE_WIDTH_RATIO, ENVELOPE_MAX_WIDTH);
  const envelopeHeight = envelopeWidth / BODY_ASPECT_RATIO;

  const packTop = stageHeight * PACK_CENTER_RATIO - envelopeHeight / 2;
  const floatTop = stageHeight * FLOAT_CENTER_RATIO - envelopeHeight / 2;

  // 내용물이 봉투 위쪽 화면 끝까지는 보이도록 잘라내는 영역을 늘린다
  const contentClipTop = packTop;

  // 화면에서 위 → 아래 순서는 첨부 사진 → 음악 커버 → 프로필. 맨 아래(프로필)부터 한 장씩 담긴다
  const cardSize = envelopeWidth * CARD_SIZE_RATIO;
  const itemCount = snapshot.items.length;
  const peekTop = -cardSize * CARD_PEEK_RATIO;

  const cardLayouts = useMemo(
    () =>
      snapshot.items.map((item, index) => ({
        size: cardSize,
        left: (envelopeWidth - cardSize) / 2,
        top: contentClipTop,
        offsetFromBottom: -(index + 1) * cardSize - index * CARD_GAP,
        restTop: peekTop + (itemCount - 1 - index) * CARD_STACK_STEP,
      })),
    [snapshot.items, itemCount, cardSize, peekTop, envelopeWidth, contentClipTop],
  );

  // 줄 아랫변 위치 (봉투 윗변 기준): 시작(화면 위 밖) → i 번째 장이 자기 자리에 닿는 위치
  const columnStops = useMemo(
    () => [
      -contentClipTop,
      ...cardLayouts.map(layout => layout.restTop - layout.offsetFromBottom),
    ],
    [cardLayouts, contentClipTop],
  );

  const {
    phase,
    columnBottom,
    sinkOffset,
    contentOpacity,
    isContentPacked,
    flapProgress,
    envelopeStyle,
    shadowStyle,
    hintStyle,
    arrowStyle,
    gesture,
  } = useLetterSendAnimation({
    itemCount,
    columnStops,
    sinkDistance: envelopeHeight * CARD_SINK_TOP_RATIO - peekTop,
    canFly: isSent,
    liftDistance: packTop - floatTop,
    flyDistance: stageHeight + envelopeHeight,
  });


  const isDone = phase === 'done';

  // 작성 흐름(Record → Envelope → LetterSend)을 닫고, 작성을 시작한 화면(피드 · 편지함 · 편지 상세 등)으로 돌아간다
  const handleClose = useCallback(() => {
    const routes = navigation?.getState()?.routes ?? [];
    const recordIndex = routes.findLastIndex(route => route.name === WRITE_FLOW_FIRST_ROUTE);

    if (recordIndex > 0) {
      navigation.pop(routes.length - recordIndex);
    } else {
      navigation?.popToTop();
    }
  }, [navigation]);

  // 작성 흐름을 닫고 방금 보낸 편지 상세로 간다. id 를 못 찾으면 닫기만 한다
  const [isOpeningSentLetter, setIsOpeningSentLetter] = useState(false);
  const handleViewSentLetter = useCallback(async () => {
    setIsOpeningSentLetter(true);
    const letterId = sentLetterId ?? (await fetchLatestSentLetterId(snapshot.isToMe));
    setIsOpeningSentLetter(false);

    handleClose();
    if (letterId != null) {
      navigation?.push('LetterDetail', { letterId });
    }
  }, [navigation, sentLetterId, snapshot.isToMe, handleClose]);

  // 전송에 실패하면 작성한 내용은 버리고 작성 흐름을 닫는다
  const handleCloseAfterFailure = useCallback(() => {
    resetWriteForms();
    handleClose();
  }, [handleClose]);

  // 작성한 내용을 버리고 빈 편지 작성 화면을 새로 연다
  const handleWriteNewLetter = useCallback(() => {
    resetWriteForms();
    handleClose();
    navigation?.navigate(WRITE_FLOW_FIRST_ROUTE, { type: 'letter' });
  }, [navigation, handleClose]);

  // 보내는 중에는 뒤로 갈 수 없고, 완료 · 실패 뒤에는 작성 흐름을 모두 닫는다
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isFailed) handleCloseAfterFailure();
      else if (isDone) handleClose();
      return true;
    });

    return () => subscription.remove();
  }, [isDone, isFailed, handleClose, handleCloseAfterFailure]);

  if (isFailed) {
    return (
      <LetterSendFailed
        onClose={handleCloseAfterFailure}
        onWriteNewLetter={handleWriteNewLetter}
      />
    );
  }

  if (isDone) {
    return (
      <LetterSendDone
        snapshot={snapshot}
        onClose={handleClose}
        onViewSentLetter={handleViewSentLetter}
        isOpeningSentLetter={isOpeningSentLetter}
      />
    );
  }

  const shadowWidth = envelopeWidth * 0.9;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <GestureDetector gesture={gesture}>
        <View
          style={styles.stage}
          onLayout={event => setStageHeight(event.nativeEvent.layout.height)}
        >
          {stageHeight > 0 ? (
            <>
              <Animated.View
                style={[
                  styles.shadow,
                  {
                    top: floatTop + envelopeHeight + 28,
                    left: (windowWidth - shadowWidth) / 2,
                    width: shadowWidth,
                  },
                  shadowStyle,
                ]}
                pointerEvents="none"
              >
                <Canvas style={{ width: shadowWidth, height: SHADOW_HEIGHT }}>
                  <Oval
                    x={SHADOW_BLUR * 2}
                    y={SHADOW_BLUR}
                    width={shadowWidth - SHADOW_BLUR * 4}
                    height={SHADOW_HEIGHT - SHADOW_BLUR * 2}
                    color="rgba(30, 33, 37, 0.18)"
                  >
                    <BlurMask blur={SHADOW_BLUR} style="normal" />
                  </Oval>
                </Canvas>
              </Animated.View>

              <Animated.View
                style={[
                  styles.envelope,
                  { top: packTop, left: (windowWidth - envelopeWidth) / 2 },
                  envelopeStyle,
                ]}
              >
                <SendEnvelope
                  width={envelopeWidth}
                  colorId={snapshot.colorId}
                  color={snapshot.color}
                  FallbackFlapSvg={snapshot.FlapSvg}
                  flapProgress={flapProgress}
                  contentClipTop={contentClipTop}
                >
                  {!isContentPacked && snapshot.items.map((item, index) => (
                    <SendContentCard
                      key={item.key}
                      kind={item.kind}
                      uri={item.uri}
                      layout={cardLayouts[index]}
                      columnBottom={columnBottom}
                      sinkOffset={sinkOffset}
                      contentOpacity={contentOpacity}
                    />
                  ))}
                </SendEnvelope>
              </Animated.View>

              {phase === 'floating' ? (
                <View
                  style={[styles.hint, { top: Math.max(floatTop - 132, 0) }]}
                  pointerEvents="none"
                >
                  {isSent ? (
                    <Animated.View style={[styles.hintContent, hintStyle]}>
                      <Animated.View style={arrowStyle}>
                        <IcArrowUp width={24} height={24} color={colors.fgNeutralQuaternary} />
                      </Animated.View>
                      <Text style={styles.hintText}>위로 올려서 편지 날리기</Text>
                    </Animated.View>
                  ) : (
                    <Animated.Text entering={FadeIn} style={styles.hintText}>
                      편지를 보내는 중이에요
                    </Animated.Text>
                  )}
                </View>
              ) : null}
            </>
          ) : null}
        </View>
      </GestureDetector>
    </SafeAreaView>
  );
};

/* 편지를 날려 보낸 뒤 완료 화면 (Figma: write/letter : case : 전송 완료 · 도착일 지정 / 나에게 보내기) */
/* 편지 전송에 실패했을 때 (Figma: write/letter : case : 전송 실패2) */
const LetterSendFailed = ({ onClose, onWriteNewLetter }) => (
  <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
    <Animated.View entering={FadeIn.duration(400)} style={styles.done}>
      <View style={styles.failedIcon}>
        <IcFilledAlert width={FAILED_ICON_SIZE} height={FAILED_ICON_SIZE} color={colors.fillCriticalStrong} />
      </View>

      <View style={styles.doneTextGroup}>
        <Text style={styles.doneTitle}>편지를 보내지 못했어요</Text>
        <Text style={styles.doneDescription}>
          {'편지 전송 중 오류가 발생했어요.\n작성한 내용은 저장되지 않았어요.'}
        </Text>
      </View>
    </Animated.View>

    <View style={styles.doneButtonContainer}>
      <Button
        variant={BUTTON_VARIANT.WEAK}
        size={BUTTON_SIZE.XL}
        onPress={onClose}
        style={styles.doneButton}
      >
        돌아가기
      </Button>
      <Button
        variant={BUTTON_VARIANT.SOLID}
        size={BUTTON_SIZE.XL}
        onPress={onWriteNewLetter}
        style={styles.doneButton}
      >
        새 편지 작성하기
      </Button>
    </View>
  </SafeAreaView>
);

const LetterSendDone = ({ snapshot, onClose, onViewSentLetter, isOpeningSentLetter }) => {
  // 도착일을 고르지 않았으면 오늘 도착한다
  const arrivalDate = formatDate(deliveryAtToDate(snapshot.deliveryAt) ?? new Date());

  const title = snapshot.isToMe ? '미래의 나에게 편지를 보냈어요' : '편지를 보냈어요';
  const description = snapshot.isToMe
    ? `${arrivalDate}에 편지함으로 도착해요`
    : `${arrivalDate}에 ${snapshot.receiverNickname}님에게 도착해요`;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <Animated.View entering={FadeIn.duration(400)} style={styles.done}>
        <View style={styles.doneIllustration}>
          <IlLetterSuccess width="100%" height="100%" />
        </View>

        <View style={styles.doneTextGroup}>
          <Text style={styles.doneTitle}>{title}</Text>
          <Text style={styles.doneDescription}>{description}</Text>
        </View>
      </Animated.View>

      <View style={styles.doneButtonContainer}>
        <Button
          variant={BUTTON_VARIANT.WEAK}
          size={BUTTON_SIZE.XL}
          onPress={onClose}
          style={styles.doneButton}
        >
          돌아가기
        </Button>
        <Button
          variant={BUTTON_VARIANT.SOLID}
          size={BUTTON_SIZE.XL}
          onPress={onViewSentLetter}
          loading={isOpeningSentLetter}
          style={styles.doneButton}
        >
          보낸 편지 보기
        </Button>
      </View>
    </SafeAreaView>
  );
};

export default LetterSendScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgBase,
  },
  stage: {
    flex: 1,
    overflow: 'hidden',
  },

  envelope: {
    position: 'absolute',
  },
  shadow: {
    position: 'absolute',
    height: SHADOW_HEIGHT,
  },

  /* 위로 올리기 안내 */
  hint: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hintContent: {
    alignItems: 'center',
    gap: gap.M,
  },
  hintText: {
    ...typo.suitLabelMedium,
    color: colors.fgNeutralTertiary,
  },

  /* 완료 화면 */
  done: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: gap.L,
    paddingVertical: padding.XL,
  },
  doneIllustration: {
    width: 200,
    height: 200,
  },
  doneTextGroup: {
    alignItems: 'center',
    gap: gap.XS,
  },
  doneTitle: {
    ...typo.suitTitleXLargeStrong,
    color: colors.fgNeutralPrimary,
    textAlign: 'center',
  },
  doneDescription: {
    ...typo.suitBodyXLarge,
    color: colors.fgNeutralTertiary,
    textAlign: 'center',
  },
  doneButtonContainer: {
    flexDirection: 'row',
    gap: gap.M,
    paddingHorizontal: padding.L,
    paddingBottom: padding.L,
  },
  // Button 기본 alignSelf(flex-start)를 덮어써 두 버튼이 너비를 반씩 나눈다
  doneButton: {
    flex: 1,
    alignSelf: 'auto',
  },

  /* 실패 화면 */
  failedIcon: {
    width: FAILED_ICON_CIRCLE_SIZE,
    height: FAILED_ICON_CIRCLE_SIZE,
    borderRadius: FAILED_ICON_CIRCLE_SIZE / 2,
    backgroundColor: colors.fillCriticalWeak,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
