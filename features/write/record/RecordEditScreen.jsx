import React, { useCallback } from 'react';
import { ActivityIndicator, Keyboard, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Shared Components & Providers
import TopIconNavigation from '../../../shared/components/navigation/topnavigation/TopIconNavigation';
import { useGlobalOverlay } from '../../../shared/providers/GlobalOverlayProvider';

// Shared Hooks & Utils
import useCurrentUser from '../../../shared/hooks/useCurrentUser';
import { getApiErrorMessage } from '../../../shared/api/client';

// Shared Styles
import { colors } from '../../../shared/styles/color';

// Feature Components & Stores
import RecordEditorBody from './components/RecordEditorBody';
import { useRecordFormStore } from '../store/useRecordFormStore';

// Hooks
import useRecordEditor from './hooks/useRecordEditor';
import { useFeedEditForm } from './hooks/useFeedEditForm';
import useUpdateFeed from './hooks/useUpdateFeed';
import { useLeaveRecordConfirm } from './hooks/useLeaveRecordConfirm';

const MUSIC_SELECT_OVERLAY_ID = 'record-edit-music-select';

const RecordEditScreen = ({ navigation, route }) => {
  /* 현재 로그인 사용자 */
  const { userId } = useCurrentUser();

  const feedId = route?.params?.feedId;

  /* 수정 대상 피드를 store로 불러오기 */
  const {
    loading: isLoadingFeed,
    error: loadFeedError,
    originalFileIds,
  } = useFeedEditForm({ feedId, userId });

  /* 피드 작성 상태 (RecordScreen과 store · 편집 로직을 공유) */
  const editor = useRecordEditor({
    navigation,
    musicSelectOverlayId: MUSIC_SELECT_OVERLAY_ID,
  });

  const {
    hasMusic,
    hasContent,
    bottomOffset,
  } = editor;

  const isDirty = useRecordFormStore(state => state.isDirty);
  const resetRecordForm = useRecordFormStore(state => state.resetRecordForm);

  const handlePressClose = useLeaveRecordConfirm({
    navigation,
    hasChanges: isDirty,
    title: '수정을 그만둘까요?',
    description: '수정된 내용은 저장되지 않습니다.',
    cancelText: '계속 수정하기',
    onDiscard: useCallback(() => {
      resetRecordForm();
    }, [resetRecordForm]),
  });

  /* 다음 버튼 활성 색상 조건 (수정 사항이 없으면 비활성) */
  const isNextReady = hasMusic && hasContent;
  const canSubmit = isNextReady && isDirty;
  const nextTextColor = canSubmit ? colors.fgNeutralMuted : colors.fgDisabled;

  const { showToast } = useGlobalOverlay();

  /* Feed 수정 저장 */
  const {
    updateFeed,
    isUpdatingFeed,
  } = useUpdateFeed({
    feedId,
    userId,
    originalFileIds,

    onSuccess: () => {
      navigation?.goBack();
    },

    onError: error => {
      showToast({
        message: getApiErrorMessage(error, '피드를 수정하지 못했습니다.'),
        bottomOffset,
      });
    },
  });

  const handlePressNext =
    useCallback(() => {
      /*
       * 수정된 내용이 없으면 완료 버튼을 막아둡니다.
       * (안내할 누락 항목이 없으므로 Toast는 띄우지 않습니다.)
       */
      if (!isDirty) {
        return;
      }

      /*
       * 회색 상태에서도 실제 disabled는 하지 않고,
       * 비어 있는 항목을 Toast로 안내합니다.
       */
      if (!isNextReady) {
        const missingToastMessage =
          (!hasMusic && '음악을 선택해 주세요.') ||
          '메시지를 작성하거나 사진을 첨부해 주세요.';

        showToast({
          message: missingToastMessage,
          icon: 'alert',
          iconColor: colors.fgCritical,
          bottomOffset,
        });

        return;
      }

      /*
       * 네트워크 요청 중 연속 탭으로
       * 같은 피드가 여러 번 수정되는 것을 방지합니다.
       */
      if (isUpdatingFeed) {
        return;
      }

      Keyboard.dismiss();

      updateFeed();
    }, [
      bottomOffset,
      hasMusic,
      isDirty,
      isNextReady,
      isUpdatingFeed,
      showToast,
      updateFeed,
    ]);

  if (isLoadingFeed || loadFeedError) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <TopIconNavigation
          type="text"
          headerText="피드 수정하기"
          nextText="완료"
          onPressClose={handlePressClose}
          nextTextStyle={{ color: colors.fgDisabled }}
        />

        <View style={styles.stateContainer}>
          {isLoadingFeed && <ActivityIndicator />}

          {!isLoadingFeed && loadFeedError && (
            <Text style={styles.stateText}>
              기록을 불러오지 못했습니다.
            </Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <TopIconNavigation
        type="text"
        headerText="피드 수정하기"
        nextText="완료"
        onPressClose={handlePressClose}
        onPressNext={handlePressNext}
        nextTextStyle={{ color: nextTextColor }}
      />

      <RecordEditorBody
        editor={editor}
        placeholder="음악과 함께 기록할 내용을 작성해 주세요."
      />
    </SafeAreaView>
  );
};

export default RecordEditScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgLayerDefault,
  },
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateText: {
    color: colors.fgNeutralMuted,
  },
});
