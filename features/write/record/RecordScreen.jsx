import React, { useCallback } from 'react';
import { Keyboard, Pressable, StyleSheet, TextInput, View } from 'react-native';
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
import { padding } from '../../../shared/styles/token';
import { typo } from '../../../shared/styles/typo';

// Feature Components & Stores
import LabeledButton from '../components/LabeledButton';
import BottomBar from '../components/bottombar/BottomBar';
import MusicSelectBottomSheet from '../music/components/MusicSelectBottomSheet';
import RecipientSelectBottomSheet from '../recipient/components/RecipientSelectBottomSheet';
import { useRecordFormStore } from '../store/useRecordFormStore';
import { useLetterFormStore } from '../store/useLetterFormStore';

const RECORD_TYPE = {
  FEED: 'feed',
  LETTER: 'letter',
};

const MUSIC_SELECT_OVERLAY_ID = 'record-music-select';
const RECIPIENT_SELECT_OVERLAY_ID = 'record-recipient-select';

const RecordScreen = ({ navigation, route }) => {
  /* 현재 로그인 사용자 */
  const { userId } = useCurrentUser();

  /* 피드 / 편지 공통 작성 데이터 */
  const text = useRecordFormStore(state => state.text);
  const setText = useRecordFormStore(state => state.setText);
  const music = useRecordFormStore(state => state.music);

  /* 편지 전용 작성 데이터 */
  const receiver = useLetterFormStore(state => state.receiver);

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
  const handleOpenDateSelect = useCallback(() => {
    Keyboard.dismiss();

    // TODO: 날짜 선택 BottomSheet 연결
  }, []);

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
            <View style={styles.recipientAndDateContainer}>
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
                <LabeledButton
                  icon={<IcCalendar />}
                  label="날짜 선택"
                  size="M"
                  typography={typo.suitLabelLargeStrong}
                  color={colors.fgNeutralMuted}
                  backgroundColor={colors.bgNeutralFaint}
                  onPress={handleOpenDateSelect}
                />
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
              imageSource={music.musicArtwork}
              title={music.musicTitle}
              artist={music.musicArtist}
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
    paddingVertical: padding.S,
    paddingHorizontal: padding.L,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recipientProfile: {
    paddingVertical: 0,
    paddingHorizontal: 0,
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