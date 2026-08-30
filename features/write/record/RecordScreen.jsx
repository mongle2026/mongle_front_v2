import React, { useCallback } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Icons
import IcProfile from '../../../assets/icons/ic_profile.svg';
import IcMusic from '../../../assets/icons/ic_musicplay.svg';
import IcCalendar from '../../../assets/icons/ic_comment.svg';

// Shared Components & Providers
import { DividerLine } from '../../../shared/components/atomic/DividerLine';
import MusicCard from '../../../shared/components/content/MusicCard';
import Profile from '../../../shared/components/content/profile/Profile';
import TopIconNavigation from '../../../shared/components/navigation/topnavigation/TopIconNavigation';
import { useGlobalOverlay } from '../../../shared/providers/GlobalOverlayProvider';

// Shared Hooks & Utils
import { useFloatingBottomOffset } from '../../../shared/hooks/useFloatingBottomOffset';
import useCurrentUser from '../../../shared/hooks/useCurrentUser';
import { resolveMediaUri } from '../../../shared/utils/media';

// Shared Styles
import { colors } from '../../../shared/styles/color';
import { gap, padding } from '../../../shared/styles/token';
import { typo } from '../../../shared/styles/typo';

// Feature Components & Stores
import LabeledButton from '../components/LabeledButton';
import BottomBar from '../components/bottombar/BottomBar';
import MusicSelectBottomSheet from '../music/components/MusicSelectBottomSheet';
import RecipientSelectBottomSheet from '../recipient/components/RecipientSelectBottomSheet';
import DateSelectBottomSheet from '../date/components/DateSelectBottomSheet';
import { useRecordFormStore } from '../store/useRecordFormStore';
import { useLetterFormStore } from '../store/useLetterFormStore';
import { formatDeliveryDateLabel, toDeliveryAt, } from '../date/utils/deliveryDate';

import useRecordMusicPlayback from './hooks/useRecordMusicPlayback';

const RECORD_TYPE = {
  FEED: 'feed',
  LETTER: 'letter',
};

const MUSIC_SELECT_OVERLAY_ID = 'record-music-select';
const RECIPIENT_SELECT_OVERLAY_ID = 'record-recipient-select';
const DATE_SELECT_OVERLAY_ID = 'record-date-select';

