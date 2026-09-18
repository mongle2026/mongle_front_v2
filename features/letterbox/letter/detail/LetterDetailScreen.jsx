import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import IlDialogDeleteletter from '../../../../assets/illustrations/il_dialog_deleteletter.svg';

import { Dialog } from '../../../../shared/components/action/Dialog';
import Menu from '../../../../shared/components/action/menu/Menu';
import { TextButton } from '../../../../shared/components/action/TextButton';
import MusicCard from '../../../../shared/components/content/MusicCard';
import Profile from '../../../../shared/components/content/profile/Profile';
import TopIconNavigation from '../../../../shared/components/navigation/topnavigation/TopIconNavigation';
import useCurrentUser from '../../../../shared/hooks/useCurrentUser';
import useFeedMusicPlayback from '../../../../shared/hooks/useFeedMusicPlayback';
import { useDialog } from '../../../../shared/providers/DialogProvider';
import { colors } from '../../../../shared/styles/color';
import { FONT } from '../../../../shared/styles/font';
import { padding } from '../../../../shared/styles/token';
import { getSenderSuffix } from '../../../../shared/utils/koreanUtils';

import ActionBar from '../../../feed/home/components/ActionBar';
import { formatDateOnly } from '../../../feed/utils/formatDate';

import LetterDetailContent from './components/LetterDetailContent';
import useLetterDetail from './hooks/useLetterDetail';

