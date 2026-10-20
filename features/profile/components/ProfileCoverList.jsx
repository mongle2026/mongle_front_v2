import { useCallback, useContext, useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';

import { gap, padding, radius } from '../../../shared/styles/token';
import { chunk } from '../../../shared/utils/arrayUtils';

import ProfileMusicCard, { ProfileMusicCardSpacer } from './ProfileMusicCard';

const COLUMN_COUNT = 2;
const END_REACHED_THRESHOLD = 0.5;

const keyExtractor = row => String(row[0].feedId);

const RowSeparator = () => <View style={styles.rowSeparator} />;

// 프로필 정보(header) + 노래 커버를 한 줄에 두 개씩 보여주는 그리드 (내 프로필, 다른 사람 프로필 공용).
// header 와 커버가 함께 스크롤된다. covers 등은 useProfileFeedCovers 결과를 그대로 넘긴다
const ProfileCoverList = ({
  header,
  covers,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}) => {
  const coverRows = useMemo(() => chunk(covers, COLUMN_COUNT), [covers]);

  // 마지막 줄이 안드로이드 하단 시스템 바(홈 인디케이터)에 가리지 않게 inset 만큼 더 띄운다.
  // 탭 화면(내 프로필)은 하단 탭바가 이미 시스템 바 영역까지 채우므로 더하지 않는다
  const insets = useSafeAreaInsets();
  const isInTab = useContext(BottomTabBarHeightContext) != null;
  const bottomInset = isInTab ? 0 : insets.bottom;

  const contentContainerStyle = useMemo(
    () => [styles.container, { paddingBottom: padding.XXL + bottomInset }],
    [bottomInset],
  );

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
      {row.length < COLUMN_COUNT && <ProfileMusicCardSpacer />}
    </View>
  ), []);

  return (
    <FlatList
      data={coverRows}
      keyExtractor={keyExtractor}
      renderItem={renderRow}
      ListHeaderComponent={<View style={styles.header}>{header}</View>}
      ItemSeparatorComponent={RowSeparator}
      onEndReached={handleEndReached}
      onEndReachedThreshold={END_REACHED_THRESHOLD}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={contentContainerStyle}
    />
  );
};

const styles = StyleSheet.create({
  // 프로필 정보 + 커버 그리드 전체.
  // alignItems: 'flex-start'를 주면 FlatList 셀이 내용 폭으로 줄어 카드 폭이 0이 되므로 기본값(stretch)을 쓴다
  container: {
    paddingHorizontal: padding.L,
    // 커버 그리드 아래 여백(padding.XXL + 하단 inset)은 contentContainerStyle 에서 준다
    flexDirection: 'column',
    borderRadius: radius.S,
  },

  header: {
    alignSelf: 'stretch',
    // 커버 그리드 위 여백
    paddingBottom: padding.M,
  },

  coverRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: gap.M,
    alignSelf: 'stretch',
  },

  rowSeparator: {
    height: gap.M,
  },
});

export default ProfileCoverList;
