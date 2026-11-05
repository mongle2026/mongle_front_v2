import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

import { colors } from '../../../shared/styles/color';
import { gap, padding } from '../../../shared/styles/token';
import { typo } from '../../../shared/styles/typo';
import { PATTERNS, STAMPS } from '../../../shared/data/envelopeData';
import { resolveEnvelope } from '../../../shared/utils/envelopeUtils';
import Letter from '../../../shared/components/content/Letter';

import LetterCard from '../../letterbox/components/Card';
import FlippableLetter from '../../letterbox/components/FlippableLetter';
import SendEnvelope from '../../write/send/components/SendEnvelope';
import {
  BODY_ASPECT_RATIO,
  FLAP_HEIGHT_RATIO,
  findSendEnvelopeLayers,
} from '../../write/send/data/sendEnvelopeData';

import { CatalogSection, Specimen } from '../components/Specimen';

const noop = () => {};

const SAMPLE_RECIPIENT = '몽글';
const SAMPLE_SENDER = '동글';
const SAMPLE_STAMP_ID = STAMPS[0].id;
const SAMPLE_DATE = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

// 색상마다 복잡한 SVG 를 두 장씩 그려서, 화면이 멈추지 않도록 조금씩 나눠 마운트한다
const MOUNT_STEP = 4;
const MOUNT_DELAY_MS = 50;

const ENVELOPES = PATTERNS.flatMap(pattern =>
  pattern.colors.map(color => ({
    key: color.id,
    patternId: pattern.id,
    colorId: color.id,
    hex: color.color,
  })),
);

// 카드(Specimen) 안쪽 폭 = 화면 - 섹션 패딩 - 카드 테두리 - 카드 패딩
const CARD_INSET = (padding.XL + 1 + padding.L) * 2;

const useProgressiveCount = total => {
  const [count, setCount] = useState(Math.min(MOUNT_STEP, total));

  useEffect(() => {
    if (count >= total) return undefined;

    const timer = setTimeout(
      () => setCount(current => Math.min(current + MOUNT_STEP, total)),
      MOUNT_DELAY_MS,
    );
    return () => clearTimeout(timer);
  }, [count, total]);

  return count;
};

const EnvelopeList = ({ title, contentStyle, renderEnvelope }) => {
  const count = useProgressiveCount(ENVELOPES.length);

  return (
    <CatalogSection title={`${title} · ${ENVELOPES.length}개`}>
      {ENVELOPES.slice(0, count).map(envelope => (
        <Specimen
          key={envelope.key}
          name={envelope.colorId}
          note={envelope.hex}
          contentStyle={contentStyle}
          dark
          showSpec={false}
        >
          {renderEnvelope(envelope)}
        </Specimen>
      ))}
    </CatalogSection>
  );
};

const Face = ({ label, children }) => (
  <View style={styles.face}>
    <Text style={styles.faceLabel}>{label}</Text>
    {children}
  </View>
);

/* 봉투 선택: EnvelopeScreen 의 미리보기와 같은 Letter 구성 */
const PickerFace = ({ type, patternId, colorId }) => {
  const envelope = useMemo(
    () => resolveEnvelope({ patternId, colorId, stampId: SAMPLE_STAMP_ID }),
    [patternId, colorId],
  );

  return (
    <Letter
      type={type}
      BackgroundSvg={type === 'back' ? envelope.BackSvg : envelope.FrontSvg}
      FlapSvg={envelope.FlapSvg}
      StampSvg={envelope.StampSvg}
      recipient={SAMPLE_RECIPIENT}
      sender={SAMPLE_SENDER}
      isDark={Boolean(envelope.color?.isDark)}
    />
  );
};

const PickerSection = () => (
  <EnvelopeList
    title="봉투 선택"
    contentStyle={styles.row}
    renderEnvelope={({ patternId, colorId }) => (
      <>
        <Face label="앞면">
          <PickerFace type="front" patternId={patternId} colorId={colorId} />
        </Face>
        <Face label="뒷면">
          <PickerFace type="back" patternId={patternId} colorId={colorId} />
        </Face>
      </>
    )}
  />
);

/* 편지함: 앞면은 목록의 Card, 뒷면은 안 읽은 편지 더미의 FlippableLetter */
const LetterboxSection = () => {
  const isFlipping = useSharedValue(false);

  return (
    <EnvelopeList
      title="편지함"
      contentStyle={styles.stack}
      renderEnvelope={({ patternId, colorId }) => {
        const envelope = { pattern: patternId, color: colorId, stamp: SAMPLE_STAMP_ID };

        return (
          <>
            <Text style={styles.faceLabel}>앞면 · Card</Text>
            <LetterCard
              type="unread"
              letter={{
                nickname: SAMPLE_RECIPIENT,
                receivedAt: SAMPLE_DATE,
                music: { title: '노래 제목', singer: '아티스트' },
                envelope,
              }}
            />
            <Text style={styles.faceLabel}>뒷면 · FlippableLetter (눌러서 뒤집기)</Text>
            <FlippableLetter
              letter={{
                envelope,
                recipientName: SAMPLE_RECIPIENT,
                senderName: SAMPLE_SENDER,
              }}
              isFlipping={isFlipping}
              onPress={noop}
              style={styles.flippable}
            />
          </>
        );
      }}
    />
  );
};

/* 전송: 앞면은 닫힌 SendEnvelope, 뒷면은 Back 레이어, 안쪽은 열린 SendEnvelope. flapProgress 1 = 닫힘, 0 = 열림 */
const SendSection = () => {
  const { width: windowWidth } = useWindowDimensions();
  const closedProgress = useSharedValue(1);
  const openProgress = useSharedValue(0);

  const envelopeWidth = (windowWidth - CARD_INSET - gap.M) / 2;
  const flapHeight = envelopeWidth * FLAP_HEIGHT_RATIO;

  const renderSendEnvelope = (colorId, hex, flapProgress) => (
    <SendEnvelope
      width={envelopeWidth}
      colorId={colorId}
      color={hex}
      flapProgress={flapProgress}
      contentClipTop={0}
    />
  );

  return (
    <EnvelopeList
      title="전송"
      contentStyle={styles.stack}
      renderEnvelope={({ colorId, hex }) => {
        const BackLayer = findSendEnvelopeLayers(colorId)?.Back;

        return (
          <>
            <View style={styles.row}>
              <Face label="앞면">
                {renderSendEnvelope(colorId, hex, closedProgress)}
              </Face>
              <Face label="뒷면">
                <View style={{ width: envelopeWidth, aspectRatio: BODY_ASPECT_RATIO }}>
                  {BackLayer ? (
                    <BackLayer width="100%" height="100%" preserveAspectRatio="none" />
                  ) : null}
                </View>
              </Face>
            </View>
            <Face label="안쪽 · 전송 중 덮개 열림">
              <View style={{ width: envelopeWidth, paddingTop: flapHeight }}>
                {renderSendEnvelope(colorId, hex, openProgress)}
              </View>
            </Face>
          </>
        );
      }}
    />
  );
};

export const ENVELOPE_SECTIONS = [
  { key: 'envelope-picker', label: '봉투 선택', Component: PickerSection },
  { key: 'envelope-letterbox', label: '편지함', Component: LetterboxSection },
  { key: 'envelope-send', label: '전송', Component: SendSection },
];

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: gap.M,
  },

  stack: {
    alignItems: 'stretch',
  },

  face: {
    flex: 1,
    gap: gap.S,
  },

  faceLabel: {
    ...typo.suitLabelMedium,
    color: colors.fgNeutralTertiary,
  },

  flippable: {
    width: '100%',
  },
});