const RecordScreen = ({ navigation, route }) => {
  /* 현재 로그인 사용자 */
  const { userId } = useCurrentUser();

  /* 피드 / 편지 공통 작성 데이터 */
  const text = useRecordFormStore(state => state.text);
  const setText = useRecordFormStore(state => state.setText);
  const music = useRecordFormStore(state => state.music);

  /* 음악 재생 */
  const {
    musicArtworkUri,
    musicPreviewUri,

    isMusicPlaying,
    playbackProgress,

    handlePlayback,
    handleSeek,
  } = useRecordMusicPlayback({
    music,
    navigation,
  });

  /* 편지 전용 작성 데이터 */
  const receiver = useLetterFormStore(state => state.receiver);
  const deliveryAt = useLetterFormStore(state => state.deliveryAt,);
  const setDeliveryAt = useLetterFormStore(state => state.setDeliveryAt,);

  /* feed / letter 구분 */
  const type = route?.params?.type ?? RECORD_TYPE.FEED;
  const isLetter = type === RECORD_TYPE.LETTER;

  /* 키보드가 올라왔을 때 BottomBar 위치 */
  const bottomOffset = useFloatingBottomOffset();
  const { openOverlay } = useGlobalOverlay();

  /* 수신인 선택 BottomSheet 열기 */
  const handleOpenRecipientSelect = useCallback(() => {
    Keyboard.dismiss();

    openOverlay({
      id: RECIPIENT_SELECT_OVERLAY_ID,
      accessibilityLabel: '수신인 선택 닫기',
      contentContainerStyle: styles.bottomSheetOverlayContainer,
      renderContent: ({ close }) => (
        <RecipientSelectBottomSheet currentUserId={userId} onClose={close} />
      ),
    });
  }, [openOverlay, userId]);

  /* 음악 선택 BottomSheet 열기 */
  const handleOpenMusicSelect = useCallback(() => {
    Keyboard.dismiss();

    openOverlay({
      id: MUSIC_SELECT_OVERLAY_ID,
      accessibilityLabel: '음악 선택 닫기',
      contentContainerStyle: styles.bottomSheetOverlayContainer,
      renderContent: ({ close }) => (
        <MusicSelectBottomSheet onClose={close} />
      ),
    });
  }, [openOverlay]);

  /* 날짜 선택 */
  const handleOpenDateSelect =
    useCallback(() => {
      Keyboard.dismiss();

      openOverlay({
        id: DATE_SELECT_OVERLAY_ID,
        accessibilityLabel:
          '날짜 선택 닫기',
        contentContainerStyle:
          styles.bottomSheetOverlayContainer,

        renderContent: ({ close }) => (
          <DateSelectBottomSheet
            initialDate={
              parseDeliveryAtToDate(
                deliveryAt,
              )
            }
            onConfirm={
              handleConfirmDate
            }
            onClose={close}
          />
        ),
      });
    }, [
      openOverlay,
      deliveryAt,
      handleConfirmDate,
    ]);

  const handleConfirmDate = useCallback(
    selectedDate => {
      const nextDeliveryAt =
        toDeliveryAt(selectedDate);

      if (!nextDeliveryAt) {
        return;
      }

      setDeliveryAt(nextDeliveryAt);
    },
    [setDeliveryAt],
  );

  const parseDeliveryAtToDate = deliveryAt => {
    if (!deliveryAt) {
      return null;
    }

    const dateString =
      deliveryAt.split('T')[0];

    const [
      year,
      month,
      day,
    ] = dateString
      .split('-')
      .map(Number);

    if (
      !year ||
      !month ||
      !day
    ) {
      return null;
    }

    return new Date(
      year,
      month - 1,
      day,
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <TopIconNavigation
        type="text"
        headerText={isLetter ? '편지 작성하기' : '피드 작성하기'}
        onPressClose={() => navigation?.goBack()}
      />

      <View style={styles.container}>
        {isLetter && (
          <>
            <View
              style={[
                styles.recipientAndDateContainer,

                // 수신인 선택 전
                !receiver && styles.recipientAndDateContainerBeforeSelect,

                // 나를 선택했고, 아직 날짜는 선택하지 않은 상태
                receiver?.isMe &&
                !deliveryAt &&
                styles.recipientAndDateContainerDateButton,
              ]}
            >
              {receiver ? (
                <Pressable
                  onPress={handleOpenRecipientSelect}
                  accessibilityRole="button"
                  accessibilityLabel="수신인 다시 선택"
                >
                  <Profile
                    type="Letter"
                    imageUri={
                      receiver.profileImageUrl
                        ? resolveMediaUri(receiver.profileImageUrl)
                        : null
                    }
                    recipientName={`${receiver.nickname}${receiver.isMe ? '(나)' : ''}`}
                    style={styles.recipientProfile}
                  />
                </Pressable>
              ) : (
                <LabeledButton
                  icon={<IcProfile />}
                  label="수신인 선택"
                  size="M"
                  typography={typo.suitLabelLargeStrong}
                  color={colors.fgNeutralMuted}
                  iconColor={colors.fgNeutralMuted}
                  backgroundColor={colors.bgNeutralFaint}
                  onPress={handleOpenRecipientSelect}
                />
              )}

              {receiver?.isMe && (
                deliveryAt ? (
                  <Pressable
                    style={styles.dateContainer}
                    onPress={handleOpenDateSelect}
                    accessibilityRole="button"
                    accessibilityLabel="도착 날짜 다시 선택"
                  >
                    <Text
                      allowFontScaling={false}
                      style={styles.dateText}
                    >
                      {formatDeliveryDateLabel(deliveryAt,)}
                    </Text>
                  </Pressable>
                ) : (
                  <LabeledButton
                    icon={<IcCalendar />}
                    label="날짜 선택"
                    size="M"
                    typography={typo.suitLabelLargeStrong}
                    color={colors.fgNeutralMuted}
                    backgroundColor={colors.bgNeutralFaint}
                    onPress={handleOpenDateSelect}
                    style={styles.dateSelectButton}
                  />
                )
              )}
            </View>

            <View style={styles.dividerContainer}>
              <DividerLine />
            </View>
          </>
        )}

        {music ? (
          <Pressable
            style={styles.musicCardButton}
            onPress={handleOpenMusicSelect}
            accessibilityRole="button"
            accessibilityLabel="음악 다시 선택"
          >
            <MusicCard
              imageSource={
                musicArtworkUri
                  ? {
                    uri:
                      musicArtworkUri,
                  }
                  : undefined
              }
              title={music.musicTitle}
              artist={music.musicArtist}
              isPlaying={isMusicPlaying}
              playbackProgress={playbackProgress}
              disabled={!musicPreviewUri}
              onPressPlayback={
                musicPreviewUri
                  ? handlePlayback
                  : undefined
              }
              onSeekPlayback={
                musicPreviewUri
                  ? handleSeek
                  : undefined
              }
            />
          </Pressable>
        ) : (
          <View style={styles.musicContainer}>
            <LabeledButton
              icon={<IcMusic />}
              label="음악 선택"
              size="M"
              typography={typo.suitLabelLargeStrong}
              color={colors.fgNeutralMuted}
              iconColor={colors.fgNeutralMuted}
              backgroundColor={colors.bgNeutralFaint}
              onPress={handleOpenMusicSelect}
            />
          </View>
        )}

        <View style={styles.textContainer}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="텍스트 입력"
            placeholderTextColor={colors.fgPlaceholder}
            multiline
            textAlignVertical="top"
            allowFontScaling={false}
            style={styles.textInput}
          />
        </View>
      </View>

      <View style={[styles.bottomBarContainer, { bottom: bottomOffset }]}>
        <BottomBar />
      </View>
    </SafeAreaView>
  );
};

export default RecordScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgLayerDefault,
  },
  container: {
    width: '100%',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  recipientAndDateContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // Profile이 뜨기 전
  recipientAndDateContainerBeforeSelect: {
    paddingVertical: padding.S,
    paddingHorizontal: padding.L,
  },

  // Profile은 떴지만 날짜 선택 버튼이 아직 있을 때
  recipientAndDateContainerDateButton: {
    paddingRight: padding.L,
  },
  dateSelectButton: {
    alignSelf: 'center',
  },
  dateContainer: {
    paddingVertical: padding.M,
    paddingHorizontal: padding.L,

    flexDirection: 'row',
    alignItems: 'center',

    gap: gap.S,
  },
  dateText: {
    ...typo.kyoboLabelLarge,

    color: colors.fgNeutralSolid,

    includeFontPadding: false,
  },
  dividerContainer: {
    width: '100%',
    paddingVertical: padding.XXS,
    paddingHorizontal: padding.L,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  musicCardButton: {
    width: '100%',
  },
  musicContainer: {
    width: '100%',
    paddingVertical: padding.S,
    paddingHorizontal: padding.L,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textContainer: {
    width: '100%',
    paddingVertical: padding.M,
    paddingHorizontal: padding.L,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    padding: 0,
    margin: 0,
    ...typo.kyoboBodyLarge,
    color: colors.fgNeutralSolid,
    textAlign: 'justify',
    includeFontPadding: false,
  },
  bottomBarContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
  },
  bottomSheetOverlayContainer: {
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
  },
});