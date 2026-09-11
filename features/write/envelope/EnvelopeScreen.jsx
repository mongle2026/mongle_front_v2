import { Animated, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import IcArrowLeft from '../../../assets/icons/ic_arrow_left.svg';

import TopIconNavigation from '../../../shared/components/navigation/topnavigation/TopIconNavigation';
import TabBar from '../../../shared/components/navigation/tabbar/TabBar';
import GridSpacers from '../../../shared/components/layout/GridSpacers';

import { colors } from '../../../shared/styles/color';
import { gap, padding } from '../../../shared/styles/token';

import useCurrentUser from '../../../shared/hooks/useCurrentUser';
import { useGlobalOverlay } from '../../../shared/providers/GlobalOverlayProvider';

import { PATTERNS, STAMPS } from '../../../shared/data/envelopeData';
import { resolvePatternColor } from '../../../shared/utils/envelopeUtils';
import { chunk } from '../../../shared/utils/arrayUtils';

import { useLetterFormStore } from '../store/useLetterFormStore';

import Letter from '../../letter/components/Letter';
import Templete from '../components/Templete';
import PatternItem from '../components/PatternItem';
import ColorItem from '../components/ColorItem';
import StampItem from '../components/StampItem';

import useEnvelopeSelect, { TABS } from './hooks/useEnvelopeSelect';
import useCreateLetter from './hooks/useCreateLetter';
import useLetterFlip from './hooks/useLetterFlip';
import useLetterPreviewSize from './hooks/useLetterPreviewSize';
import { TEMPLATES } from './data/envelopeTemplateData';

/* TabBar 는 인덱스 기반이라 훅의 tab key 와 매핑한다 */
const TAB_LABELS = TABS.map((tab) => tab.label);

/* Letter 원본 비율(320:232, Letter.jsx의 CARD_ASPECT_RATIO와 동일) */
const LETTER_ASPECT_RATIO = 320 / 232;

const EnvelopeScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  const {
    activeTab,
    selectedItems,
    currentColors,
    envelope,
    isNextEnabled,
    handleTabPress,
    handleSelectItem,
  } = useEnvelopeSelect();

  const activeTabIndex = TABS.findIndex((tab) => tab.key === activeTab);

  const receiver = useLetterFormStore((state) => state.receiver);
  const { currentUser, userId } = useCurrentUser();
  const { showToast } = useGlobalOverlay();

  const recipientName = receiver?.nickname ?? '';
  const senderName = currentUser?.nickname ?? '';

  const { previewFace, flipAnim, flapOpacity, handleToggleFace } =
    useLetterFlip();

  const { previewSize: letterPreviewSize, onLayout: handleLetterLayout } =
    useLetterPreviewSize(LETTER_ASPECT_RATIO);

  const scrollBottomInset = { paddingBottom: insets.bottom };

  const { createLetter, isCreatingLetter } = useCreateLetter({
    userId,

    onSuccess: () => {
      navigation?.popToTop();
    },

    onError: (error) => {
      const message =
        error.response?.data?.message ?? '편지를 보내지 못했습니다.';

      showToast({
        message: Array.isArray(message) ? message[0] : message,
        icon: 'alert',
        iconColor: colors.fgCritical,
        bottomOffset: insets.bottom,
      });
    },
  });

  const handlePressBack = () => navigation?.goBack();
  const handlePressSend = () => {
    if (!isNextEnabled) {
      showToast({
        message: '봉투를 선택해 주세요.',
        icon: 'alert',
        iconColor: colors.fgCritical,
        bottomOffset: insets.bottom,
      });

      return;
    }

    /*
     * 네트워크 요청 중 연속 탭으로
     * 같은 편지가 여러 번 생성되는 것을 방지합니다.
     */
    if (isCreatingLetter) {
      return;
    }

    createLetter();
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <TopIconNavigation
        type="text"
        leftIcon={IcArrowLeft}
        leftAccessibilityLabel="뒤로가기"
        headerText="편지 봉투 선택"
        nextText="전송"
        onPressClose={handlePressBack}
        onPressNext={handlePressSend}
        nextTextStyle={{
          color: isNextEnabled ? colors.fgNeutralMuted : colors.fgDisabled,
        }}
      />

      <View style={styles.letterContainer} onLayout={handleLetterLayout}>
        <Pressable
          style={[styles.letterPressable, letterPreviewSize]}
          onPress={handleToggleFace}
          accessibilityRole="button"
          accessibilityLabel={
            previewFace === 'back' ? '봉투 앞면 보기' : '봉투 뒷면 보기'
          }
        >
          <Animated.View style={{ transform: [{ scaleX: flipAnim }] }}>
            <Letter
              type={previewFace}
              BackgroundSvg={envelope.FrontSvg}
              FlapSvg={envelope.FlapSvg}
              StampSvg={envelope.StampSvg}
              recipient={recipientName}
              sender={senderName}
              style={letterPreviewSize}
              flapOpacity={flapOpacity}
            />
          </Animated.View>
        </Pressable>
      </View>

      <TabBar
        tabs={TAB_LABELS}
        activeIndex={activeTabIndex}
        onChange={(index) => handleTabPress(TABS[index].key)}
      />

      <View style={styles.sectionArea}>
        {activeTab === 'template' && (
          <ScrollView
            style={styles.sectionScroll}
            contentContainerStyle={[styles.templateContent, scrollBottomInset]}
            showsVerticalScrollIndicator={false}
          >
            {chunk(TEMPLATES, 2).map((row, rowIndex) => (
              <View key={`template-row-${rowIndex}`} style={styles.templateRow}>
                {row.map((template) => {
                  const resolved = resolvePatternColor(template.patternColorId);
                  const stamp = STAMPS.find((item) => item.id === template.stampId);

                  return (
                    <Templete
                      key={template.id}
                      label={template.label}
                      PatternSvg={resolved?.pattern.thumbnail}
                      StampSvg={stamp?.SvgComponent}
                      isActive={selectedItems.template === template.id}
                      onPress={() => handleSelectItem(template.id)}
                    />
                  );
                })}
              </View>
            ))}
          </ScrollView>
        )}

        {activeTab === 'pattern' && (
          <ScrollView
            style={styles.sectionScroll}
            contentContainerStyle={[styles.patternContent, scrollBottomInset]}
            showsVerticalScrollIndicator={false}
          >
            {chunk(PATTERNS, 3).map((row, rowIndex) => (
              <View key={`pattern-row-${rowIndex}`} style={styles.gridRow}>
                {row.map((pattern) => (
                  <PatternItem
                    key={pattern.id}
                    Svg={pattern.thumbnail}
                    isActive={selectedItems.patternId === pattern.id}
                    onPress={() => handleSelectItem(pattern.id)}
                    style={styles.gridCell}
                  />
                ))}
                <GridSpacers count={3 - row.length} style={styles.gridCell} />
              </View>
            ))}
          </ScrollView>
        )}

        {activeTab === 'color' && (
          <ScrollView
            style={styles.sectionScroll}
            contentContainerStyle={[styles.colorContent, scrollBottomInset]}
            showsVerticalScrollIndicator={false}
          >
            {chunk(currentColors, 3).map((row, rowIndex) => (
              <View key={`color-row-${rowIndex}`} style={styles.gridRow}>
                {row.map((color) => (
                  <ColorItem
                    key={color.id}
                    color={color.color}
                    isActive={selectedItems.colorId === color.id}
                    onPress={() => handleSelectItem(color.id)}
                    style={styles.gridCell}
                  />
                ))}
                <GridSpacers count={3 - row.length} style={styles.gridCell} />
              </View>
            ))}
          </ScrollView>
        )}

        {activeTab === 'stamp' && (
          <ScrollView
            style={styles.sectionScroll}
            contentContainerStyle={[styles.stampContent, scrollBottomInset]}
            showsVerticalScrollIndicator={false}
          >
            {chunk(STAMPS, 3).map((row, rowIndex) => (
              <View key={`stamp-row-${rowIndex}`} style={styles.gridRow}>
                {row.map((stamp) => (
                  <StampItem
                    key={stamp.id}
                    Svg={stamp.SvgComponent}
                    isActive={selectedItems.stampId === stamp.id}
                    onPress={() => handleSelectItem(stamp.id)}
                    style={styles.gridCell}
                  />
                ))}
                <GridSpacers count={3 - row.length} style={styles.gridCell} />
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
};

export default EnvelopeScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgLayerDefault,
  },

  /* 편지 봉투 미리보기 영역: 탭하면 앞면 <-> 뒷면 전환 */
  letterContainer: {
    width: '100%',
    paddingVertical: padding.XXL,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  letterPressable: {
    width: '100%',
  },

  /* 탭 아래 옵션 영역: 스크롤은 여기서만 */
  sectionArea: {
    flex: 1,
    width: '100%',
  },
  sectionScroll: {
    flex: 1,
    width: '100%',
  },

  /* 템플릿 */
  templateContent: {
    padding: padding.L,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: gap.M,
  },
  templateRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  /* 패턴 */
  patternContent: {
    width: '100%',
    padding: padding.XL,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: gap.L,
  },

  /* 컬러 */
  colorContent: {
    width: '100%',
    padding: padding.XL,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: gap.M,
  },

  /* 우표 */
  stampContent: {
    width: '100%',
    padding: padding.XL,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: padding.M,
  },

  /* 패턴 / 컬러 / 우표 공통 행 */
  gridRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: padding.M,
  },
  gridCell: {
    flex: 1,
  },
});
