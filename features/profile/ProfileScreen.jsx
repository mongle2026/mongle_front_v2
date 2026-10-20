import { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import IcSettingStroke from '../../assets/icons/ic_setting_stroke.svg';
import IcPersonList from '../../assets/icons/ic_personlist.svg';

import TopNavigation from '../../shared/components/navigation/topnavigation/TopNavigation';
import ProfileImg from '../../shared/components/atomic/ProfileImg';
import IconButton from '../../shared/components/action/IconButton';
import { Button, BUTTON_SIZE, BUTTON_VARIANT } from '../../shared/components/action/Button';
import useCurrentUser from '../../shared/hooks/useCurrentUser';
import { useGlobalOverlay } from '../../shared/providers/GlobalOverlayProvider';
import { colors } from '../../shared/styles/color';
import { FONT } from '../../shared/styles/fontType';
import { gap, padding, radius } from '../../shared/styles/token';
import { chunk } from '../../shared/utils/arrayUtils';

import ProfileEditBottomSheet from './components/ProfileEditBottomSheet';
import ProfileMusicCard from './components/ProfileMusicCard';
import useMyFeedCovers from './hooks/useMyFeedCovers';

const COLUMN_COUNT = 2;
const END_REACHED_THRESHOLD = 0.5;
const PROFILE_EDIT_OVERLAY_ID = 'profile-edit';

const USER_CODE_ROTATION_DEGREE = -4;
const USER_CODE_ROTATION_RADIAN = (Math.abs(USER_CODE_ROTATION_DEGREE) * Math.PI) / 180;

/**
 * userCode 버튼은 중심 기준 -4도 회전해서 오른쪽 위 꼭짓점은 원래 박스보다 위로,
 * 왼쪽 아래 꼭짓점은 같은 만큼 아래로 나간다. 레이아웃은 회전 전 박스로 잡히므로
 * 나간 만큼을 계산해 행 위·아래 여백에 더하고, ProfileImg 를 아래 꼭짓점 높이로 내린다.
 */
const getRotatedCornerOffset = (width, height) => {
  const widthOffset = (width / 2) * Math.sin(USER_CODE_ROTATION_RADIAN);
  const heightOffset = (height / 2) * (Math.cos(USER_CODE_ROTATION_RADIAN) - 1);

  return Math.max(0, Math.ceil(widthOffset + heightOffset));
};

const keyExtractor = row => String(row[0].feedId);

const RowSeparator = () => <View style={styles.rowSeparator} />;

// 프로필 탭. 내 정보 + 내가 쓴 피드의 노래 커버를 한 줄에 두 개씩 보여준다
const ProfileScreen = () => {
  const { currentUser, userId } = useCurrentUser();
  const { covers, hasNextPage, isFetchingNextPage, fetchNextPage } = useMyFeedCovers({ userId });

  const coverRows = useMemo(() => chunk(covers, COLUMN_COUNT), [covers]);

  const userCode = String(currentUser?.userCode ?? '').replace(/^@+/, '');

  const [userCodeCornerOffset, setUserCodeCornerOffset] = useState(0);

  const handleUserCodeLayout = useCallback(e => {
    const { width, height } = e.nativeEvent.layout;
    setUserCodeCornerOffset(getRotatedCornerOffset(width, height));
  }, []);

  const navigation = useNavigation();
  const { openOverlay } = useGlobalOverlay();

  // TODO: 게시글 편집 화면이 생기면 이동시킨다
  const handlePressEdit = useCallback(() => {
    openOverlay({
      id: PROFILE_EDIT_OVERLAY_ID,
      accessibilityLabel: '프로필 편집 닫기',
      contentContainerStyle: styles.profileEditOverlay,
      renderContent: ({ close }) => (
        <ProfileEditBottomSheet
          onPressProfileInfoEdit={() => {
            close();
            navigation.navigate('ProfileInfoEdit');
          }}
          onPressFeedEdit={close}
          onClose={close}
        />
      ),
    });
  }, [openOverlay, navigation]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderRow = useCallback(({ item: row }) => (
    <View style={styles.coverRow}>
      {row.map(cover => (
        <ProfileMusicCard
          key={cover.feedId}
          imageSource={cover.imageSource}
          title={cover.title}
        />
      ))}
      {/* 마지막 줄이 한 개뿐이어도 카드가 반 폭을 유지하도록 빈 칸을 채운다 */}
      {row.length < COLUMN_COUNT && <View style={styles.emptyCell} />}
    </View>
  ), []);

  const header = (
    <View style={styles.header}>
      <View
        style={[
          styles.userRow,
          {
            paddingTop: userCodeCornerOffset,
            paddingBottom: padding.M + userCodeCornerOffset,
          },
        ]}
      >
        {/* 회전한 버튼의 가장 아래 꼭짓점과 같은 줄에 오도록 내린다 */}
        <ProfileImg
          imageUri={currentUser?.profileImageUri}
          size="M"
          style={[styles.profileImg, { transform: [{ translateY: userCodeCornerOffset }] }]}
        />

        {/* onLayout 은 회전 전 크기를 주므로 감싼 View 에서 측정한다 */}
        <View onLayout={handleUserCodeLayout}>
          <Button
            variant={BUTTON_VARIANT.GHOST}
            size={BUTTON_SIZE.M}
            font={FONT.SUIT}
            style={styles.userCodeButton}
          >
            {`@${userCode}`}
          </Button>
        </View>
      </View>

      <View style={styles.actionRow}>
        <Button
          variant={BUTTON_VARIANT.WEAK}
          size={BUTTON_SIZE.L}
          font={FONT.SUIT}
          style={styles.editButton}
          onPress={handlePressEdit}
        >
          프로필 편집
        </Button>

        <IconButton
          size="XXL"
          icon={IcPersonList}
          color={colors.fgNeutralSecondary}
          accessibilityLabel="팔로우/팔로잉 목록"
          style={styles.personListButton}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <TopNavigation
        title={currentUser?.nickname ?? ''}
        icon={IcSettingStroke}
        buttonAccessibilityLabel="설정"
      />

      {/* TopNavigation 아래 전체(프로필 정보 + 커버 그리드)가 함께 스크롤된다 */}
      <FlatList
        data={coverRows}
        keyExtractor={keyExtractor}
        renderItem={renderRow}
        ListHeaderComponent={header}
        ItemSeparatorComponent={RowSeparator}
        onEndReached={handleEndReached}
        onEndReachedThreshold={END_REACHED_THRESHOLD}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgBase,
  },

  // 프로필 정보 + 커버 그리드 전체.
  // alignItems: 'flex-start'를 주면 FlatList 셀이 내용 폭으로 줄어 카드 폭이 0이 되므로 기본값(stretch)을 쓴다
  container: {
    paddingHorizontal: padding.L,
    // 커버 그리드 아래 여백
    paddingBottom: padding.XXL,
    flexDirection: 'column',
    borderRadius: radius.S,
  },

  header: {
    alignSelf: 'stretch',
    // 커버 그리드 위 여백
    paddingBottom: padding.M,
  },

  userRow: {
    paddingBottom: padding.M,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: gap.S,
    alignSelf: 'stretch',
  },

  // ProfileImg 사이즈 프리셋을 덮어쓴다
  profileImg: {
    width: 35,
    height: 35,
  },

  // 회전은 border를 가진 Button 자신에게 걸고, overflow: 'hidden'으로 iOS 계단 현상을 막는다 (Profile 과 동일)
  userCodeButton: {
    overflow: 'hidden',
    transform: [{ rotate: `${USER_CODE_ROTATION_DEGREE}deg` }],
  },

  actionRow: {
    paddingBottom: padding.M,
    flexDirection: 'row',
    alignItems: 'center',
    gap: padding.XS,
    alignSelf: 'stretch',
  },

  // IconButton 을 뺀 나머지 폭을 채운다
  editButton: {
    flex: 1,
  },

  personListButton: {
    backgroundColor: colors.fillNeutralWeak,
  },

  coverRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: gap.M,
    alignSelf: 'stretch',
  },

  emptyCell: {
    flex: 1,
  },

  rowSeparator: {
    height: gap.M,
  },

  // BottomSheet를 화면 전체 위에 띄운다
  profileEditOverlay: {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
  },
});

export default ProfileScreen;
