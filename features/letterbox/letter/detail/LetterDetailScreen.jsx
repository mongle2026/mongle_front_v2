import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import IlDialogCancelletter from '../../../../assets/illustrations/il_dialog_cancelletter.svg';
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
import { useGlobalOverlay } from '../../../../shared/providers/GlobalOverlayProvider';
import { colors } from '../../../../shared/styles/color';
import { FONT } from '../../../../shared/styles/fontType';
import { padding } from '../../../../shared/styles/token';
import { getSenderSuffix } from '../../../../shared/utils/koreanUtils';

import ActionBar from '../../../../shared/components/content/ActionBar';
import { formatDate } from '../../../../shared/utils/dateUtils';

import LetterDetailContent from './components/LetterDetailContent';
import useLetterDetail from './hooks/useLetterDetail';

// route.params: { letterId }
const LetterDetailScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();

  const letterId = route?.params?.letterId;
  const { userId } = useCurrentUser();
  const { openDialog } = useDialog();
  const { showToast } = useGlobalOverlay();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { letter, error, isConfigured, isLoading, refetchLetter, deleteLetter, isDeletingLetter } = useLetterDetail({
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

  // 나에게 쓴 편지는 받은 편지로 취급한다 (편지함 목록과 동일)
  const isSent = Boolean(letter?.isSender && !letter?.isReceiver);

  // 예약 발송해서 아직 도착 시각이 지나지 않은 편지는 상대방이 아직 받지 못했다.
  // 화면을 열어둔 사이에 도착 시각이 지나도 버튼은 그대로 남아서, 누를 때 다시 확인한다.
  const deliveryAtTime = letter?.deliveryAt ? new Date(letter.deliveryAt).getTime() : null;
  const isDelivered = deliveryAtTime === null || deliveryAtTime <= Date.now();

  // 도착 전인 보낸 편지만 전송 취소할 수 있다 (케밥 메뉴 대신 하단 버튼)
  const canCancelSend = isSent && !isDelivered;

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
          cancelText="닫기"
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

  // 버튼을 누른 시점에 이미 도착한 편지면 취소를 막고 상세를 다시 불러온다.
  // 상세를 다시 받으면 isDelivered가 바뀌면서 취소 버튼이 케밥 메뉴로 전환된다.
  const guardCancelSend = useCallback(() => {
    if (deliveryAtTime === null || deliveryAtTime > Date.now()) return true;

    showToast({
      message: '도착 시간이 지나 전송을 취소할 수 없습니다.',
      icon: 'alert',
      iconColor: colors.fgCritical,
      bottomOffset: insets.bottom,
    });

    void refetchLetter();

    return false;
  }, [deliveryAtTime, insets.bottom, refetchLetter, showToast]);

  // 도착 전에 보낸 사람이 지우면 백엔드가 양쪽 편지함에서 지워 상대방에게 도착하지 않는다
  const handlePressCancelSend = useCallback(() => {
    if (isDeletingLetter) return;
    if (!guardCancelSend()) return;

    openDialog({
      id: 'letter-cancel-send-dialog',
      closeOnDimPress: true,
      closeOnBackPress: true,
      accessibilityLabel: '전송 취소 확인 창 닫기',
      renderContent: ({ close }) => (
        <Dialog
          illustration={IlDialogCancelletter}
          title="편지 전송을 취소할까요?"
          description="전송을 취소한 편지는 삭제됩니다."
          cancelText="닫기"
          confirmText="전송 취소"
          onCancel={close}
          onConfirm={() => {
            close();

            // 다이얼로그를 열어둔 사이에 도착했을 수 있어 한 번 더 확인한다
            if (!guardCancelSend()) return;

            deleteLetter();
          }}
        />
      ),
    });
  }, [deleteLetter, guardCancelSend, isDeletingLetter, openDialog]);

  // TODO: 답장 작성 화면으로 이동
  const handlePressReply = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  const handleMusicPlayback = useCallback(() => {
    if (!playbackId || !previewUri) return;

    handlePressPlayback({ feedId: playbackId, previewUrl: previewUri });
  }, [handlePressPlayback, playbackId, previewUri]);

  // 보낸 편지는 받는 사람, 받은 편지는 보낸 사람을 보여준다
  const counterpart = isSent ? letter?.receiver : letter?.sender;

  // 작성 날짜와 도착 날짜가 다를 때만(예약 발송) 작성/도착을 나눠 보여준다
  const isDeliveredLater =
    Boolean(letter?.createdAt && letter?.deliveryAt) &&
    formatDate(letter.createdAt) !== formatDate(letter.deliveryAt);

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.topSafeArea}>
        <View style={styles.topNavigationContainer}>
          <TopIconNavigation
            showShare={false}
            showMore={!canCancelSend}
            onPressClose={handlePressClose}
            onPressMore={handlePressMore}
          />

          {letter && isMenuOpen && !canCancelSend && (
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
              // 하단 버튼이 없으면 스크롤 끝이 안드로이드 네비게이션 바에 가리지 않게 한다
              !letter.isReceiver && !canCancelSend && { paddingBottom: padding.XXL + insets.bottom },
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
              datePrefix={isDeliveredLater ? '작성 날짜' : undefined}
              showCommentButton={false}
              showLikeButton={false}
              showBookmarkButton={false}
            />

            {isDeliveredLater && (
              <ActionBar
                createdAt={letter.deliveryAt}
                showTime={false}
                datePrefix="도착 날짜"
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
                style={styles.bottomButton}
              >
                {`${letter.sender.nickname}에게 답장하기`}
              </TextButton>
            </View>
          )}

          {/* 전송 취소는 아직 도착하지 않은 보낸 편지에서만 */}
          {canCancelSend && (
            <View style={[styles.buttonContainer, { paddingBottom: padding.XXL + insets.bottom }]}>
              <TextButton
                variant="NeutralWeak"
                size="XL"
                font={FONT.SUIT}
                disabled={isDeletingLetter}
                onPress={handlePressCancelSend}
                style={styles.bottomButton}
              >
                전송 취소
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
  bottomButton: {
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
