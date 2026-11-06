import { useCallback } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import IcArrowLeft from '../../../assets/icons/ic_arrow_left.svg';

import TopSubNavigation from '../../../shared/components/navigation/topnavigation/TopSubNavigation';
import ListRow, { LIST_ROW_TYPE } from '../../../shared/components/content/ListRow';
import Empty from '../../../shared/components/content/Empty';
import useCurrentUser from '../../../shared/hooks/useCurrentUser';
import { resolveMediaUri } from '../../../shared/utils/media';

import { colors } from '../../../shared/styles/color';

import InfoBanner from '../../notification/components/InfoBanner';
import useUserBlock from '../../block/hooks/useUserBlock';
import useBlockedUsers from '../../block/hooks/useBlockedUsers';

const HEADER_TEXT = '차단한 사용자 관리';
const INFO_BANNER_LABEL = '차단한 사용자와는 서로의 피드와 편지를 볼 수 없어요.';
const UNBLOCK_BUTTON_TEXT = '차단해제';
const EMPTY_TITLE = '차단한 사용자가 없어요';
const EMPTY_BODY = '차단한 사용자는 여기에서 관리할 수 있어요.';

const END_REACHED_THRESHOLD = 0.5;

const keyExtractor = user => String(user.id);

// 차단한 사람이 없을 때 헤더 아래 남은 영역 가운데에 띄운다
const renderListEmpty = () => (
  <View style={styles.emptyContainer}>
    <Empty type="recipient" title={EMPTY_TITLE} body={EMPTY_BODY} />
  </View>
);

// 설정 화면의 차단한 사용자 관리 행으로 들어오는 차단 목록 화면
const SettingBlockScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { userId } = useCurrentUser();
  const { unblockUser } = useUserBlock();

  // 20명씩 끊어서 받고, 끝에 가까워지면 다음 사람들을 받는다
  const {
    users,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useBlockedUsers({ userId });

  const isEmpty = users.length === 0;

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // 프로필 화면의 차단 해제와 같다. 해제 토스트는 안드로이드 하단 네비게이션 바 위에 둔다
  const handlePressUnblock = useCallback(user => {
    unblockUser({
      targetUserId: user.id,
      userCode: user.userCode,
      toastBottomOffset: insets.bottom,
    });
  }, [unblockUser, insets.bottom]);

  const renderItem = useCallback(({ item: user }) => (
    <ListRow
      type={LIST_ROW_TYPE.BUTTON}
      isPressed={false}
      imageUri={resolveMediaUri(user.profileImageUrl)}
      nickname={user.nickname}
      userId={user.userCode}
      buttonText={UNBLOCK_BUTTON_TEXT}
      onPressButton={() => handlePressUnblock(user)}
    />
  ), [handlePressUnblock]);

  return (
    <SafeAreaView style={styles.container}>
      <TopSubNavigation
        type="text"
        leftIcon={IcArrowLeft}
        leftAccessibilityLabel="뒤로가기"
        headerText={HEADER_TEXT}
        onPressClose={navigation.goBack}
        showNext={false}
      />

      {/* 차단한 사람이 없으면 Empty 만 보여준다 */}
      {!isEmpty && <InfoBanner label={INFO_BANNER_LABEL} />}

      <FlatList
        data={users}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        onEndReached={handleEndReached}
        onEndReachedThreshold={END_REACHED_THRESHOLD}
        ListEmptyComponent={isLoading ? null : renderListEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgSurface,
  },

  // 빈 화면이 남은 높이를 다 쓰도록 늘린다
  listContent: {
    flexGrow: 1,
  },

  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
});

export default SettingBlockScreen;
