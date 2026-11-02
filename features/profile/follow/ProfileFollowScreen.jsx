import { useCallback, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import IcArrowLeft from '../../../assets/icons/ic_arrow_left.svg';

import TopSubNavigation from '../../../shared/components/navigation/topnavigation/TopSubNavigation';
import TabBar from '../../../shared/components/navigation/tabbar/TabBar';
import ListRow, { LIST_ROW_TYPE } from '../../../shared/components/content/ListRow';
import useCurrentUser from '../../../shared/hooks/useCurrentUser';
import { resolveMediaUri } from '../../../shared/utils/media';

import { colors } from '../../../shared/styles/color';

import useFollowUsers, { FOLLOW_LIST_TYPE } from '../hooks/useFollowUsers';

const END_REACHED_THRESHOLD = 0.5;

// 팔로우: 내가 팔로우하는 사람 / 팔로워: 나를 팔로우하는 사람
const FOLLOW_TABS = ['팔로우', '팔로워'];
const FOLLOW_TAB_TYPES = [FOLLOW_LIST_TYPE.FOLLOWINGS, FOLLOW_LIST_TYPE.FOLLOWERS];

const keyExtractor = user => String(user.id);

// 프로필 탭에서 프로필 편집 옆 버튼으로 들어오는 팔로우/팔로워 목록
const ProfileFollowScreen = () => {
  const navigation = useNavigation();
  const { userId } = useCurrentUser();

  const [activeTabIndex, setActiveTabIndex] = useState(0);

  const { users, hasNextPage, isFetchingNextPage, fetchNextPage } = useFollowUsers({
    userId,
    type: FOLLOW_TAB_TYPES[activeTabIndex],
  });

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(({ item: user }) => (
    <ListRow
      type={LIST_ROW_TYPE.RECIPIENT}
      imageUri={resolveMediaUri(user.profileImageUrl)}
      nickname={user.nickname}
      userId={user.userCode}
      onPress={() => navigation.navigate('UserProfile', { userId: user.id })}
    />
  ), [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <TopSubNavigation
        leftIcon={IcArrowLeft}
        leftAccessibilityLabel="뒤로가기"
        onPressClose={navigation.goBack}
        showShare={false}
        showMore={false}
      />

      <TabBar
        tabs={FOLLOW_TABS}
        activeIndex={activeTabIndex}
        onChange={setActiveTabIndex}
      />

      <FlatList
        data={users}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        onEndReached={handleEndReached}
        onEndReachedThreshold={END_REACHED_THRESHOLD}
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
});

export default ProfileFollowScreen;