// route.params: { letterId }
const LetterDetailScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();

  const letterId = route?.params?.letterId;
  const { userId } = useCurrentUser();
  const { openDialog } = useDialog();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { letter, error, isConfigured, isLoading, deleteLetter, isDeletingLetter } = useLetterDetail({
    letterId,
    userId,
    onDeleteSuccess: () => {
      navigation.goBack();
    },
  });

  const { playingFeedId, handlePressPlayback } = useFeedMusicPlayback({
    navigation,
  });

  // 음악 재생 훅은 feedId 기준이라 편지는 prefix를 붙여 구분한다
  const playbackId = letter ? `letter-${letter.letterId}` : null;
  const previewUri = letter?.music.previewUri;

  const handlePressClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handlePressMore = useCallback(() => {
    if (!letter) return;

    setIsMenuOpen(previous => !previous);
  }, [letter]);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  // 삭제는 내 편지함에서만 빠지고 상대방 편지함에는 남는다
  const handlePressDelete = useCallback(() => {
    if (isDeletingLetter) return;

    setIsMenuOpen(false);

    openDialog({
      id: 'letter-delete-dialog',
      closeOnDimPress: true,
      closeOnBackPress: true,
      accessibilityLabel: '삭제 확인 창 닫기',
      renderContent: ({ close }) => (
        <Dialog
          illustration={IlDialogDeleteletter}
          title="편지를 영구 삭제할까요?"
          description="삭제한 편지는 되돌릴 수 없습니다."
          cancelText="취소"
          confirmText="삭제"
          onCancel={close}
          onConfirm={() => {
            close();
            deleteLetter();
          }}
        />
      ),
    });
  }, [deleteLetter, isDeletingLetter, openDialog]);

  // TODO: 답장 작성 화면으로 이동
  const handlePressReply = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  const handleMusicPlayback = useCallback(() => {
    if (!playbackId || !previewUri) return;

    handlePressPlayback({ feedId: playbackId, previewUrl: previewUri });
  }, [handlePressPlayback, playbackId, previewUri]);

  // 나에게 쓴 편지는 받은 편지로 취급한다 (편지함 목록과 동일)
  const isSent = Boolean(letter?.isSender && !letter?.isReceiver);

  // 보낸 편지는 받는 사람, 받은 편지는 보낸 사람을 보여준다
  const counterpart = isSent ? letter?.receiver : letter?.sender;

  // 보낸 날짜와 도착 날짜가 다를 때만(예약 발송) 전송/도착을 나눠 보여준다
  const isDeliveredLater =
    Boolean(letter?.createdAt && letter?.deliveryAt) &&
    formatDateOnly(letter.createdAt) !== formatDateOnly(letter.deliveryAt);

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.topSafeArea}>
        <View style={styles.topNavigationContainer}>
          <TopIconNavigation showShare={false} onPressClose={handlePressClose} onPressMore={handlePressMore} />

          {letter && isMenuOpen && (
            <Menu
              showEdit={false}
              deleteLabel="편지 삭제"
              deleteAccessibilityLabel="편지 삭제"
              onPressDelete={handlePressDelete}
              deleteDisabled={isDeletingLetter}
              style={styles.menu}
            />
          )}
        </View>
      </SafeAreaView>

      {!letter ? (
        <View style={styles.state}>
          {isLoading && <ActivityIndicator />}
          {!isConfigured && <Text style={styles.stateText}>EXPO_PUBLIC_API_BASE_URL을 확인해 주세요.</Text>}
          {error && <Text style={styles.stateText}>편지를 불러오지 못했습니다.</Text>}
        </View>
      ) : (
        <View style={styles.container}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[
              styles.contentContainer,
              // 답장 버튼이 없으면 스크롤 끝이 안드로이드 네비게이션 바에 가리지 않게 한다
              !letter.isReceiver && { paddingBottom: padding.XXL + insets.bottom },
            ]}
            showsVerticalScrollIndicator={false}
            onScrollBeginDrag={closeMenu}
          >
            <View style={styles.senderContainer}>
              <Profile
                type="Letter"
                imageUri={counterpart.profileImageUri}
                recipientName={counterpart.nickname}
                nameSuffix={isSent ? '에게' : getSenderSuffix(counterpart.nickname)}
                font={letter.font}
              />
            </View>

            <MusicCard
              imageSource={letter.music.artworkUri ? { uri: letter.music.artworkUri } : undefined}
              title={letter.music.title}
              artist={letter.music.singer}
              font={letter.font}
              isPlaying={playingFeedId === playbackId}
              disabled={!previewUri}
              onPressPlayback={previewUri ? handleMusicPlayback : undefined}
            />

            <LetterDetailContent text={letter.text} imageSources={letter.imageSources} font={letter.font} />

            <ActionBar
              createdAt={letter.createdAt}
              showTime={false}
              dateSuffix={isDeliveredLater ? '전송' : undefined}
              showCommentButton={false}
              showLikeButton={false}
              showBookmarkButton={false}
            />

            {isDeliveredLater && (
              <ActionBar
                createdAt={letter.deliveryAt}
                showTime={false}
                datePrefix=">"
                dateSuffix="도착"
                showCommentButton={false}
                showLikeButton={false}
                showBookmarkButton={false}
              />
            )}
          </ScrollView>

          {/* 답장은 받은 편지에서만 */}
          {letter.isReceiver && (
            <View style={[styles.buttonContainer, { paddingBottom: padding.XXL + insets.bottom }]}>
              <TextButton
                variant="Solid"
                size="XL"
                font={FONT.SUIT}
                onPress={handlePressReply}
                style={styles.replyButton}
              >
                {`${letter.sender.nickname}에게 답장하기`}
              </TextButton>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgLayerDefault,
  },
  topSafeArea: {
    width: '100%',
    backgroundColor: colors.bgLayerDefault,
    // 메뉴가 네비게이션 아래 콘텐츠 위로 겹쳐 보이게 한다
    zIndex: 20,
  },
  topNavigationContainer: {
    width: '100%',
    position: 'relative',
    zIndex: 20,
  },
  // 네비게이션 바로 밑에서 4px 겹치고, 오른쪽에서 12px 떨어진다
  menu: {
    position: 'absolute',
    top: '100%',
    marginTop: -padding.XS,
    right: padding.L,
    zIndex: 30,
  },
  container: {
    flex: 1,
    width: '100%',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scroll: {
    flex: 1,
    alignSelf: 'stretch',
  },
  contentContainer: {
    paddingBottom: padding.XXL,
    flexDirection: 'column',
    alignItems: 'flex-start',
    alignSelf: 'stretch',
  },
  senderContainer: {
    height: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  buttonContainer: {
    paddingHorizontal: padding.L,
    flexDirection: 'column',
    alignItems: 'flex-start',
    alignSelf: 'stretch',
  },
  replyButton: {
    alignSelf: 'stretch',
  },
  state: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateText: {
    color: colors.fgNeutralMuted,
  },
});

export default LetterDetailScreen;
